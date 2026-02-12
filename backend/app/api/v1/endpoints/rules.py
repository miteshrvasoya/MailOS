from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.api import deps
from app.models.rule import Rule
from pydantic import BaseModel
import uuid

router = APIRouter()

# ─── Rule Templates ───────────────────────────────────────────────

RULE_TEMPLATES = [
    {
        "id": "otp_security",
        "name": "Mark OTP & Verification Emails as Security",
        "description": "Automatically categorize OTP, verification codes, and 2FA emails into Security.",
        "conditions": {
            "all": [
                {"field": "subject", "operator": "contains", "value": "verification code"}
            ]
        },
        "actions": {"move_to_category": "Security", "mark_read": True},
        "priority": 5,
    },
    {
        "id": "archive_promotions",
        "name": "Auto-Archive Promotional Emails",
        "description": "Mark promotional emails as read so they don't clutter your inbox.",
        "conditions": {
            "all": [
                {"field": "category", "operator": "equals", "value": "promotions"}
            ]
        },
        "actions": {"mark_read": True},
        "priority": 3,
    },
    {
        "id": "important_invoices",
        "name": "Prioritize Invoice & Billing Emails",
        "description": "Mark invoices and billing emails as important and move to Finance.",
        "conditions": {
            "all": [
                {"field": "subject", "operator": "contains", "value": "invoice"}
            ]
        },
        "actions": {"move_to_category": "Finance", "mark_important": True},
        "priority": 7,
    },
    {
        "id": "newsletter_archive",
        "name": "Auto-Read Newsletters",
        "description": "Automatically mark newsletter emails as read for later browsing.",
        "conditions": {
            "all": [
                {"field": "category", "operator": "equals", "value": "newsletter"}
            ]
        },
        "actions": {"mark_read": True},
        "priority": 2,
    },
    {
        "id": "job_alerts",
        "name": "Highlight Job Application Updates",
        "description": "Mark emails about interviews, offers, and applications as important.",
        "conditions": {
            "all": [
                {"field": "subject", "operator": "contains", "value": "interview"}
            ]
        },
        "actions": {"move_to_category": "Job", "mark_important": True},
        "priority": 8,
    },
    {
        "id": "security_alerts",
        "name": "Flag Security Alerts",
        "description": "Mark login alerts and suspicious activity emails as high priority.",
        "conditions": {
            "all": [
                {"field": "subject", "operator": "contains", "value": "suspicious"}
            ]
        },
        "actions": {"move_to_category": "Security", "mark_important": True, "stop_processing": True},
        "priority": 10,
    },
]


# ─── CRUD Endpoints ──────────────────────────────────────────────

@router.get("/", response_model=List[Rule])
def read_rules(
    user_id: Optional[uuid.UUID] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
):
    """List rules, optionally filtered by user_id."""
    statement = select(Rule)
    if user_id:
        statement = statement.where(Rule.user_id == user_id)
    statement = statement.order_by(Rule.priority.desc()).offset(skip).limit(limit)
    rules = db.exec(statement).all()
    return rules


@router.post("/", response_model=Rule)
def create_rule(rule: Rule, db: Session = Depends(deps.get_db)):
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/templates")
def get_rule_templates():
    """Return the list of pre-built rule templates."""
    return RULE_TEMPLATES


class CreateFromTemplateRequest(BaseModel):
    user_id: uuid.UUID
    template_id: str


@router.post("/from-template", response_model=Rule)
def create_rule_from_template(
    req: CreateFromTemplateRequest,
    db: Session = Depends(deps.get_db),
):
    """Create a rule from a pre-built template."""
    template = next((t for t in RULE_TEMPLATES if t["id"] == req.template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    rule = Rule(
        user_id=req.user_id,
        name=template["name"],
        description=template["description"],
        priority=template["priority"],
        conditions=template["conditions"],
        actions=template["actions"],
        is_active=True,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/{rule_id}", response_model=Rule)
def read_rule(rule_id: str, db: Session = Depends(deps.get_db)):
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    conditions: Optional[dict] = None
    actions: Optional[dict] = None


@router.patch("/{rule_id}", response_model=Rule)
def update_rule(rule_id: str, update: RuleUpdate, db: Session = Depends(deps.get_db)):
    """Partially update a rule (toggle active, rename, change priority, etc.)."""
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)

    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_rule(rule_id: str, db: Session = Depends(deps.get_db)):
    """Delete a rule."""
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"status": "deleted", "id": rule_id}
