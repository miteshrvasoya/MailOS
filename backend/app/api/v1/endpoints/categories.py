from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.api import deps
from app.models.category import Category
from pydantic import BaseModel
import uuid

router = APIRouter()

# Default categories to seed for new users
DEFAULT_CATEGORIES = [
    {"name": "Work",           "color": "#3b82f6", "icon": "Briefcase",    "display_order": 0, "is_pinned": True},
    {"name": "Finance",        "color": "#f59e0b", "icon": "DollarSign",   "display_order": 1, "is_pinned": True},
    {"name": "Security",       "color": "#ef4444", "icon": "Shield",       "display_order": 2, "is_pinned": False},
    {"name": "Job Applications","color": "#06b6d4", "icon": "Briefcase",   "display_order": 3, "is_pinned": False},
    {"name": "Newsletters",    "color": "#a855f7", "icon": "BookOpen",     "display_order": 4, "is_pinned": False},
    {"name": "Promotions",     "color": "#ec4899", "icon": "Tag",          "display_order": 5, "is_pinned": False},
    {"name": "Orders",         "color": "#22c55e", "icon": "ShoppingCart",  "display_order": 6, "is_pinned": False},
    {"name": "Travel",         "color": "#14b8a6", "icon": "Plane",        "display_order": 7, "is_pinned": False},
    {"name": "Personal",       "color": "#8b5cf6", "icon": "User",         "display_order": 8, "is_pinned": False},
]


# ─── List ─────────────────────────────────────────────────────────

@router.get("/", response_model=List[Category])
def list_categories(
    user_id: uuid.UUID = Query(...),
    db: Session = Depends(deps.get_db),
):
    """List all categories for a user, ordered by pinned first then display_order."""
    statement = (
        select(Category)
        .where(Category.user_id == user_id)
        .order_by(Category.is_pinned.desc(), Category.display_order.asc())
    )
    return db.exec(statement).all()


# ─── Create ───────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    user_id: uuid.UUID
    name: str
    color: str = "#6366f1"
    icon: str = "Tag"
    is_pinned: bool = False


@router.post("/", response_model=Category)
def create_category(data: CategoryCreate, db: Session = Depends(deps.get_db)):
    """Create a new custom category."""
    # Get the max display_order for this user
    existing = db.exec(
        select(Category)
        .where(Category.user_id == data.user_id)
        .order_by(Category.display_order.desc())
    ).first()
    next_order = (existing.display_order + 1) if existing else 0

    category = Category(
        user_id=data.user_id,
        name=data.name,
        color=data.color,
        icon=data.icon,
        display_order=next_order,
        is_pinned=data.is_pinned,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# ─── Seed Defaults ────────────────────────────────────────────────

class SeedRequest(BaseModel):
    user_id: uuid.UUID


@router.post("/seed", response_model=List[Category])
def seed_default_categories(req: SeedRequest, db: Session = Depends(deps.get_db)):
    """Seed default categories for a user (idempotent — skips if categories exist)."""
    existing = db.exec(
        select(Category).where(Category.user_id == req.user_id)
    ).all()

    if existing:
        return existing  # Already seeded

    categories = []
    for default in DEFAULT_CATEGORIES:
        cat = Category(user_id=req.user_id, **default)
        db.add(cat)
        categories.append(cat)

    db.commit()
    for cat in categories:
        db.refresh(cat)

    return categories


# ─── Update (Patch) ───────────────────────────────────────────────

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None
    is_pinned: Optional[bool] = None


@router.patch("/{category_id}", response_model=Category)
def update_category(
    category_id: uuid.UUID,
    update: CategoryUpdate,
    db: Session = Depends(deps.get_db),
):
    """Partially update a category (rename, recolor, pin/unpin, reorder)."""
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# ─── Reorder ──────────────────────────────────────────────────────

class ReorderItem(BaseModel):
    id: uuid.UUID
    display_order: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]


@router.post("/reorder")
def reorder_categories(req: ReorderRequest, db: Session = Depends(deps.get_db)):
    """Batch update display_order for multiple categories."""
    for item in req.items:
        category = db.get(Category, item.id)
        if category:
            category.display_order = item.display_order
            db.add(category)

    db.commit()
    return {"status": "reordered", "count": len(req.items)}


# ─── Delete ───────────────────────────────────────────────────────

@router.delete("/{category_id}")
def delete_category(category_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    """Delete a custom category."""
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"status": "deleted", "id": str(category_id)}
