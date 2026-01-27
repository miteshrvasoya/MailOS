from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.action import EmailAction
from app.models.email import EmailInsight
from app.models.user import User
from app.api.v1.endpoints.feedback import submit_feedback, FeedbackCreate
from app.services.gmail_service import GmailService
import uuid

router = APIRouter()

@router.get("/pending", response_model=List[EmailInsight])
def get_pending_actions(db: Session = Depends(deps.get_db)):
    """
    Fetch pending AI suggestions.
    Returns EmailInsight objects with their associated Action data.
    """
    # Join queries or just fetch actions and emails
    statement = select(EmailInsight, EmailAction).join(EmailAction).where(EmailAction.status == "pending")
    results = db.exec(statement).all()
    
    # We return insights, but frontend might need action_id too
    # Let's return a custom structure or just Insight if it includes Action relation
    
    # Simplified: Return actions with email data embedded if possible
    # Or return list of custom objects. 
    # For now, let's change response_model to return Actions with Email data loaded
    pass

# Redefine response model
from pydantic import BaseModel
from datetime import datetime

class ActionResponse(BaseModel):
    id: uuid.UUID
    email_id: uuid.UUID
    email_subject: str
    email_sender: str
    suggested_label: str
    confidence: float
    reason: str
    created_at: datetime
    
@router.get("/pending-list", response_model=List[ActionResponse])
def get_pending_actions_list(db: Session = Depends(deps.get_db)):
    statement = select(EmailAction, EmailInsight).join(EmailInsight).where(EmailAction.status == "pending")
    results = db.exec(statement).all()
    
    response = []
    for action, email in results:
        response.append(ActionResponse(
            id=action.id,
            email_id=email.id,
            email_subject=email.subject,
            email_sender=email.sender,
            suggested_label=action.suggested_label,
            confidence=action.confidence,
            reason=action.reason or "AI suggested",
            created_at=action.created_at
        ))
    return response

@router.post("/{action_id}/approve")
def approve_action(action_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Check if authorized for modify (Optional: strict check or rely on try/catch in service)
    # We'll rely on service error handling
    
    user = db.get(User, action.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        service = GmailService(user, db)
        
        # 1. Ensure Label Exists
        # The stored suggested_label might be short "Job", we want "MailOS/Job" prefix usually?
        # The plan says "MailOS/Job". Let's assume the suggested_label ALREADY has prefix or we add it.
        # Earlier grouping service just returned "Job". So we should prefix here.
        
        label_name = f"MailOS/{action.suggested_label}"
        gmail_label_id = service.ensure_label(label_name)
        
        # 2. Apply Label
        # Need gmail_message_id from relation
        email = action.email
        if not email or not email.gmail_message_id:
            raise HTTPException(status_code=400, detail="Associated email not found")
            
        service.apply_label(email.gmail_message_id, gmail_label_id)
        
        action.status = "approved"
        db.add(action)
        db.commit()
        return {"status": "approved", "label_applied": label_name}
        
    except Exception as e:
        # If it's a permission error, we should probably tell the frontend
        # But for now 500 or 400
        print(f"Failed to apply label: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to apply label in Gmail: {str(e)}")

@router.post("/{action_id}/reject")
def reject_action(action_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    action.status = "rejected"
    db.add(action)
    db.commit()
    
    # Trigger Feedback Loop
    # We assume rejection means "Wrong Group"
    # Or we could ask user for correct group. For now, just negative feedback.
    # We don't have target group here, so maybe just "not_important" or "wrong_group"?
    # The doc says: "When user rejects... store user_label_preferences"
    # We'll use our existing feedback endpoint logic internally
    # But we need email object
    
    email = db.get(EmailInsight, action.email_id)
    if email:
        # Construct feedback payload
        feedback = FeedbackCreate(
            feedback_type="wrong_group",
            target_group=None # We don't know the right one yet
        )
        submit_feedback(email.id, feedback, db)
        
    return {"status": "rejected"}
