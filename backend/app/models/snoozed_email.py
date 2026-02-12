import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User
    from .email import EmailInsight


class SnoozedEmail(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    email_id: uuid.UUID = Field(foreign_key="emailinsight.id", index=True)

    snooze_until: datetime  # When to resurface the email
    reason: Optional[str] = None  # e.g. "Snooze for tomorrow"
    status: str = Field(default="snoozed")  # snoozed, resurfaced, cancelled

    created_at: datetime = Field(default_factory=datetime.utcnow)
    resurfaced_at: Optional[datetime] = None

    # Relationships
    user: "User" = Relationship(back_populates="snoozed_emails")
    email: "EmailInsight" = Relationship()
