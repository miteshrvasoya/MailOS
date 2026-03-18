"""
Auto-Clean Rules API endpoints.
Full CRUD + templates + manual execution trigger.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel
from app.api import deps
from app.models.auto_clean_rule import AutoCleanRule
from app.models.user import User
from app.services.auto_clean_engine import AutoCleanWorker
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Templates (hardcoded presets) ───────────────────────────────

AUTO_CLEAN_TEMPLATES = [
    {
        "id": "delete_otp_24h",
        "name": "Delete OTP emails after 24 hours",
        "description": "Automatically trash one-time passwords and verification codes after 24 hours.",
        "rule_type": "otp",
        "conditions": {"category": "OTP"},
        "action": "trash",
        "retention_hours": 24,
    },
    {
        "id": "trash_newsletters_3d",
        "name": "Trash newsletters after 3 days",
        "description": "Move newsletter emails to trash after 3 days to keep your inbox clean.",
        "rule_type": "newsletter",
        "conditions": {"category": "Newsletter"},
        "action": "trash",
        "retention_hours": 72,
    },
    {
        "id": "archive_promotions_1d",
        "name": "Archive promotions after 1 day",
        "description": "Archive promotional and marketing emails after 24 hours.",
        "rule_type": "promotion",
        "conditions": {"category": "Promotion"},
        "action": "archive",
        "retention_hours": 24,
    },
]


# ─── Request / Response Models ───────────────────────────────────

class AutoCleanRuleCreate(BaseModel):
    user_id: uuid.UUID
    name: str
    rule_type: str = "custom"
    conditions: dict = {}
    action: str = "trash"
    retention_hours: int = 24
    is_enabled: bool = True


class AutoCleanRuleUpdate(BaseModel):
    name: Optional[str] = None
    rule_type: Optional[str] = None
    conditions: Optional[dict] = None
    action: Optional[str] = None
    retention_hours: Optional[int] = None
    is_enabled: Optional[bool] = None


class CreateFromTemplateRequest(BaseModel):
    user_id: uuid.UUID
    template_id: str


# ─── CRUD Endpoints ──────────────────────────────────────────────

@router.get("/", response_model=List[AutoCleanRule])
def list_auto_clean_rules(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """List all auto-clean rules for a user."""
    statement = (
        select(AutoCleanRule)
        .where(AutoCleanRule.user_id == user_id)
        .order_by(AutoCleanRule.created_at.desc())
    )
    rules = db.exec(statement).all()
    return rules


@router.post("/", response_model=AutoCleanRule)
def create_auto_clean_rule(
    req: AutoCleanRuleCreate,
    db: Session = Depends(deps.get_db),
):
    """Create a new auto-clean rule."""
    # Validate action
    if req.action not in ("trash", "delete", "archive"):
        raise HTTPException(status_code=400, detail="Action must be 'trash', 'delete', or 'archive'")
    if req.rule_type not in ("otp", "newsletter", "promotion", "low_priority", "custom"):
        raise HTTPException(status_code=400, detail="Invalid rule_type")
    if req.retention_hours < 1:
        raise HTTPException(status_code=400, detail="retention_hours must be at least 1")

    rule = AutoCleanRule(
        user_id=req.user_id,
        name=req.name,
        rule_type=req.rule_type,
        conditions=req.conditions,
        action=req.action,
        retention_hours=req.retention_hours,
        is_enabled=req.is_enabled,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    logger.info(f"AutoClean API: Created rule '{rule.name}' for user {rule.user_id}")
    return rule


@router.put("/{rule_id}", response_model=AutoCleanRule)
def update_auto_clean_rule(
    rule_id: uuid.UUID,
    req: AutoCleanRuleUpdate,
    db: Session = Depends(deps.get_db),
):
    """Update an auto-clean rule."""
    rule = db.get(AutoCleanRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = req.model_dump(exclude_unset=True)

    # Validate action if provided
    if "action" in update_data and update_data["action"] not in ("trash", "delete", "archive"):
        raise HTTPException(status_code=400, detail="Action must be 'trash', 'delete', or 'archive'")

    for key, value in update_data.items():
        setattr(rule, key, value)

    rule.updated_at = datetime.utcnow()
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_auto_clean_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
):
    """Delete an auto-clean rule."""
    rule = db.get(AutoCleanRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"status": "deleted", "id": str(rule_id)}


@router.patch("/{rule_id}/toggle", response_model=AutoCleanRule)
def toggle_auto_clean_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
):
    """Toggle an auto-clean rule's enabled state."""
    rule = db.get(AutoCleanRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.is_enabled = not rule.is_enabled
    rule.updated_at = datetime.utcnow()
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


# ─── Templates ───────────────────────────────────────────────────

@router.get("/templates")
def get_auto_clean_templates():
    """Return preset auto-clean templates."""
    return AUTO_CLEAN_TEMPLATES


@router.post("/from-template", response_model=AutoCleanRule)
def create_from_template(
    req: CreateFromTemplateRequest,
    db: Session = Depends(deps.get_db),
):
    """Create an auto-clean rule from a preset template."""
    template = next((t for t in AUTO_CLEAN_TEMPLATES if t["id"] == req.template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    rule = AutoCleanRule(
        user_id=req.user_id,
        name=template["name"],
        rule_type=template["rule_type"],
        conditions=template["conditions"],
        action=template["action"],
        retention_hours=template["retention_hours"],
        is_enabled=True,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


# ─── Manual Execution Trigger ────────────────────────────────────

@router.post("/execute-now")
def execute_auto_clean_now(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """
    Manually trigger the auto-clean worker to process pending emails.
    Useful for testing or immediate execution.
    """
    worker = AutoCleanWorker(db)
    stats = worker.execute_pending()
    return {
        "status": "executed",
        "stats": stats,
    }
