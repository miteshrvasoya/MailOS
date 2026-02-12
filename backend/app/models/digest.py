import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, JSON

if TYPE_CHECKING:
    from .user import User


class Digest(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    digest_type: str = Field(default="daily")  # daily, weekly
    period_start: datetime  # Start of the period covered
    period_end: datetime  # End of the period covered

    # Content stored as JSON
    summary: Optional[str] = None  # AI-generated text summary
    stats: dict = Field(default={}, sa_type=JSON)  # {"total_emails": 15, "important": 3, ...}
    sections: List[dict] = Field(default=[], sa_type=JSON)  # [{"category": "Work", "count": 5, "highlights": [...]}]

    is_delivered: bool = Field(default=False)
    delivered_at: Optional[datetime] = None

    generated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="digests")
