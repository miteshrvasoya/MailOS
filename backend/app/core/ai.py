"""
AI Classification Module — OpenRouter REST API

Uses direct HTTP calls (httpx) instead of OpenAI SDK.
Logs every request/response to AILog table for debugging and analysis.
"""

import re
import json
import time
import httpx
import uuid
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


# ─── Email Preprocessing ─────────────────────────────────────────

def preprocess_email(subject: str, body: str, sender: str) -> Dict[str, str]:
    """Clean and truncate email content for AI processing."""
    if not body:
        body = ""

    # Strip HTML
    clean_body = re.sub(r'<[^>]+>', '', body)

    # Remove multiple newlines/spaces
    clean_body = re.sub(r'\s+', ' ', clean_body).strip()

    # Truncate to ~1500 chars (approx 300-400 tokens)
    if len(clean_body) > 1500:
        clean_body = clean_body[:1500] + "...(truncated)"

    # Mask Credit Card numbers
    clean_body = re.sub(r'\b(?:\d[ -]*?){13,16}\b', '[CARD_MASKED]', clean_body)

    return {
        "subject": subject or "",
        "sender": sender or "",
        "body": clean_body
    }


# ─── OpenRouter REST Client ──────────────────────────────────────

def _call_openrouter(
    messages: list,
    model: Optional[str] = None,
    temperature: float = 0,
    response_format: Optional[dict] = None,
) -> Dict[str, Any]:
    """
    Make a direct REST API call to OpenRouter.
    Returns the full response dict or raises an exception.
    """
    api_key = settings.OPENROUTER_API_KEY
    base_url = settings.OPENROUTER_BASE_URL

    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set")

    url = f"{base_url}/chat/completions"
    model = model or settings.AI_MODEL

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://mailos.ai",
        "X-Title": "MailOS Backend",
    }

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    if response_format:
        payload["response_format"] = response_format

    start_time = time.time()

    with httpx.Client(timeout=60.0) as client:
        response = client.post(url, headers=headers, json=payload)

    latency_ms = int((time.time() - start_time) * 1000)

    if response.status_code != 200:
        raise Exception(f"OpenRouter API error {response.status_code}: {response.text}")

    data = response.json()
    data["_latency_ms"] = latency_ms
    return data


# ─── AI Classification with Logging ──────────────────────────────

def classify_email(
    subject: str,
    body: str,
    sender: str,
    db=None,
    user_id: Optional[uuid.UUID] = None,
    email_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """
    Classify email intent and importance using OpenRouter REST API.
    Logs the request and response to AILog if db session is provided.
    """
    print("Email Classification (REST API) ---")

    clean_data = preprocess_email(subject, body, sender)

    system_message = "You are an email assistant. Respond only in valid JSON."
    user_message = f"""Analyze this email and return JSON. Use this taxonomy:

1. Work: Direct Communication, Notifications, Recruiting, Networking (LinkedIn etc), Newsletter
2. Finance: Transactional, Banking, Investment (Market news/Demat), Security (OTP)
3. Personal: Correspondence, Health, Travel
4. Promo: Offers, Newsletter, Spam

Output JSON Schema:
{{
  "category": "High-level bucket (Work, Personal, Finance, Promo, Travel)",
  "subcategory": "Specific sub-bucket (e.g. Networking, Investment, Banking, Recruiting)",
  "intent": "Fine-grained intent (e.g. connection_request, market_news, otp, invoice, job_offer)",
  "importance_score": 0-100 (float),
  "needs_reply": boolean,
  "urgency": "low" | "medium" | "high",
  "explanation": "Short reason",
  "tasks": [
    {{
        "title": "Actionable task title",
        "priority": "high/medium/low",
        "due_date": "YYYY-MM-DD or null",
        "status": "pending"
    }}
  ]
}}

Email:
Sender: {clean_data['sender']}
Subject: {clean_data['subject']}
Body: {clean_data['body']}"""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]

    model = settings.AI_MODEL

    try:
        response_data = _call_openrouter(
            messages=messages,
            model=model,
            temperature=0,
            response_format={"type": "json_object"},
        )

        # Extract response
        choice = response_data["choices"][0]
        content = choice["message"]["content"]
        finish_reason = choice.get("finish_reason", "unknown")
        usage = response_data.get("usage", {})
        latency_ms = response_data.get("_latency_ms", 0)

        # Parse the AI response
        parsed = json.loads(content)

        print(f"AI Response (model={response_data.get('model', model)}, "
              f"tokens={usage.get('total_tokens', 0)}, "
              f"latency={latency_ms}ms): {parsed.get('category')} / {parsed.get('intent')}")

        # Log to database
        if db:
            _save_log(
                db=db,
                user_id=user_id,
                email_id=email_id,
                model=response_data.get("model", model),
                messages=messages,
                temperature=0,
                response_content=content,
                parsed_result=parsed,
                finish_reason=finish_reason,
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                cost=usage.get("cost", 0),
                latency_ms=latency_ms,
                status="success",
                purpose="classify_email",
            )

        return parsed

    except Exception as e:
        print(f"AI Classification failed: {e}")

        # Log error
        if db:
            _save_log(
                db=db,
                user_id=user_id,
                email_id=email_id,
                model=model,
                messages=messages,
                temperature=0,
                response_content=None,
                parsed_result=None,
                finish_reason=None,
                prompt_tokens=0,
                completion_tokens=0,
                total_tokens=0,
                cost=0,
                latency_ms=0,
                status="error",
                purpose="classify_email",
                error=str(e),
            )

        return {
            "category": "Uncategorized",
            "intent": "error",
            "importance_score": 0.0,
            "needs_reply": False,
            "urgency": "low",
            "explanation": f"AI Processing Error: {str(e)}"
        }


