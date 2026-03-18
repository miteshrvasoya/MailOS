"""
Auto-Clean Engine: Matches emails against user-defined auto-clean rules
and schedules them for automatic cleanup (trash/delete/archive).
Also contains the worker that executes scheduled actions.
"""

import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from sqlmodel import Session, select
from app.models.user import User
from app.models.email import EmailInsight
from app.models.auto_clean_rule import AutoCleanRule
from app.models.ai_log import AILog
from app.services.gmail_service import GmailService

logger = logging.getLogger(__name__)

# Safety constants
MAX_EMAILS_PER_EXECUTION = 100
MIN_IMPORTANCE_THRESHOLD = 0.8  # Never clean emails above this importance


# ─── Predefined category mappings for rule_types ────────────────────
PREDEFINED_CATEGORIES = {
    "otp": ["OTP", "Verification", "Security Code"],
    "newsletter": ["Newsletter", "Newsletters"],
    "promotion": ["Promotion", "Promotions", "Marketing"],
    "low_priority": ["Low Priority", "Spam", "Junk"],
}


class AutoCleanEngine:
    """Evaluates emails against auto-clean rules and schedules actions."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.rules = self._fetch_active_rules()

    def _fetch_active_rules(self) -> List[AutoCleanRule]:
        """Fetch active auto-clean rules for the user."""
        statement = (
            select(AutoCleanRule)
            .where(AutoCleanRule.user_id == self.user.id)
            .where(AutoCleanRule.is_enabled == True)
        )
        return list(self.db.exec(statement).all())

    def evaluate_email(self, email: EmailInsight) -> bool:
        """
        Match an email against auto-clean rules. If matched, schedule cleanup.
        Returns True if a rule was matched and the email was scheduled.
        """
        # Safety: never act on important or high-urgency emails
        if email.importance_score > MIN_IMPORTANCE_THRESHOLD:
            return False
        if email.urgency == "high":
            return False
        if email.needs_reply:
            return False
        # Only act on fully classified emails
        if email.classification_status != "classified":
            return False
        # Already scheduled or completed
        if email.clean_action_status != "none":
            return False

        for rule in self.rules:
            if self._matches_rule(rule, email):
                # Schedule the action
                email.auto_clean_rule_id = rule.id
                email.scheduled_clean_at = datetime.utcnow() + timedelta(hours=rule.retention_hours)
                email.clean_action_status = "pending"
                self.db.add(email)

                logger.info(
                    f"AutoClean: Scheduled email {email.id} (subject: {email.subject}) "
                    f"for '{rule.action}' in {rule.retention_hours}h via rule '{rule.name}'"
                )
                return True

        return False

    def _matches_rule(self, rule: AutoCleanRule, email: EmailInsight) -> bool:
        """Check if an email matches a rule's conditions."""
        rule_type = rule.rule_type

        # Predefined type matching (category-based)
        if rule_type in PREDEFINED_CATEGORIES:
            target_categories = PREDEFINED_CATEGORIES[rule_type]
            email_category = email.category or ""
            for target in target_categories:
                if target.lower() in email_category.lower():
                    return True
            # Also check classification_tags
            tags = email.classification_tags or []
            for tag in tags:
                for target in target_categories:
                    if target.lower() in tag.lower():
                        return True
            return False

        # Custom rule: use conditions dict (same pattern as RuleEngine)
        if rule_type == "custom":
            conditions = rule.conditions or {}
            # Support simple category match
            if "category" in conditions:
                return (email.category or "").lower() == conditions["category"].lower()

            # Support structured conditions {"all": [...]}
            criteria_list = conditions.get("all", [])
            if not criteria_list:
                return False

            email_data = {
                "sender": email.sender or "",
                "subject": email.subject or "",
                "category": email.category or "",
                "snippet": email.snippet or "",
                "urgency": email.urgency or "",
                "importance_score": str(email.importance_score),
            }

            for criteria in criteria_list:
                if not self._check_condition(criteria, email_data):
                    return False
            return True

        return False

    def _check_condition(self, criteria: Dict[str, Any], email_data: Dict[str, str]) -> bool:
        """Evaluate a single condition against email data."""
        field = criteria.get("field", "")
        operator = criteria.get("operator", "")
        target = criteria.get("value", "")

        email_value = email_data.get(field, "")
        if isinstance(email_value, str):
            email_value = email_value.lower()
        if isinstance(target, str):
            target = target.lower()

        if operator == "contains":
            return target in email_value
        elif operator == "not_contains":
            return target not in email_value
        elif operator == "equals":
            return email_value == target
        elif operator == "not_equals":
            return email_value != target
        elif operator == "starts_with":
            return email_value.startswith(target)
        elif operator == "ends_with":
            return email_value.endswith(target)

        return False


