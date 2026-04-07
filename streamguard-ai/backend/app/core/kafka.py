import json
import logging
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

        # Attempt to create Kafka producer
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            await self.producer.start()
            logger.info("AIOKafka producer connected.")
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
            await self.producer.send_and_wait(self.topic, tx_data)
        except Exception as e:
            logger.error(f"Kafka message emit failed: {e}")

kafka_streamer = KafkaStreamer()
