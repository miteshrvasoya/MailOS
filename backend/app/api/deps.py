from typing import Generator
from fastapi import Depends
from sqlmodel import Session
from app.db.session import get_session

def get_db() -> Generator[Session, None, None]:
    for session in get_session():
        yield session
