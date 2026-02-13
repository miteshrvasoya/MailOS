import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, JSON


class AILog(SQLModel, table=True):
    """Stores every AI API request and response for debugging and analysis."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id", index=True)
    email_id: Optional[uuid.UUID] = Field(default=None, index=True)  # Link to EmailInsight if applicable

    # Request
    model: str = Field(default="")
    prompt_messages: list = Field(default=[], sa_type=JSON)  # Full messages array sent
    temperature: float = Field(default=0.0)

    # Response
    response_content: Optional[str] = None  # Raw AI response text
    parsed_result: Optional[dict] = Field(default=None, sa_type=JSON)  # Parsed JSON result
    finish_reason: Optional[str] = None
    error: Optional[str] = None  # Error message if failed

    # Usage
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_tokens: int = Field(default=0)
    cost: float = Field(default=0.0)

    # Performance
    latency_ms: int = Field(default=0)  # Round-trip time in milliseconds
    status: str = Field(default="success")  # success, error, timeout

    # Metadata
    purpose: str = Field(default="classify_email")  # classify_email, digest, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
