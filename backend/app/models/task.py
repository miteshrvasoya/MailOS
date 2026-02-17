from typing import TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship, SQLModel
import uuid
from datetime import datetime

if TYPE_CHECKING:
    from .user import User
    from .email import EmailInsight

class TaskBase(SQLModel):
    title: str = Field(index=True)
    description: Optional[str] = None
    status: str = Field(default="pending", index=True)  # pending, done, snoozed
    priority: str = Field(default="medium")  # high, medium, low
    due_date: Optional[datetime] = None
    
class Task(TaskBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    email_id: Optional[uuid.UUID] = Field(default=None, foreign_key="emailinsight.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="tasks")
    email: Optional["EmailInsight"] = Relationship(back_populates="tasks")

class TaskCreate(TaskBase):
    email_id: Optional[uuid.UUID] = None

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
