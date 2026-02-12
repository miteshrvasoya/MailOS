from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.api import deps
from app.models.digest import Digest
from app.services.digest_service import generate_digest, get_latest_digest, get_digest_history
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


# ─── Response Models ──────────────────────────────────────────────

class DigestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    digest_type: str
    period_start: datetime
    period_end: datetime
    summary: Optional[str]
    stats: dict
    sections: list
    is_delivered: bool
    generated_at: datetime


class GenerateRequest(BaseModel):
    user_id: uuid.UUID
    digest_type: str = "daily"  # daily or weekly


# ─── Generate ─────────────────────────────────────────────────────

@router.post("/generate", response_model=DigestResponse)
def generate(req: GenerateRequest, db: Session = Depends(deps.get_db)):
    """Generate a new digest for the user."""
    digest = generate_digest(db, req.user_id, req.digest_type)
    return _to_response(digest)


# ─── Latest ───────────────────────────────────────────────────────

@router.get("/latest", response_model=Optional[DigestResponse])
def get_latest(
    user_id: uuid.UUID = Query(...),
    digest_type: str = Query("daily"),
    db: Session = Depends(deps.get_db),
):
    """Get the most recent digest."""
    digest = get_latest_digest(db, user_id, digest_type)
    if not digest:
        return None
    return _to_response(digest)


# ─── History ──────────────────────────────────────────────────────

@router.get("/history", response_model=List[DigestResponse])
def get_history(
    user_id: uuid.UUID = Query(...),
    limit: int = Query(10, le=50),
    db: Session = Depends(deps.get_db),
):
    """Get digest history for a user."""
    digests = get_digest_history(db, user_id, limit)
    return [_to_response(d) for d in digests]


# ─── Helpers ──────────────────────────────────────────────────────

def _to_response(digest: Digest) -> DigestResponse:
    return DigestResponse(
        id=digest.id,
        user_id=digest.user_id,
        digest_type=digest.digest_type,
        period_start=digest.period_start,
        period_end=digest.period_end,
        summary=digest.summary,
        stats=digest.stats,
        sections=digest.sections,
        is_delivered=digest.is_delivered,
        generated_at=digest.generated_at,
    )
