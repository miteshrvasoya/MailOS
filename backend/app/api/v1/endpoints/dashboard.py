from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.api import deps
from app.models.email import EmailInsight
from app.models.rule import Rule
from app.models.user import User
from app.services.digest_service import get_latest_digest

router = APIRouter()


def _compute_dashboard_stats(db: Session, user_id):
  # 1. Total emails processed
  total_emails = db.exec(
      select(func.count(EmailInsight.id)).where(EmailInsight.user_id == user_id)
  ).one()

  # 2. Important detected (importance > 0.7)
  important_emails = db.exec(
      select(func.count(EmailInsight.id)).where(
          EmailInsight.user_id == user_id,
          EmailInsight.importance_score > 0.7,
      )
  ).one()

  # 3. Rules created
  active_rules = db.exec(
      select(func.count(Rule.id)).where(
          Rule.user_id == user_id,
          Rule.is_active == True,
      )
  ).one()

  # 4. AI Confidence
  raw_avg = db.exec(
      select(func.avg(EmailInsight.importance_score)).where(
          EmailInsight.user_id == user_id
      )
  ).one()

  avg_importance = float(raw_avg or 0.0)

  # Support both 0–1 and 0–100 scales, then clamp to [0, 100]
  if avg_importance <= 1.0:
      ai_conf = round(avg_importance * 100, 1)
  else:
      ai_conf = round(avg_importance, 1)

  ai_conf = max(0.0, min(ai_conf, 100.0))

  return {
      "total_emails": total_emails,
      "important_emails": important_emails,
      "active_rules": active_rules,
      "ai_confidence": ai_conf,
  }


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get aggregate statistics for the dashboard.
    """
    return _compute_dashboard_stats(db, current_user.id)


@router.get("/overview")
def get_dashboard_overview(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Combined dashboard data for the main dashboard view.
    Includes stats, important emails, and today's digest preview (if available).
    """
    user_id = current_user.id

    stats = _compute_dashboard_stats(db, user_id)

    # Important emails (top 5 by importance & recency)
    important_emails = db.exec(
        select(EmailInsight)
        .where(
            EmailInsight.user_id == user_id,
            EmailInsight.importance_score > 0.7,
        )
        .order_by(EmailInsight.sent_at.desc())
        .limit(5)
    ).all()

    # Latest daily digest for preview (if any)
    digest = get_latest_digest(db, user_id, "daily")
    digest_preview = None
    if digest:
        digest_preview = {
            "summary": digest.summary,
            "stats": digest.stats,
            "sections": digest.sections,
            "generated_at": digest.generated_at,
        }

    return {
        "stats": stats,
        "important_emails": important_emails,
        "digest_preview": digest_preview,
    }
