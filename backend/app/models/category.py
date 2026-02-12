import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User


class Category(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    name: str  # e.g. "Work", "Finance", "Newsletters"
    color: str = Field(default="#6366f1")  # hex color for UI
    icon: str = Field(default="Tag")  # lucide icon name
    display_order: int = Field(default=0)  # lower = first
    is_pinned: bool = Field(default=False)  # pinned categories show at top of dashboard

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="categories")
