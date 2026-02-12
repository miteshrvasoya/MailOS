import uuid
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class UserIntentPreference(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    
    intent: str # The intent for which the preference is set
    
    # If the user manually moves emails of this intent to a specific group
    preferred_group_id: Optional[int] = None
    preferred_group_name: Optional[str] = None  # Stores the user's preferred group/category name
    
    # AI learning adjustments
    importance_adjustment: float = Field(default=0.0) # e.g. -10.0 or +20.0
    
    # Relationships
    user: "User" = Relationship(back_populates="intent_preferences")

