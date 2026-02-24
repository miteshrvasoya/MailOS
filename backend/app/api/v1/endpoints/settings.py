from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.api.deps import get_db
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter()

class UserSettingsUpdate(BaseModel):
    auto_fetch_enabled: bool | None = None
    action_mode: str | None = None
    confidence_threshold: float | None = None

class UserSettingsResponse(BaseModel):
    auto_fetch_enabled: bool
    action_mode: str
    confidence_threshold: float

@router.get("/", response_model=UserSettingsResponse)
def get_user_settings(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db)
):
    """Retrieve settings for a given user."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return UserSettingsResponse(
        auto_fetch_enabled=user.auto_fetch_enabled,
        action_mode=user.action_mode,
        confidence_threshold=user.confidence_threshold
    )

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
        
    if settings_in.auto_fetch_enabled is not None:
        user.auto_fetch_enabled = settings_in.auto_fetch_enabled
    if settings_in.action_mode is not None:
        user.action_mode = settings_in.action_mode
    if settings_in.confidence_threshold is not None:
        user.confidence_threshold = settings_in.confidence_threshold
        
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserSettingsResponse(
        auto_fetch_enabled=user.auto_fetch_enabled,
        action_mode=user.action_mode,
        confidence_threshold=user.confidence_threshold
    )
