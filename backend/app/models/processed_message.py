import uuid
from datetime import datetime
from sqlmodel import Field, SQLModel


class ProcessedMessage(SQLModel, table=True):
    """Idempotency table: tracks Gmail message IDs that have already been processed via push notifications."""
    message_id: str = Field(primary_key=True)  # Gmail message ID
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    processed_at: datetime = Field(default_factory=datetime.utcnow)
