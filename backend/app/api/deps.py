from typing import Generator, Optional
from fastapi import Depends, HTTPException, Header, Query, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
import uuid

def get_db() -> Generator[Session, None, None]:
    for session in get_session():
        yield session

def get_current_user(
    request: Request,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id_query: Optional[str] = Query(None, alias="user_id"),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the current user ID from, in order of precedence:
    1. X-User-Id header (set by frontend)
    2. user_id query parameter
    3. user_id path parameter on the route (e.g. /.../{user_id})
    """
    path_user_id = request.path_params.get("user_id")

    uid = x_user_id or user_id_query or path_user_id
    if not uid:
        raise HTTPException(
            status_code=401,
            detail="Missing user ID in header (X-User-Id), query param, or path param",
        )
    
    try:
        user_uuid = uuid.UUID(uid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    user = db.get(User, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

