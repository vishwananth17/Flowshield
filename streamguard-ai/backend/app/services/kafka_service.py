import asyncio
import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from fastapi import WebSocket

from app.core.config import get_settings

logger = logging.getLogger("streamguard.kafka")

class KafkaService:
    def __init__(self):
        self.settings = get_settings()
        self.producer: AIOKafkaProducer | None = None
        self.consumer: AIOKafkaConsumer | None = None
        self.active_websockets: list[WebSocket] = []
        self._consumer_task: asyncio.Task | None = None

    async def connect_producer(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await self.producer.start()
        logger.info("Kafka Producer started")

    async def disconnect_producer(self):
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka Producer stopped")

    async def publish(self, topic: str, message: dict[str, Any]):
        if not self.producer:
            logger.warning("Producer not connected, ignoring message")
            return
        await self.producer.send_and_wait(topic, message)

    async def connect_consumer(self):
        self.consumer = AIOKafkaConsumer(
            "transactions_live",
            bootstrap_servers=self.settings.kafka_bootstrap_servers,
            group_id="streamguard_websocket_group",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest"
        )
        await self.consumer.start()
        logger.info("Kafka Consumer started")
        self._consumer_task = asyncio.create_task(self._consume())

    async def disconnect_consumer(self):
        if self._consumer_task:
            self._consumer_task.cancel()
        if self.consumer:
            await self.consumer.stop()
            logger.info("Kafka Consumer stopped")

    async def _consume(self):
        try:
            async for msg in self.consumer:
                await self.broadcast(msg.value)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error consuming kafka: {e}")

    async def add_websocket(self, websocket: WebSocket):
        self.active_websockets.append(websocket)

    def remove_websocket(self, websocket: WebSocket):
        if websocket in self.active_websockets:
            self.active_websockets.remove(websocket)

    async def broadcast(self, message: dict[str, Any]):
        dead_connections = []
        for ws in self.active_websockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.append(ws)
        
        for dead in dead_connections:
            self.remove_websocket(dead)

kafka_service = KafkaService()