class AutoCleanWorker:
    """
    Executes scheduled auto-clean actions.
    Designed to be called by a cron job or manual trigger.
    """

    def __init__(self, db: Session):
        self.db = db

    def execute_pending(self) -> Dict[str, int]:
        """
        Find and execute all pending auto-clean actions that are due.
        Returns stats: {completed, failed, skipped}.
        """
        now = datetime.utcnow()
        stats = {"completed": 0, "failed": 0, "skipped": 0}

        # Fetch emails due for cleaning
        statement = (
            select(EmailInsight)
            .where(EmailInsight.clean_action_status == "pending")
            .where(EmailInsight.scheduled_clean_at <= now)
            .limit(MAX_EMAILS_PER_EXECUTION)
        )
        emails = list(self.db.exec(statement).all())

        if not emails:
            logger.info("AutoCleanWorker: No pending emails to process")
            return stats

        logger.info(f"AutoCleanWorker: Processing {len(emails)} pending emails")

        # Group by user for efficient Gmail service creation
        user_emails: Dict[uuid.UUID, List[EmailInsight]] = {}
        for email in emails:
            user_emails.setdefault(email.user_id, []).append(email)

        for user_id, user_email_list in user_emails.items():
            user = self.db.get(User, user_id)
            if not user:
                logger.warning(f"AutoCleanWorker: User {user_id} not found, skipping")
                for em in user_email_list:
                    em.clean_action_status = "failed"
                    stats["failed"] += 1
                continue

            try:
                gmail = GmailService(user, self.db)
            except Exception as e:
                logger.error(f"AutoCleanWorker: Failed to init Gmail for user {user_id}: {e}")
                for em in user_email_list:
                    em.clean_action_status = "failed"
                    stats["failed"] += 1
                continue

            for email in user_email_list:
                result = self._execute_single(email, gmail)
                if result == "completed":
                    stats["completed"] += 1
                elif result == "skipped":
                    stats["skipped"] += 1
                else:
                    stats["failed"] += 1

        self.db.commit()
        logger.info(f"AutoCleanWorker: Done. Stats: {stats}")
        return stats

    def _execute_single(self, email: EmailInsight, gmail: GmailService) -> str:
        """Execute action for a single email. Returns status string."""
        # Re-verify: check if the rule is still active
        if email.auto_clean_rule_id:
            rule = self.db.get(AutoCleanRule, email.auto_clean_rule_id)
            if not rule or not rule.is_enabled:
                logger.info(f"AutoCleanWorker: Rule disabled/deleted for email {email.id}, skipping")
                email.clean_action_status = "none"
                email.auto_clean_rule_id = None
                email.scheduled_clean_at = None
                self.db.add(email)
                return "skipped"
            action = rule.action
        else:
            email.clean_action_status = "failed"
            self.db.add(email)
            return "failed"

        # Safety re-check: don't act on important emails
        if email.importance_score > MIN_IMPORTANCE_THRESHOLD:
            logger.info(f"AutoCleanWorker: Email {email.id} became important, skipping")
            email.clean_action_status = "none"
            self.db.add(email)
            return "skipped"

        # Execute the Gmail action
        success = False
        try:
            if action == "trash":
                success = gmail.trash_message(email.gmail_message_id)
            elif action == "delete":
                success = gmail.delete_message(email.gmail_message_id)
            elif action == "archive":
                success = gmail.archive_message(email.gmail_message_id)
            else:
                logger.warning(f"AutoCleanWorker: Unknown action '{action}' for email {email.id}")
                email.clean_action_status = "failed"
                self.db.add(email)
                return "failed"
        except Exception as e:
            logger.error(f"AutoCleanWorker: Gmail action failed for email {email.id}: {e}")

        if success:
            email.clean_action_status = "completed"
            self.db.add(email)

            # Log the action
            self._log_action(email, action, "success")
            return "completed"
        else:
            email.clean_action_status = "failed"
            self.db.add(email)
            self._log_action(email, action, "failed")
            return "failed"

    def _log_action(self, email: EmailInsight, action: str, result: str):
        """Log the auto-clean action to AILog table."""
        try:
            log = AILog(
                user_id=email.user_id,
                email_id=email.id,
                model="auto_clean_engine",
                prompt_messages=[],
                temperature=0.0,
                response_content=f"Auto-clean: {action} email '{email.subject}'",
                parsed_result={"action": action, "gmail_id": email.gmail_message_id, "result": result},
                finish_reason=None,
                prompt_tokens=0,
                completion_tokens=0,
                total_tokens=0,
                cost=0.0,
                latency_ms=0,
                status=result,
                purpose="auto_clean",
            )
            self.db.add(log)
        except Exception as e:
            logger.error(f"AutoCleanWorker: Failed to log action: {e}")
