from typing import List
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, and_
from app.api import deps
from app.models.ai_log import AILog
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

router = APIRouter()


# ─── Response Models ──────────────────────────────────────────────

class AILogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    email_id: Optional[uuid.UUID]
    model: str
    prompt_messages: list
    temperature: float
    response_content: Optional[str]
    parsed_result: Optional[dict]
    finish_reason: Optional[str]
    error: Optional[str]
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    latency_ms: int
    status: str
    purpose: str
    created_at: datetime


class AILogSummary(BaseModel):
    total_calls: int
    success_count: int
    error_count: int
    total_tokens: int
    total_cost: float
    avg_latency_ms: float


# ─── List Logs ────────────────────────────────────────────────────

@router.get("/", response_model=List[AILogResponse])
def list_logs(
    user_id: Optional[uuid.UUID] = Query(None),
    purpose: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(deps.get_db),
):
    """List AI API logs with optional filters."""
    statement = select(AILog).order_by(AILog.created_at.desc())

    if user_id:
        statement = statement.where(AILog.user_id == user_id)
    if purpose:
        statement = statement.where(AILog.purpose == purpose)
    if status:
        statement = statement.where(AILog.status == status)

    statement = statement.limit(limit)
    logs = db.exec(statement).all()
    return [_to_response(log) for log in logs]


# ─── Summary ─────────────────────────────────────────────────────

@router.get("/summary", response_model=AILogSummary)
def get_summary(
    user_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(deps.get_db),
):
    """Get aggregate stats for AI API usage."""
    statement = select(AILog)
    if user_id:
        statement = statement.where(AILog.user_id == user_id)

    logs = db.exec(statement).all()

    if not logs:
        return AILogSummary(
            total_calls=0, success_count=0, error_count=0,
            total_tokens=0, total_cost=0, avg_latency_ms=0,
        )

    return AILogSummary(
        total_calls=len(logs),
        success_count=sum(1 for l in logs if l.status == "success"),
        error_count=sum(1 for l in logs if l.status == "error"),
        total_tokens=sum(l.total_tokens for l in logs),
        total_cost=sum(l.cost for l in logs),
        avg_latency_ms=round(sum(l.latency_ms for l in logs) / len(logs), 1) if logs else 0,
    )


# ─── Single Log Detail ───────────────────────────────────────────

@router.get("/{log_id}", response_model=AILogResponse)
def get_log(log_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    """Get a single AI log by ID."""
    log = db.get(AILog, log_id)
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Log not found")
    return _to_response(log)


# ─── Helpers ──────────────────────────────────────────────────────

def _to_response(log: AILog) -> AILogResponse:
    return AILogResponse(
        id=log.id,
        user_id=log.user_id,
        email_id=log.email_id,
        model=log.model,
        prompt_messages=log.prompt_messages,
        temperature=log.temperature,
        response_content=log.response_content,
        parsed_result=log.parsed_result,
        finish_reason=log.finish_reason,
        error=log.error,
        prompt_tokens=log.prompt_tokens,
        completion_tokens=log.completion_tokens,
        total_tokens=log.total_tokens,
        cost=log.cost,
        latency_ms=log.latency_ms,
        status=log.status,
        purpose=log.purpose,
        created_at=log.created_at,
    )
