from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.api import deps
from app.models.user import User
from app.models.email import EmailInsight
from app.models.action import EmailAction
from app.models.ai_log import AILog

router = APIRouter()


def _get_recent_emails(db: Session, user_id, days: int = 7) -> List[EmailInsight]:
    since = datetime.utcnow() - timedelta(days=days)
    return db.exec(
        select(EmailInsight).where(
            EmailInsight.user_id == user_id,
            EmailInsight.sent_at >= since,
        )
    ).all()


@router.get("/overview")
def get_insights_overview(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Dict[str, Any]:
    """
    Overview data that powers the /dashboard/insights page.
    All values are scoped to the current user.
    """
    user_id = current_user.id

    now = datetime.utcnow()
    last_7_days = _get_recent_emails(db, user_id, days=7)
    last_14_days = _get_recent_emails(db, user_id, days=14)

    # ----- Key metrics -----
    total_7 = len(last_7_days)
    important_7 = sum(1 for e in last_7_days if e.importance_score >= 0.7)
    unread_7 = sum(1 for e in last_7_days if not e.is_read)
    unread_urgent_7 = sum(
        1 for e in last_7_days if not e.is_read and e.urgency == "high"
    )

    important_ratio = (important_7 / total_7 * 100) if total_7 else 0.0

    # Approximate "avg response time" as age of pending follow-ups (hours)
    pending_followups = [
        e
        for e in last_7_days
        if e.needs_reply and e.follow_up_status == "pending"
    ]
    if pending_followups:
        avg_response_hours = sum(
            (now - e.sent_at).total_seconds() / 3600.0 for e in pending_followups
        ) / len(pending_followups)
    else:
        avg_response_hours = None

    # AI accuracy approximation from AI logs (success ratio last 7 days)
    logs_7 = db.exec(
        select(AILog).where(
            AILog.user_id == user_id,
            AILog.created_at >= now - timedelta(days=7),
        )
    ).all()
    if logs_7:
        success = sum(1 for l in logs_7 if l.status == "success")
        ai_accuracy = round(success / len(logs_7) * 100, 1)
    else:
        ai_accuracy = None

    key_metrics = {
        "important_ratio": round(important_ratio, 1),
        "avg_response_hours": avg_response_hours,
        "unread_this_week": unread_7,
        "unread_urgent": unread_urgent_7,
        "ai_accuracy": ai_accuracy,
    }

    # ----- Category distribution (last 7 days) -----
    category_counts: Dict[str, int] = {}
    for e in last_7_days:
        cat = e.category or "Uncategorized"
        category_counts[cat] = category_counts.get(cat, 0) + 1

    category_distribution = [
        {"category": cat, "count": count}
        for cat, count in sorted(
            category_counts.items(), key=lambda x: x[1], reverse=True
        )
    ]

    # ----- Importance trend (per day, last 7 days) -----
    trend_map: Dict[str, Dict[str, int]] = {}
    for e in last_7_days:
        day = e.sent_at.strftime("%a")  # Mon, Tue, ...
        bucket = trend_map.setdefault(day, {"date": day, "important": 0, "total": 0})
        bucket["total"] += 1
        if e.importance_score >= 0.7:
            bucket["important"] += 1

    # Keep days ordered by weekday order (Mon..Sun)
    weekday_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    importance_trend = [
        trend_map[d] for d in weekday_order if d in trend_map
    ]

    # ----- Response delay distribution -----
    ranges = [
        ("0-1h", 0, 1),
        ("1-4h", 1, 4),
        ("4-24h", 4, 24),
        ("1-7d", 24, 24 * 7),
        ("7d+", 24 * 7, None),
    ]
    buckets = {label: 0 for (label, _, _) in ranges}

    for e in pending_followups:
        age_hours = (now - e.sent_at).total_seconds() / 3600.0
        for label, lo, hi in ranges:
            if hi is None:
                if age_hours >= lo:
                    buckets[label] += 1
                    break
            elif lo <= age_hours < hi:
                buckets[label] += 1
                break

    response_delay_distribution = [
        {"range": label, "emails": count} for label, count in buckets.items()
    ]

    # ----- Confidence buckets (importance_score) -----
    conf_buckets = {
        "90-100%": 0,
        "80-90%": 0,
        "70-80%": 0,
        "<70%": 0,
    }
    for e in last_7_days:
        score = e.importance_score
        # Normalise if stored as 0–1
        if score <= 1.0:
            score *= 100
        if score >= 90:
            conf_buckets["90-100%"] += 1
        elif score >= 80:
            conf_buckets["80-90%"] += 1
        elif score >= 70:
            conf_buckets["70-80%"] += 1
        else:
            conf_buckets["<70%"] += 1

    confidence_buckets = [
        {"range": label, "emails": count}
        for label, count in conf_buckets.items()
    ]

    # ----- Top senders (last 30 days) -----
    last_30_days = _get_recent_emails(db, user_id, days=30)
    sender_counts: Dict[str, int] = {}
    for e in last_30_days:
        sender_counts[e.sender] = sender_counts.get(e.sender, 0) + 1

    total_30 = len(last_30_days) or 1
    top_senders = []
    for sender, count in sorted(
        sender_counts.items(), key=lambda x: x[1], reverse=True
    )[:5]:
        percentage = round(count / total_30 * 100)
        top_senders.append(
            {"sender": sender, "emails": count, "percentage": percentage}
        )

    # ----- Volume summary (this week vs last week, this month vs last month) -----
    # This week / last week
    this_week_start = now - timedelta(days=7)
    last_week_start = now - timedelta(days=14)

    this_week = [
        e for e in last_14_days if e.sent_at >= this_week_start
    ]
    last_week = [
        e for e in last_14_days if last_week_start <= e.sent_at < this_week_start
    ]

    this_week_count = len(this_week)
    last_week_count = len(last_week)
    if last_week_count > 0:
        this_week_delta = (this_week_count - last_week_count) / last_week_count
    else:
        this_week_delta = 0.0

    # This month vs previous month (approximate 30-day windows)
    last_60_days = _get_recent_emails(db, user_id, days=60)
    this_month_start = now - timedelta(days=30)
    prev_month_start = now - timedelta(days=60)

    this_month = [
        e for e in last_60_days if e.sent_at >= this_month_start
    ]
    prev_month = [
        e
        for e in last_60_days
        if prev_month_start <= e.sent_at < this_month_start
    ]

    this_month_count = len(this_month)
    prev_month_count = len(prev_month)
    if prev_month_count > 0:
        this_month_delta = (this_month_count - prev_month_count) / prev_month_count
    else:
        this_month_delta = 0.0

    days_span = max(1, min(30, len({e.sent_at.date() for e in last_30_days})))
    daily_average = this_month_count / days_span if days_span else 0.0

    volume_summary = {
        "this_week": this_week_count,
        "this_week_delta": this_week_delta,
        "this_month": this_month_count,
        "this_month_delta": this_month_delta,
        "daily_average": round(daily_average, 1),
    }

    # ----- Engagement Summary -----
    # Most / least active day in last 30 days
    day_counts: Dict[str, int] = {}
    for e in last_30_days:
        day_label = e.sent_at.strftime("%A")  # Monday, Tuesday, ...
        day_counts[day_label] = day_counts.get(day_label, 0) + 1

    if day_counts:
        most_active_day, most_active_count = max(
            day_counts.items(), key=lambda x: x[1]
        )
        quietest_day, quietest_count = min(
            day_counts.items(), key=lambda x: x[1]
        )
    else:
        most_active_day, most_active_count = "N/A", 0
        quietest_day, quietest_count = "N/A", 0

    # Avg processing speed from AI logs (all time)
    all_logs = db.exec(
        select(AILog).where(AILog.user_id == user_id)
    ).all()
    if all_logs:
        avg_processing_ms = round(
            sum(l.latency_ms for l in all_logs) / len(all_logs), 1
        )
    else:
        avg_processing_ms = 0.0

    engagement_summary = {
        "most_active_day": most_active_day,
        "most_active_count": most_active_count,
        "quietest_day": quietest_day,
        "quietest_count": quietest_count,
        "avg_processing_ms": avg_processing_ms,
    }

    return {
        "key_metrics": key_metrics,
        "category_distribution": category_distribution,
        "importance_trend": importance_trend,
        "response_delay_distribution": response_delay_distribution,
        "confidence_buckets": confidence_buckets,
        "top_senders": top_senders,
        "volume_summary": volume_summary,
        "engagement_summary": engagement_summary,
    }

