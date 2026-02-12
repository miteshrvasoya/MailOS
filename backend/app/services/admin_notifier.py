"""
Admin Email Notifier
Sends email notifications to the admin for important events like new user signups.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from threading import Thread
from app.core.config import settings

IST = timezone(timedelta(hours=5, minutes=30))

logger = logging.getLogger(__name__)


def _send_email_async(subject: str, html_body: str, to_email: str):
    """Send email in a background thread so it doesn't block the API response."""
    print(f"[NOTIFIER] _send_email_async called | subject='{subject}' | to='{to_email}'")
    try:
        print(f"[NOTIFIER] SMTP_USER = '{settings.SMTP_USER}'")
        print(f"[NOTIFIER] SMTP_PASSWORD = '{'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 'None'}'")
        print(f"[NOTIFIER] SMTP_HOST = '{settings.SMTP_HOST}' | SMTP_PORT = {settings.SMTP_PORT}")
        
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print("[NOTIFIER] ERROR: SMTP credentials not configured. Skipping.")
            return

        print("[NOTIFIER] Building email message...")
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"MailOS Notifications <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        print("[NOTIFIER] Email message built successfully.")

        print(f"[NOTIFIER] Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            print("[NOTIFIER] Connected. Starting TLS...")
            server.starttls()
            print("[NOTIFIER] TLS started. Logging in...")
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            print("[NOTIFIER] Login successful. Sending email...")
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
            print(f"[NOTIFIER] ✅ Email sent successfully to {to_email}")

        logger.info(f"Admin notification sent to {to_email}: {subject}")

    except smtplib.SMTPAuthenticationError as e:
        print(f"[NOTIFIER] ❌ SMTP Authentication FAILED: {e}")
        print("[NOTIFIER] Hint: Make sure you're using a Gmail App Password, not your regular password.")
        print("[NOTIFIER] Hint: Go to https://myaccount.google.com/apppasswords to generate one.")
        logger.error(f"SMTP Authentication failed: {e}")
    except smtplib.SMTPException as e:
        print(f"[NOTIFIER] ❌ SMTP Error: {type(e).__name__}: {e}")
        logger.error(f"SMTP error: {e}")
    except Exception as e:
        print(f"[NOTIFIER] ❌ Unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        logger.error(f"Failed to send admin notification: {e}")


def send_admin_email(subject: str, html_body: str):
    """Send an email to the admin address in a non-blocking way."""
    to_email = settings.ADMIN_NOTIFY_EMAIL
    print(f"[NOTIFIER] send_admin_email called | to={to_email}")
    thread = Thread(target=_send_email_async, args=(subject, html_body, to_email), daemon=True)
    thread.start()
    print(f"[NOTIFIER] Background thread started.")


def notify_new_user_signup(user_email: str, user_name: str = None):
    """Send admin notification when a new user signs up."""
    print(f"[NOTIFIER] >>> notify_new_user_signup called | email={user_email} | name={user_name}")
    now = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S IST")
    display_name = user_name or "N/A"

    subject = f"🎉 New MailOS Signup: {user_email}"

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">🎉 New User Signed Up!</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                    <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">{user_email}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name</td>
                    <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">{display_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Signed Up At</td>
                    <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">{now}</td>
                </tr>
            </table>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
            MailOS Admin Notifications
        </p>
    </div>
    """

    print(f"[NOTIFIER] Calling send_admin_email...")
    send_admin_email(subject, html_body)
    print(f"[NOTIFIER] <<< notify_new_user_signup done (email queued)")

