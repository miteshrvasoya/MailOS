import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .email import EmailInsight
    from .rule import Rule
    from .preference import UserIntentPreference
    from .action import EmailAction
    from .gmail_label import GmailLabel
    from .google_credential import GoogleCredential



class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Action Mode Settings
    action_mode: str = Field(default="review_first") # "auto_apply" or "review_first"
    confidence_threshold: float = Field(default=0.85) # 0.0 to 1.0
    
    # Gmail Integration
    # gmail_scopes removed in favor of GoogleCredential table
    
    # Onboarding State
    onboarding_step: str = Field(default="welcome") # welcome, mode_selection, category_selection, preview, confirm, completed
    onboarding_completed: bool = Field(default=False)
    selected_categories: Optional[str] = None # JSON string of selected categories
    
    # Sync State
    last_history_id: Optional[str] = Field(default=None) # Gmail historyId for incremental sync
    last_sync_at: Optional[datetime] = Field(default=None) # Timestamp of last successful sync

    # Relationships
    email_insights: List["EmailInsight"] = Relationship(back_populates="user")
    rules: List["Rule"] = Relationship(back_populates="user")
    intent_preferences: List["UserIntentPreference"] = Relationship(back_populates="user")
    actions: List["EmailAction"] = Relationship(back_populates="user")
    gmail_labels: List["GmailLabel"] = Relationship(back_populates="user")
    google_credential: Optional["GoogleCredential"] = Relationship(back_populates="user")


