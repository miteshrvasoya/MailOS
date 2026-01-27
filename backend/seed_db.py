from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User
from app.models.email import EmailInsight
from app.models.rule import Rule
from datetime import datetime
import uuid

def seed_data():
    with Session(engine) as session:
        # Check if we have a user
        user = session.exec(select(User)).first()
        if not user:
            print("No user found. Please login first to create a user, or we can create a dummy one.")
            # Let's create a dummy user if none
            user = User(email="demo@example.com", full_name="Demo User")
            session.add(user)
            session.commit()
            session.refresh(user)
            print("Created dummy user.")
        
        # Check if we have emails
        count = session.exec(select(EmailInsight)).first()
        if not count:
            print("Seeding emails...")
            emails = [
                EmailInsight(
                    user_id=user.id,
                    gmail_message_id=str(uuid.uuid4()),
                    sender="noreply@google.com",
                    subject="Security Alert",
                    importance_score=0.95,
                    category="Security",
                    classification_tags=["urgent", "security"],
                    sent_at=datetime.utcnow()
                ),
                EmailInsight(
                    user_id=user.id,
                    gmail_message_id=str(uuid.uuid4()),
                    sender="newsletter@tech.com",
                    subject="Weekly Tech Digest",
                    importance_score=0.2,
                    category="Newsletter",
                    sent_at=datetime.utcnow()
                ),
                 EmailInsight(
                    user_id=user.id,
                    gmail_message_id=str(uuid.uuid4()),
                    sender="boss@corp.com",
                    subject="Project Update Needed",
                    importance_score=0.8,
                    category="Work",
                    sent_at=datetime.utcnow()
                )
            ]
            for e in emails:
                session.add(e)
            session.commit()
            print("Seeded fake emails.")
        else:
            print("Emails already exist, skipping seed.")

if __name__ == "__main__":
    seed_data()
