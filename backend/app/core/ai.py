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
from typing import Optional, Dict, Any
from app.core.config import settings


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
    user_message = f"""Analyze this email and return JSON:
Sender: {clean_data['sender']}
Subject: {clean_data['subject']}
Body: {clean_data['body']}

Output JSON Schema:
{{
  "category": "High-level bucket (Work, Personal, Newsletter, Finance, Security, Promo, Travel, Job)",
  "intent": "Fine-grained intent (e.g., meeting_request, invoice, otp, ad, job_application, interview_invitation)",
  "importance_score": 0-100 (float),
  "needs_reply": boolean,
  "urgency": "low" | "medium" | "high",
  "explanation": "Short reason for classification"
}}"""

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
