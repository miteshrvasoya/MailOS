import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, JSON

if TYPE_CHECKING:
    from .user import User


class AutoCleanRule(SQLModel, table=True):
    """
    User-defined rules for automatically cleaning emails
    based on classification, category, or custom conditions.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    name: str  # e.g. "Delete OTP after 24h"
    rule_type: str = Field(default="custom")  # otp, newsletter, promotion, low_priority, custom

    # For predefined types: {"category": "OTP"}
    # For custom: {"all": [{"field": "sender", "operator": "contains", "value": "@example.com"}]}
    conditions: dict = Field(default={}, sa_type=JSON)

    action: str = Field(default="trash")  # trash, delete, archive
    retention_hours: int = Field(default=24)  # Hours to wait before executing action

    is_enabled: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="auto_clean_rules")
