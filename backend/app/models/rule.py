import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON

if TYPE_CHECKING:
    from .user import User

class Rule(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    
    name: str
    description: Optional[str] = None
    priority: int = Field(default=0) # 0 is lowest priority

    
    # Conditions: e.g. {"sender": "contains:@google.com", "subject": "contains:alert"}
    conditions: Dict[str, Any] = Field(default={}, sa_type=JSON)
    
    # Actions: e.g. {"mark_important": true, "move_to_category": "Work"}
    actions: Dict[str, Any] = Field(default={}, sa_type=JSON)
    
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="rules")
