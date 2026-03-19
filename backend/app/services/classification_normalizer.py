"""
Classification Normalizer — Pre-LLM Fast Path + Post-LLM Normalization

Provides:
1. Pre-LLM fast path: pattern-match sender/subject to skip AI for common cases
2. Subcategory normalization: map synonym variants to canonical names
3. Intent standardization: map synonym intents to canonical intents
4. normalize_result(): clean up any AI response for consistency
"""

import re
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)


# ─── Valid Categories (strict list) ──────────────────────────────

VALID_CATEGORIES = {
    "Work", "Finance", "Social", "Promotions",
    "Travel", "Security", "System", "Other"
}

# ─── Subcategory Normalization Map ───────────────────────────────
# Maps noisy AI output → canonical subcategory name
# Keys MUST be lowercase

SUBCATEGORY_NORMALIZATION_MAP = {
    # LinkedIn
    "connection requests": "LinkedIn Notifications",
    "linkedin invites": "LinkedIn Notifications",
    "linkedin invitations": "LinkedIn Notifications",
    "linkedin connection requests": "LinkedIn Notifications",
    "linkedin messages": "LinkedIn Notifications",
    "network invites": "LinkedIn Notifications",
    "linkedin updates": "LinkedIn Notifications",
    "linkedin alerts": "LinkedIn Notifications",
    "linkedin notifications": "LinkedIn Notifications",
    # OTP / Security
    "otp emails": "OTP Messages",
    "otp codes": "OTP Messages",
    "verification emails": "OTP Messages",
    "verification codes": "OTP Messages",
    "security codes": "OTP Messages",
    "two-factor codes": "OTP Messages",
    "2fa codes": "OTP Messages",
    "login codes": "OTP Messages",
    "authentication codes": "OTP Messages",
    "password resets": "Password Resets",
    "password reset emails": "Password Resets",
    "security alerts": "Security Alerts",
    "security notifications": "Security Alerts",
    "login alerts": "Security Alerts",
    "suspicious login alerts": "Security Alerts",
    # Finance
    "bank transactions": "Bank Transactions",
    "bank alerts": "Bank Transactions",
    "bank notifications": "Bank Transactions",
    "transaction alerts": "Bank Transactions",
    "payment confirmations": "Payment Confirmations",
    "payment receipts": "Payment Confirmations",
    "payment notifications": "Payment Confirmations",
    "invoice emails": "Invoices",
    "invoices": "Invoices",
    "billing notifications": "Invoices",
    # E-commerce
    "e-commerce orders": "E-commerce Orders",
    "order confirmations": "E-commerce Orders",
    "order updates": "E-commerce Orders",
    "purchase confirmations": "E-commerce Orders",
    "shopping orders": "E-commerce Orders",
    "shipping updates": "Shipping Updates",
    "delivery updates": "Shipping Updates",
    "shipping notifications": "Shipping Updates",
    "delivery notifications": "Shipping Updates",
    "package tracking": "Shipping Updates",
    # Newsletters / Promotions
    "newsletter subscriptions": "Newsletter Subscriptions",
    "newsletters": "Newsletter Subscriptions",
    "newsletter updates": "Newsletter Subscriptions",
    "email newsletters": "Newsletter Subscriptions",
    "promotional emails": "Promotional Offers",
    "promotions": "Promotional Offers",
    "marketing emails": "Promotional Offers",
    "deals and offers": "Promotional Offers",
    "discount emails": "Promotional Offers",
    "sale notifications": "Promotional Offers",
    # Work
    "meeting requests": "Meeting Requests",
    "meeting invitations": "Meeting Requests",
    "calendar invites": "Meeting Requests",
    "team updates": "Team Updates",
    "team notifications": "Team Updates",
    "project updates": "Team Updates",
    # Jobs
    "job applications": "Job Applications",
    "job offers": "Job Applications",
    "job interview invitations": "Job Applications",
    "recruiting updates": "Job Applications",
    "recruitment emails": "Job Applications",
    "application updates": "Job Applications",
    # Travel
    "flight confirmations": "Flight Bookings",
    "flight bookings": "Flight Bookings",
    "airline confirmations": "Flight Bookings",
    "hotel bookings": "Hotel Bookings",
    "hotel reservations": "Hotel Bookings",
    "travel bookings": "Travel Bookings",
    "travel confirmations": "Travel Bookings",
    # Software / Subscriptions
    "software subscriptions": "Software Subscriptions",
    "subscription renewals": "Software Subscriptions",
    "software alerts": "Software Alerts",
    "software notifications": "Software Alerts",
    "system notifications": "System Notifications",
    "system alerts": "System Notifications",
    "automated notifications": "System Notifications",
    # Social
    "social notifications": "Social Notifications",
    "social media alerts": "Social Notifications",
    "social updates": "Social Notifications",
    # Food delivery
    "food delivery": "Food Delivery Orders",
    "food delivery orders": "Food Delivery Orders",
    "food orders": "Food Delivery Orders",
}


# ─── Intent Standardization Map ─────────────────────────────────
# Keys MUST be lowercase

