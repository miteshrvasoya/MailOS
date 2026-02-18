from sqlmodel import Session, select, func
from app.db.session import engine
from app.models.email import EmailInsight

def check_and_reset():
    with Session(engine) as db:
        # Check counts
        results = db.exec(
            select(EmailInsight.classification_status, func.count(EmailInsight.id))
            .group_by(EmailInsight.classification_status)
        ).all()
        
        print("Current Status Counts:")
        for status, count in results:
            print(f"  {status}: {count}")
            
        # Reset 'classifying' to 'pending'
        stuck = db.exec(
            select(EmailInsight).where(EmailInsight.classification_status == "classifying")
        ).all()
        
        if stuck:
            print(f"Resetting {len(stuck)} stuck 'classifying' emails to 'pending'...")
            for email in stuck:
                email.classification_status = "pending"
            db.commit()
            print("Reset complete.")
        else:
            print("No emails stuck in 'classifying'.")

if __name__ == "__main__":
    check_and_reset()
