"""
Gmail Pub/Sub Webhook Endpoint
Receives push notifications from Google Pub/Sub when new emails arrive.
Returns 200 immediately and processes asynchronously.
"""
import base64
import json
import logging
from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User
from app.core.config import settings
from app.services.push_processor import process_push_notification
from fastapi import Depends

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/gmail/pubsub")
async def gmail_pubsub_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
):
    """
    Webhook endpoint for Gmail Pub/Sub push notifications.

    Expected payload:
    {
        "message": {
            "data": "<base64_encoded_json>",
            "messageId": "...",
            "publishTime": "..."
        },
        "subscription": "..."
    }

    Decoded data:
    {
        "emailAddress": "user@example.com",
        "historyId": "12345"
    }
    """

    # ── 1. Verify the request ──
    # Check for verification token in query params or Authorization header
    if settings.PUBSUB_VERIFICATION_TOKEN:
        # Check query param first (simple token verification)
        token = request.query_params.get("token")
        if not token:
            # Check Authorization header for Bearer token
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]

        if token != settings.PUBSUB_VERIFICATION_TOKEN:
            logger.warning("[WEBHOOK] Unauthorized Pub/Sub request — invalid token")
            raise HTTPException(status_code=403, detail="Invalid verification token")

    # ── 2. Parse the Pub/Sub message ──
    try:
        body = await request.json()
    except Exception:
        logger.error("[WEBHOOK] Failed to parse request body as JSON")
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    message = body.get("message")
    if not message or "data" not in message:
        logger.warning("[WEBHOOK] Missing message.data in Pub/Sub payload")
        # Return 200 to prevent Pub/Sub retries on malformed messages
        return {"status": "ignored", "reason": "no data in message"}

    # ── 3. Decode the base64 payload ──
    try:
        decoded_data = base64.b64decode(message["data"])
        payload = json.loads(decoded_data)
    except Exception as e:
        logger.error(f"[WEBHOOK] Failed to decode Pub/Sub data: {e}")
        return {"status": "ignored", "reason": "decode failed"}

    email_address = payload.get("emailAddress")
    history_id = payload.get("historyId")

    if not email_address or not history_id:
        logger.warning(f"[WEBHOOK] Incomplete payload: {payload}")
        return {"status": "ignored", "reason": "missing emailAddress or historyId"}

    logger.info(f"[WEBHOOK] Push notification for {email_address}, historyId={history_id}")

    # ── 4. Look up the user ──
    user = db.exec(select(User).where(User.email == email_address)).first()
    if not user:
        logger.warning(f"[WEBHOOK] No user found for email {email_address}")
        return {"status": "ignored", "reason": "user not found"}

    # ── 5. Enqueue background processing and return 200 immediately ──
    background_tasks.add_task(process_push_notification, user.id, str(history_id))

    return {"status": "ok"}
