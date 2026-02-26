"""
Digest Generation Service

Generates daily/weekly email digests by:
1. Querying emails for the specified period
2. Grouping by category
3. Computing stats
4. Generating a text summary
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select, and_, func
from app.models.email import EmailInsight
from app.models.digest import Digest
from app.core.ai import generate_digest_insights
import uuid


def generate_digest(
    db: Session,
    user_id: uuid.UUID,
    digest_type: str = "daily",
    period_end: Optional[datetime] = None,
) -> Digest:
    """Generate a digest for the user covering the specified period."""
    if period_end is None:
        period_end = datetime.utcnow()

    if digest_type == "daily":
        period_start = period_end - timedelta(days=1)
    elif digest_type == "weekly":
        period_start = period_end - timedelta(weeks=1)
    else:
        period_start = period_end - timedelta(days=1)

    # Fetch emails for the period
    emails = db.exec(
        select(EmailInsight).where(
            and_(
                EmailInsight.user_id == user_id,
                EmailInsight.sent_at >= period_start,
                EmailInsight.sent_at <= period_end,
            )
        )
    ).all()

    # Compute stats
    total = len(emails)
    important = sum(1 for e in emails if e.importance_score >= 0.7)
    needs_reply = sum(1 for e in emails if e.needs_reply)
    high_urgency = sum(1 for e in emails if e.urgency == "high")

    stats = {
        "total_emails": total,
        "important": important,
        "needs_reply": needs_reply,
        "high_urgency": high_urgency,
    }

    # Group by category (derived from labels/tags + category field)
    category_map: Dict[str, List[EmailInsight]] = {}
    for email in emails:
        cat = _derive_digest_category(email)
        category_map.setdefault(cat, []).append(email)

    # Build sections
    sections = []
    for category, cat_emails in sorted(category_map.items(), key=lambda x: len(x[1]), reverse=True):
        # Sort by importance within category
        cat_emails.sort(key=lambda e: e.importance_score, reverse=True)

        highlights = []
        for email in cat_emails[:5]:  # Top 5 per category
            highlights.append({
                "id": str(email.id),
                "thread_id": email.thread_id,
                "subject": email.subject or "No subject",
                "sender": email.sender,
                "importance": round(email.importance_score, 2),
                "urgency": email.urgency,
                "needs_reply": email.needs_reply,
                "snippet": (email.snippet or "")[:100],
            })

        sections.append({
            "category": category,
            "count": len(cat_emails),
            "important_count": sum(1 for e in cat_emails if e.importance_score >= 0.7),
            "highlights": highlights,
        })

    # Generate text summary via AI
    summary = generate_digest_insights(sections, digest_type, db, user_id)

    # Save digest
    digest = Digest(
        user_id=user_id,
        digest_type=digest_type,
        period_start=period_start,
        period_end=period_end,
        summary=summary,
        stats=stats,
        sections=sections,
        is_delivered=False,
    )
    db.add(digest)
    db.commit()
    db.refresh(digest)
    return digest


def _category_emoji(category: str) -> str:
    emojis = {
        "Work": "💼", "Finance": "💰", "Security": "🔒",
        "Newsletters": "📰", "Personal": "👤", "Promotions": "🏷️",
        "Orders": "📦", "Travel": "✈️", "Job Applications": "💼",
        "Uncategorized": "📧",
    }
    return emojis.get(category, "📧")


def _derive_digest_category(email: EmailInsight) -> str:
    """
    Derive a digest category using labels/tags when available for more precise grouping.

    Preference order:
    1. Sub:... tags (Dynamic AI subcategories e.g. 'Sub:Job Interviews')
    2. AI:... tags (e.g. 'AI:Finance', 'AI:Work')
    3. Rule:... tags (e.g. 'Rule:Job Applications')
    4. email.category field
    5. 'Uncategorized'
    """
    tags = getattr(email, "classification_tags", None) or []

    # 1. Prefer Deep Dynamic Subcategory tags
    for tag in tags:
        if isinstance(tag, str) and tag.startswith("Sub:"):
            value = tag.split("Sub:", 1)[1].strip()
            if value:
                return value

    # 2. Fallback to broad AI-derived category tags
    for tag in tags:
        if isinstance(tag, str) and tag.startswith("AI:"):
            value = tag.split("AI:", 1)[1].strip()
            if value:
                return value

    # 3. Fall back to rule-based tags
    for tag in tags:
        if isinstance(tag, str) and tag.startswith("Rule:"):
            value = tag.split("Rule:", 1)[1].strip()
            if value:
                return value

    # Finally, use the stored category or default
    return email.category or "Uncategorized"


def get_latest_digest(db: Session, user_id: uuid.UUID, digest_type: str = "daily") -> Optional[Digest]:
    """Get the most recent digest for a user."""
    return db.exec(
        select(Digest).where(
            and_(
                Digest.user_id == user_id,
                Digest.digest_type == digest_type,
            )
        ).order_by(Digest.generated_at.desc())
    ).first()


def get_digest_history(
    db: Session,
    user_id: uuid.UUID,
    limit: int = 10,
) -> List[Digest]:
    """Get recent digest history."""
    return db.exec(
        select(Digest).where(
            Digest.user_id == user_id,
        ).order_by(Digest.generated_at.desc()).limit(limit)
    ).all()
