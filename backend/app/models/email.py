import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, JSON

if TYPE_CHECKING:
    from .user import User
    from .action import EmailAction
    from .task import Task


class EmailInsight(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    
    gmail_message_id: str = Field(index=True)
    thread_id: Optional[str] = None
    
    sender: str
    subject: Optional[str] = None
    snippet: Optional[str] = None
    sent_at: datetime
    
    # AI Analysis
    importance_score: float = Field(default=0.0) # 0 to 1
    category: str = Field(default="Uncategorized") # Work, Personal, Newsletter, etc.
    intent: Optional[str] = None # e.g. "interview_invitation"
    urgency: str = Field(default="low") # low, medium, high
    needs_reply: bool = Field(default=False)
    explanation: Optional[str] = None # User-facing reason
    classification_tags: List[str] = Field(default=[], sa_type=JSON) # ["urgent", "invoice", "flight"]
    
    is_read: bool = Field(default=False)
    is_preview: bool = Field(default=False)
    
    # Follow-up tracking
    follow_up_status: str = Field(default="none")  # none, pending, resolved
    follow_up_deadline: Optional[datetime] = None  # when the follow-up is due
    waiting_on_reply: bool = Field(default=False)  # True if user is waiting for someone else to reply
    
    # Sync Status
    classification_status: str = Field(default="pending")  # pending, classifying, classified, failed

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="email_insights")
    action: Optional["EmailAction"] = Relationship(back_populates="email", sa_relationship_kwargs={"uselist": False})
    tasks: List["Task"] = Relationship(back_populates="email")

