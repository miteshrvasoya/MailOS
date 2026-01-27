from typing import List, Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlmodel import Session, select
from app.models.user import User
from app.models.google_credential import GoogleCredential
from app.models.gmail_label import GmailLabel
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class GmailService:
    def __init__(self, user: User, db: Session):
        self.user = user
        self.db = db
        try:
            self.creds = self._get_credentials()
            self.service = build('gmail', 'v1', credentials=self.creds)
        except Exception as e:
            logger.error(f"Failed to initialize Gmail service for user {user.id}: {e}")
            raise e

    def _get_credentials(self) -> Credentials:
        stmt = select(GoogleCredential).where(GoogleCredential.user_id == self.user.id)
        cred_model = self.db.exec(stmt).first()
        
        if not cred_model:
            raise Exception("User not connected to Gmail")
            
        return Credentials(
            token=cred_model.access_token,
            refresh_token=cred_model.refresh_token,
            token_uri=cred_model.token_uri,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=cred_model.scopes.split(',') if cred_model.scopes else []
        )

    def fetch_preview_emails(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch recent emails for preview. Read-only scope is sufficient.
        """
        try:
            # q='newer_than:7d'
            results = self.service.users().messages().list(userId='me', q='newer_than:7d', maxResults=limit).execute()
            messages = results.get('messages', [])
            
            preview_data = []
            for msg in messages:
                try:
                    full_msg = self.service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                    
                    headers = full_msg['payload'].get('headers', [])
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(No Subject)')
                    sender = next((h['value'] for h in headers if h['name'] == 'From'), '(Unknown Sender)')
                    date_str = next((h['value'] for h in headers if h['name'] == 'Date'), None)
                    
                    snippet = full_msg.get('snippet', '')
                    
                    preview_data.append({
                        "gmail_message_id": msg['id'],
                        "thread_id": msg['threadId'],
                        "subject": subject,
                        "sender": sender,
                        "sent_at": date_str, # Will need parsing later
                        "snippet": snippet,
                        "body": snippet # Simplified for preview
                    })
                except Exception as e:
                    logger.warning(f"Failed to fetch details for message {msg['id']}: {e}")
                    continue
                
            return preview_data
        except Exception as e:
            logger.error(f"Gmail API list failed: {e}")
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
            # List labels
            response = self.service.users().labels().list(userId='me').execute()
            labels = response.get('labels', [])
            
            # Check for existing
            for label in labels:
                if label['name'].lower() == name.lower():
                    # Update DB cache if missing
                    self._cache_label_in_db(name, label['id'])
                    return label['id']
            
            # Create if not found
            label_body = {
                "name": name,
                "labelListVisibility": "labelShow",
                "messageListVisibility": "show"
            }
            created_label = self.service.users().labels().create(userId='me', body=label_body).execute()
            
            # Cache in DB
            self._cache_label_in_db(name, created_label['id'])
            
            return created_label['id']
            
        except Exception as e:
            logger.error(f"Failed to ensure label {name}: {e}")
            # If scope error, this will raise.
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
            body = {
                "addLabelIds": [gmail_label_id]
            }
            self.service.users().messages().modify(userId='me', id=gmail_message_id, body=body).execute()
        except Exception as e:
            logger.error(f"Failed to apply label {gmail_label_id} to {gmail_message_id}: {e}")
            raise e
