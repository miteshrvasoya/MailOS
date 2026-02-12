"""
Background Sync Worker
Periodically syncs Gmail for all connected users using incremental sync.
"""
import logging
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User
from app.models.google_credential import GoogleCredential
from app.services.gmail_service import GmailService, HistoryExpiredError
from app.services.email_processor import process_email_pipeline

logger = logging.getLogger(__name__)

# Minimum interval between syncs per user (avoid hammering Gmail API)
MIN_SYNC_INTERVAL = timedelta(minutes=5)


def sync_user_emails(user: User, db: Session) -> dict:
    """
    Sync emails for a single user. Uses incremental sync when possible.
    Returns a summary dict.
    """
    try:
        service = GmailService(user, db)
        raw_emails = []
        new_history_id = None
        sync_type = "full"

        # Attempt incremental sync 
        if user.last_history_id:
            try:
                raw_emails, new_history_id = service.fetch_new_emails(user.last_history_id)
                sync_type = "incremental"
            except HistoryExpiredError:
                logger.warning(f"History expired for user {user.id}, falling back to full sync")
                raw_emails = []

        # Full sync fallback
        if sync_type == "full" or (not raw_emails and not new_history_id):
            raw_emails = service.fetch_preview_emails(limit=50)
            sync_type = "full"

        # Get latest historyId  
        if not new_history_id:
            try:
                profile = service.get_profile()
                new_history_id = profile.get('historyId')
            except Exception as e:
                logger.warning(f"Failed to get historyId for user {user.id}: {e}")

        # Process through pipeline
        processed = 0
        for email_data in raw_emails:
            try:
                process_email_pipeline(db, user, email_data, is_preview=False, gmail_service=service)
                processed += 1
            except Exception as e:
                logger.debug(f"Skipping email {email_data.get('gmail_message_id')}: {e}")
                continue

        # Update sync state
        if new_history_id:
            user.last_history_id = new_history_id
        user.last_sync_at = datetime.now(timezone.utc)
        db.add(user)
        db.commit()

        return {
            "user_id": str(user.id),
            "sync_type": sync_type,
            "emails_fetched": len(raw_emails),
            "emails_processed": processed,
        }

    except Exception as e:
        logger.error(f"Background sync failed for user {user.id}: {e}")
        return {
            "user_id": str(user.id),
            "error": str(e),
        }


def run_background_sync():
    """
    Main entry point for the background sync job.
    Iterates over all connected users and syncs their emails.
    """
    logger.info("Background sync starting...")
    
    with Session(engine) as db:
        # Find all users with Gmail credentials
        stmt = select(User).join(GoogleCredential).where(User.is_active == True)
        users = db.exec(stmt).all()
        
        now = datetime.now(timezone.utc)
        results = []
        
        for user in users:
            # Skip if synced recently
            if user.last_sync_at and (now - user.last_sync_at) < MIN_SYNC_INTERVAL:
                logger.debug(f"Skipping user {user.id}: synced {(now - user.last_sync_at).seconds}s ago")
                continue
                
            result = sync_user_emails(user, db)
            results.append(result)
            
        synced_count = sum(1 for r in results if 'error' not in r)
        error_count = sum(1 for r in results if 'error' in r)
        
        logger.info(f"Background sync complete: {synced_count} users synced, {error_count} errors")
        
    return results
