import asyncio
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def reinject():
    key = "sg_live_5rr6HhGRQyM.jkkZyl0Jg5JKuXu5My-L4q-9e0QarJY9oGUETwPkXSQ"
    expected_hash = hashlib.sha256(key.encode("utf-8")).hexdigest()
    prefix = "sg_live_5rr6HhGRQyM"
    
    print(f"TARGET_KEY: {key}")
    print(f"CALCULATED_HASH: {expected_hash}")
    
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        # 1. Clean up old entries for this prefix
        await conn.execute(text("DELETE FROM api_keys WHERE key_prefix = :p"), {"p": prefix})
        
        # 2. Get an org id
        r = await conn.execute(text("SELECT id FROM organizations LIMIT 1"))
        org_id = r.scalar()
        
        # 3. Insert fresh
        import uuid
        key_id = uuid.uuid4()
        await conn.execute(
            text("""
                INSERT INTO api_keys (id, org_id, name, key_hash, key_prefix, is_active, created_at, environment)
                VALUES (:id, :org_id, :name, :kh, :p, true, now(), 'live')
            """),
            {
                "id": key_id,
                "org_id": org_id,
                "name": "Final Commercial Gateway",
                "kh": expected_hash,
                "p": prefix
            }
        )
        print(f"RE-INJECTION SUCCESS: Key ID {key_id}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reinject())
