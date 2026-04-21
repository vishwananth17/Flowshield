import asyncio
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
API_KEY = "sg_live_GgN9Y3I5"

async def verify():
    engine = create_async_engine(DB_URL)
    hashed = hashlib.sha256(API_KEY.encode()).hexdigest()
    
    async with engine.connect() as conn:
        print(f"Hashed Key to find: {hashed}")
        r = await conn.execute(text("SELECT id, org_id, name FROM api_keys WHERE key_hash = :h"), {"h": hashed})
        row = r.first()
        if row:
            print(f"SUCCESS: Key Verified. OrgID: {row.org_id} | Name: {row.name}")
        else:
            print("FAILURE: API Key not found in DB hashes.")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify())
