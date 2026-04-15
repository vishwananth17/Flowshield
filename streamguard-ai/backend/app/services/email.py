import resend
import logging
from app.core.config import get_settings

logger = logging.getLogger("streamguard")

class EmailService:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.resend_api_key
        if self.api_key:
            resend.api_key = self.api_key
        
    async def send_welcome_email(self, to_email: str):
        """Sends a beautiful welcome email to new waitlist signups"""
        if not self.api_key:
            logger.info(f"📧 [MOCK MODE] would send welcome to {to_email}")
            return

        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="background-color: #2563eb; padding: 20px; border-radius: 8px; text-align: center;">
                <h1 style="color: white; margin: 0;">Flowshield AI</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="color: #1e293b;">You're on the list! 🚀</h2>
                <p style="color: #475569; line-height: 1.6;">
                    Thanks for joining the Flowshield AI early access list. We're building the future of 
                    autonomous payment security, and we're excited to have you with us.
                </p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e293b; font-weight: 600;">What happens next?</p>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">
                        We are onboarding users in small batches to ensure the highest quality experience. 
                        Keep an eye on your inbox for your unique access link.
                    </p>
                </div>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                © 2026 Flowshield AI | Secure your flow.
            </div>
        </div>
        """

        try:
            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": [to_email],
                "subject": "You're in! Welcome to Flowshield AI",
                "html": html_content
            })
            logger.info(f"✅ Welcome email sent to {to_email}")
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")

email_service = EmailService()
