from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
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
    """Fetch pending AI suggestions (kept for backward compat)."""
    return _get_pending_list(db)


@router.get("/pending-list", response_model=List[ActionResponse])
def get_pending_actions_list(user_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    """Fetch pending AI suggestions with email data."""
    return _get_pending_list(db, user_id)


def _get_pending_list(db: Session, user_id: uuid.UUID) -> List[ActionResponse]:
    statement = select(EmailAction, EmailInsight).join(EmailInsight).where(EmailAction.status == "pending", EmailAction.user_id == user_id)
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
            created_at=action.created_at,
            status=action.status,
        ))
    return response


# ─── Single Approve ───────────────────────────────────────────────

@router.post("/{action_id}/approve")
def approve_action(action_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    user = db.get(User, action.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        service = GmailService(user, db)
        label_name = f"MailOS/{action.suggested_label}"
        gmail_label_id = service.ensure_label(label_name)

        email = action.email
        if not email or not email.gmail_message_id:
            raise HTTPException(status_code=400, detail="Associated email not found")

        service.apply_label(email.gmail_message_id, gmail_label_id)

        action.status = "approved"
        action.updated_at = datetime.utcnow()
        db.add(action)
        db.commit()
        return {"status": "approved", "label_applied": label_name}

    except Exception as e:
        print(f"Failed to apply label: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to apply label in Gmail: {str(e)}")


# ─── Single Reject ────────────────────────────────────────────────

@router.post("/{action_id}/reject")
def reject_action(action_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.status = "rejected"
    action.updated_at = datetime.utcnow()
    db.add(action)
    db.commit()

    email = db.get(EmailInsight, action.email_id)
    if email:
        feedback = FeedbackCreate(feedback_type="wrong_group", target_group=None)
        submit_feedback(email.id, feedback, db)

    return {"status": "rejected"}


# ─── Undo Action ──────────────────────────────────────────────────

@router.post("/{action_id}/undo")
def undo_action(action_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    """
    Revert an approved/rejected action back to pending,
    only if within the undo window (10 seconds).
    """
    action = db.get(EmailAction, action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

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


# ─── Bulk Approve ─────────────────────────────────────────────────

class BulkActionRequest(BaseModel):
    action_ids: List[uuid.UUID]


class BulkActionResult(BaseModel):
    succeeded: List[str]
    failed: List[str]


@router.post("/bulk-approve", response_model=BulkActionResult)
def bulk_approve(req: BulkActionRequest, db: Session = Depends(deps.get_db)):
    """Approve multiple suggestions at once."""
    succeeded = []
    failed = []

    for action_id in req.action_ids:
        action = db.get(EmailAction, action_id)
        if not action:
            failed.append(str(action_id))
            continue

        user = db.get(User, action.user_id)
        if not user:
            failed.append(str(action_id))
            continue

        try:
            service = GmailService(user, db)
            label_name = f"MailOS/{action.suggested_label}"
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
def bulk_reject(req: BulkActionRequest, db: Session = Depends(deps.get_db)):
    """Reject multiple suggestions at once."""
    succeeded = []
    failed = []

    for action_id in req.action_ids:
        action = db.get(EmailAction, action_id)
        if not action:
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
