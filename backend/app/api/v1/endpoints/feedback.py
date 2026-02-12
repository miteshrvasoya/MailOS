from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.email import EmailInsight
from app.models.preference import UserIntentPreference
from pydantic import BaseModel
import uuid
from typing import Optional

router = APIRouter()

class FeedbackCreate(BaseModel):
    feedback_type: str # "not_important", "wrong_group", "mark_important"
    target_group: Optional[str] = None 

@router.post("/email/{email_id}")
def submit_feedback(
    email_id: uuid.UUID, 
    feedback: FeedbackCreate, 
    db: Session = Depends(deps.get_db)
):
    """
    Learn from user feedback.
    - not_important: Reduce importance score for this intent
    - mark_important: Increase importance score
    - wrong_group: Learn preferred group for this intent
    """
    email = db.get(EmailInsight, email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    intent = email.intent
    if not intent:
         # Fallback to category if intent is missing?
         intent = f"CATEGORY:{email.category}"
         # return {"message": "No intent found, learned on category basis."}

    # Find or Create Preference
    pref = db.exec(select(UserIntentPreference).where(
        UserIntentPreference.user_id == email.user_id,
        UserIntentPreference.intent == intent
    )).first()
    
    if not pref:
        pref = UserIntentPreference(user_id=email.user_id, intent=intent)
        
    if feedback.feedback_type == "not_important":
        pref.importance_adjustment -= 10.0
        # Cap min
        if pref.importance_adjustment < -50: diff = -50
        
    elif feedback.feedback_type == "mark_important":
        pref.importance_adjustment += 10.0
        
    elif feedback.feedback_type == "wrong_group":
         if feedback.target_group:
             pref.preferred_group_name = feedback.target_group
         
    db.add(pref)
    db.commit()
    
    return {"status": "feedback_recorded", "new_adjustment": pref.importance_adjustment}
