from sqlmodel import Session
from app.models.email import EmailInsight
from app.models.user import User
from app.models.action import EmailAction
from app.models.notification import Notification, NotificationCategory, NotificationPriority
from app.core.ai import classify_email
from app.services.grouping import assign_group
from app.services.rule_engine import RuleEngine
from app.services.gmail_service import GmailService
from datetime import datetime
import uuid
from typing import Optional, Dict, Any

class EmailProcessingResult:
    def __init__(self, insight: EmailInsight, action: EmailAction, notification: Optional[Notification]):
        self.insight = insight
        self.action = action
        self.notification = notification

def process_email_pipeline(
    db: Session,
    user: User,
    email_data: Dict[str, Any],
    is_preview: bool = False,
    gmail_service: Optional[GmailService] = None
) -> EmailProcessingResult:
    """
    Core pipeline:
    1. AI Classify
    2. Auto-Group
    3. Save Insight
    4. Action Mode Logic
    5. Check Notifications
    """
    
    # 1. AI Classification
    ai_result = classify_email(
        email_data.get("subject", ""), 
        email_data.get("body", ""), 
        email_data.get("sender", "")
    )
    
    # 2. Create Insight Object
    insight = EmailInsight(
        user_id=user.id,
        gmail_message_id=email_data.get("gmail_message_id"),
        thread_id=email_data.get("thread_id"),
        sender=email_data.get("sender"),
        subject=email_data.get("subject"),
        sent_at=email_data.get("sent_at", datetime.utcnow()),
        snippet=email_data.get("body", "")[:200],
        
        # AI Fields
        category=ai_result.get("category", "Uncategorized"),
        intent=ai_result.get("intent"),
        importance_score=ai_result.get("importance_score", 0),
        urgency=ai_result.get("urgency", "low"),
        needs_reply=ai_result.get("needs_reply", False),
        explanation=ai_result.get("explanation"),
        classification_tags=[ai_result.get("category")] if ai_result.get("category") else [],
        is_preview=is_preview
    )
    
    # 3. Auto-Grouping
    assigned_group = assign_group(insight, ai_result, db)
    
    # 3.5 Rule Engine Evaluation
    # Merge email data with AI results for rule evaluation
    rule_data = {**email_data, **ai_result}
    rule_engine = RuleEngine(db, user)
    rule_overrides = rule_engine.evaluate(rule_data)
    
    # Apply Overrides
    if "move_to_category" in rule_overrides:
        assigned_group = rule_overrides["move_to_category"]
        insight.classification_tags.append(f"Rule:{assigned_group}")
    
    if "mark_important" in rule_overrides:
        if rule_overrides["mark_important"]:
             insight.importance_score = 100
             insight.urgency = "high"
    
    if "mark_read" in rule_overrides:
        # TODO: Handle mark read status in Email model or Action
        pass

    if insight.category:
        insight.classification_tags.append(f"AI:{insight.category}")
    insight.category = assigned_group
    
    db.add(insight)
    db.commit()
    db.refresh(insight)
    
    # 4. Action Mode Logic
    status = "pending"
    # Normalize confidence to 0-1
    confidence = insight.importance_score / 100.0 if insight.importance_score > 1 else insight.importance_score
    
    if user.action_mode == "auto_apply" and confidence >= user.confidence_threshold and not is_preview:
        status = "auto_applied"
        # Apply Gmail Label
        if gmail_service:
            try:
                label_name = f"MailOS/{assigned_group}"
                label_id = gmail_service.ensure_label(label_name)
                # gmail_message_id is in insight
                if insight.gmail_message_id:
                    gmail_service.apply_label(insight.gmail_message_id, label_id)
            except Exception as e:
                # Fallback if failed (e.g. no write access)
                status = "failed"
                print(f"Auto-apply failed: {e}")
        else:
             # Warning: No service provided
             pass
        
    action = EmailAction(
        user_id=user.id,
        email_id=insight.id,
        suggested_label=assigned_group,
        confidence=confidence,
        reason=insight.explanation,
        status=status
    )
    db.add(action)
    db.commit()
    
    # 5. Notifications
    notif = None
    if insight.importance_score > 80 or insight.urgency == "high":
        notif = Notification(
            user_id=insight.user_id,
            title=f"Important: {insight.subject[:30]}...",
            message=insight.explanation or "High importance email detected",
            category=NotificationCategory.EMAIL_INSIGHT,
            priority=NotificationPriority.HIGH,
            action_url=f"/dashboard/emails/{insight.id}"
        )
        db.add(notif)
        db.commit()
        
    return EmailProcessingResult(insight, action, notif)
