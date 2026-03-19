"""
AI Classification Module — OpenRouter REST API (v2 — Hybrid Pipeline)

Uses direct HTTP calls (httpx) instead of OpenAI SDK.
Logs every request/response to AILog table for debugging and analysis.
Integrates classification_normalizer for consistency.
"""

import re
import json
import time
import httpx
import uuid
import logging
from typing import Optional, Dict, Any, List
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


# ─── Upgraded Prompts ────────────────────────────────────────────

SYSTEM_MESSAGE = """You are a highly accurate email classification engine.

Your job is to classify emails with high consistency, not creativity.

Always return valid JSON.
Do NOT generate random or inconsistent labels.
"""

def _build_single_prompt(clean_data: Dict[str, str]) -> str:
    return f"""Analyze this email and return structured JSON.

STRICT RULES:

1. CATEGORY:
Choose ONE from:
["Work", "Finance", "Social", "Promotions", "Travel", "Security", "System", "Other"]

2. SUBCATEGORY:
- Generate a SPECIFIC but CONSISTENT group name
- MUST be plural
- MUST be 2–4 words max
- Avoid synonyms explosion
- Similar emails MUST map to SAME subcategory
Examples:
✔ "LinkedIn Notifications"
✔ "Bank Transactions"
✔ "E-commerce Orders"
✔ "Job Applications"
✔ "OTP Messages"

3. INTENT:
- Must be machine-friendly snake_case
- Highly specific
- Examples: job_interview_invite, otp_verification, connection_request, payment_confirmation, subscription_renewal

4. IMPORTANCE SCORE:
0–100
Rules:
- OTP / security / deadlines → high (70-100)
- Work / meetings → medium (40-70)
- Newsletters / promos → low (0-30)

5. TASK EXTRACTION:
Extract only REAL actionable tasks. Do not fabricate tasks.

6. CONSISTENCY RULE:
If similar email types appear, ALWAYS reuse same subcategory and intent.

EMAIL:
Subject: {clean_data['subject']}
Sender: {clean_data['sender']}
Body: {clean_data['body']}

Return JSON:
{{
  "category": "",
  "subcategory": "",
  "intent": "",
  "importance_score": 0,
  "needs_reply": false,
  "urgency": "low|medium|high",
  "explanation": "",
  "tasks": []
}}"""


