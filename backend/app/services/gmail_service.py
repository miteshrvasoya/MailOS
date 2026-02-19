from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from sqlmodel import Session, select
from app.models.user import User
from app.models.google_credential import GoogleCredential
from app.models.gmail_label import GmailLabel
from app.core.config import settings
import logging
import email.utils
import threading
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Max concurrent Gmail API calls
GMAIL_FETCH_WORKERS = 10

class GmailService:
    def __init__(self, user: User, db: Session):
        self.user = user
        self.db = db
        self.thread_local = threading.local()
        try:
            self.creds = self._get_credentials()
            # We don't initialize self.service here anymore; use _get_service() instead
        except Exception as e:
            logger.error(f"Failed to initialize Gmail credentials for user {user.id}: {e}")
            raise e

    def _get_service(self):
        """Thread-safe way to get the Gmail service."""
        if not hasattr(self.thread_local, 'service'):
            logger.info(f"GmailService: Creating new service instance for thread {threading.current_thread().name}")
            self.thread_local.service = build('gmail', 'v1', credentials=self.creds, cache_discovery=False)
        return self.thread_local.service

    def _get_credentials(self) -> Credentials:
        stmt = select(GoogleCredential).where(GoogleCredential.user_id == self.user.id)
        cred_model = self.db.exec(stmt).first()
        
        if not cred_model:
            raise Exception("User not connected to Gmail")
            
        creds = Credentials(
            token=cred_model.access_token,
            refresh_token=cred_model.refresh_token,
            token_uri=cred_model.token_uri,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=cred_model.scopes.split(',') if cred_model.scopes else []
        )
        
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Update DB with new token
                cred_model.access_token = creds.token
                cred_model.updated_at = datetime.utcnow()
                self.db.add(cred_model)
                self.db.commit()
                logger.info(f"Refreshed Gmail access token for user {self.user.id}")
                print(f"Refreshed Gmail access token for user {self.user.id}")
            except Exception as e:
                logger.error(f"Failed to refresh Gmail token for user {self.user.id}: {e}")
                print(f"Failed to refresh Gmail token for user {self.user.id}: {e}")
        return creds

    def _fetch_single_message(self, msg_id: str) -> Optional[Dict[str, Any]]:
        """Fetch and parse a single Gmail message. Thread-safe."""
        try:
            service = self._get_service()
            full_msg = service.users().messages().get(
                userId='me', id=msg_id, format='full'
            ).execute()
            return self._parse_message(full_msg)
        except Exception as e:
            logger.warning(f"GmailService: Failed to fetch message {msg_id}: {e}")
            return None

    def _fetch_messages_concurrent(self, message_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Fetch multiple Gmail messages concurrently using ThreadPoolExecutor.
        Returns parsed email dicts in order, skipping failures.
        """
        if not message_ids:
            return []

        import time as _time
        start = _time.time()
        results: List[Optional[Dict[str, Any]]] = [None] * len(message_ids)
        failed_count = 0

        with ThreadPoolExecutor(max_workers=GMAIL_FETCH_WORKERS) as executor:
            future_to_idx = {
                executor.submit(self._fetch_single_message, mid): idx
                for idx, mid in enumerate(message_ids)
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    failed_count += 1
                    logger.warning(f"Concurrent fetch error for index {idx}: {e}")

        fetched = [r for r in results if r is not None]
        elapsed = _time.time() - start
        logger.info(f"GmailService: Concurrently fetched {len(fetched)}/{len(message_ids)} messages in {elapsed:.1f}s ({failed_count} failed)")
        return fetched

    def fetch_preview_emails(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch recent emails for preview using concurrent fetching.
        """
        logger.info(f"GmailService: Fetching preview emails with limit {limit}")
        try:
            service = self._get_service()
            results = service.users().messages().list(
                userId='me', q='newer_than:7d', maxResults=limit
            ).execute()
            messages = results.get('messages', [])
            message_ids = [msg['id'] for msg in messages]

            logger.info(f"GmailService: Found {len(message_ids)} message IDs")
            logger.info(f"Fetching {len(message_ids)} messages concurrently...")
            print(f"Fetching {len(message_ids)} messages concurrently...")
            print(f"Message IDs: {message_ids}")
            return self._fetch_messages_concurrent(message_ids)
        except Exception as e:
            logger.error(f"GmailService: Preview sync failed: {e}")
            print(f"Preview sync failed: {e}")
            raise e

    def ensure_label(self, name: str) -> str:
        """
        Check if a label exists in Gmail. If not, create it.
        Return the gmail_label_id.
        Requires 'https://www.googleapis.com/auth/gmail.modify' scope.
        """
        # First check DB cache to avoid API calls? 
        # Or always check API to be safe? Safest is check API list.
        
        try:
            service = self._get_service()
            # List labels
            response = service.users().labels().list(userId='me').execute()
            labels = response.get('labels', [])
            
            # Check for existing
            for label in labels:
                if label['name'].lower() == name.lower():
                    self._cache_label_in_db(name, label['id'])
                    return label['id']
            
            # Create if not found
            label_body = {
                "name": name,
                "labelListVisibility": "labelShow",
                "messageListVisibility": "show"
            }
            created_label = service.users().labels().create(userId='me', body=label_body).execute()
            self._cache_label_in_db(name, created_label['id'])
            logger.info(f"GmailService: Created label '{name}'")
            print(f"Created label '{name}'")
            return created_label['id']
            
        except Exception as e:
            logger.error(f"GmailService: Failed to ensure label '{name}': {e}")
            print(f"Failed to ensure label '{name}': {e}")
            raise e

    def _cache_label_in_db(self, name: str, gmail_id: str):
        # Check if already in DB
        existing = self.db.exec(select(GmailLabel).where(GmailLabel.user_id == self.user.id, GmailLabel.gmail_id == gmail_id)).first()
        if not existing:
            new_label = GmailLabel(
                user_id=self.user.id,
                name=name,
                gmail_id=gmail_id
            )
            self.db.add(new_label)
            self.db.commit()

    def apply_label(self, gmail_message_id: str, gmail_label_id: str):
        """
        Apply a label to a message.
        Requires 'https://www.googleapis.com/auth/gmail.modify' scope.
        Safe: Does NOT remove labels or archive.
        """
        try:
            service = self._get_service()
            body = {
                "addLabelIds": [gmail_label_id]
            }
            service.users().messages().modify(userId='me', id=gmail_message_id, body=body).execute()
            logger.info(f"GmailService: Applied label {gmail_label_id} to message {gmail_message_id}")
            print(f"Applied label {gmail_label_id} to message {gmail_message_id}")
        except Exception as e:
            print(f"Failed to apply label: {e}")
            logger.error(f"GmailService: Failed to apply label {gmail_label_id} to {gmail_message_id}: {e}")
            raise e

    def _parse_message(self, full_msg: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a Gmail message into a standardized dict."""
        headers = full_msg['payload'].get('headers', [])
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(No Subject)')
        sender = next((h['value'] for h in headers if h['name'] == 'From'), '(Unknown Sender)')
        date_str = next((h['value'] for h in headers if h['name'] == 'Date'), None)
        sent_at = None
        if date_str:
            try:
                sent_at = email.utils.parsedate_to_datetime(date_str)
            except Exception as e:
                logger.warning(f"Failed to parse date string '{date_str}': {e}")

            print(f"Parsed message: {full_msg}")

        snippet = full_msg.get('snippet', '')

        return {
            "gmail_message_id": full_msg['id'],
            "thread_id": full_msg['threadId'],
            "subject": subject,
            "sender": sender,
            "sent_at": sent_at,
            "snippet": snippet,
            "body": snippet
        }

    def get_profile(self) -> Dict[str, Any]:
        """Get Gmail profile including current historyId."""
        try:
            service = self._get_service()
            profile = service.users().getProfile(userId='me').execute()
            logger.info(f"GmailService: Profile fetched, historyId={profile.get('historyId')}")
            return profile
        except Exception as e:
            logger.error(f"GmailService: Failed to get Gmail profile: {e}")
            raise e

    def fetch_new_emails(self, start_history_id: str) -> tuple:
        """
        Fetch only new emails since last sync using Gmail History API.
        Returns (list_of_email_dicts, new_history_id).
        Raises HistoryExpiredError if the historyId is too old.
        """
        logger.info(f"GmailService: Fetching new emails since history_id {start_history_id}")
        try:
            new_message_ids = set()
            page_token = None
            new_history_id = start_history_id
            page_count = 0

            while True:
                params = {
                    'userId': 'me',
                    'startHistoryId': start_history_id,
                    'historyTypes': ['messageAdded'],
                }
                if page_token:
                    params['pageToken'] = page_token

                service = self._get_service()
                history_response = service.users().history().list(**params).execute()
                
                history_records = history_response.get('history', [])
                page_count += 1
                logger.info(f"GmailService: History page {page_count}: {len(history_records)} records")
                for record in history_records:
                    for msg_added in record.get('messagesAdded', []):
                        msg = msg_added.get('message', {})
                        labels = msg.get('labelIds', [])
                        if 'INBOX' in labels:
                            new_message_ids.add(msg['id'])

                new_history_id = history_response.get('historyId', new_history_id)
                page_token = history_response.get('nextPageToken')
                if not page_token:
                    break

            # Fetch full details concurrently
            logger.info(f"GmailService: Found {len(new_message_ids)} new message IDs, fetching concurrently...")
            preview_data = self._fetch_messages_concurrent(list(new_message_ids))
            return preview_data, new_history_id

        except Exception as e:
            error_str = str(e)
            if '404' in error_str or 'notFound' in error_str:
                logger.warning("GmailService: History expired, falling back to full sync")
                raise HistoryExpiredError("Gmail history has expired, full sync required")
            logger.error(f"GmailService: Incremental sync failed: {e}")
            raise e


class HistoryExpiredError(Exception):
    """Raised when Gmail history ID is no longer valid."""
    pass
