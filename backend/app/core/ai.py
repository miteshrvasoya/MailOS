import re
import json
from typing import Optional, Dict, Any
from openai import OpenAI
from app.core.config import settings

# Initialize client
api_key = settings.OPENROUTER_API_KEY
base_url = settings.OPENROUTER_BASE_URL

client = None
if api_key:
    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
    )

def preprocess_email(subject: str, body: str, sender: str) -> Dict[str, str]:
    """
    Clean and truncate email content for AI processing.
    """
    if not body:
        body = ""
        
    # 1. Strip HTML (simple regex approach for now)
    clean_body = re.sub(r'<[^>]+>', '', body)
    
    # 2. Remove multiple newlines/spaces
    clean_body = re.sub(r'\s+', ' ', clean_body).strip()
    
    # 3. Truncate to ~1500 chars (approx 300-400 tokens)
    if len(clean_body) > 1500:
        clean_body = clean_body[:1500] + "...(truncated)"
        
    # 4. Mask sensitive patterns
    # Mask Credit Card numbers (simple check - groups of 13-16 digits)
    clean_body = re.sub(r'\b(?:\d[ -]*?){13,16}\b', '[CARD_MASKED]', clean_body)
    
    return {
        "subject": subject or "",
        "sender": sender or "",
        "body": clean_body
    }

def classify_email(subject: str, body: str, sender: str) -> Dict[str, Any]:
    print("Email Classification---")
    """
    Classify email intent and importance using OpenRouter via OpenAI SDK.
    """
    # Initialize client locally if global init failed or context changed
    local_client = client
    if not local_client:
        api_key = settings.OPENROUTER_API_KEY
        base_url = settings.OPENROUTER_BASE_URL
        
        if api_key:
            local_client = OpenAI(
                base_url=base_url,
                api_key=api_key,
            )
        
    if not local_client:
        return {
            "category": "Uncategorized",
            "intent": "unknown",
            "importance_score": 50.0,
            "needs_reply": False,
            "urgency": "low",
            "explanation": "OpenRouter API key missing."
        }

    clean_data = preprocess_email(subject, body, sender)
    
    prompt = f"""
    Analyze this email and return JSON:
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
    }}
    """
    
    try:
        completion = local_client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://mailos.ai", 
                "X-Title": "MailOS Backend",
            },
            extra_body={},
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": "You are an email assistant. Respond only in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )

        print("Completion: ", completion)
        
        content = completion.choices[0].message.content
        return json.loads(content)
        
    except Exception as e:
        print(f"AI Classification failed: {e}")
        return {
            "category": "Uncategorized",
            "intent": "error",
            "importance_score": 0.0,
            "needs_reply": False,
            "urgency": "low",
            "explanation": f"AI Processing Error: {str(e)}"
        }
