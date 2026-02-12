from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, and_
from app.api import deps
from app.models.email import EmailInsight
from app.services.follow_up_service import (
    scan_for_follow_ups,
    create_follow_up_reminders,
    get_follow_up_summary,
)
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


# ─── Response Models ──────────────────────────────────────────────

class FollowUpItem(BaseModel):
    id: uuid.UUID
    email_id: uuid.UUID
    subject: Optional[str]
    sender: str
    sent_at: datetime
    urgency: str
    importance_score: float
    snippet: Optional[str]
    follow_up_status: str
    follow_up_deadline: Optional[datetime]
    waiting_on_reply: bool
    category: str


class FollowUpSummary(BaseModel):
    needs_reply_count: int
    waiting_on_others_count: int
    overdue_count: int


class ScanResult(BaseModel):
    follow_ups_flagged: int
    stale_threads_flagged: int
    reminders_created: int


# ─── Summary ──────────────────────────────────────────────────────

@router.get("/summary", response_model=FollowUpSummary)
def get_summary(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """Get follow-up status summary for the user."""
    return get_follow_up_summary(db, user_id)


# ─── List: Needs Reply ────────────────────────────────────────────

@router.get("/needs-reply", response_model=List[FollowUpItem])
def list_needs_reply(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """List emails that need a reply from the user."""
    statement = (
        select(EmailInsight)
        .where(
            and_(
                EmailInsight.user_id == user_id,
                EmailInsight.follow_up_status == "pending",
                EmailInsight.waiting_on_reply == False,
            )
        )
        .order_by(EmailInsight.follow_up_deadline.asc())
    )
    emails = db.exec(statement).all()
    return [_email_to_followup(e) for e in emails]


# ─── List: Waiting on Others ─────────────────────────────────────

@router.get("/waiting", response_model=List[FollowUpItem])
def list_waiting_on_others(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """List threads where user is waiting for a reply from someone else."""
    statement = (
        select(EmailInsight)
        .where(
            and_(
                EmailInsight.user_id == user_id,
                EmailInsight.follow_up_status == "pending",
                EmailInsight.waiting_on_reply == True,
            )
        )
        .order_by(EmailInsight.sent_at.asc())
    )
    emails = db.exec(statement).all()
    return [_email_to_followup(e) for e in emails]


# ─── Resolve / Dismiss ───────────────────────────────────────────

@router.post("/{email_id}/resolve")
def resolve_follow_up(
    email_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
):
    """Mark a follow-up as resolved."""
    email = db.get(EmailInsight, email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    email.follow_up_status = "resolved"
    db.add(email)
    db.commit()
    return {"status": "resolved", "email_id": str(email_id)}


@router.post("/{email_id}/dismiss")
def dismiss_follow_up(
    email_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
):
    """Dismiss a follow-up (set back to none)."""
    email = db.get(EmailInsight, email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    email.follow_up_status = "none"
    email.waiting_on_reply = False
    email.follow_up_deadline = None
    db.add(email)
    db.commit()
    return {"status": "dismissed", "email_id": str(email_id)}


# ─── Scan ─────────────────────────────────────────────────────────

@router.post("/scan", response_model=ScanResult)
def trigger_scan(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """Manually trigger a follow-up scan."""
    scan_result = scan_for_follow_ups(db, user_id)
    reminders = create_follow_up_reminders(db, user_id)
    return ScanResult(
        follow_ups_flagged=scan_result["follow_ups_flagged"],
        stale_threads_flagged=scan_result["stale_threads_flagged"],
        reminders_created=reminders,
    )


# ─── Helpers ──────────────────────────────────────────────────────

def _email_to_followup(email: EmailInsight) -> FollowUpItem:
    return FollowUpItem(
        id=email.id,
        email_id=email.id,
        subject=email.subject,
        sender=email.sender,
        sent_at=email.sent_at,
        urgency=email.urgency,
        importance_score=email.importance_score,
        snippet=email.snippet,
        follow_up_status=email.follow_up_status,
        follow_up_deadline=email.follow_up_deadline,
        waiting_on_reply=email.waiting_on_reply,
        category=email.category,
    )
