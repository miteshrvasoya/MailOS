from typing import Generator, Optional
from fastapi import Depends, HTTPException, Header, Query
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
import uuid

def get_db() -> Generator[Session, None, None]:
    for session in get_session():
        yield session

def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current user from X-User-Id header or user_id query param.
    Validates that the user exists in the database.
    """
    uid = x_user_id or user_id
    if not uid:
        raise HTTPException(status_code=401, detail="Missing user ID in header (X-User-Id) or query param")
    
    try:
        user_uuid = uuid.UUID(uid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    user = db.get(User, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

