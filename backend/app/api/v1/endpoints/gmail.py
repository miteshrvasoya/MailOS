from typing import List, Dict, Any
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.models.user import User
from app.services.gmail_service import GmailService
from app.services.email_processor import process_email_pipeline

from app.models.google_credential import GoogleCredential
from sqlmodel import select

router = APIRouter()

@router.get("/status")
def get_gmail_status(db: Session = Depends(deps.get_db), user_id: uuid.UUID = None): # TODO: Real auth
    # For now, pass user_id as query param to match other mock endpoints if needed, 
    # but ideally we get current_user from token.
    # Let's support query param for consistency with 'sync' mock if we must, 
    # but sync uses body. GET should use query.
    # But wait, we have real auth in session on frontend.
    # Let's rely on user_id passed from frontend for now or just standard deps.get_current_user logic if we had it.
    # We will accept user_id param.
    
    if not user_id:
         # Fallback or error
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
    # User is fetched via deps if we have auth, 
    # but here we might need manual user fetch if auth not fully set up in header? 
    # But usually endpoints should restrict to current user.
    # Assuming we have a dependency to get current_user, or simply pass user_id for now if dev flow.
    # But for production, use deps.get_current_user.
    # Let's assume we pass user_id in body for now matching previous mock sync, OR upgrade to proper auth.
    # Previous mock sync took 'user_id' in body. Let's stick to that for consistency or upgrade.
    # Let's try to get user from body to stay consistent with Onboarding flow which might not have full header auth yet?
    # Actually onboarding has session.
):
    # TODO: Refactor to usage real auth dependency
    pass


class SyncRequest(BaseModel):
    user_id: uuid.UUID
    limit: int = 50
    mode: str = "preview" # preview | full

@router.post("/sync")
def sync_gmail(req: SyncRequest, db: Session = Depends(deps.get_db)):
    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        service = GmailService(user, db)
        raw_emails = service.fetch_preview_emails(limit=req.limit)
        
        results = []
        for email_data in raw_emails:
            # Process and mark as preview
            # Check if already exists? process_email_pipeline usually handles it but we want to force preview?
            # Actually gmail_message_id unique constraint might block duplication.
            # If we preview, we probably shouldn't save duplicate if it exists.
            # But process_email_pipeline doesn't check existence first (it relies on uniqueness error or we should check).
            # Let's just run it. If it fails due to existing, we skip.
            
            try:
                is_preview = (req.mode == "preview")
                result = process_email_pipeline(db, user, email_data, is_preview=is_preview, gmail_service=service)
                results.append(result.insight)
            except Exception as e:
                # likely duplicate or error
                # print(e)
                continue
                
        # Aggregate stats
        categories = {}
        for r in results:
            cat = r.category
            categories[cat] = categories.get(cat, 0) + 1
            
        return {
            "count": len(results),
            "groups": [{"name": k, "count": v} for k, v in categories.items()],
            "preview_items": [
                {"subject": r.subject, "category": r.category, "confidence": r.importance_score} 
                for r in results[:5]
            ]
        }
            
    except Exception as e:
        print("Gmail Sync Error: ", e)
        raise HTTPException(status_code=400, detail=str(e))
