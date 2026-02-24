from typing import List, Dict, Any
import uuid
import time
import logging
import traceback
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User
from app.services.gmail_service import GmailService, HistoryExpiredError
from app.services.email_processor import store_raw_emails, classify_stored_emails
from app.services.digest_mailer import send_digest_email
from app.models.google_credential import GoogleCredential
from app.services.sync_manager import sync_manager
from app.services.digest_service import generate_digest

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status")
def get_gmail_status(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    stmt = select(GoogleCredential).where(GoogleCredential.user_id == current_user.id)
    cred = db.exec(stmt).first()

    if not cred:
        return {"connected": False, "write_access": False, "scopes": []}

    # Google scopes are typically space-separated strings
    scopes = []
    if cred.scopes:
        scopes = cred.scopes.split(' ') if ' ' in cred.scopes else cred.scopes.split(',')
        
    write_access = "https://www.googleapis.com/auth/gmail.modify" in scopes

    return {
        "connected": True,
        "write_access": write_access,
        "scopes": scopes
    }


@router.post("/preview-sync")
def preview_sync(
    limit: int = 20,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # TODO: Refactor to use real auth dependency (Done)
    pass


class SyncRequest(BaseModel):
    user_id: uuid.UUID
    limit: int = 50
    mode: str = "preview"  # preview | full
    force_full: bool = False


@router.get("/sync/status/{user_id}")
def get_sync_status(
    user_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user's status")
    return sync_manager.get_status(user_id)


@router.post("/sync")
def sync_gmail(
    req: SyncRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if req.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to sync for this user")

    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_status = sync_manager.get_status(req.user_id)
    if current_status.get("status") == "running":
        return {"status": "running", "message": "Sync already in progress"}

    logger.info(f"Initiating two-phase sync for user {user.id} (mode={req.mode}, limit={req.limit})")

    # Initialize Sync State
    sync_manager.start_sync(req.user_id, type=req.mode)

    # Add background task
    background_tasks.add_task(_run_sync_pipeline, req.user_id, req.limit, req.mode, req.force_full)

    return {"status": "started", "message": "Sync started in background"}


@router.post("/classify")
def trigger_classification(
    req: SyncRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Manually trigger Phase 2 (Classification) only.
    Useful for retrying failed classifications without fetching from Gmail.
    """
    if req.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to classify provided user")
        
    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_status = sync_manager.get_status(req.user_id)
    if current_status.get("status") == "running":
        return {"status": "running", "message": "Sync/Classification already in progress"}

    logger.info(f"Initiating manual classification for user {user.id}")
    
    sync_manager.start_sync(req.user_id, type="classification_only")
    background_tasks.add_task(_run_classification_phase, req.user_id, req.limit)
    
    return {"status": "started", "message": "Classification started in background"}



def _run_sync_pipeline(user_id: uuid.UUID, limit: int, mode: str, force_full: bool):
    """
    Background task to run the full two-phase sync.
    Phase 1: Fetch & Store Raw
    Phase 2: Classify (if Phase 1 successful)
    """
    from app.db.session import engine

    total_start = time.time()
    logger.info(f"[SYNC] Starting two-phase sync for user {user_id}")

    try:
        # ── Phase 1: Fetch & Store ──────────────────────────────────
        raw_count = _run_fetch_phase(user_id, limit, mode, force_full)
        
        # ── Phase 2: Classify ───────────────────────────────────────
        if raw_count > 0 or True: # Always check for pending emails even if 0 fetched
            _run_classification_phase(user_id, limit)
        
        total_elapsed = time.time() - total_start
        sync_manager.finish_sync(
            user_id,
            status="completed",
            message=f"Sync complete in {total_elapsed:.0f}s"
        )
        logger.info(f"[SYNC] ✓ Full pipeline complete for {user_id} in {total_elapsed:.1f}s")

    except Exception as e:
        total_elapsed = time.time() - total_start
        logger.error(f"[SYNC] ✗ Pipeline failed for {user_id}: {e}")
        logger.error(f"[SYNC] Traceback: {traceback.format_exc()}")
        sync_manager.finish_sync(user_id, status="error", message=str(e))


def _run_fetch_phase(user_id: uuid.UUID, limit: int, mode: str, force_full: bool) -> int:
    """
    Phase 1: Fetch from Gmail and store raw emails.
    Returns number of new raw emails stored.
    """
    from app.db.session import engine
    
    with Session(engine) as db:
        user = db.get(User, user_id)
        if not user:
            raise Exception(f"User {user_id} not found")

        service = GmailService(user, db)
        sync_manager.set_phase(user_id, "fetching", "Connecting to Gmail...")
        
        raw_emails = []
        new_history_id = None
        sync_type = "full"
        fetch_start = time.time()

        # Incremental Sync
        if user.last_history_id and not force_full:
            try:
                logger.info(f"[SYNC] Attempting incremental sync (history_id={user.last_history_id})")
                raw_emails, new_history_id = service.fetch_new_emails(user.last_history_id)
                sync_type = "incremental"
            except Exception as e:
                logger.warning(f"[SYNC] Incremental sync failed: {e}. Fallback to full.")
                raw_emails = []

        # Full Sync Fallback
        if not raw_emails and (sync_type == "full" or not new_history_id):
            sync_type = "full"
            logger.info(f"[SYNC] Full sync (using fetch_all_missing_emails)")
            raw_emails = service.fetch_all_missing_emails()

        fetch_elapsed = time.time() - fetch_start
        logger.info(f"[SYNC] Fetch complete: {len(raw_emails)} emails in {fetch_elapsed:.1f}s")
        
        # Store Raw
        sync_manager.set_phase(user_id, "storing_raw", f"Storing {len(raw_emails)} raw emails...")
        stats = store_raw_emails(db, user, raw_emails, is_preview=(mode == "preview"))
        
        logger.info(f"[SYNC] Stored raw: {stats.stored} new, {stats.skipped} skipped")
        
        # Update User State
        if new_history_id:
            user.last_history_id = new_history_id
        user.last_sync_at = datetime.now(timezone.utc)
        db.add(user)
        db.commit()
        
        return stats.stored


def _run_classification_phase(user_id: uuid.UUID, limit: int):
    """
    Phase 2: Classify pending emails from DB and generate a digest.
    """
    from app.db.session import engine
    
    with Session(engine) as db:
        user = db.get(User, user_id)
        if not user:
            return

        service = GmailService(user, db)

        # Classify
        logger.info(f"[SYNC] Starting classification phase for {user_id}")
        stats = classify_stored_emails(db, user, limit=limit, gmail_service=service)
        logger.info(
            f"[SYNC] Classification complete: {stats.classified} classified, {stats.failed} failed"
        )

        # Generate a fresh digest based on user's settings
        try:
            digest_type = getattr(user, "digest_frequency", "daily") or "daily"
            if getattr(user, "digest_enabled", True):
                sync_manager.set_phase(
                    user_id, "digesting", f"Generating {digest_type} digest..."
                )
                digest = generate_digest(db, user_id=user.id, digest_type=digest_type)
                logger.info(
                    f"[SYNC] Digest generated for user {user_id}: "
                    f"{digest.stats.get('total_emails', 0)} emails, "
                    f"{digest.stats.get('important', 0)} important"
                )

                # Send digest email (non-blocking)
                send_digest_email(user, digest)
        except Exception as e:
            logger.error(f"[SYNC] Digest generation/email failed for {user_id}: {e}")
