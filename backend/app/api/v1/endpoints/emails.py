from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.email import EmailInsight
from app.models.user import User

import uuid

router = APIRouter()

@router.get("/", response_model=List[EmailInsight])
def read_emails(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Generic email listing for the current user (paginated)."""
    emails = db.exec(
        select(EmailInsight)
        .where(EmailInsight.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    ).all()
    return emails


@router.get("/important", response_model=List[EmailInsight])
def read_important_emails(
    limit: int = 5,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Return the most important recent emails for the dashboard.
    Importance is based on importance_score (> 0.7) and recency.
    """
    stmt = (
        select(EmailInsight)
        .where(
            EmailInsight.user_id == current_user.id,
            EmailInsight.importance_score > 0.7,
        )
        .order_by(EmailInsight.sent_at.desc())
        .limit(limit)
    )
    emails = db.exec(stmt).all()
    return emails

@router.post("/", response_model=EmailInsight)
def create_email_insight(
    email_insight: EmailInsight, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if email_insight.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to create insight for another user")
         
    db.add(email_insight)
    db.commit()
    db.refresh(email_insight)
    return email_insight

@router.get("/{email_id}", response_model=EmailInsight)
def read_email(
    email_id: uuid.UUID, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    email = db.get(EmailInsight, email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email insight not found")
        
    if email.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this email")
        
    return email

# ... (Imports remain same, omitted for brevity if no change needed, but better to keep context if simple)
from pydantic import BaseModel
from datetime import datetime
import uuid
from typing import Optional
from app.core.ai import classify_email
from app.services.grouping import assign_group
from app.models.notification import Notification, NotificationCategory, NotificationPriority

class EmailInput(BaseModel):
    user_id: uuid.UUID
    gmail_message_id: str
    thread_id: Optional[str] = None
    sender: str
    subject: str
    body: str
    sent_at: datetime

@router.post("/analyze", response_model=EmailInsight)
def analyze_email(
    email_in: EmailInput, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Analyze a single email using the core pipeline.
    """
    from app.services.email_processor import process_email_pipeline
    
    if email_in.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = current_user # Use the validated user

    # Construct dict for pipeline
    email_data = {
        "gmail_message_id": email_in.gmail_message_id,
        "thread_id": email_in.thread_id,
        "sender": email_in.sender,
        "subject": email_in.subject,
        "body": email_in.body,
        "sent_at": email_in.sent_at
    }
    
    result = process_email_pipeline(db, user, email_data)
    return result.insight

from pydantic import BaseModel

class SyncRequest(BaseModel):
    user_id: uuid.UUID

class SyncResponse(BaseModel):
    scanned_count: int
    pending_actions_count: int
    auto_applied_count: int

@router.post("/mock-sync", response_model=SyncResponse)
def simulate_sync(
    req: SyncRequest, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Simulation of Gmail Sync for testing and development purposes.
    Generates mock emails and processes them through the pipeline.
    """
    from app.services.email_processor import process_email_pipeline
    
    if req.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user = current_user
        
    # Generate Mock Emails
    mock_emails = [
        {
            "gmail_message_id": f"mock_{uuid.uuid4()}",
            "sender": "recruiter@linkedin.com",
            "subject": "Interview Invitation: Senior Developer",
            "body": "Hi, we'd like to schedule an interview for the Senior Developer role.",
            "sent_at": datetime.utcnow()
        },
        {
            "gmail_message_id": f"mock_{uuid.uuid4()}",
            "sender": "billing@aws.com",
            "subject": "Invoice for January 2026",
            "body": "Your invoice for $120.50 is ready. Payment due in 3 days.",
            "sent_at": datetime.utcnow()
        },
        {
            "gmail_message_id": f"mock_{uuid.uuid4()}",
            "sender": "newsletter@techcrunch.com",
            "subject": "TechCrunch: Runaway AI",
            "body": "Top stories today: AI startup raises $500M...",
            "sent_at": datetime.utcnow()
        },
        {
            "gmail_message_id": f"mock_{uuid.uuid4()}",
            "sender": "alert@bankofamerica.com",
            "subject": "Suspicious Login Detected",
            "body": "We detected a login from a new device. Please verify.",
            "sent_at": datetime.utcnow()
        },
        {
            "gmail_message_id": f"mock_{uuid.uuid4()}",
            "sender": "promo@uber.com",
            "subject": "50% off your next 3 rides",
            "body": "Use code RIDE50 to save on your commute.",
            "sent_at": datetime.utcnow()
        }
    ]
    
    pending_count = 0
    auto_count = 0
    
    for email_data in mock_emails:
        result = process_email_pipeline(db, user, email_data)
        if result.action.status == "pending":
            pending_count += 1
        elif result.action.status == "auto_applied":
            auto_count += 1
            
    return SyncResponse(
        scanned_count=len(mock_emails),
        pending_actions_count=pending_count,
        auto_applied_count=auto_count
    )


