import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from sqlmodel import Session, select

from app.models.user import User
from app.models.google_credential import GoogleCredential
from app.core.config import settings

logger = logging.getLogger(__name__)

class CalendarService:
    def __init__(self, user: User, db: Session):
        self.user = user
        self.db = db
        try:
            self.creds = self._get_credentials()
            self.service = build('calendar', 'v3', credentials=self.creds, cache_discovery=False)
        except Exception as e:
            logger.error(f"Failed to initialize Calendar service for user {user.id}: {e}")
            raise e

    def _get_credentials(self) -> Credentials:
        stmt = select(GoogleCredential).where(GoogleCredential.user_id == self.user.id)
        cred_model = self.db.exec(stmt).first()
        
        if not cred_model:
            raise Exception("User not connected to Google")
            
        creds = Credentials(
            token=cred_model.access_token,
            refresh_token=cred_model.refresh_token,
            token_uri=cred_model.token_uri,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            expiry=cred_model.expiry,
            scopes=cred_model.scopes.split(' ') if cred_model.scopes and ' ' in cred_model.scopes else (cred_model.scopes.split(',') if cred_model.scopes else [])
        )
        
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                cred_model.access_token = creds.token
                cred_model.updated_at = datetime.utcnow()
                self.db.add(cred_model)
                self.db.commit()
                logger.info(f"Refreshed Calendar access token for user {self.user.id}")
            except Exception as e:
                logger.error(f"Failed to refresh Calendar token for user {self.user.id}: {e}")
        return creds

    def create_event(self, summary: str, due_date: datetime, description: str = "") -> Optional[Dict[str, Any]]:
        """
        Create a 1-hour Calendar Event precisely at the given due_date time.
        If the due_date only has year-month-day (time is 00:00:00), it's created as an all-day event.
        Requires 'https://www.googleapis.com/auth/calendar.events' scope.
        """
        try:
            # Check if timeframe is Midnight exactly (which typically implies an All-Day Event)
            is_all_day = (due_date.hour == 0 and due_date.minute == 0 and due_date.second == 0)

            event = {
                'summary': summary,
                'description': description,
            }

            if is_all_day:
                date_str = due_date.strftime('%Y-%m-%d')
                event['start'] = {'date': date_str}
                event['end'] = {'date': (due_date + timedelta(days=1)).strftime('%Y-%m-%d')}
            else:
                event['start'] = {
                    'dateTime': due_date.isoformat(),
                    'timeZone': 'UTC',
                }
                event['end'] = {
                    'dateTime': (due_date + timedelta(hours=1)).isoformat(),
                    'timeZone': 'UTC',
                }

            created_event = self.service.events().insert(calendarId='primary', body=event).execute()
            logger.info(f"CalendarService: Created event '{summary}' for user {self.user.id}")
            return created_event

        except Exception as e:
            logger.error(f"CalendarService: Failed to create event '{summary}': {e}")
            return None