# ─── Batch AI Classification ────────────────────────────────────

def classify_emails_batch(
    emails: list[Dict[str, str]],
    db=None,
    user_id: Optional[uuid.UUID] = None,
) -> list[Dict[str, Any]]:
    """
    Classify multiple emails in a single API call.
    Each email in the list should have: subject, body, sender.
    Returns a list of classification dicts in the same order.
    Falls back to individual classification on failure.
    """
    if not emails:
        return []

    # If only 1 email, use the single classifier
    if len(emails) == 1:
        e = emails[0]
        return [classify_email(e.get("subject", ""), e.get("body", ""), e.get("sender", ""), db=db, user_id=user_id)]

    logger.info(f"AI: Batch classification (REST API) — {len(emails)} emails")

    # Preprocess all emails
    cleaned = [preprocess_email(e.get("subject", ""), e.get("body", ""), e.get("sender", "")) for e in emails]

    # Build the batch prompt
    email_blocks = []
    for i, c in enumerate(cleaned):
        email_blocks.append(
            f"--- Email {i+1} ---\n"
            f"Sender: {c['sender']}\n"
            f"Subject: {c['subject']}\n"
            f"Body: {c['body']}"
        )

    joined = "\n\n".join(email_blocks)

    system_message = "You are an email classification assistant. Respond ONLY with a valid JSON array."
    user_message = f"""Classify these {len(emails)} emails using this taxonomy:

1. Work: Direct Communication, Notifications, Recruiting, Networking (LinkedIn), Newsletter
2. Finance: Transactional, Banking, Investment (Market news), Security (OTP)
3. Personal: Correspondence, Health, Travel
4. Promo: Offers, Newsletter, Spam

Return a JSON array with exactly {len(emails)} objects. Schema:
{{
  "category": "Work" | "Personal" | "Finance" | "Promo" | "Travel",
  "subcategory": "e.g. Networking, Investment, Banking, Recruiting, Transactional",
  "intent": "e.g. connection_request, market_news, otp, invoice, meeting_request",
  "importance_score": 0-100,
  "needs_reply": boolean,
  "urgency": "low" | "medium" | "high",
  "explanation": "Short reason",
  "tasks": [{{ "title": "string", "priority": "medium", "due_date": "YYYY-MM-DD" }}]
}}

Emails:
{joined}"""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]

    model = settings.AI_MODEL

    try:
        response_data = _call_openrouter(
            messages=messages,
            model=model,
            temperature=0,
            response_format={"type": "json_object"},
        )

        choice = response_data["choices"][0]
        content = choice["message"]["content"]
        finish_reason = choice.get("finish_reason", "unknown")
        usage = response_data.get("usage", {})
        latency_ms = response_data.get("_latency_ms", 0)

        # Parse — handle both raw array and wrapped object
        parsed = json.loads(content)

        logger.debug(f"AI: Batch parsed response: {len(parsed) if isinstance(parsed, list) else 'non-list'} items")


        if isinstance(parsed, dict):
            # Some models wrap in {"classifications": [...]} or {"results": [...]}
            for key in ("classifications", "results", "emails", "data"):
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break
            else:
                # If it's a single object, wrap it
                if "category" in parsed:
                    parsed = [parsed]

        if not isinstance(parsed, list) or len(parsed) != len(emails):
            logger.warning(f"AI: Batch parse mismatch — expected {len(emails)}, got {len(parsed) if isinstance(parsed, list) else 'non-list'}. Falling back.")
            raise ValueError("Batch response count mismatch")

        logger.info(f"AI: Batch classified (model={response_data.get('model', model)}, "
                     f"tokens={usage.get('total_tokens', 0)}, "
                     f"latency={latency_ms}ms): {len(parsed)} classifications")

        # Log to database
        if db:
            _save_log(
                db=db,
                user_id=user_id,
                email_id=None,
                model=response_data.get("model", model),
                messages=messages,
                temperature=0,
                response_content=content,
                parsed_result={"batch_size": len(parsed), "results": parsed},
                finish_reason=finish_reason,
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                cost=usage.get("cost", 0),
                latency_ms=latency_ms,
                status="success",
                purpose="classify_email_batch",
            )

        # Ensure each result has all required fields
        defaults = {
            "category": "Uncategorized",
            "intent": "unknown",
            "importance_score": 0.0,
            "needs_reply": False,
            "urgency": "low",
            "explanation": "",
        }
        sanitized = []
        for r in parsed:
            item = {**defaults, **(r if isinstance(r, dict) else {})}
            sanitized.append(item)

        return sanitized

    except Exception as e:
        logger.error(f"AI: Batch classification failed: {e}. Falling back to individual classification.")

        # Log error
        if db:
            _save_log(
                db=db,
                user_id=user_id,
                email_id=None,
                model=model,
                messages=messages,
                temperature=0,
                response_content=None,
                parsed_result=None,
                finish_reason=None,
                prompt_tokens=0,
                completion_tokens=0,
                total_tokens=0,
                cost=0,
                latency_ms=0,
                status="error",
                purpose="classify_email_batch",
                error=str(e),
            )

        # Fallback: classify individually
        results = []
        for em in emails:
            result = classify_email(
                em.get("subject", ""), em.get("body", ""), em.get("sender", ""),
                db=db, user_id=user_id,
            )
            results.append(result)
        return results