def _build_batch_prompt(
    cleaned_emails: List[Dict[str, str]],
    previous_classifications: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Build batch prompt with optional previous context for consistency."""
    email_blocks = []
    for i, c in enumerate(cleaned_emails):
        email_blocks.append(
            f"--- Email {i+1} ---\n"
            f"Sender: {c['sender']}\n"
            f"Subject: {c['subject']}\n"
            f"Body: {c['body']}"
        )
    joined = "\n\n".join(email_blocks)

    context_block = ""
    if previous_classifications:
        # Give the model context of recently classified emails for consistency
        context_items = []
        for pc in previous_classifications[-5:]:  # Last 5 for context
            context_items.append(
                f"  - subcategory: \"{pc.get('subcategory', '')}\", "
                f"intent: \"{pc.get('intent', '')}\", "
                f"category: \"{pc.get('category', '')}\""
            )
        context_block = f"""
PREVIOUS CLASSIFICATIONS (for consistency — reuse subcategory and intent when the email type is similar):
{chr(10).join(context_items)}
"""

    return f"""Classify these {len(cleaned_emails)} emails. Return a JSON array with exactly {len(cleaned_emails)} objects.

STRICT RULES:

1. CATEGORY: Choose ONE from ["Work", "Finance", "Social", "Promotions", "Travel", "Security", "System", "Other"]

2. SUBCATEGORY:
- SPECIFIC but CONSISTENT pluralized group name (2-4 words)
- Similar emails MUST map to SAME subcategory
- Examples: "LinkedIn Notifications", "Bank Transactions", "E-commerce Orders", "OTP Messages"

3. INTENT: machine-friendly snake_case (e.g. otp_verification, connection_request, payment_confirmation)

4. IMPORTANCE SCORE: 0-100 (OTP/security/deadlines=high, newsletters/promos=low)

5. TASKS: Extract only REAL actionable tasks. Do not fabricate.
{context_block}
Schema per object:
{{
  "category": "", "subcategory": "", "intent": "",
  "importance_score": 0, "needs_reply": false,
  "urgency": "low|medium|high", "explanation": "",
  "tasks": [{{"title": "", "priority": "medium", "due_date": "YYYY-MM-DD or null"}}]
}}

Emails:
{joined}"""


# ─── OpenRouter REST Client ──────────────────────────────────────

def _call_openrouter(
    messages: list,
    model: Optional[str] = None,
    temperature: float = 0.2,
    top_p: float = 0.9,
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
        "top_p": top_p,
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


# ─── AI Classification with Normalization ────────────────────────

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
    Applies post-LLM normalization for consistency.
    Logs raw + normalized output to AILog.
    """
    from app.services.classification_normalizer import try_fast_path, normalize_result

    clean_data = preprocess_email(subject, body, sender)

    # ── Fast Path (skip LLM) ──
    fast_result = try_fast_path(clean_data["subject"], clean_data["sender"], clean_data["body"])
    if fast_result:
        logger.info(f"AI: Fast path hit for '{subject[:50]}' — skipping LLM")
        # Log fast path result
        if db:
            _save_log(
                db=db, user_id=user_id, email_id=email_id,
                model="fast_path", messages=[], temperature=0,
                response_content=json.dumps(fast_result), parsed_result=fast_result,
                finish_reason="fast_path", prompt_tokens=0, completion_tokens=0,
                total_tokens=0, cost=0, latency_ms=0,
                status="success", purpose="classify_email_fast_path",
            )
        return fast_result

    # ── LLM Classification ──
    user_message = _build_single_prompt(clean_data)

    messages = [
        {"role": "system", "content": SYSTEM_MESSAGE},
        {"role": "user", "content": user_message},
    ]

    model = settings.AI_MODEL

    try:
        response_data = _call_openrouter(
            messages=messages,
            model=model,
            temperature=0.2,
            top_p=0.9,
            response_format={"type": "json_object"},
        )

        # Extract response
        choice = response_data["choices"][0]
        content = choice["message"]["content"]
        finish_reason = choice.get("finish_reason", "unknown")
        usage = response_data.get("usage", {})
        latency_ms = response_data.get("_latency_ms", 0)

        # Parse raw AI response
        raw_parsed = json.loads(content)

        # Normalize
        normalized = normalize_result(raw_parsed)

        logger.info(f"AI: Classified '{subject[:40]}' → {normalized.get('category')}/{normalized.get('subcategory')} "
                     f"(model={response_data.get('model', model)}, tokens={usage.get('total_tokens', 0)}, latency={latency_ms}ms)")

        # Log to database (store both raw + normalized)
        if db:
            _save_log(
                db=db, user_id=user_id, email_id=email_id,
                model=response_data.get("model", model), messages=messages,
                temperature=0.2, response_content=content,
                parsed_result={"raw": raw_parsed, "normalized": normalized},
                finish_reason=finish_reason,
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                cost=usage.get("cost", 0), latency_ms=latency_ms,
                status="success", purpose="classify_email",
            )

        return normalized

    except Exception as e:
        logger.error(f"AI Classification failed: {e}")

        # Log error
        if db:
            _save_log(
                db=db, user_id=user_id, email_id=email_id,
                model=model, messages=messages, temperature=0.2,
                response_content=None, parsed_result=None, finish_reason=None,
                prompt_tokens=0, completion_tokens=0, total_tokens=0,
                cost=0, latency_ms=0,
                status="error", purpose="classify_email", error=str(e),
            )

        return {
            "category": "Other",
            "subcategory": "Uncategorized",
            "intent": "error",
            "importance_score": 0.0,
            "needs_reply": False,
            "urgency": "low",
            "explanation": f"AI Processing Error: {str(e)}",
            "tasks": [],
        }


# ─── Batch AI Classification with Context ───────────────────────

# Module-level context for batch consistency
_batch_context: List[Dict[str, Any]] = []

def classify_emails_batch(
    emails: list[Dict[str, str]],
    db=None,
    user_id: Optional[uuid.UUID] = None,
) -> list[Dict[str, Any]]:
    """
    Classify multiple emails in a single API call.
    Uses previous batch context for consistency.
    Applies post-LLM normalization to every result.
    Falls back to individual classification on failure.
    """
    global _batch_context
    from app.services.classification_normalizer import try_fast_path, normalize_result

    if not emails:
        return []

    # If only 1 email, use the single classifier
    if len(emails) == 1:
        e = emails[0]
        return [classify_email(e.get("subject", ""), e.get("body", ""), e.get("sender", ""), db=db, user_id=user_id)]

    logger.info(f"AI: Batch classification (REST API) — {len(emails)} emails")

    # ── Separate fast-path from LLM-needed ──
    results: list[Optional[Dict[str, Any]]] = [None] * len(emails)
    llm_indices: list[int] = []
    llm_emails: list[Dict[str, str]] = []

    for i, e in enumerate(emails):
        clean = preprocess_email(e.get("subject", ""), e.get("body", ""), e.get("sender", ""))
        fast = try_fast_path(clean["subject"], clean["sender"], clean["body"])
        if fast:
            results[i] = fast
            _batch_context.append(fast)  # Add to context
        else:
            llm_indices.append(i)
            llm_emails.append(clean)

    fast_count = len(emails) - len(llm_indices)
    if fast_count:
        logger.info(f"AI: Fast path resolved {fast_count}/{len(emails)} emails")

    if not llm_emails:
        # All resolved by fast path
        return [r for r in results if r is not None]

    # ── Build batch prompt with context ──
    user_message = _build_batch_prompt(
        llm_emails,
        previous_classifications=_batch_context[-5:] if _batch_context else None,
    )

    messages = [
        {"role": "system", "content": SYSTEM_MESSAGE},
        {"role": "user", "content": user_message},
    ]

    model = settings.AI_MODEL

    try:
        response_data = _call_openrouter(
            messages=messages,
            model=model,
            temperature=0.2,
            top_p=0.9,
            response_format={"type": "json_object"},
        )

        choice = response_data["choices"][0]
        content = choice["message"]["content"]
        finish_reason = choice.get("finish_reason", "unknown")
        usage = response_data.get("usage", {})
        latency_ms = response_data.get("_latency_ms", 0)

        # Parse — handle both raw array and wrapped object
        parsed = json.loads(content)

        if isinstance(parsed, dict):
            for key in ("classifications", "results", "emails", "data"):
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break
            else:
                if "category" in parsed:
                    parsed = [parsed]

        if not isinstance(parsed, list) or len(parsed) != len(llm_emails):
            logger.warning(f"AI: Batch parse mismatch — expected {len(llm_emails)}, got {len(parsed) if isinstance(parsed, list) else 'non-list'}. Falling back.")
            raise ValueError("Batch response count mismatch")

        # Normalize each result
        raw_results = list(parsed)
        normalized_results = [normalize_result(r if isinstance(r, dict) else {}) for r in parsed]

        logger.info(f"AI: Batch classified (model={response_data.get('model', model)}, "
                     f"tokens={usage.get('total_tokens', 0)}, latency={latency_ms}ms): "
                     f"{len(normalized_results)} LLM + {fast_count} fast-path")

        # Log to database
        if db:
            _save_log(
                db=db, user_id=user_id, email_id=None,
                model=response_data.get("model", model), messages=messages,
                temperature=0.2, response_content=content,
                parsed_result={"batch_size": len(parsed), "raw": raw_results, "normalized": normalized_results},
                finish_reason=finish_reason,
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                cost=usage.get("cost", 0), latency_ms=latency_ms,
                status="success", purpose="classify_email_batch",
            )

        # Map normalized results back to original indices
        for j, norm in enumerate(normalized_results):
            original_idx = llm_indices[j]
            results[original_idx] = norm
            _batch_context.append(norm)  # Add to running context

        # Keep context bounded
        if len(_batch_context) > 20:
            _batch_context = _batch_context[-20:]

        # Fill any remaining None with defaults
        defaults = {
            "category": "Other", "subcategory": "Uncategorized",
            "intent": "unknown", "importance_score": 0.0,
            "needs_reply": False, "urgency": "low", "explanation": "", "tasks": [],
        }
        final = [r if r is not None else defaults for r in results]
        return final

    except Exception as e:
        logger.error(f"AI: Batch classification failed: {e}. Falling back to individual classification.")

        # Log error
        if db:
            _save_log(
                db=db, user_id=user_id, email_id=None,
                model=model, messages=messages, temperature=0.2,
                response_content=None, parsed_result=None, finish_reason=None,
                prompt_tokens=0, completion_tokens=0, total_tokens=0,
                cost=0, latency_ms=0,
                status="error", purpose="classify_email_batch", error=str(e),
            )

        # Fallback: classify individually (already includes normalization)
        for j, idx in enumerate(llm_indices):
            e_data = emails[idx]
            result = classify_email(
                e_data.get("subject", ""), e_data.get("body", ""), e_data.get("sender", ""),
                db=db, user_id=user_id,
            )
            results[idx] = result

        defaults = {
            "category": "Other", "subcategory": "Uncategorized",
            "intent": "unknown", "importance_score": 0.0,
            "needs_reply": False, "urgency": "low", "explanation": "", "tasks": [],
        }
        return [r if r is not None else defaults for r in results]


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
        for h in section.get('highlights', [])[:3]:
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
        response_data = _call_openrouter(
            messages=messages,
            model=model,
            temperature=0.7,
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
