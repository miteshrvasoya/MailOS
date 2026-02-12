"""
Follow-up Detection Service

Analyzes emails to determine:
1. Which emails need a reply from the user (follow-up pending)
2. Which threads the user is waiting on (stale threads)
3. Generates follow-up reminders as notifications
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select, and_, or_
from app.models.email import EmailInsight
from app.models.notification import Notification, NotificationCategory, NotificationPriority
import uuid


# Keywords that suggest a follow-up is needed
FOLLOW_UP_KEYWORDS = [
    "please reply", "let me know", "get back to me", "your response",
    "waiting for your", "follow up", "following up", "action required",
    "action needed", "please respond", "urgent", "asap", "deadline",
    "by tomorrow", "by end of day", "eod", "at your earliest",
    "can you confirm", "please confirm", "awaiting your", "rsvp",
    "please advise", "your thoughts", "what do you think",
]

# Keywords that suggest user is waiting for a reply
WAITING_KEYWORDS = [
    "i'll get back", "will follow up", "will respond", "let you know",
    "i will send", "will share", "get back to you",
]

# Default follow-up window (hours)
DEFAULT_FOLLOW_UP_HOURS = 24
STALE_THREAD_HOURS = 48


def scan_for_follow_ups(
    db: Session,
    user_id: uuid.UUID,
    hours_lookback: int = 72,
) -> Dict[str, int]:
    """
    Scan recent emails and flag those needing follow-up.
    Returns counts of newly flagged items.
    """
    cutoff = datetime.utcnow() - timedelta(hours=hours_lookback)

    # Get recent unflagged emails that need reply
    statement = select(EmailInsight).where(
        and_(
            EmailInsight.user_id == user_id,
            EmailInsight.sent_at >= cutoff,
            EmailInsight.follow_up_status == "none",
            EmailInsight.needs_reply == True,
        )
    )
    emails = db.exec(statement).all()

    follow_up_count = 0
    waiting_count = 0

    for email in emails:
        snippet_lower = (email.snippet or "").lower()
        subject_lower = (email.subject or "").lower()
        combined = f"{snippet_lower} {subject_lower}"

        # Check if this email contains follow-up signals
        has_follow_up_signal = any(kw in combined for kw in FOLLOW_UP_KEYWORDS)
        is_high_urgency = email.urgency in ("high", "medium")

        if has_follow_up_signal or is_high_urgency or email.needs_reply:
            email.follow_up_status = "pending"

            # Set deadline based on urgency
            if email.urgency == "high":
                email.follow_up_deadline = email.sent_at + timedelta(hours=6)
            elif email.urgency == "medium":
                email.follow_up_deadline = email.sent_at + timedelta(hours=DEFAULT_FOLLOW_UP_HOURS)
            else:
                email.follow_up_deadline = email.sent_at + timedelta(hours=48)

            db.add(email)
            follow_up_count += 1

    # Detect stale threads (user sent last message, no reply received)
    stale_cutoff = datetime.utcnow() - timedelta(hours=STALE_THREAD_HOURS)
    stale_statement = select(EmailInsight).where(
        and_(
            EmailInsight.user_id == user_id,
            EmailInsight.sent_at <= stale_cutoff,
            EmailInsight.thread_id != None,
            EmailInsight.waiting_on_reply == False,
            EmailInsight.follow_up_status == "none",
        )
    )
    stale_candidates = db.exec(stale_statement).all()

    # Group by thread_id to find threads with no newer messages
    thread_map: Dict[str, List[EmailInsight]] = {}
    for email in stale_candidates:
        if email.thread_id:
            thread_map.setdefault(email.thread_id, []).append(email)

    for thread_id, thread_emails in thread_map.items():
        # Sort by sent_at, newest first
        thread_emails.sort(key=lambda e: e.sent_at, reverse=True)
        latest = thread_emails[0]

        # Check if latest snippet suggests user is waiting
        snippet_lower = (latest.snippet or "").lower()
        has_waiting_signal = any(kw in snippet_lower for kw in WAITING_KEYWORDS)

        if has_waiting_signal or latest.needs_reply:
            latest.waiting_on_reply = True
            latest.follow_up_status = "pending"
            db.add(latest)
            waiting_count += 1

    db.commit()

    return {"follow_ups_flagged": follow_up_count, "stale_threads_flagged": waiting_count}


def create_follow_up_reminders(
    db: Session,
    user_id: uuid.UUID,
) -> int:
    """
    Create notification reminders for overdue follow-ups.
    Returns the number of reminders created.
    """
    now = datetime.utcnow()

    # Find pending follow-ups that are past their deadline
    statement = select(EmailInsight).where(
        and_(
            EmailInsight.user_id == user_id,
            EmailInsight.follow_up_status == "pending",
            EmailInsight.follow_up_deadline != None,
            EmailInsight.follow_up_deadline <= now,
        )
    )
    overdue = db.exec(statement).all()

    reminder_count = 0
    for email in overdue:
        # Check if we already sent a notification for this email recently
        existing = db.exec(
            select(Notification).where(
                and_(
                    Notification.user_id == user_id,
                    Notification.category == NotificationCategory.FOLLOW_UP,
                    Notification.action_url == f"/dashboard/emails/{email.id}",
                    Notification.created_at >= now - timedelta(hours=12),
                )
            )
        ).first()

        if not existing:
            hours_overdue = int((now - email.follow_up_deadline).total_seconds() / 3600)
            notification = Notification(
                user_id=user_id,
                title=f"Follow-up needed: {email.subject or 'No subject'}",
                message=f"Email from {email.sender} is {hours_overdue}h overdue for a reply.",
                category=NotificationCategory.FOLLOW_UP,
                priority=NotificationPriority.HIGH if email.urgency == "high" else NotificationPriority.MEDIUM,
                action_url=f"/dashboard/emails/{email.id}",
            )
            db.add(notification)
            reminder_count += 1

    db.commit()
    return reminder_count


def get_follow_up_summary(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
    """Get a summary of follow-up status for the user."""
    now = datetime.utcnow()

    pending = db.exec(
        select(EmailInsight).where(
            EmailInsight.user_id == user_id,
            EmailInsight.follow_up_status == "pending",
            EmailInsight.waiting_on_reply == False,
        )
    ).all()

    waiting = db.exec(
        select(EmailInsight).where(
            EmailInsight.user_id == user_id,
            EmailInsight.follow_up_status == "pending",
            EmailInsight.waiting_on_reply == True,
        )
    ).all()

    overdue = [e for e in pending if e.follow_up_deadline and e.follow_up_deadline <= now]

    return {
        "needs_reply_count": len(pending),
        "waiting_on_others_count": len(waiting),
        "overdue_count": len(overdue),
    }