# ─── Digest Insight Generation ──────────────────────────────────

def generate_digest_insights(
    sections: list[Dict[str, Any]],
    digest_type: str,
    db=None,
    user_id: Optional[uuid.UUID] = None,
) -> str:
    """
    Generate a concise 2-3 sentence engaging summary highlighting key actions or notable corresponders 
    across the provided digest sections.
    """
    if not sections:
        return "Your inbox is clear. You have no new emails for this period."

    # Build a prompt containing a simplified view of the top emails
    email_contexts = []
    for section in sections:
        cat = section.get('category', 'Other')
        for h in section.get('highlights', [])[:3]: # Only send the top 3 per category to keep token count low
            email_contexts.append(
                f"[{cat}] {h.get('sender', 'Unknown')} - {h.get('subject', 'No Subject')} "
                f"(Reply needed: {h.get('needs_reply', False)}, Urgency: {h.get('urgency', 'low')})"
            )
            
    joined_emails = "\n".join(email_contexts)
    
    system_message = (
        "You are an executive assistant. Generate a short, friendly, and engaging 2-3 sentence summary "
        "of the following emails. Do NOT list numbers or stats. Instead, highlight the most important people who emailed, "
        "urgent actions needed, or general themes (e.g. 'You have a few urgent action items from Sarah and a "
        "handful of newsletters to catch up on'). Be concise."
    )
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": f"Emails for this {digest_type}:\n{joined_emails}"},
    ]

    model = settings.AI_MODEL

    try:
        # We don't force JSON here, just a string response
        response_data = _call_openrouter(
            messages=messages,
            model=model,
            temperature=0.7, # Slightly higher temp for natural language
        )

        choice = response_data["choices"][0]
        content = choice["message"]["content"].strip()
        
        # Log to DB if session provided
        if db:
            usage = response_data.get("usage", {})
            latency_ms = response_data.get("_latency_ms", 0)
            _save_log(
                db=db, user_id=user_id, email_id=None, model=response_data.get("model", model),
                messages=messages, temperature=0.7, response_content=content, parsed_result=None,
                finish_reason=choice.get("finish_reason", "unknown"),
                prompt_tokens=usage.get("prompt_tokens", 0), completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0), cost=usage.get("cost", 0), latency_ms=latency_ms,
                status="success", purpose="digest_insights",
            )
            
        return content

    except Exception as e:
        logger.error(f"AI: Digest insight generation failed: {e}")
        return "Here's a quick summary of your inbox for this period."


# ─── Log Helper ───────────────────────────────────────────────────

def _save_log(
    db,
    user_id,
    email_id,
    model: str,
    messages: list,
    temperature: float,
    response_content: Optional[str],
    parsed_result: Optional[dict],
    finish_reason: Optional[str],
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost: float,
    latency_ms: int,
    status: str,
    purpose: str,
    error: Optional[str] = None,
):
    """Save an AI interaction log to the database."""
    from app.models.ai_log import AILog

    log = AILog(
        user_id=user_id,
        email_id=email_id,
        model=model,
        prompt_messages=messages,
        temperature=temperature,
        response_content=response_content,
        parsed_result=parsed_result,
        finish_reason=finish_reason,
        error=error,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost=cost,
        latency_ms=latency_ms,
        status=status,
        purpose=purpose,
    )
    db.add(log)
    try:
        db.commit()
    except Exception as log_err:
        print(f"Failed to save AI log: {log_err}")
        db.rollback()
