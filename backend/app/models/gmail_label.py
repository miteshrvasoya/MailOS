import uuid
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class GmailLabel(SQLModel, table=True):
    __tablename__ = "gmail_label"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    
    name: str # The display name, e.g. "MailOS/Job"
    gmail_id: str = Field(index=True) # The ID from Gmail API, e.g. "Label_12345"
    visibility: str = Field(default="labelShow") # labelShow, labelHide
    
    # Relationships
    user: "User" = Relationship(back_populates="gmail_labels")
