from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.models.user import User
from app.services.gmail_service import GmailService, HistoryExpiredError
from app.services.email_processor import process_emails_batch
from app.models.google_credential import GoogleCredential
from sqlmodel import select
import logging
import time

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/status")
def get_gmail_status(db: Session = Depends(deps.get_db), user_id: uuid.UUID = None): # TODO: Real auth
    if not user_id:
         return {"connected": False, "write_access": False, "scopes": []}
         
    stmt = select(GoogleCredential).where(GoogleCredential.user_id == user_id)
    cred = db.exec(stmt).first()
    
    if not cred:
        return {"connected": False, "write_access": False, "scopes": []}
        
    scopes = cred.scopes.split(',') if cred.scopes else []
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
):
    # TODO: Refactor to use real auth dependency
    pass


class SyncRequest(BaseModel):
    user_id: uuid.UUID
    limit: int = 50
    mode: str = "preview" # preview | full
    force_full: bool = False  # Force full sync even if incremental is available

from fastapi import BackgroundTasks

@router.get("/sync/status/{user_id}")
def get_sync_status(user_id: uuid.UUID):
    from app.services.sync_manager import sync_manager
    return sync_manager.get_status(user_id)

@router.post("/sync")
def sync_gmail(
    req: SyncRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db)
):
    from app.services.sync_manager import sync_manager
    
    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    current_status = sync_manager.get_status(req.user_id)
    if current_status.get("status") == "running":
        return {"status": "running", "message": "Sync already in progress"}
        
    logger.info(f"Initiating background sync for user {user.id}")
    
    # Initialize Sync State
    sync_manager.start_sync(req.user_id, type=req.mode)
    
    # Add background task
    background_tasks.add_task(_run_sync_task, req.user_id, req.limit, req.mode, req.force_full)
    
    return {"status": "started", "message": "Sync started in background"}


def _run_sync_task(user_id: uuid.UUID, limit: int, mode: str, force_full: bool):
    """
    Background task to sync Gmail.
    Creates its own DB session.
    """
    from app.db.session import engine
    from app.services.sync_manager import sync_manager
    
    logger.info(f"Starting background sync task for user {user_id}")
    
    with Session(engine) as db:
        user = db.get(User, user_id)
        if not user:
            logger.error(f"User {user_id} not found in background task")
            sync_manager.finish_sync(user_id, status="error", message="User not found")
            return

        try:
            service = GmailService(user, db)
            raw_emails = []
            new_history_id = None
            sync_type = "full"
            
            # Attempt incremental sync
            if user.last_history_id and not force_full:
                try:
                    raw_emails, new_history_id = service.fetch_new_emails(user.last_history_id)
                    sync_type = "incremental"
                    logger.info(f"Incremental sync: {len(raw_emails)} new emails")
                    sync_manager.update_progress(user_id, 0, message=f"Fetched {len(raw_emails)} new emails")
                except HistoryExpiredError:
                    logger.warning("History expired, fallback to full sync")
                    raw_emails = []
            
            # Full sync fallback
            if not raw_emails and sync_type == "full" or (sync_type == "incremental" and not raw_emails and not new_history_id):
                raw_emails = service.fetch_preview_emails(limit=limit)
                sync_type = "full"
                logger.info(f"Full sync: fetched {len(raw_emails)} emails")
                sync_manager.update_progress(user_id, 0, message=f"Fetched {len(raw_emails)} emails")

            # Get latest historyId
            if not new_history_id:
                try:
                    profile = service.get_profile()
                    new_history_id = profile.get('historyId')
                except Exception as e:
                    logger.warning(f"Failed to fetch profile: {e}")

            # Update total in manager for progress bar
            sync_manager.set_total(user_id, len(raw_emails))

            # Process
            process_emails_batch(
                db, user, raw_emails, is_preview=(mode == "preview"), gmail_service=service
            )
            
            # Update user state
            if new_history_id:
                user.last_history_id = new_history_id
            user.last_sync_at = datetime.now(timezone.utc)
            db.add(user)
            db.commit()
            
            count = len(raw_emails)
            sync_manager.finish_sync(user_id, status="completed", message=f"Synced {count} emails")
            logger.info(f"Background sync complete for {user_id}")
            
        except Exception as e:
            logger.error(f"Sync failed for {user_id}: {e}")
            sync_manager.finish_sync(user_id, status="error", message=str(e))
