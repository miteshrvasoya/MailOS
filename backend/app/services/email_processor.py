from sqlmodel import Session
from app.models.email import EmailInsight
from app.models.user import User
from app.models.action import EmailAction
from app.models.notification import Notification, NotificationCategory, NotificationPriority
from app.models.task import Task
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
    
    # 1. AI Classification (with logging)
    ai_result = classify_email(
        email_data.get("subject", ""), 
        email_data.get("body", ""), 
        email_data.get("sender", ""),
        db=db,
        user_id=user.id,
    )
    
    # Check if Insight already exists
    gmail_msg_id = email_data.get("gmail_message_id")
    insight = None
    if gmail_msg_id:
        from sqlmodel import select
        insight = db.exec(select(EmailInsight).where(EmailInsight.gmail_message_id == gmail_msg_id)).first()
        
    if not insight:
        # Create New Insight
        insight = EmailInsight(
            user_id=user.id,
            gmail_message_id=gmail_msg_id,
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
        db.add(insight)
    else:
        # Update Existing Insight
        insight.category = ai_result.get("category", insight.category)
        insight.intent = ai_result.get("intent", insight.intent)
        insight.importance_score = ai_result.get("importance_score", insight.importance_score)
        insight.urgency = ai_result.get("urgency", insight.urgency)
        insight.needs_reply = ai_result.get("needs_reply", insight.needs_reply)
        insight.explanation = ai_result.get("explanation", insight.explanation)
        insight.classification_tags = [ai_result.get("category")] if ai_result.get("category") else []
        insight.is_preview = is_preview
        # Don't update static fields like sender, subject, sent_at unless needed
        
        db.add(insight)

    # 3. Auto-Grouping
    assigned_group = assign_group(insight, ai_result, db)
    
    # 3.5 Rule Engine Evaluation
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
        pass

    if insight.category and f"AI:{insight.category}" not in insight.classification_tags:
        insight.classification_tags.append(f"AI:{insight.category}")
    insight.category = assigned_group
    
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
    
    # Check for existing Action
    from sqlmodel import select
    action = db.exec(select(EmailAction).where(EmailAction.email_id == insight.id)).first()
    
    if not action:
        action = EmailAction(
            user_id=user.id,
            email_id=insight.id,
            suggested_label=assigned_group,
            confidence=confidence,
            reason=insight.explanation,
            status=status
        )
        db.add(action)
    else:
        # Update existing action if it hasn't been acted upon manually
        if action.status == "pending":
             action.suggested_label = assigned_group
             action.confidence = confidence
             action.reason = insight.explanation
             action.status = status
             db.add(action)
             
    db.commit()
    
    # 5. Notifications
    notif = None
    if insight.importance_score > 80 or insight.urgency == "high":
        # Check if notification already exists to avoid spam?
        # For now, simplistic approach: create new notification only if insight was just created?
        # Or just let it be.
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

    # 6. Task Extraction
    extracted_tasks = ai_result.get("tasks", [])
    if extracted_tasks and isinstance(extracted_tasks, list):
        for t_data in extracted_tasks:
            if not isinstance(t_data, dict) or not t_data.get("title"):
                continue
            task = Task(
                user_id=user.id,
                email_id=insight.id,
                title=t_data.get("title"),
                priority=t_data.get("priority", "medium"),
                status="pending",
                # due_date parsing omitted for simplicity, can add dateparser later
            )
            db.add(task)
        db.commit()
    
    return EmailProcessingResult(insight, action, notif)


def process_emails_batch(
    db: Session,
    user: User,
    emails_data: list,
    is_preview: bool = False,
    gmail_service: Optional[GmailService] = None,
) -> list:
    """
    Process multiple emails using batch AI classification.
    1. Filter duplicates
    2. Batch classify with AI
    3. Process each result through grouping, rules, actions
    Returns list of EmailProcessingResult.
    """
    from app.core.ai import classify_emails_batch
    from app.core.config import settings
    from sqlmodel import select

    if not emails_data:
        return []

    batch_size = settings.AI_BATCH_SIZE

    # 1. Filter out already-classified emails
    new_emails = []
    existing_insights = {}
    for ed in emails_data:
        gmail_msg_id = ed.get("gmail_message_id")
        if gmail_msg_id:
            existing = db.exec(
                select(EmailInsight).where(EmailInsight.gmail_message_id == gmail_msg_id)
            ).first()
            if existing:
                existing_insights[gmail_msg_id] = existing
                continue
        new_emails.append(ed)

    # If no new emails, return early
    if not new_emails:
        return []

    # 2. Batch classify in chunks
    all_ai_results = []
    for i in range(0, len(new_emails), batch_size):
        chunk = new_emails[i:i + batch_size]
        batch_input = [
            {"subject": e.get("subject", ""), "body": e.get("body", ""), "sender": e.get("sender", "")}
            for e in chunk
        ]
        chunk_results = classify_emails_batch(batch_input, db=db, user_id=user.id)
        all_ai_results.extend(chunk_results)

    # 3. Process each email with its classification
    from app.services.sync_manager import sync_manager
    
    results = []
    for email_data, ai_result in zip(new_emails, all_ai_results):
        try:
            result = _process_single_with_classification(
                db, user, email_data, ai_result, is_preview, gmail_service
            )
            results.append(result)
            
            # Update Progress
            sync_manager.update_progress(user.id)
            
        except Exception as e:
            import logging
            logging.getLogger(__name__).debug(
                f"Skipping email {email_data.get('gmail_message_id')}: {e}"
            )
            continue

    return results


def _process_single_with_classification(
    db: Session,
    user: User,
    email_data: Dict[str, Any],
    ai_result: Dict[str, Any],
    is_preview: bool = False,
    gmail_service: Optional[GmailService] = None,
) -> EmailProcessingResult:
    """
    Process a single email that has already been classified by AI.
    Handles insight creation, grouping, rules, actions, and notifications.
    """
    from sqlmodel import select

    gmail_msg_id = email_data.get("gmail_message_id")
    insight = None
    if gmail_msg_id:
        insight = db.exec(
            select(EmailInsight).where(EmailInsight.gmail_message_id == gmail_msg_id)
        ).first()

    # Prepare tags from AI result
    category = ai_result.get("category", "Uncategorized")
    subcategory = ai_result.get("subcategory")
    intent = ai_result.get("intent")
    
    tags = [f"AI:{category}"]
    if subcategory:
        tags.append(f"Sub:{subcategory}")
    if intent:
        tags.append(f"Intent:{intent}")

    if not insight:
        insight = EmailInsight(
            user_id=user.id,
            gmail_message_id=gmail_msg_id,
            thread_id=email_data.get("thread_id"),
            sender=email_data.get("sender"),
            subject=email_data.get("subject"),
            sent_at=email_data.get("sent_at", datetime.utcnow()),
            snippet=email_data.get("body", "")[:200],
            category=category,
            intent=intent,
            importance_score=ai_result.get("importance_score", 0),
            urgency=ai_result.get("urgency", "low"),
            needs_reply=ai_result.get("needs_reply", False),
            explanation=ai_result.get("explanation"),
            classification_tags=tags,
            is_preview=is_preview,
        )
        db.add(insight)
    else:
        insight.category = category
        insight.intent = intent
        insight.importance_score = ai_result.get("importance_score", insight.importance_score)
        insight.urgency = ai_result.get("urgency", insight.urgency)
        insight.needs_reply = ai_result.get("needs_reply", insight.needs_reply)
        insight.explanation = ai_result.get("explanation", insight.explanation)
        insight.classification_tags = tags
        insight.is_preview = is_preview
        db.add(insight)

    # Grouping
    assigned_group = assign_group(insight, ai_result, db)

    # Rule Engine
    rule_data = {**email_data, **ai_result}
    rule_engine = RuleEngine(db, user)
    rule_overrides = rule_engine.evaluate(rule_data)

    if "move_to_category" in rule_overrides:
        assigned_group = rule_overrides["move_to_category"]
        insight.classification_tags.append(f"Rule:{assigned_group}")
    
    # Handle Rule-based Subcategory & Intent overrides
    if "set_subcategory" in rule_overrides:
        sub = rule_overrides["set_subcategory"]
        insight.classification_tags.append(f"Sub:{sub}")
        
    if "set_intent" in rule_overrides:
        new_intent = rule_overrides["set_intent"]
        insight.intent = new_intent
        insight.classification_tags.append(f"Intent:{new_intent}")

    if "mark_important" in rule_overrides and rule_overrides["mark_important"]:
        insight.importance_score = 100
        insight.urgency = "high"
        
    if insight.category and f"AI:{insight.category}" not in insight.classification_tags:
        insight.classification_tags.append(f"AI:{insight.category}")
        
    insight.category = assigned_group

    db.commit()
    db.refresh(insight)

    # Action Mode
    status = "pending"
    confidence = insight.importance_score / 100.0 if insight.importance_score > 1 else insight.importance_score

    if user.action_mode == "auto_apply" and confidence >= user.confidence_threshold and not is_preview:
        status = "auto_applied"
        if gmail_service:
            try:
                label_name = f"MailOS/{assigned_group}"
                label_id = gmail_service.ensure_label(label_name)
                if insight.gmail_message_id:
                    gmail_service.apply_label(insight.gmail_message_id, label_id)
            except Exception:
                status = "failed"

    action = db.exec(select(EmailAction).where(EmailAction.email_id == insight.id)).first()
    if not action:
        action = EmailAction(
            user_id=user.id,
            email_id=insight.id,
            suggested_label=assigned_group,
            confidence=confidence,
            reason=insight.explanation,
            status=status,
        )
        db.add(action)
    elif action.status == "pending":
        action.suggested_label = assigned_group
        action.confidence = confidence
        action.reason = insight.explanation
        action.status = status
        db.add(action)

    db.commit()

    # Notifications
    notif = None
    if insight.importance_score > 80 or insight.urgency == "high":
        notif = Notification(
            user_id=insight.user_id,
            title=f"Important: {insight.subject[:30]}...",
            message=insight.explanation or "High importance email detected",
            category=NotificationCategory.EMAIL_INSIGHT,
            priority=NotificationPriority.HIGH,
            action_url=f"/dashboard/emails/{insight.id}",
        )
        db.add(notif)
        db.commit()

    # Tasks
    extracted_tasks = ai_result.get("tasks", [])
    if extracted_tasks and isinstance(extracted_tasks, list):
        for t_data in extracted_tasks:
            if not isinstance(t_data, dict) or not t_data.get("title"):
                continue
            task = Task(
                user_id=user.id,
                email_id=insight.id,
                title=t_data.get("title"),
                priority=t_data.get("priority", "medium"),
                status="pending"
            )
            db.add(task)
        db.commit()

    return EmailProcessingResult(insight, action, notif)
