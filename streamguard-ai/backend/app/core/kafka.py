import json
import logging
import asyncio
from aiokafka import AIOKafkaProducer
from app.core.config import get_settings

logger = logging.getLogger("streamguard.kafka")

class KafkaStreamer:
    def __init__(self):
        self.producer = None
        self.topic = "transactions.raw"

    async def connect(self):
        settings = get_settings()
        servers = settings.kafka_bootstrap_servers
        if not servers:
            logger.warning("Kafka bootstrap servers not set in env, Kafka streamer disabled.")
            return

        # Attempt to create Kafka producer with timeout
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                linger_ms=0,
                acks=1,
                compression_type=None
            )
            # Upstash Kafka can sometimes hang on start() if unreachable, 
            # so we enforce a strict 5 second timeout to ensure graceful degradation.
            await asyncio.wait_for(self.producer.start(), timeout=5.0)
            logger.info("AIOKafka producer connected successfully with zero-linger fast dispatch.")
        except asyncio.TimeoutError:
            logger.error("Kafka connection timed out. Degraded mode active.")
            self.producer = None
        except Exception as e:
            logger.error(f"Failed to connect to Kafka tracking stream: {e}")
            self.producer = None

    async def close(self):
        if self.producer:
            await self.producer.stop()
            self.producer = None

    async def emit_transaction(self, tx_data: dict):
        if not self.producer:
            return
        try:
            await self.producer.send(self.topic, tx_data)
        except Exception as e:
            logger.error(f"Kafka message emit failed: {e}")

kafka_streamer = KafkaStreamer()
