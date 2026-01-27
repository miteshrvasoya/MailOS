from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.db.session import get_session
from app.models.notification import (
    Notification, 
    NotificationCreate, 
    NotificationRead,
    NotificationCategory,
    NotificationPriority
)

router = APIRouter()

@router.get("/", response_model=List[NotificationRead])
def get_notifications(
    user_id: int,
    unread_only: bool = False,
    category: Optional[NotificationCategory] = None,
    session: Session = Depends(get_session)
):
    """Get all notifications for a user, optionally filtered by read status or category."""
    query = select(Notification).where(Notification.user_id == user_id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    if category:
        query = query.where(Notification.category == category)
    
    query = query.order_by(Notification.created_at.desc())
    
    notifications = session.exec(query).all()
    return notifications

@router.get("/unread-count")
def get_unread_count(user_id: int, session: Session = Depends(get_session)):
    """Get count of unread notifications for a user."""
    query = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read == False
    )
    notifications = session.exec(query).all()
    return {"count": len(notifications)}

@router.post("/", response_model=NotificationRead)
def create_notification(
    notification: NotificationCreate,
    session: Session = Depends(get_session)
):
    """Create a new notification."""
    db_notification = Notification.model_validate(notification)
    session.add(db_notification)
    session.commit()
    session.refresh(db_notification)
    return db_notification

@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: int, session: Session = Depends(get_session)):
    """Mark a notification as read."""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    session.add(notification)
    session.commit()
    return {"success": True}

@router.patch("/mark-all-read")
def mark_all_as_read(user_id: int, session: Session = Depends(get_session)):
    """Mark all notifications as read for a user."""
    query = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read == False
    )
    notifications = session.exec(query).all()
    
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        session.add(notification)
    
    session.commit()
    return {"success": True, "marked_count": len(notifications)}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, session: Session = Depends(get_session)):
    """Delete a notification."""
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    session.delete(notification)
    session.commit()
    return {"success": True}
