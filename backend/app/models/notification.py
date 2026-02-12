from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

class NotificationCategory(str, Enum):
    """Categories for notifications"""
    EMAIL_INSIGHT = "email_insight"  # New email insights available
    DIGEST_READY = "digest_ready"    # Daily digest is ready
    RULE_TRIGGERED = "rule_triggered" # A rule was triggered
    FOLLOW_UP = "follow_up"          # Follow-up reminder
    SYSTEM = "system"                # System notifications
    SECURITY = "security"            # Security-related alerts
    UPDATE = "update"                # Product updates

class NotificationPriority(str, Enum):
    """Priority levels for notifications"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class NotificationBase(SQLModel):
    title: str
    message: str
    category: NotificationCategory = NotificationCategory.SYSTEM
    priority: NotificationPriority = NotificationPriority.MEDIUM
    is_read: bool = False
    action_url: Optional[str] = None  # Optional link to take action

class Notification(NotificationBase, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    user_id: uuid.UUID

class NotificationRead(NotificationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    read_at: Optional[datetime]

