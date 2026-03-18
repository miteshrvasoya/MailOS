from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.action import EmailAction
from app.models.email import EmailInsight
from app.models.user import User
from app.api.v1.endpoints.feedback import submit_feedback, FeedbackCreate
from app.services.gmail_service import GmailService
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid

router = APIRouter()

UNDO_WINDOW_SECONDS = 10


# ─── Response Models ──────────────────────────────────────────────

class ActionResponse(BaseModel):
    id: uuid.UUID
    email_id: uuid.UUID
    email_subject: str
    email_sender: str
    suggested_label: str
    confidence: float
    reason: str
    created_at: datetime
    status: str = "pending"


# ─── List Pending ─────────────────────────────────────────────────

@router.get("/pending", response_model=List[ActionResponse])
def get_pending_actions(db: Session = Depends(deps.get_db)):
    """Fetch pending AI suggestions (global, backward compatible)."""
    return _get_pending_list(db)


@router.get("/pending-list", response_model=List[ActionResponse])
def get_pending_actions_list(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Fetch pending AI suggestions for the authenticated user with email data.
    """
    pending_actions = _get_pending_list(db, user_id=current_user.id)
    
    response = []
    for action in pending_actions:
        if not action.email:  # Skip if email was deleted or not loaded
            continue
        response.append(ActionResponse(
            id=action.id,
            email_id=action.email_id,
            email_subject=action.email.subject or "",
            email_sender=action.email.sender or "",
            suggested_label=action.suggested_label,
            confidence=action.confidence,
            reason=action.reason or "",
            created_at=action.created_at,
            status=action.status,
        ))
    return response


def _get_pending_list(db: Session, user_id: uuid.UUID = None) -> List[EmailAction]:
    statement = (
        select(EmailAction)
        .options(selectinload(EmailAction.email))
        .where(EmailAction.status == "pending")
    )
    if user_id:
        statement = statement.where(EmailAction.user_id == user_id)
    results = db.exec(statement).all()
    return results


# ─── Single Approve ───────────────────────────────────────────────

@router.post("/{action_id}/approve", response_model=ActionResponse)
def approve_action(
    action_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    # Verify ownership
    if action.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to approve this action")
        
    # Execute Approval Logic
    try:
        service = GmailService(current_user, db)
        label_name = f"{current_user.label_prefix}/{action.suggested_label}"
        gmail_label_id = service.ensure_label(label_name)

        if action.email and action.email.gmail_message_id:
            service.apply_label(action.email.gmail_message_id, gmail_label_id)
            
        # Update Insight Category too
        if action.email:
            action.email.category = action.suggested_label
            db.add(action.email)
            
    except Exception as e:
        print(f"Failed to apply label: {e}")
        # Don't fail the action approval if Gmail fails? 
        # For now, log and continue as per previous behavior/robustness preference.

    # 1. Update Action Status
    action.status = "approved"
    action.updated_at = datetime.utcnow()
    
    db.add(action)
    db.commit()
    db.refresh(action)
    
    return ActionResponse(
        id=action.id,
        email_id=action.email_id,
        email_subject=action.email.subject if action.email else "Unknown",
        email_sender=action.email.sender if action.email else "Unknown",
        suggested_label=action.suggested_label,
        confidence=action.confidence,
        reason=action.reason,
        created_at=action.created_at,
        status=action.status
    )


# ─── Single Reject ────────────────────────────────────────────────

@router.post("/{action_id}/reject", response_model=ActionResponse)
def reject_action(
    action_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    action.status = "rejected"
    action.updated_at = datetime.utcnow()
    
    db.add(action)
    db.commit()
    db.refresh(action)

    email = db.get(EmailInsight, action.email_id)
    if email:
        feedback = FeedbackCreate(feedback_type="wrong_group", target_group=None)
        submit_feedback(email.id, feedback, db)
    
    return ActionResponse(
        id=action.id,
        email_id=action.email_id,
        email_subject=action.email.subject if action.email else "Unknown",
        email_sender=action.email.sender if action.email else "Unknown",
        suggested_label=action.suggested_label,
        confidence=action.confidence,
        reason=action.reason,
        created_at=action.created_at,
        status=action.status
    )


# ─── Undo Action ──────────────────────────────────────────────────

@router.post("/{action_id}/undo")
def undo_action(
    action_id: uuid.UUID, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Revert an approved/rejected action back to pending,
    only if within the undo window (10 seconds).
    """
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if action.status == "pending":
        return {"status": "already_pending"}

    # Check undo window
    time_since_update = datetime.utcnow() - action.updated_at
    if time_since_update > timedelta(seconds=UNDO_WINDOW_SECONDS):
        raise HTTPException(
            status_code=400,
            detail=f"Undo window expired ({UNDO_WINDOW_SECONDS}s). Action cannot be reverted."
        )

    previous_status = action.status
    action.status = "pending"
    action.updated_at = datetime.utcnow()
    db.add(action)
    db.commit()

    return {"status": "undone", "previous_status": previous_status}


# ─── Bulk Approve / Reject ────────────────────────────────────────

class BulkActionRequest(BaseModel):
    action_ids: List[uuid.UUID]


class BulkActionResult(BaseModel):
    succeeded: List[str]
    failed: List[str]


@router.post("/bulk-approve", response_model=BulkActionResult)
def bulk_approve(
    req: BulkActionRequest, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Approve multiple suggestions at once for the authenticated user."""
    succeeded = []
    failed = []

    for action_id in req.action_ids:
        action = db.get(EmailAction, action_id)
        if not action:
            failed.append(str(action_id))
            continue

        # Verify ownership for each action
        if action.user_id != current_user.id:
            failed.append(str(action_id))
            continue
            
        # Use current_user instead of fetching again (auth is done)
        user = current_user

        try:
            service = GmailService(user, db)
            label_name = f"{user.label_prefix}/{action.suggested_label}"
            gmail_label_id = service.ensure_label(label_name)

            email = action.email
            if email and email.gmail_message_id:
                service.apply_label(email.gmail_message_id, gmail_label_id)

            action.status = "approved"
            action.updated_at = datetime.utcnow()
            db.add(action)
            succeeded.append(str(action_id))
        except Exception as e:
            print(f"Bulk approve failed for {action_id}: {e}")
            failed.append(str(action_id))

    db.commit()
    return BulkActionResult(succeeded=succeeded, failed=failed)


# ─── Bulk Reject ──────────────────────────────────────────────────

@router.post("/bulk-reject", response_model=BulkActionResult)
def bulk_reject(
    req: BulkActionRequest, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Reject multiple suggestions at once for the authenticated user."""
    succeeded = []
    failed = []

    for action_id in req.action_ids:
        action = db.get(EmailAction, action_id)
        if not action:
            failed.append(str(action_id))
            continue
            
        # Verify ownership
        if action.user_id != current_user.id:
            failed.append(str(action_id))
            continue

        action.status = "rejected"
        action.updated_at = datetime.utcnow()
        db.add(action)
        succeeded.append(str(action_id))

        # Trigger feedback
        email = db.get(EmailInsight, action.email_id)
        if email:
            feedback = FeedbackCreate(feedback_type="wrong_group", target_group=None)
            submit_feedback(email.id, feedback, db)

    db.commit()
    return BulkActionResult(succeeded=succeeded, failed=failed)

