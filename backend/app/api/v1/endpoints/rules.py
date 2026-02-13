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


# ─── Natural Language Rule Creation ───────────────────────────────

class ParseTextRequest(BaseModel):
    user_id: uuid.UUID
    text: str  # e.g. "Filter LinkedIn connection requests into LinkedIn/Requests"


class ParsedRulePreview(BaseModel):
    name: str
    description: str
    conditions: dict
    actions: dict
    priority: int
    explanation: str  # AI reasoning for how it parsed the text


@router.post("/parse-text", response_model=ParsedRulePreview)
def parse_text_to_rule(
    req: ParseTextRequest,
    db: Session = Depends(deps.get_db),
):
    """
    Parse a natural language rule description into structured conditions/actions
    using OpenRouter AI. Returns a preview for user approval.
    """
    import json
    from app.core.ai import _call_openrouter, _save_log
    from app.core.config import settings

    system_message = """You are a rule parser for an email management system. 
Convert the user's natural language rule into structured JSON matching this exact schema:

{
  "name": "Short descriptive rule name",
  "description": "One-line description of what this rule does",
  "conditions": {
    "all": [
      {"field": "sender|subject|category|body", "operator": "contains|equals|starts_with|ends_with", "value": "match value"}
    ]
  },
  "actions": {
    "move_to_category": "Category/SubCategory name (optional)",
    "mark_important": true/false (optional),
    "mark_read": true/false (optional),
    "apply_label": "Label name to create/apply (optional)",
    "stop_processing": true/false (optional)
  },
  "priority": 1-10 (higher = more important),
  "explanation": "Brief explanation of how you interpreted the user's request"
}

Guidelines:
- For LinkedIn emails, use sender contains "linkedin.com"
- For connection requests, also check subject contains keywords like "invitation", "connect", "connection"
- Create specific, useful label names using forward slash notation (e.g., "LinkedIn/Requests")
- Only include actions that are relevant to the user's request
- Set priority based on perceived importance (security=10, work=7, newsletters=3, etc.)

Respond with ONLY valid JSON, nothing else."""

    user_message = f"Convert this rule to structured format: \"{req.text}\""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]

    try:
        response_data = _call_openrouter(
            messages=messages,
            model=settings.AI_MODEL,
            temperature=0,
            response_format={"type": "json_object"},
        )

        choice = response_data["choices"][0]
        content = choice["message"]["content"]
        usage = response_data.get("usage", {})
        latency_ms = response_data.get("_latency_ms", 0)

        parsed = json.loads(content)

        # Log the AI call
        _save_log(
            db=db,
            user_id=req.user_id,
            email_id=None,
            model=response_data.get("model", settings.AI_MODEL),
            messages=messages,
            temperature=0,
            response_content=content,
            parsed_result=parsed,
            finish_reason=choice.get("finish_reason"),
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            cost=usage.get("cost", 0),
            latency_ms=latency_ms,
            status="success",
            purpose="parse_rule_text",
        )

        return ParsedRulePreview(
            name=parsed.get("name", "Untitled Rule"),
            description=parsed.get("description", ""),
            conditions=parsed.get("conditions", {"all": []}),
            actions=parsed.get("actions", {}),
            priority=parsed.get("priority", 5),
            explanation=parsed.get("explanation", ""),
        )

    except Exception as e:
        # Log error
        _save_log(
            db=db,
            user_id=req.user_id,
            email_id=None,
            model=settings.AI_MODEL,
            messages=messages,
            temperature=0,
            response_content=None,
            parsed_result=None,
            finish_reason=None,
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            cost=0,
            latency_ms=0,
            status="error",
            purpose="parse_rule_text",
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {str(e)}")


class CreateFromParsedRequest(BaseModel):
    user_id: uuid.UUID
    name: str
    description: str
    conditions: dict
    actions: dict
    priority: int


@router.post("/from-parsed", response_model=Rule)
def create_from_parsed(
    req: CreateFromParsedRequest,
    db: Session = Depends(deps.get_db),
):
    """Create a rule from an AI-parsed preview (after user approval)."""
    rule = Rule(
        user_id=req.user_id,
        name=req.name,
        description=req.description,
        priority=req.priority,
        conditions=req.conditions,
        actions=req.actions,
        is_active=True,
    )
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
