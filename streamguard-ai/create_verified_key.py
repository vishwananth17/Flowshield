import asyncio
import secrets
import hashlib
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

def generate_api_key():
    prefix = f"sg_live_{secrets.token_urlsafe(8)}"
    secret = secrets.token_urlsafe(32)
    api_key = f"{prefix}.{secret}"
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    return api_key, prefix, key_hash

async def create_key():
    api_key, prefix, key_hash = generate_api_key()
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        await session.execute(text("""
            INSERT INTO api_keys (id, org_id, name, key_hash, key_prefix, environment, is_active, created_at)
            VALUES (:id, :oid, :name, :hash, :prefix, 'live', true, now())
        """), {
            "id": uuid.uuid4(),
            "oid": ORG_ID,
            "name": "Production Verification Key",
            "hash": key_hash,
            "prefix": prefix
        })
        await session.commit()
        print(f"SUCCESS: Key Created and Authorized.")
        print(f"NEW_API_KEY: {api_key}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_key())
