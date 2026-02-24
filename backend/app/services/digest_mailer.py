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
            # Generate Gmail deep-link: https://mail.google.com/mail/u/0/#all/{thread_id}
            thread_id = h.get('thread_id')
            subject = h.get('subject', 'No subject')
            
            if thread_id:
                link = f"https://mail.google.com/mail/u/0/#all/{thread_id}"
                subject_html = f"<a href='{link}' style='color:#2563eb;text-decoration:none;'>{subject}</a>"
            else:
                subject_html = f"<strong>{subject}</strong>"

            needs_reply_badge = "<span style='margin-left:6px;padding:2px 6px;background:#fee2e2;color:#991b1b;border-radius:4px;font-size:10px;font-weight:bold;'>Needs Reply</span>" if h.get('needs_reply') else ""
            
            highlights_html += f"""
            <li style="margin-bottom:8px;">
                <div style="font-size:14px;font-weight:500;">
                    {subject_html} {needs_reply_badge}
                </div>
                <div style="color:#6b7280;font-size:12px;margin-top:2px;">
                    From: {h.get('sender', '')}
                </div>
            </li>
            """

        sections_html += f"""
        <div style="margin-bottom:20px;background:#ffffff;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
            <div style="font-weight:600;margin-bottom:12px;font-size:16px;color:#111827;border-bottom:1px solid #f3f4f6;padding-bottom:8px;">
                {section.get('category', 'Other')} <span style="color:#9ca3af;font-size:13px;font-weight:normal;">({section.get('count', 0)})</span>
            </div>
            <ul style="margin:0;padding:0;list-style-type:none;">
                {highlights_html}
            </ul>
        </div>
        """

    stats = digest.stats or {}
    total = stats.get("total_emails", 0)
    important = stats.get("important", 0)
    needs_reply = stats.get("needs_reply", 0)

    body = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Your MailOS {digest.digest_type.capitalize()} Digest</h2>
      
      <div style="margin-bottom:24px;border-left:4px solid #3b82f6;padding-left:16px;">
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.5;">
            {summary}
          </p>
      </div>

      <div style="margin:0 0 24px;display:flex;gap:12px;">
        <div style="background:#ffffff;padding:12px;border-radius:8px;flex:1;border:1px solid #e5e7eb;text-align:center;">
            <div style="font-size:20px;font-weight:bold;color:#111827;">{total}</div>
            <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Emails</div>
        </div>
        <div style="background:#ffffff;padding:12px;border-radius:8px;flex:1;border:1px solid #e5e7eb;text-align:center;">
            <div style="font-size:20px;font-weight:bold;color:#111827;">{important}</div>
            <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Important</div>
        </div>
        <div style="background:#ffffff;padding:12px;border-radius:8px;flex:1;border:1px solid #e5e7eb;text-align:center;">
            <div style="font-size:20px;font-weight:bold;color:#ef4444;">{needs_reply}</div>
            <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Need Reply</div>
        </div>
      </div>

      {sections_html}

      <div style="margin-top:32px;text-align:center;border-top:1px solid #e5e7eb;padding-top:24px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            You’re receiving this because MailOS digest emails are enabled in your settings.
          </p>
      </div>
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

