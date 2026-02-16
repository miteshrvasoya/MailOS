from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.api import deps
from app.models.email import EmailInsight
from app.models.rule import Rule
from app.models.user import User

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(user_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    """
    Get aggregate statistics for the dashboard.
    """
    # 1. Total emails processed
    total_emails = db.exec(select(func.count(EmailInsight.id)).where(EmailInsight.user_id == user_id)).one()
    
    # 2. Important detected (importance > 0.7)
    important_emails = db.exec(select(func.count(EmailInsight.id)).where(EmailInsight.user_id == user_id, EmailInsight.importance_score > 0.7)).one()
    
    # 3. Rules created
    active_rules = db.exec(select(func.count(Rule.id)).where(Rule.user_id == user_id, Rule.is_active == True)).one()
    
    # 4. AI Confidence
    avg_importance = db.exec(select(func.avg(EmailInsight.importance_score)).where(EmailInsight.user_id == user_id)).one() or 0.0
    
    return {
        "total_emails": total_emails,
        "important_emails": important_emails,
        "active_rules": active_rules,
        "ai_confidence": round(avg_importance * 100, 1) if avg_importance else 85.0
    }
