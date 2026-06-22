import json
import logging
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from models import AuditLog
from app.services.api_key_service import send_security_email

logger = logging.getLogger(__name__)

def get_client_ip(request) -> str:
    if not request:
        return "unknown"
    return request.client.host if request.client else "unknown"

class AuditLogger:
    async def log(
        self,
        db: Session,
        action: str,
        result: str,
        actor=None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        severity: str = "info",
        request=None
    ) -> AuditLog:
        """Create an audit log record in the database.
        If severity is 'critical', triggers a security alert email.
        """
        entry = AuditLog(
            action=action,
            result=result,
            actor_id=getattr(actor, "id", None),
            actor_type="user" if actor else "system",
            actor_email=getattr(actor, "email", None),
            org_id=getattr(actor, "org_id", None),
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=get_client_ip(request) if request else None,
            user_agent=request.headers.get("user-agent") if request else None,
            request_id=getattr(request.state, "request_id", None) if request and hasattr(request.state, "request_id") else None,
            metadata=metadata or {},
            severity=severity,
            timestamp=datetime.utcnow()
        )

        db.add(entry)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to write audit log: {e}")

        # Trigger critical security alerts
        if severity == "critical":
            await self.send_security_alert(entry)

        return entry

    async def send_security_alert(self, entry: AuditLog):
        subject = f"[SECURITY ALERT] {entry.severity.upper()} — {entry.action}"
        body = f"""
Time: {entry.timestamp} IST
Severity: {entry.severity.upper()}
Event: {entry.action}
Actor IP: {entry.ip_address}
User Agent: {entry.user_agent}
Affected: {entry.org_id or 'System'}
Result: {entry.result}
Metadata: {json.dumps(entry.metadata)}
Action Taken: Automated threat response flagged
Recommended: Check security dashboard
"""
        send_security_email(
            subject=subject,
            body=body,
            recipient="legal@flowshieldai.com"
        )

audit_logger = AuditLogger()
