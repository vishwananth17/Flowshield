import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kafka_worker")

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "transactions"

async def consume():
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="flowshield-consumers",
        value_deserializer=lambda v: json.loads(v.decode('utf-8')),
        fetch_max_wait_ms=10,
        fetch_min_bytes=1,
        max_poll_interval_ms=300000,
        session_timeout_ms=30000,
        heartbeat_interval_ms=3000,
        auto_offset_reset="latest"
    )
    
    await consumer.start()
    logger.info(f"Worker started. Listening for transactions on {TOPIC}...")
    
    try:
        async for msg in consumer:
            tx_data = msg.value
            logger.info(f"Processing background task for transaction: {tx_data.get('id')}")
            
            # Here you could implement:
            # 1. Sending webhooks to clients
            # 2. Enriching data further
            # 3. Moving data to long-term cold storage
            
            await asyncio.sleep(0.1) # Simulate work
            
    finally:
        await consumer.stop()

if __name__ == "__main__":
    asyncio.run(consume())
