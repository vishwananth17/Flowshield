import asyncio
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT name, key_hash, key_prefix FROM api_keys"))
        keys = r.fetchall()
        print(f"DATABASE_KEYS: {keys}")
        
        # Check what the hash SHOULD be
        key_to_auth = "sg_live_5rr6HhGRQyM.jkkZyl0Jg5JKuXu5My-L4q-9e0QarJY9oGUETwPkXSQ"
        expected_hash = hashlib.sha256(key_to_auth.encode()).hexdigest()
        print(f"EXPECTED_HASH: {expected_hash}")
        
        for k in keys:
            if k[1] == expected_hash:
                print("MATCH FOUND!")
            else:
                print(f"NO MATCH for {k[1]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
