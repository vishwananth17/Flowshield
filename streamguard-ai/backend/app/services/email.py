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

    async def send_fraud_alert_email(
        self,
        to_email: str,
        tx_id: str,
        external_id: str,
        amount: str,
        currency: str,
        merchant_name: str,
        risk_score: float,
        risk_label: str,
        reasons: list[str]
    ):
        """Sends an instant high-risk fraud alert email to the merchant organization"""
        score_pct = int(risk_score * 100) if risk_score <= 1.0 else int(risk_score)
        
        if not self.api_key:
            logger.info(f"🚨 [MOCK EMAIL ALERT] To: {to_email} | Order: {external_id} | Score: {score_pct}/100 | Reasons: {reasons}")
            return

        reasons_list_html = "".join([f'<li style="margin-bottom: 6px; color: #ef4444;">{r}</li>' for r in (reasons or ["High anomaly pattern detected"])])
        dashboard_url = "https://flowshield-git-main-vishwananth17s-projects.vercel.app/dashboard/transactions"

        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #0b0f17; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <h2 style="color: #ef4444; margin: 0; font-size: 18px;">🚨 High Risk Fraud Alert</h2>
                <span style="background-color: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; border: 1px solid rgba(239, 68, 68, 0.3);">
                    SCORE: {score_pct}/100
                </span>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
                FlowShield Autonomous Intelligence detected a high-risk transaction for <strong>{merchant_name}</strong>.
            </p>

            <div style="background-color: #101623; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 20px;">
                <table style="width: 100%; font-size: 13px; color: #f8fafc;">
                    <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Order Reference:</td>
                        <td style="font-weight: bold; text-align: right; padding-bottom: 8px;">{external_id or tx_id[:12]}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Amount:</td>
                        <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #3b82f6;">{currency} {amount}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Risk Classification:</td>
                        <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #ef4444;">{risk_label.upper()}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 24px;">
                <h4 style="color: #f8fafc; font-size: 13px; margin-bottom: 8px; font-weight: 600;">Flagged Risk Indicators:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                    {reasons_list_html}
                </ul>
            </div>

            <div style="text-align: center; margin-top: 28px; margin-bottom: 16px;">
                <a href="{dashboard_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                    Review Order in FlowShield Console
                </a>
            </div>

            <div style="border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; color: #64748b; font-size: 11px;">
                © 2026 FlowShield AI • Automated Security Telemetry
            </div>
        </div>
        """

        try:
            resend.Emails.send({
                "from": "alerts@resend.dev",
                "to": [to_email],
                "subject": f"🚨 [High Risk Alert] Order {external_id or tx_id[:8]} Flagged ({score_pct}/100)",
                "html": html_content
            })
            logger.info(f"✅ Fraud alert email dispatched to {to_email} for order {external_id}")
        except Exception as e:
            logger.error(f"❌ Failed to send fraud alert email to {to_email}: {str(e)}")

email_service = EmailService()
