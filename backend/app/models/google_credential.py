import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class GoogleCredential(SQLModel, table=True):
    __tablename__ = "google_credential"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True, unique=True)
    
    access_token: str
    refresh_token: Optional[str] = None
    token_uri: str = Field(default="https://oauth2.googleapis.com/token")
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    scopes: str # Comma-separated list of scopes
    expiry: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: "User" = Relationship(back_populates="google_credential")
