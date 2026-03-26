"""
Gmail Watch Service
Manages Gmail push notification watches via the Gmail API.
Watches expire ~7 days after creation and must be renewed.
"""
import logging
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from app.models.user import User
from app.models.gmail_watch import GmailWatch
from app.models.google_credential import GoogleCredential
from app.services.gmail_service import GmailService
from app.core.config import settings

logger = logging.getLogger(__name__)


def start_gmail_watch(user: User, db: Session) -> dict:
    """
    Register a Gmail push notification watch for a user.
    Calls POST https://gmail.googleapis.com/gmail/v1/users/me/watch
    Persists the watch state (historyId, expiration) in DB.
    Returns the Gmail API response dict.
    """
    if not settings.GOOGLE_CLOUD_PROJECT_ID:
        raise ValueError("GOOGLE_CLOUD_PROJECT_ID is not configured")

    topic_name = f"projects/{settings.GOOGLE_CLOUD_PROJECT_ID}/topics/{settings.PUBSUB_TOPIC_NAME}"

    try:
        gmail_svc = GmailService(user, db)
        service = gmail_svc._get_service()

        watch_response = service.users().watch(
            userId='me',
            body={
                "topicName": topic_name,
                "labelIds": ["INBOX"],
                "labelFilterAction": "include",
            }
        ).execute()

        history_id = str(watch_response.get("historyId", ""))
        expiration_ms = int(watch_response.get("expiration", 0))
        expiration_dt = datetime.fromtimestamp(expiration_ms / 1000, tz=timezone.utc)

        # Upsert GmailWatch row
        existing_watch = db.exec(
            select(GmailWatch).where(GmailWatch.user_id == user.id)
        ).first()

        if existing_watch:
            existing_watch.history_id = history_id
            existing_watch.expiration = expiration_dt
            existing_watch.updated_at = datetime.now(timezone.utc)
            db.add(existing_watch)
        else:
            new_watch = GmailWatch(
                user_id=user.id,
                history_id=history_id,
                expiration=expiration_dt,
            )
            db.add(new_watch)

        # Also update user.last_history_id for consistency with sync_worker
        user.last_history_id = history_id
        db.add(user)
        db.commit()

        logger.info(
            f"WatchService: Watch started for user {user.id}, "
            f"historyId={history_id}, expires={expiration_dt.isoformat()}"
        )
        return watch_response

    except Exception as e:
        logger.error(f"WatchService: Failed to start watch for user {user.id}: {e}")
        raise


def stop_gmail_watch(user: User, db: Session) -> bool:
    """Stop the Gmail push notification watch for a user."""
    try:
        gmail_svc = GmailService(user, db)
        service = gmail_svc._get_service()
        service.users().stop(userId='me').execute()

        # Remove watch row
        existing_watch = db.exec(
            select(GmailWatch).where(GmailWatch.user_id == user.id)
        ).first()
        if existing_watch:
            db.delete(existing_watch)
            db.commit()

        logger.info(f"WatchService: Watch stopped for user {user.id}")
        return True

    except Exception as e:
        logger.error(f"WatchService: Failed to stop watch for user {user.id}: {e}")
        return False


def renew_watch(user: User, db: Session) -> dict:
    """Renew a Gmail watch (same as start — Gmail replaces the existing watch)."""
    return start_gmail_watch(user, db)


def renew_all_watches():
    """
    Cron job entry point: renew all Gmail watches that expire within 2 days.
    Called by APScheduler daily.
    """
    from app.db.session import engine

    logger.info("WatchService: Starting daily watch renewal check...")

    with Session(engine) as db:
        threshold = datetime.now(timezone.utc) + timedelta(days=2)

        # Find watches expiring soon
        expiring_watches = db.exec(
            select(GmailWatch).where(GmailWatch.expiration < threshold)
        ).all()

        if not expiring_watches:
            logger.info("WatchService: No watches need renewal.")
            return

        renewed = 0
        failed = 0

        for watch in expiring_watches:
            user = db.get(User, watch.user_id)
            if not user or not user.is_active:
                continue

            # Check user has credentials
            cred = db.exec(
                select(GoogleCredential).where(GoogleCredential.user_id == user.id)
            ).first()
            if not cred:
                continue

            try:
                renew_watch(user, db)
                renewed += 1
            except Exception as e:
                logger.error(f"WatchService: Failed to renew watch for user {user.id}: {e}")
                failed += 1

        logger.info(f"WatchService: Renewal complete — {renewed} renewed, {failed} failed")
