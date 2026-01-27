from sqlmodel import Session, select
from typing import Dict, Any, Optional
from app.models.rule import Rule
from app.models.email import EmailInsight
from app.models.preference import UserIntentPreference
import uuid

# Default Intent -> Group Map
INTENT_GROUP_MAP = {
    "interview_invitation": "Job Applications",
    "job_application_update": "Job Applications",
    "application_status": "Job Applications",
    "payment_received": "Finance",
    "invoice": "Finance",
    "bill_due": "Finance", 
    "bank_alert": "Finance",
    "otp_message": "Security",
    "login_alert": "Security",
    "password_reset": "Security",
    "newsletter_issue": "Newsletters",
    "newsletter_update": "Newsletters",
    "shipping_update": "Orders",
    "order_confirmation": "Orders",
    "flight_confirmation": "Travel",
    "hotel_booking": "Travel",
}

# Category -> Group Fallback
CATEGORY_GROUP_MAP = {
    "Job": "Job Applications",
    "Finance": "Finance",
    "Security": "Security",
    "Newsletter": "Newsletters",
    "Promo": "Promotions",
    "Travel": "Travel",
    "Work": "Work",
    "Personal": "Personal",
}

def check_rule_match(email: EmailInsight, rule: Rule) -> bool:
    """
    Check if email matches rule conditions.
    Supported conditions: sender:contains, subject:contains
    """
    conditions = rule.conditions or {}
    match = True
    
    # 1. Sender check
    sender_cond = conditions.get("sender")
    if sender_cond and isinstance(sender_cond, str) and "contains:" in sender_cond:
        val = sender_cond.split("contains:")[1].lower()
        if val not in email.sender.lower():
            match = False
            
    # 2. Subject check
    subject_cond = conditions.get("subject")
    if subject_cond and isinstance(subject_cond, str) and "contains:" in subject_cond:
        val = subject_cond.split("contains:")[1].lower()
        if val not in (email.subject or "").lower():
            match = False
            
    return match

def assign_group(email: EmailInsight, ai_result: Dict[str, Any], session: Session) -> str:
    """
    Decide which group to assign the email to based on priority:
    1. Rules
    2. Thread (reuse) - TODO (requires storing thread-group mapping)
    3. User Preference (Learned)
    4. Intent Map
    5. Category Map (Fallback)
    6. Inbox
    """
    user_id = email.user_id
    
    # 1. Check User Rules
    rules = session.exec(select(Rule).where(Rule.user_id == user_id, Rule.is_active == True)).all()
    for rule in rules:
        if check_rule_match(email, rule):
            # Assuming action is like {"move_to_group": "Work"}
            actions = rule.actions or {}
            action_group = actions.get("move_to_group")
            if action_group:
                return action_group

    intent = ai_result.get("intent")
    
    # 3. Check User Preference (Learned)
    if intent:
        pref = session.exec(select(UserIntentPreference).where(
            UserIntentPreference.user_id == user_id,
            UserIntentPreference.intent == intent
        )).first()
        
        # If user has a preference, map it
        # For now, we assume we can fetch the group name by ID or if we update the model to store name
        # Since we don't have a Group table, we might need to assume preferred_group_id implies a mapping
        # OR we update the plan/model to store 'preferred_group_name' instead of ID.
        # But let's skip strict preference application for now and focus on Maps.
        pass

    # 4. Intent Map
    if intent and intent in INTENT_GROUP_MAP:
        return INTENT_GROUP_MAP[intent]

    # 5. Category Fallback
    category = ai_result.get("category")
    if category and category in CATEGORY_GROUP_MAP:
        return CATEGORY_GROUP_MAP[category]

    return "Inbox"
