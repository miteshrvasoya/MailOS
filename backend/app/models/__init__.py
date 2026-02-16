from .user import User
from .email import EmailInsight
from .rule import Rule
from .preference import UserIntentPreference
from .action import EmailAction
from .gmail_label import GmailLabel
from .google_credential import GoogleCredential
from .category import Category
from .snoozed_email import SnoozedEmail
from .digest import Digest
from .notification import Notification
from .ai_log import AILog
from .task import Task

# For Alembic/SQLModel to detect
__all__ = [
    "User", "EmailInsight", "Rule", "UserIntentPreference", 
    "EmailAction", "GmailLabel", "GoogleCredential", 
    "Category", "SnoozedEmail", "Digest", "Notification",
    "AILog", "Task"
]
