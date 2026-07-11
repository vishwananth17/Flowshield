import os
import sys
import asyncio
import logging
from datetime import datetime, UTC
import resend
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Add parent path to sys.path if running as script
if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import get_settings
from app.models.dispute import Dispute, DisputeEvidence, DisputeReminder, DisputeTimeline
from app.services.evidence_gatherer import EvidenceGatherer

logger = logging.getLogger(__name__)


class DisputeReminderWorker:
    """
    Worker to process scheduled dispute reminders.
    Sends alerts to merchants via Resend and logs reminder timeline events.
    """

    @classmethod
    async def process_pending_reminders(cls, db: AsyncSession) -> int:
        """
        Queries all unsent reminders whose trigger time has passed on active disputes.
        Returns the number of reminders successfully processed.
        """
        logger.info("Starting processing loop for pending dispute reminders...")
        now = datetime.now(UTC)

        # Select all active disputes with unsent reminders that are due
        stmt = (
            select(DisputeReminder)
            .options(
                selectinload(DisputeReminder.dispute).selectinload(Dispute.evidence)
            )
            .join(Dispute)
            .where(
                Dispute.status.in_(["open", "evidence_gathering"]),
                DisputeReminder.sent == False,
                DisputeReminder.remind_at <= now
            )
        )

        res = await db.execute(stmt)
        reminders = res.scalars().all()
        
        if not reminders:
            logger.info("No pending dispute reminders to send.")
            return 0

        logger.info(f"Found {len(reminders)} reminders to process.")
        settings = get_settings()
        resend_key = settings.resend_api_key
        
        if resend_key:
            resend.api_key = resend_key

        sent_count = 0
        for r in reminders:
            try:
                dispute = r.dispute
                strength = EvidenceGatherer.calculate_evidence_strength(dispute, dispute.evidence)
                
                # Send Email
                email_sent = await cls._send_email(
                    recipient=dispute.customer_email or "operator@flowshieldai.com",  # Send to merchant email (in demo, fallback to operator)
                    dispute=dispute,
                    reminder=r,
                    strength_score=strength,
                    resend_key=resend_key
                )
                
                if email_sent:
                    # Update reminder record
                    r.sent = True
                    r.sent_at = datetime.now(UTC)
                    
                    # Log Timeline
                    timeline = DisputeTimeline(
                        dispute_id=dispute.id,
                        event_type="reminder_sent",
                        event_description=f"Deadline reminder email ({r.days_before_deadline}-day alert) dispatched to merchant.",
                        triggered_by="system"
                    )
                    db.add(timeline)
                    sent_count += 1
            except Exception as e:
                logger.error(f"Failed to process reminder {r.id}: {e}", exc_info=True)
                
        await db.commit()
        logger.info(f"Reminder loop complete. Dispatched {sent_count} alerts.")
        return sent_count

    @classmethod
    async def _send_email(cls, recipient: str, dispute: Dispute, reminder: DisputeReminder, strength_score: int, resend_key: str | None) -> bool:
        """Constructs urgency template and dispatches via Resend API."""
        subject = f"⚠️ ACTION REQUIRED: Dispute {dispute.dispute_reference} is due soon"
        bg_color = "#f1f5f9"
        border_color = "#cbd5e1"
        btn_html = ""
        action_html = ""

        # Urgency template adjustments
        if reminder.days_before_deadline == 7:
            subject = f"⏳ Dispute Response Needed: {dispute.dispute_reference} due in 7 days"
            bg_color = "#eff6ff"
            border_color = "#3b82f6"
            action_html = (
                f"<p style='color:#1e40af;'>You have 7 days left to submit evidence for this dispute. "
                f"Your current evidence strength score is <b>{strength_score}/100</b>.</p>"
                f"<p><b>Required Evidence Checklist:</b><br/>"
                f"- Order Confirmation Invoice<br/>"
                f"- Tracking details / Shipping Receipt<br/>"
                f"- Customer conversation screenshot (WhatsApp/Email)</p>"
            )
        elif reminder.days_before_deadline == 3:
            subject = f"⚠️ ACTION REQUIRED: Dispute {dispute.dispute_reference} due in 3 days"
            bg_color = "#fffbeb"
            border_color = "#f59e0b"
            action_html = (
                f"<p style='color:#92400e; font-weight:600;'>Urgent: Only 3 days remaining before deadline.</p>"
                f"<p>Your evidence strength score is <b>{strength_score}/100</b>.</p>"
                f"<p>Please review automatically compiled evidence, upload any missing customer chat logs, and click the link below to generate your response document.</p>"
            )
            btn_html = (
                f"<a href='https://flowshieldai.com/dashboard/disputes/{dispute.id}' style='display:inline-block; background-color:#f59e0b; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;'>Compile Dispute Response</a>"
            )
        elif reminder.days_before_deadline == 1:
            subject = f"🚨 URGENT: Dispute {dispute.dispute_reference} deadline is TOMORROW"
            bg_color = "#fef2f2"
            border_color = "#ef4444"
            action_html = (
                f"<p style='color:#b91c1c; font-weight:bold; font-size:16px;'>CRITICAL: Deadline is tomorrow.</p>"
                f"<p>Missing this deadline will result in an automatic chargeback loss of <b>INR {dispute.dispute_amount:,.2f}</b>.</p>"
                f"<p>Generate your PDF defense package and submit it immediately.</p>"
            )
            btn_html = (
                f"<a href='https://flowshieldai.com/dashboard/disputes/{dispute.id}' style='display:inline-block; background-color:#ef4444; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;'>Generate & Download PDF Now</a>"
            )
        elif reminder.days_before_deadline == 0:
            subject = f"🔴 FINAL WARNING: Dispute {dispute.dispute_reference} deadline is TODAY"
            bg_color = "#fef2f2"
            border_color = "#b91c1c"
            action_html = (
                f"<p style='color:#991b1b; font-weight:bold; font-size:18px;'>FINAL NOTICE: Response due TODAY.</p>"
                f"<p>This is your last opportunity to contest this dispute. Blocked amount: <b>INR {dispute.dispute_amount:,.2f}</b>.</p>"
                f"<p>If you need assistance gathering tracking receipts or composing your defense, contact us immediately at support@flowshieldai.com.</p>"
            )
            btn_html = (
                f"<a href='https://flowshieldai.com/dashboard/disputes/{dispute.id}' style='display:inline-block; background-color:#b91c1c; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;'>Contest Dispute Instantly</a>"
            )

        html_content = f"""
        <div style="font-family:sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #e2e8f0; border-radius:12px;">
            <div style="background-color:{bg_color}; padding:20px; border-radius:8px; border-left:6px solid {border_color};">
                <h2 style="margin:0; color:#0f172a;">Dispute Deadline Reminder</h2>
                <p style="margin:5px 0 0 0; color:#475569;">Reference: {dispute.dispute_reference}</p>
            </div>
            <div style="padding:20px 0;">
                <p>Hello,</p>
                <p>We are tracking a chargeback dispute from <b>{dispute.payment_gateway.upper()}</b> for <b>{dispute.currency} {dispute.dispute_amount:,.2f}</b>.</p>
                
                {action_html}
                
                <div style="margin:25px 0; text-align:center;">
                    {btn_html}
                </div>
            </div>
            <div style="border-top:1px solid #e2e8f0; padding-top:15px; color:#94a3b8; font-size:12px;">
                <p>This is an automated alert from Flowshield AI. You are receiving this because dispute reminders are enabled for your merchant account.</p>
            </div>
        </div>
        """

        if not resend_key:
            logger.warning(f"Resend API key missing. Reminder email content (not sent):\n{html_content}")
            return True  # Return True in dev mock environments to simulate successful alert dispatch

        try:
            resend.Emails.send({
                "from": "alerts@resend.dev",
                "to": [recipient],
                "subject": subject,
                "html": html_content
            })
            logger.info(f"Reminder email sent to {recipient}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via Resend: {e}")
            return False


async def run_cron():
    """CLI execution entry point."""
    from app.db.session import SessionLocal
    async with SessionLocal() as db:
        await DisputeReminderWorker.process_pending_reminders(db)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_cron())
