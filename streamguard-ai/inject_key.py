import asyncio
import hashlib
import uuid
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def inject():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        # 1. Find the real organization
        r = await conn.execute(text("SELECT id FROM organizations LIMIT 1"))
        row = r.fetchone()
        if not row:
            print("ERROR: No organizations found!")
            return
        org_id = row[0]
        
        # 2. Key Details
        key_to_auth = "sg_live_5rr6HhGRQyM.jkkZyl0Jg5JKuXu5My-L4q-9e0QarJY9oGUETwPkXSQ"
        key_hash = hashlib.sha256(key_to_auth.encode()).hexdigest()
        key_id = uuid.uuid4()
        
        # 3. Clean up any existing stale keys for this hash
        await conn.execute(text("DELETE FROM api_keys WHERE key_hash = :kh"), {"kh": key_hash})
        
        # 4. Insert Fresh Production Key
        await conn.execute(
            text("""
                INSERT INTO api_keys (id, org_id, name, key_hash, key_prefix, is_active, created_at)
                VALUES (:id, :org_id, :name, :kh, :prefix, true, now())
            """),
            {
                "id": key_id,
                "org_id": org_id,
                "name": "Production Commercial Gateway",
                "kh": key_hash,
                "prefix": "sg_live_5rr6HhGRQyM",
            }
        )
        print(f"SUCCESS: Injected Production Key {key_id} for Org {org_id}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(inject())
