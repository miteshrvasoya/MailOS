from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.api.deps import get_db
from app.models.user import User
from pydantic import BaseModel
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class UserSettingsUpdate(BaseModel):
    auto_fetch_enabled: bool | None = None
    action_mode: str | None = None
    confidence_threshold: float | None = None
    auto_create_events: bool | None = None
    label_prefix: str | None = None
    apply_prefix_to_existing: bool | None = None

class UserSettingsResponse(BaseModel):
    auto_fetch_enabled: bool
    action_mode: str
    confidence_threshold: float
    auto_create_events: bool
    label_prefix: str
    apply_prefix_to_existing: bool

def _build_response(user: User) -> UserSettingsResponse:
    return UserSettingsResponse(
        auto_fetch_enabled=user.auto_fetch_enabled,
        action_mode=user.action_mode,
        confidence_threshold=user.confidence_threshold,
        auto_create_events=user.auto_create_events,
        label_prefix=user.label_prefix,
        apply_prefix_to_existing=user.apply_prefix_to_existing,
    )

@router.get("/", response_model=UserSettingsResponse)
def get_user_settings(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db)
):
    """Retrieve settings for a given user."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _build_response(user)

@router.put("/", response_model=UserSettingsResponse)
def update_user_settings(
    settings_in: UserSettingsUpdate,
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db)
):
    """Update settings for a given user."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_prefix = user.label_prefix

    if settings_in.auto_fetch_enabled is not None:
        user.auto_fetch_enabled = settings_in.auto_fetch_enabled
    if settings_in.action_mode is not None:
        user.action_mode = settings_in.action_mode
    if settings_in.confidence_threshold is not None:
        user.confidence_threshold = settings_in.confidence_threshold
    if settings_in.auto_create_events is not None:
        user.auto_create_events = settings_in.auto_create_events
    if settings_in.apply_prefix_to_existing is not None:
        user.apply_prefix_to_existing = settings_in.apply_prefix_to_existing
    if settings_in.label_prefix is not None:
        user.label_prefix = settings_in.label_prefix

    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-rename existing labels if prefix changed AND setting is enabled
    new_prefix = user.label_prefix
    if settings_in.label_prefix is not None and old_prefix != new_prefix and user.apply_prefix_to_existing:
        try:
            from app.services.gmail_service import GmailService
            gmail = GmailService(user, db)
            result = gmail.rename_label_prefix(old_prefix, new_prefix)
            logger.info(f"Auto-renamed labels for user {user_id}: {result}")
        except Exception as e:
            logger.error(f"Auto-rename failed for user {user_id}: {e}")

    return _build_response(user)


# ─── Manual Label Rename ─────────────────────────────────────────

class RenamePrefixRequest(BaseModel):
    old_prefix: str
    new_prefix: str

class RenamePrefixResponse(BaseModel):
    renamed: int
    failed: int
    details: list

@router.post("/rename-labels", response_model=RenamePrefixResponse)
def rename_label_prefix(
    req: RenamePrefixRequest,
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
):
    """Manually rename all existing Gmail labels from old_prefix/* to new_prefix/*."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not req.old_prefix or not req.new_prefix:
        raise HTTPException(status_code=400, detail="Prefixes cannot be empty")
    if req.old_prefix == req.new_prefix:
        return RenamePrefixResponse(renamed=0, failed=0, details=["Prefixes are the same"])

    try:
        from app.services.gmail_service import GmailService
        gmail = GmailService(user, db)
        result = gmail.rename_label_prefix(req.old_prefix, req.new_prefix)
        return RenamePrefixResponse(**result)
    except Exception as e:
        logger.error(f"Label rename failed for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Rename failed: {str(e)}")