INTENT_STANDARDIZATION_MAP = {
    # OTP
    "otp": "otp_verification",
    "verification code": "otp_verification",
    "login code": "otp_verification",
    "verification": "otp_verification",
    "two_factor_authentication": "otp_verification",
    "2fa_verification": "otp_verification",
    "otp_message": "otp_verification",
    # Security
    "login_alert": "security_alert",
    "login alert": "security_alert",
    "suspicious_login": "security_alert",
    "security_notification": "security_alert",
    "password_reset_request": "password_reset",
    "password reset": "password_reset",
    # LinkedIn
    "connection_request": "social_connection_request",
    "linkedin_connection": "social_connection_request",
    "linkedin_invite": "social_connection_request",
    "network_connection": "social_connection_request",
    # Payments
    "payment_received": "payment_confirmation",
    "payment_receipt": "payment_confirmation",
    "payment_notification": "payment_confirmation",
    "transaction_alert": "payment_confirmation",
    "invoice_received": "invoice_notification",
    "invoice": "invoice_notification",
    "bill_due": "invoice_notification",
    "billing_notification": "invoice_notification",
    # Orders
    "order_confirmation": "order_confirmation",
    "order_placed": "order_confirmation",
    "purchase_confirmation": "order_confirmation",
    "shipping_update": "shipping_notification",
    "delivery_update": "shipping_notification",
    "package_tracking": "shipping_notification",
    # Jobs
    "interview_invitation": "job_interview_invite",
    "job_application_update": "job_application_update",
    "application_status": "job_application_update",
    "job_offer": "job_offer",
    # Newsletters
    "newsletter_issue": "newsletter_delivery",
    "newsletter_update": "newsletter_delivery",
    "newsletter": "newsletter_delivery",
    # Meetings
    "meeting_request": "meeting_invitation",
    "meeting_invite": "meeting_invitation",
    "calendar_invite": "meeting_invitation",
    # Travel
    "flight_confirmation": "travel_booking_confirmation",
    "hotel_booking": "travel_booking_confirmation",
    "travel_confirmation": "travel_booking_confirmation",
    # Subscriptions
    "subscription_renewal": "subscription_renewal",
    "subscription_confirmation": "subscription_renewal",
    # Marketing
    "promotional": "promotional_offer",
    "promotion": "promotional_offer",
    "marketing_email": "promotional_offer",
    "discount_offer": "promotional_offer",
}


# ─── Pre-LLM Fast Path Templates ────────────────────────────────

def _linkedin_template() -> Dict[str, Any]:
    return {
        "category": "Social",
        "subcategory": "LinkedIn Notifications",
        "intent": "social_connection_request",
        "importance_score": 25,
        "needs_reply": False,
        "urgency": "low",
        "explanation": "LinkedIn notification — auto-classified via fast path",
        "tasks": [],
        "_fast_path": True,
    }

def _otp_template() -> Dict[str, Any]:
    return {
        "category": "Security",
        "subcategory": "OTP Messages",
        "intent": "otp_verification",
        "importance_score": 85,
        "needs_reply": False,
        "urgency": "high",
        "explanation": "OTP / verification code — auto-classified via fast path",
        "tasks": [],
        "_fast_path": True,
    }

def _newsletter_template() -> Dict[str, Any]:
    return {
        "category": "Promotions",
        "subcategory": "Newsletter Subscriptions",
        "intent": "newsletter_delivery",
        "importance_score": 10,
        "needs_reply": False,
        "urgency": "low",
        "explanation": "Newsletter — auto-classified via fast path",
        "tasks": [],
        "_fast_path": True,
    }

def _promotion_template() -> Dict[str, Any]:
    return {
        "category": "Promotions",
        "subcategory": "Promotional Offers",
        "intent": "promotional_offer",
        "importance_score": 10,
        "needs_reply": False,
        "urgency": "low",
        "explanation": "Promotional email — auto-classified via fast path",
        "tasks": [],
        "_fast_path": True,
    }

def _noreply_system_template() -> Dict[str, Any]:
    return {
        "category": "System",
        "subcategory": "System Notifications",
        "intent": "system_notification",
        "importance_score": 15,
        "needs_reply": False,
        "urgency": "low",
        "explanation": "Automated system notification — auto-classified via fast path",
        "tasks": [],
        "_fast_path": True,
    }


# ─── Fast Path Patterns ─────────────────────────────────────────

# (sender_pattern, subject_pattern, template_func)
# None means "don't check this field". Both are case-insensitive regexes.
FAST_PATH_RULES = [
    # LinkedIn
    (r"linkedin\.com", None, _linkedin_template),
    # OTP / Verification codes
    (None, r"\b(otp|verification code|verify your|login code|security code|one.?time.?pass)\b", _otp_template),
    # Newsletters (sender contains "newsletter" or body has unsubscribe)
    (r"newsletter@", None, _newsletter_template),
    # Promotions from common senders
    (r"(promo|marketing|offers|deals|sale)@", None, _promotion_template),
    # noreply senders that aren't security
    (r"no-?reply@.*\.(com|io|org)", r"\b(notification|update|status|report)\b", _noreply_system_template),
]


