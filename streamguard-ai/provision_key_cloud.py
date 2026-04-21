import asyncio
import os
import sys
import uuid
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.core.security import generate_api_key
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

async def provision_key():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Generate the key
    raw_key, prefix_display, key_hash = generate_api_key("live")
    print(f"Generated Raw Key: {raw_key}")
    print(f"Prefix: {prefix_display}")

    async with async_session() as session:
        print(f"Provisioning key for Org {ORG_ID}...")
        key_id = uuid.uuid4()
        query = text("""
            INSERT INTO api_keys (id, org_id, name, key_hash, key_prefix, environment, is_active, created_at)
            VALUES (:id, :org_id, :name, :key_hash, :key_prefix, :env, true, now())
        """)
        await session.execute(query, {
            "id": key_id,
            "org_id": ORG_ID,
            "name": "Kaggle Ingestion Key",
            "key_hash": key_hash,
            "key_prefix": prefix_display[:20],
            "env": "live"
        })
        await session.commit()
        print("Key successfully instantiated in cloud ledger.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(provision_key())
