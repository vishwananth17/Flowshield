import asyncio
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def fix():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        # 1. Find the first real organization
        r = await conn.execute(text("SELECT id FROM organizations LIMIT 1"))
        row = r.fetchone()
        if not row:
            print("ERROR: No organizations found!")
            return
        org_id = row[0]
        print(f"FOUND REAL ORG_ID: {org_id}")

        # 2. Update the API key to point to this real org
        key_to_auth = "sg_live_5rr6HhGRQyM.jkkZyl0Jg5JKuXu5My-L4q-9e0QarJY9oGUETwPkXSQ"
        key_hash = hashlib.sha256(key_to_auth.encode()).hexdigest()
        
        await conn.execute(
            text("UPDATE api_keys SET org_id = :org_id, is_active = true WHERE key_hash = :kh"),
            {"org_id": org_id, "kh": key_hash}
        )
        print(f"SUCCESS: API Key linked to Production Identity {org_id}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix())
