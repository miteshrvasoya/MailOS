import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class GmailWatch(SQLModel, table=True):
    """Tracks Gmail push notification watch state per user."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", unique=True, index=True)
    history_id: str  # Last known Gmail historyId
    expiration: datetime  # Watch expiration (typically ~7 days)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
