import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User
    from .email import EmailInsight

class EmailAction(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    email_id: uuid.UUID = Field(foreign_key="emailinsight.id", index=True)
    
    suggested_label: str # The Group/Label AI wants to apply
    confidence: float # 0.0 to 1.0
    reason: Optional[str] = None
    
    status: str = Field(default="pending") # pending, approved, rejected, auto_applied
    
    gmail_label_id: Optional[str] = None # ID of the label in Gmail if applied
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: "User" = Relationship(back_populates="actions")
    email: "EmailInsight" = Relationship(back_populates="action")
