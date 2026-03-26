"""
Push Notification Processor
Handles the background processing triggered by Gmail Pub/Sub push notifications.
Idempotent: uses ProcessedMessage table to skip already-processed emails.
"""
import logging
import uuid
import time
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.models.user import User
from app.models.gmail_watch import GmailWatch
from app.models.processed_message import ProcessedMessage
from app.services.gmail_service import GmailService, HistoryExpiredError
from app.services.email_processor import store_raw_emails, classify_stored_emails
from app.services.sync_manager import sync_manager

logger = logging.getLogger(__name__)


def process_push_notification(user_id: uuid.UUID, new_history_id: str):
    """
    Background task: process a Gmail push notification for a user.

    Pipeline:
    1. Load GmailWatch → get last known historyId
    2. Fetch new emails via Gmail History API
    3. Filter out already-processed message IDs (idempotency)
    4. Store raw emails → classify
    5. Record processed message IDs
    6. Update GmailWatch.history_id
    """
    from app.db.session import engine

    total_start = time.time()
    logger.info(f"[PUSH] Processing push notification for user {user_id}, historyId={new_history_id}")

    try:
        with Session(engine) as db:
            user = db.get(User, user_id)
            if not user:
                logger.error(f"[PUSH] User {user_id} not found, skipping")
                return

            # Get the watch record for last known history_id
            watch = db.exec(
                select(GmailWatch).where(GmailWatch.user_id == user_id)
            ).first()

            last_history_id = None
            if watch:
                last_history_id = watch.history_id
            elif user.last_history_id:
                last_history_id = user.last_history_id

            if not last_history_id:
                logger.warning(f"[PUSH] No history_id found for user {user_id}, performing full sync")
                _full_sync_fallback(user, db)
                return

            # Don't re-process if we've already seen this historyId or a newer one
            if last_history_id == new_history_id:
                logger.info(f"[PUSH] historyId unchanged for user {user_id}, skipping")
                return

            gmail_svc = GmailService(user, db)
            raw_emails = []
            fetched_history_id = None

            try:
                raw_emails, fetched_history_id = gmail_svc.fetch_new_emails(last_history_id)
            except HistoryExpiredError:
                logger.warning(f"[PUSH] History expired for user {user_id}, falling back to full sync")
                _full_sync_fallback(user, db)
                return

            if not raw_emails:
                logger.info(f"[PUSH] No new emails for user {user_id}")
                # Still update the history_id
                _update_history_id(db, user, watch, fetched_history_id or new_history_id)
                return

            # ── Idempotency: filter out already-processed messages ──
            message_ids = [e["gmail_message_id"] for e in raw_emails if e.get("gmail_message_id")]
            if message_ids:
                already_processed = set(
                    db.exec(
                        select(ProcessedMessage.message_id).where(
                            ProcessedMessage.message_id.in_(message_ids),
                            ProcessedMessage.user_id == user_id,
                        )
                    ).all()
                )

                if already_processed:
                    logger.info(f"[PUSH] Skipping {len(already_processed)} already-processed messages")
                    raw_emails = [
                        e for e in raw_emails
                        if e.get("gmail_message_id") not in already_processed
                    ]

            if not raw_emails:
                logger.info(f"[PUSH] All messages already processed for user {user_id}")
                _update_history_id(db, user, watch, fetched_history_id or new_history_id)
                return

            logger.info(f"[PUSH] Processing {len(raw_emails)} new emails for user {user_id}")

            # ── Phase 1: Store Raw Emails ──
            store_stats = store_raw_emails(db, user, raw_emails, is_preview=False)
            logger.info(f"[PUSH] Stored: {store_stats.stored} new, {store_stats.skipped} skipped")

            # ── Phase 2: Classify ──
            classify_stats = classify_stored_emails(
                db, user,
                limit=max(50, len(raw_emails)),
                gmail_service=gmail_svc,
            )
            logger.info(
                f"[PUSH] Classified: {classify_stats.classified} classified, "
                f"{classify_stats.failed} failed"
            )

            # ── Record processed message IDs ──
            now = datetime.now(timezone.utc)
            for email_data in raw_emails:
                msg_id = email_data.get("gmail_message_id")
                if msg_id:
                    existing = db.exec(
                        select(ProcessedMessage).where(
                            ProcessedMessage.message_id == msg_id,
                            ProcessedMessage.user_id == user_id,
                        )
                    ).first()
                    if not existing:
                        db.add(ProcessedMessage(
                            message_id=msg_id,
                            user_id=user_id,
                            processed_at=now,
                        ))
            db.commit()

            # ── Update history_id ──
            _update_history_id(db, user, watch, fetched_history_id or new_history_id)

            elapsed = time.time() - total_start
            logger.info(
                f"[PUSH] ✓ Push processing complete for user {user_id} in {elapsed:.1f}s — "
                f"{store_stats.stored} stored, {classify_stats.classified} classified"
            )

    except Exception as e:
        logger.error(f"[PUSH] ✗ Push processing failed for user {user_id}: {e}", exc_info=True)


def _update_history_id(db: Session, user: User, watch: GmailWatch | None, history_id: str):
    """Update the history_id in both GmailWatch and User tables."""
    if watch:
        watch.history_id = history_id
        watch.updated_at = datetime.now(timezone.utc)
        db.add(watch)

    user.last_history_id = history_id
    user.last_sync_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()


def _full_sync_fallback(user: User, db: Session):
    """Fallback: do a full sync when history is expired or unavailable."""
    logger.info(f"[PUSH] Running full sync fallback for user {user.id}")

    try:
        gmail_svc = GmailService(user, db)
        raw_emails = gmail_svc.fetch_all_missing_emails()

        if raw_emails:
            store_raw_emails(db, user, raw_emails, is_preview=False)
            classify_stored_emails(db, user, limit=len(raw_emails), gmail_service=gmail_svc)

        # Get fresh historyId
        profile = gmail_svc.get_profile()
        new_history_id = profile.get("historyId")
        if new_history_id:
            watch = db.exec(
                select(GmailWatch).where(GmailWatch.user_id == user.id)
            ).first()
            _update_history_id(db, user, watch, new_history_id)

        logger.info(f"[PUSH] Full sync fallback complete for user {user.id}")

    except Exception as e:
        logger.error(f"[PUSH] Full sync fallback failed for user {user.id}: {e}", exc_info=True)
