import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def activate():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        r = await conn.execute(
            text("UPDATE api_keys SET is_active = true WHERE key_prefix = :p"),
            {"p": "sg_live_5rr6HhGRQyM"}
        )
        print(f"ROWS UPDATED: {r.rowcount}")
        
        # Also check the status
        r = await conn.execute(text("SELECT is_active, org_id FROM api_keys WHERE key_prefix = :p"), {"p": "sg_live_5rr6HhGRQyM"})
        row = r.fetchone()
        print(f"CURRENT STATUS: {row}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(activate())
