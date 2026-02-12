from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User
from app.models.google_credential import GoogleCredential
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class UserUpsert(BaseModel):
    email: str
    full_name: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    expires_at: int | None = None
    scopes: str | None = None

@router.get("/", response_model=List[User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    users = db.exec(select(User).offset(skip).limit(limit)).all()
    return users

@router.post("/", response_model=User)
def create_user(user: User, db: Session = Depends(deps.get_db)):
    db_user = db.exec(select(User).where(User.email == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/upsert", response_model=User)
def upsert_user(user_data: UserUpsert, db: Session = Depends(deps.get_db)):
    """Create or update user on sign in"""
    db_user = db.exec(select(User).where(User.email == user_data.email)).first()
    
    if db_user:
        # Update existing user
        print(f"[USERS] Existing user found: {db_user.email} — skipping signup notification")
        db_user.full_name = user_data.full_name
        db_user.updated_at = datetime.utcnow()
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        # Create new user
        print(f"[USERS] NEW USER detected: {user_data.email} — will send signup notification")
        new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        db_user = new_user
        
        # Notify admin about new signup (non-blocking)
        print(f"[USERS] Calling notify_new_user_signup...")
        from app.services.admin_notifier import notify_new_user_signup
        notify_new_user_signup(user_email=db_user.email, user_name=db_user.full_name)
        print(f"[USERS] notify_new_user_signup returned")
    
    # Update Google Credentials
    if user_data.access_token:
        stmt = select(GoogleCredential).where(GoogleCredential.user_id == db_user.id)
        cred = db.exec(stmt).first()
        
        expiry = datetime.fromtimestamp(user_data.expires_at) if user_data.expires_at else None
        
        if cred:
            cred.access_token = user_data.access_token
            if user_data.refresh_token:
                cred.refresh_token = user_data.refresh_token
            if expiry:
                cred.expiry = expiry
            if user_data.scopes:
                cred.scopes = user_data.scopes
            cred.updated_at = datetime.utcnow()
            db.add(cred)
        else:
            cred = GoogleCredential(
                user_id=db_user.id,
                access_token=user_data.access_token,
                refresh_token=user_data.refresh_token,
                expiry=expiry,
                scopes=user_data.scopes or ""
            )
            db.add(cred)
        db.commit()

    return db_user

@router.get("/by-email/{email}", response_model=User)
def read_user_by_email(email: str, db: Session = Depends(deps.get_db)):
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}", response_model=User)
def read_user(user_id: str, db: Session = Depends(deps.get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
