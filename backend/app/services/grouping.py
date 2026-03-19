from sqlmodel import Session, select
from typing import Dict, Any, Optional
from app.models.rule import Rule
from app.models.email import EmailInsight
from app.models.preference import UserIntentPreference
import uuid
import logging

logger = logging.getLogger(__name__)

# ─── Canonical Intent → Group Map ────────────────────────────────
# Uses the canonical intents from classification_normalizer.py

INTENT_GROUP_MAP = {
    # Jobs
    "job_interview_invite": "Job Applications",
    "job_application_update": "Job Applications",
    "job_offer": "Job Applications",
    # Finance
    "payment_confirmation": "Finance",
    "invoice_notification": "Finance",
    "subscription_renewal": "Finance",
    # Security
    "otp_verification": "Security",
    "security_alert": "Security",
    "password_reset": "Security",
    # Newsletters
    "newsletter_delivery": "Newsletters",
    # Orders / Shipping
    "order_confirmation": "Orders",
    "shipping_notification": "Orders",
    # Travel
    "travel_booking_confirmation": "Travel",
    # Social
    "social_connection_request": "Social",
    # Meetings
    "meeting_invitation": "Work",
    # Promotions
    "promotional_offer": "Promotions",
    # System
    "system_notification": "System",
}

# ─── Category → Group Fallback ───────────────────────────────────

CATEGORY_GROUP_MAP = {
    "Work": "Work",
    "Finance": "Finance",
    "Security": "Security",
    "Social": "Social",
    "Promotions": "Promotions",
    "Travel": "Travel",
    "System": "System",
    "Other": "Inbox",
    # Legacy aliases
    "Job": "Job Applications",
    "Newsletter": "Newsletters",
    "Promo": "Promotions",
    "Personal": "Social",
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
    2. User Preference (Learned)
    3. Normalized Subcategory (direct from AI + normalization)
    4. Intent Map (canonical intents)
    5. Category Map (Fallback)
    6. Inbox
    """
    user_id = email.user_id
    
    # 1. Check User Rules
    rules = session.exec(select(Rule).where(Rule.user_id == user_id, Rule.is_active == True)).all()
    for rule in rules:
        if check_rule_match(email, rule):
            actions = rule.actions or {}
            action_group = actions.get("move_to_group")
            if action_group:
                return action_group

    intent = ai_result.get("intent")
    
    # 2. Check User Preference (Learned)
    if intent:
        pref = session.exec(select(UserIntentPreference).where(
            UserIntentPreference.user_id == user_id,
            UserIntentPreference.intent == intent
        )).first()
        
        if pref and pref.preferred_group_name:
            return pref.preferred_group_name

    # 3. Normalized Subcategory (already normalized by the pipeline)
    subcategory = ai_result.get("subcategory")
    if subcategory and isinstance(subcategory, str) and len(subcategory.strip()) > 3:
        # Already normalized by classification_normalizer — just use directly
        clean_sub = subcategory.strip("'\" ")
        if clean_sub and clean_sub != "Uncategorized" and clean_sub != "Other":
            return clean_sub

    # 4. Intent Map (canonical intents from normalizer)
    if intent and intent in INTENT_GROUP_MAP:
        return INTENT_GROUP_MAP[intent]

    # 5. Category Fallback
    category = ai_result.get("category")
    if category and category in CATEGORY_GROUP_MAP:
        return CATEGORY_GROUP_MAP[category]

    return "Inbox"
