import logging
from threading import Thread
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

from app.core.config import settings
from app.models.user import User
from app.models.digest import Digest

logger = logging.getLogger(__name__)


def _build_digest_email_html(user: User, digest: Digest) -> str:
    """Build a short, scannable HTML email for a digest."""
    summary = digest.summary or "Here's a quick summary of your inbox."

    sections_html = ""
    for section in digest.sections[:5]:
        highlights_html = ""
        for h in section.get("highlights", [])[:3]:
            highlights_html += f"""
            <li>
                <strong>{h.get('subject', 'No subject')}</strong>
                <span style="color:#6b7280;"> — {h.get('sender', '')}</span>
            </li>
            """

        sections_html += f"""
        <div style="margin-bottom:16px;">
            <div style="font-weight:600;margin-bottom:4px;">
                {section.get('category', 'Other')} &middot; {section.get('count', 0)} emails
            </div>
            <ul style="margin:0 0 4px 16px;padding:0;font-size:13px;color:#374151;">
                {highlights_html}
            </ul>
        </div>
        """

    stats = digest.stats or {}
    total = stats.get("total_emails", 0)
    important = stats.get("important", 0)
    needs_reply = stats.get("needs_reply", 0)

    body = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 8px;font-size:20px;">Your MailOS {digest.digest_type.capitalize()} Digest</h2>
      <p style="margin:0 0 12px;color:#6b7280;font-size:14px;">
        {summary}
      </p>

      <div style="margin:16px 0;padding:12px 14px;border-radius:10px;background:#f3f4f6;font-size:13px;color:#374151;">
        <strong>{total}</strong> emails • <strong>{important}</strong> important • <strong>{needs_reply}</strong> need your reply
      </div>

      {sections_html}

      <p style="margin-top:16px;color:#9ca3af;font-size:11px;">
        You’re receiving this because MailOS digest emails are enabled in your settings.
      </p>
    </div>
    """
    return body


def _send_digest_email_async(to_email: str, subject: str, html_body: str):
    try:
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("Digest mailer: SMTP credentials not configured. Skipping send.")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"MailOS Digest <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info("Digest email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send digest email to %s: %s", to_email, e)


def send_digest_email(user: User, digest: Digest):
    """Send a digest email to the user in a background thread."""
    if not user.email:
        logger.warning("Digest mailer: user %s has no email address; skipping.", user.id)
        return

    subject = f"Your MailOS {digest.digest_type.capitalize()} Digest"
    html_body = _build_digest_email_html(user, digest)

    thread = Thread(
        target=_send_digest_email_async,
        args=(user.email, subject, html_body),
        daemon=True,
    )
    thread.start()