def try_fast_path(subject: str, sender: str, body: str = "") -> Optional[Dict[str, Any]]:
    """
    Try to classify an email without calling the LLM.
    Returns a classification dict if matched, None otherwise.
    """
    subject_lower = (subject or "").lower()
    sender_lower = (sender or "").lower()
    body_lower = (body or "").lower()

    for sender_pattern, subject_pattern, template_fn in FAST_PATH_RULES:
        sender_match = True
        subject_match = True

        if sender_pattern:
            sender_match = bool(re.search(sender_pattern, sender_lower))
        if subject_pattern:
            subject_match = bool(re.search(subject_pattern, subject_lower))

        # If both fields are specified, both must match
        # If only one is specified, just that one matters
        if sender_pattern and subject_pattern:
            if sender_match and subject_match:
                result = template_fn()
                logger.info(f"Fast path match: {template_fn.__name__} for sender='{sender}' subject='{subject}'")
                return result
        elif sender_pattern and sender_match:
            result = template_fn()
            logger.info(f"Fast path match: {template_fn.__name__} for sender='{sender}'")
            return result
        elif subject_pattern and subject_match:
            result = template_fn()
            logger.info(f"Fast path match: {template_fn.__name__} for subject='{subject}'")
            return result

    # Check for "unsubscribe" in body — strong newsletter signal
    if "unsubscribe" in body_lower and "list-unsubscribe" not in body_lower:
        if any(kw in subject_lower for kw in ["weekly", "digest", "newsletter", "roundup", "update"]):
            logger.info(f"Fast path match: newsletter (unsubscribe + keyword) for subject='{subject}'")
            return _newsletter_template()

    return None


# ─── Post-LLM Normalization ─────────────────────────────────────

def normalize_subcategory(subcategory: str) -> str:
    """Normalize a subcategory string to its canonical form."""
    if not subcategory:
        return "Other"

    cleaned = subcategory.strip("'\" ").strip()
    lookup = cleaned.lower()

    # Check normalization map
    if lookup in SUBCATEGORY_NORMALIZATION_MAP:
        return SUBCATEGORY_NORMALIZATION_MAP[lookup]

    # Title-case for consistency
    return " ".join(word.capitalize() for word in cleaned.split())


def normalize_intent(intent: str) -> str:
    """Normalize an intent string to its canonical snake_case form."""
    if not intent:
        return "unknown"

    raw_lower = intent.strip().lower()

    # Check with original spacing first (e.g. "verification code")
    if raw_lower in INTENT_STANDARDIZATION_MAP:
        return INTENT_STANDARDIZATION_MAP[raw_lower]

    # Convert to snake_case and check again
    cleaned = raw_lower.replace(" ", "_").replace("-", "_")
    if cleaned in INTENT_STANDARDIZATION_MAP:
        return INTENT_STANDARDIZATION_MAP[cleaned]

    # Ensure clean snake_case
    return re.sub(r"[^a-z0-9_]", "", cleaned)


def normalize_category(category: str) -> str:
    """Validate and normalize category to the strict list."""
    if not category:
        return "Other"

    cleaned = category.strip().title()

    # Map common AI aliases to canonical names
    _ALIASES = {
        "Personal": "Social",
        "Promo": "Promotions",
        "Marketing": "Promotions",
        "Newsletter": "Promotions",
        "Job": "Work",
        "Jobs": "Work",
        "Shopping": "Promotions",
        "E-Commerce": "Promotions",
        "Ecommerce": "Promotions",
        "Banking": "Finance",
        "Subscription": "Finance",
    }

    if cleaned in VALID_CATEGORIES:
        return cleaned

    if cleaned in _ALIASES:
        return _ALIASES[cleaned]

    return "Other"


def normalize_result(ai_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Full post-LLM normalization pipeline.
    Takes raw AI output and returns a cleaned, consistent result.
    """
    normalized = dict(ai_result)  # shallow copy

    # 1. Category
    normalized["category"] = normalize_category(ai_result.get("category", ""))

    # 2. Subcategory
    normalized["subcategory"] = normalize_subcategory(ai_result.get("subcategory", ""))

    # 3. Intent
    normalized["intent"] = normalize_intent(ai_result.get("intent", ""))

    # 4. Importance score — clamp to 0-100
    score = ai_result.get("importance_score", 0)
    try:
        score = float(score)
    except (TypeError, ValueError):
        score = 0.0
    normalized["importance_score"] = max(0, min(100, score))

    # 5. Urgency — validate
    urgency = ai_result.get("urgency", "low").lower()
    if urgency not in {"low", "medium", "high"}:
        urgency = "low"
    normalized["urgency"] = urgency

    # 6. needs_reply — ensure boolean
    normalized["needs_reply"] = bool(ai_result.get("needs_reply", False))

    # 7. Tasks — ensure list
    tasks = ai_result.get("tasks", [])
    if not isinstance(tasks, list):
        tasks = []
    # Filter out empty tasks
    normalized["tasks"] = [t for t in tasks if isinstance(t, dict) and t.get("title")]

    # 8. Explanation — ensure string
    normalized["explanation"] = str(ai_result.get("explanation", ""))

    return normalized
