from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, and_
from app.api import deps
from app.models.snoozed_email import SnoozedEmail
from app.models.email import EmailInsight
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid

router = APIRouter()


# ─── Response Models ──────────────────────────────────────────────

class SnoozedItemResponse(BaseModel):
    id: uuid.UUID
    email_id: uuid.UUID
    email_subject: Optional[str]
    email_sender: str
    snooze_until: datetime
    reason: Optional[str]
    status: str
    created_at: datetime


class SnoozeRequest(BaseModel):
    user_id: uuid.UUID
    email_id: uuid.UUID
    duration: str  # "1h", "3h", "tomorrow", "next_week", or ISO datetime string
    reason: Optional[str] = None


# ─── Duration Parser ──────────────────────────────────────────────

def parse_snooze_duration(duration: str) -> datetime:
    """Convert a duration string to a target datetime."""
    now = datetime.utcnow()

    if duration == "1h":
        return now + timedelta(hours=1)
    elif duration == "3h":
        return now + timedelta(hours=3)
    elif duration == "tomorrow":
        # Tomorrow at 9 AM UTC
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=9, minute=0, second=0, microsecond=0)
    elif duration == "next_week":
        # Next Monday at 9 AM UTC
        days_until_monday = (7 - now.weekday()) % 7 or 7
        next_monday = now + timedelta(days=days_until_monday)
        return next_monday.replace(hour=9, minute=0, second=0, microsecond=0)
    elif duration == "next_month":
        # 30 days from now at 9 AM UTC
        return (now + timedelta(days=30)).replace(hour=9, minute=0, second=0, microsecond=0)
    else:
        # Try parsing as ISO datetime
        try:
            return datetime.fromisoformat(duration)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid duration: {duration}")


# ─── Snooze an Email ──────────────────────────────────────────────

@router.post("/", response_model=SnoozedItemResponse)
def snooze_email(req: SnoozeRequest, db: Session = Depends(deps.get_db)):
    """Snooze an email for a specified duration."""
    email = db.get(EmailInsight, req.email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    snooze_until = parse_snooze_duration(req.duration)

    # Check if already snoozed
    existing = db.exec(
        select(SnoozedEmail).where(
            and_(
                SnoozedEmail.email_id == req.email_id,
                SnoozedEmail.user_id == req.user_id,
                SnoozedEmail.status == "snoozed",
            )
        )
    ).first()

    if existing:
        # Update existing snooze
        existing.snooze_until = snooze_until
        existing.reason = req.reason
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return _to_response(existing, email)

    snoozed = SnoozedEmail(
        user_id=req.user_id,
        email_id=req.email_id,
        snooze_until=snooze_until,
        reason=req.reason or _duration_label(req.duration),
    )
    db.add(snoozed)
    db.commit()
    db.refresh(snoozed)
    return _to_response(snoozed, email)


# ─── List Snoozed ────────────────────────────────────────────────

@router.get("/", response_model=List[SnoozedItemResponse])
def list_snoozed(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """List all currently snoozed emails for a user."""
    statement = (
        select(SnoozedEmail, EmailInsight)
        .join(EmailInsight)
        .where(
            and_(
                SnoozedEmail.user_id == user_id,
                SnoozedEmail.status == "snoozed",
            )
        )
        .order_by(SnoozedEmail.snooze_until.asc())
    )
    results = db.exec(statement).all()
    return [_to_response(snoozed, email) for snoozed, email in results]


# ─── Unsnooze ─────────────────────────────────────────────────────

@router.post("/{snooze_id}/unsnooze")
def unsnooze_email(snooze_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    """Cancel a snooze and resurface the email immediately."""
    snoozed = db.get(SnoozedEmail, snooze_id)
    if not snoozed:
        raise HTTPException(status_code=404, detail="Snoozed email not found")

    snoozed.status = "cancelled"
    snoozed.resurfaced_at = datetime.utcnow()
    db.add(snoozed)
    db.commit()
    return {"status": "unsnoozed", "email_id": str(snoozed.email_id)}


# ─── Resurface Check (for background worker) ─────────────────────

@router.post("/resurface")
def resurface_snoozed(db: Session = Depends(deps.get_db)):
    """
    Check for snoozed emails whose snooze_until has passed
    and mark them as resurfaced. Called by a background worker.
    """
    now = datetime.utcnow()
    statement = select(SnoozedEmail).where(
        and_(
            SnoozedEmail.status == "snoozed",
            SnoozedEmail.snooze_until <= now,
        )
    )
    expired = db.exec(statement).all()

    count = 0
    for snoozed in expired:
        snoozed.status = "resurfaced"
        snoozed.resurfaced_at = now
        db.add(snoozed)
        count += 1

    db.commit()
    return {"resurfaced": count}


# ─── Helpers ──────────────────────────────────────────────────────

def _to_response(snoozed: SnoozedEmail, email: EmailInsight) -> SnoozedItemResponse:
    return SnoozedItemResponse(
        id=snoozed.id,
        email_id=snoozed.email_id,
        email_subject=email.subject,
        email_sender=email.sender,
        snooze_until=snoozed.snooze_until,
        reason=snoozed.reason,
        status=snoozed.status,
        created_at=snoozed.created_at,
    )


def _duration_label(duration: str) -> str:
    labels = {
        "1h": "Snoozed for 1 hour",
        "3h": "Snoozed for 3 hours",
        "tomorrow": "Snoozed until tomorrow",
        "next_week": "Snoozed until next week",
        "next_month": "Snoozed until next month",
    }
    return labels.get(duration, f"Snoozed until {duration}")
