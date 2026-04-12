import uuid
import logging
from typing import Any
from app.core.websockets import ws_manager
from app.models.alert import Alert

logger = logging.getLogger("streamguard")

async def broadcast_alert(org_id: uuid.UUID, alert: Alert):
    """
    Broadcasts a new alert to all connected dashboard clients for an organization.
    This ensures real-time badge updates and toast notifications.
    """
    try:
        # Flatten alert for transport
        # We use a dict to avoid circular dependencies with schemas
        payload = {
            "type": "new_alert",
            "alert": {
                "id": str(alert.id),
                "severity": alert.severity,
                "title": alert.title,
                "description": alert.description,
                "status": alert.status,
                "created_at": alert.created_at.isoformat() if alert.created_at else None,
            }
        }
        await ws_manager.broadcast(str(org_id), payload)
    except Exception as e:
        logger.error(f"Failed to broadcast websocket alert: {e}")
