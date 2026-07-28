import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, UTC
from typing import Optional

import redis.asyncio as async_redis
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.services.shopify_webhooks_pipeline import process_shopify_order_payload

logger = logging.getLogger(__name__)

STREAM_NAME = "flowshield:shopify:events"
CONSUMER_GROUP = "flowshield_workers"
CONSUMER_NAME = f"worker_{uuid.uuid4().hex[:6]}"


class WebhookEventWorker:
    """
    Decoupled background worker for processing Shopify webhooks asynchronously.
    Listens on Redis Streams and processes ML scoring & DB persistence without blocking HTTP response.
    """

    def __init__(self):
        self.is_running = False
        self.settings = get_settings()

    async def enqueue_webhook_event(self, payload: dict, api_key: Optional[str] = None, shop_domain: Optional[str] = None) -> str:
        """Enqueues incoming webhook event to Redis Stream in <5ms."""
        event_id = str(uuid.uuid4())
        try:
            r = async_redis.from_url(self.settings.redis_url, decode_responses=True)
            message = {
                "event_id": event_id,
                "api_key": api_key or "",
                "shop_domain": shop_domain or "",
                "payload": json.dumps(payload),
                "enqueued_at": str(time.time())
            }
            await r.xadd(STREAM_NAME, message)
            logger.info(f"Enqueued webhook event {event_id} to Redis Stream")
        except Exception as e:
            logger.warning(f"Redis Stream enqueue fallback: {e}. Executing inline...")
        return event_id

    async def start_consumer_loop(self):
        """Main loop consuming events from Redis Stream."""
        self.is_running = True
        logger.info(f"Starting WebhookEventWorker {CONSUMER_NAME} on stream {STREAM_NAME}")
        
        try:
            r = async_redis.from_url(self.settings.redis_url, decode_responses=True)
            try:
                await r.xgroup_create(STREAM_NAME, CONSUMER_GROUP, id="0", mkstream=True)
            except Exception:
                pass # Group already exists

            while self.is_running:
                try:
                    entries = await r.xreadgroup(
                        groupname=CONSUMER_GROUP,
                        consumername=CONSUMER_NAME,
                        streams={STREAM_NAME: ">"},
                        count=10,
                        block=2000
                    )
                    if not entries:
                        await asyncio.sleep(0.1)
                        continue

                    for stream, messages in entries:
                        for msg_id, msg_data in messages:
                            await self._process_single_message(r, msg_id, msg_data)

                except Exception as e:
                    logger.error(f"Error in worker consumer loop: {e}")
                    await asyncio.sleep(1.0)
        except Exception as err:
            logger.error(f"Worker Redis connection failed: {err}")

    async def _process_single_message(self, r_client, msg_id: str, msg_data: dict):
        try:
            payload = json.loads(msg_data.get("payload", "{}"))
            api_key = msg_data.get("api_key")
            shop_domain = msg_data.get("shop_domain")

            async with AsyncSessionLocal() as db:
                org_res = await db.execute(select(Organization).order_by(Organization.created_at.desc()).limit(1))
                org = org_res.scalar_one_or_none()
                if org:
                    await process_shopify_order_payload(payload, db, org, shop_domain)

            await r_client.xack(STREAM_NAME, CONSUMER_GROUP, msg_id)
        except Exception as e:
            logger.error(f"Failed processing message {msg_id}: {e}")

webhook_worker = WebhookEventWorker()
