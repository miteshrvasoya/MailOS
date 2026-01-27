from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.models.user import User
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter()

class OnboardingState(BaseModel):
    step: str
    completed: bool
    action_mode: str
    selected_categories: Optional[str] = None

class UpdateStepRequest(BaseModel):
    step: str

class UpdateModeRequest(BaseModel):
    action_mode: str  # "review_first" or "auto_apply"

class UpdateCategoriesRequest(BaseModel):
    categories: List[str]  # ["important", "newsletters", "job", "finance", "promotions"]

@router.get("/state/{user_id}", response_model=OnboardingState)
def get_onboarding_state(user_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return OnboardingState(
        step=user.onboarding_step,
        completed=user.onboarding_completed,
        action_mode=user.action_mode,
        selected_categories=user.selected_categories
    )

@router.post("/update-step/{user_id}")
def update_onboarding_step(user_id: uuid.UUID, req: UpdateStepRequest, db: Session = Depends(deps.get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.onboarding_step = req.step
    db.add(user)
    db.commit()
    return {"status": "updated", "step": req.step}

@router.post("/update-mode/{user_id}")
def update_action_mode(user_id: uuid.UUID, req: UpdateModeRequest, db: Session = Depends(deps.get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.action_mode = req.action_mode
    db.add(user)
    db.commit()
    return {"status": "updated", "action_mode": req.action_mode}

@router.post("/update-categories/{user_id}")
def update_categories(user_id: uuid.UUID, req: UpdateCategoriesRequest, db: Session = Depends(deps.get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    import json
    user.selected_categories = json.dumps(req.categories)
    db.add(user)
    db.commit()
    return {"status": "updated", "categories": req.categories}

@router.post("/complete/{user_id}")
def complete_onboarding(user_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.onboarding_step = "completed"
    user.onboarding_completed = True
    db.add(user)
    db.commit()
    return {"status": "completed"}

class PreviewResult(BaseModel):
    category: str
    count: int

@router.get("/preview/{user_id}", response_model=List[PreviewResult])
def preview_sync(user_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    """
    Simulate scanning inbox and return category counts.
    In production, this would call Gmail API and use AI classification.
    For now, return mock data.
    """
    # Mock data for demo
    return [
        PreviewResult(category="Job Applications", count=5),
        PreviewResult(category="Newsletters", count=12),
        PreviewResult(category="Finance", count=3),
        PreviewResult(category="Security", count=2),
        PreviewResult(category="Promotions", count=8),
    ]
