from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.api import deps
from app.models.email import EmailInsight
from app.models.rule import Rule
from app.models.user import User

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(deps.get_db)):
    """
    Get aggregate statistics for the dashboard.
    """
    # 1. Total emails processed (mock: total emails in DB)
    total_emails = db.exec(select(func.count(EmailInsight.id))).one()
    
    # 2. Important detected (importance > 0.7)
    important_emails = db.exec(select(func.count(EmailInsight.id)).where(EmailInsight.importance_score > 0.7)).one()
    
    # 3. Rules/Groups created (using Rules for now as we don't have groups)
    active_rules = db.exec(select(func.count(Rule.id)).where(Rule.is_active == True)).one()
    
    # 4. AI Confidence (Average importance score as a proxy, or just mock for now)
    # Let's calculate average importance of analyzed emails
    avg_importance = db.exec(select(func.avg(EmailInsight.importance_score))).one() or 0.0
    
    return {
        "total_emails": total_emails,
        "important_emails": important_emails,
        "active_rules": active_rules,
        "ai_confidence": round(avg_importance * 100, 1) if avg_importance else 85.0 # Mock baseline if empty
    }
