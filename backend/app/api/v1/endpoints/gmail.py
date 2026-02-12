from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.models.user import User
from app.services.gmail_service import GmailService, HistoryExpiredError
from app.services.email_processor import process_email_pipeline
from app.models.google_credential import GoogleCredential
from sqlmodel import select
import logging

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

@router.post("/sync")
def sync_gmail(req: SyncRequest, db: Session = Depends(deps.get_db)):
    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    logger.info(f"Starting Gmail sync for user {user.id} (mode: {req.mode})")
    
    try:
        service = GmailService(user, db)
        raw_emails = []
        new_history_id = None
        sync_type = "full"  # Track sync type for response
        
        # Attempt incremental sync if we have a history ID and not forcing full sync
        if user.last_history_id and not req.force_full:
            try:
                raw_emails, new_history_id = service.fetch_new_emails(user.last_history_id)
                sync_type = "incremental"
                logger.info(f"Incremental sync: {len(raw_emails)} new emails for user {user.id}")
            except HistoryExpiredError:
                logger.warning(f"History expired for user {user.id}, falling back to full sync")
                raw_emails = []  # Will trigger full sync below
                
        # Full sync: first time or fallback
        if not raw_emails and sync_type == "full" or (sync_type == "incremental" and not raw_emails and not new_history_id):
            raw_emails = service.fetch_preview_emails(limit=req.limit)
            sync_type = "full"
            logger.info(f"Full sync: fetched {len(raw_emails)} emails for user {user.id}")
        
        # Always capture the latest history ID
        if not new_history_id:
            try:
                profile = service.get_profile()
                new_history_id = profile.get('historyId')
            except Exception as e:
                logger.warning(f"Failed to fetch profile for historyId: {e}")
        
        # Process emails through the pipeline
        results = []
        for email_data in raw_emails:
            try:
                is_preview = (req.mode == "preview")
                result = process_email_pipeline(db, user, email_data, is_preview=is_preview, gmail_service=service)
                results.append(result.insight)
            except Exception as e:
                logger.debug(f"Skipping email {email_data.get('gmail_message_id')} due to error: {e}")
                continue
                
        # Update user's sync state
        if new_history_id:
            user.last_history_id = new_history_id
        user.last_sync_at = datetime.now(timezone.utc)
        db.add(user)
        db.commit()
        
        # Aggregate stats
        categories = {}
        for r in results:
            cat = r.category
            categories[cat] = categories.get(cat, 0) + 1
            
        logger.info(f"Sync complete for user {user.id}. Type: {sync_type}, Processed: {len(results)}")

        return {
            "count": len(results),
            "sync_type": sync_type,
            "groups": [{"name": k, "count": v} for k, v in categories.items()],
            "preview_items": [
                {"subject": r.subject, "category": r.category, "confidence": r.importance_score} 
                for r in results[:5]
            ],
            "last_sync_at": user.last_sync_at.isoformat() if user.last_sync_at else None
        }
            
    except Exception as e:
        logger.error(f"Gmail Sync Error for user {user.id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
