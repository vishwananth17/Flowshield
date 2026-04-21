import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

async def force_upgrade():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        print(f"Force-Elevating Org {ORG_ID} to PREMIUM...")
        await conn.execute(text("UPDATE organizations SET plan = 'premium' WHERE id = :oid"), {"oid": ORG_ID})
        await conn.commit()
        
        # Verify
        r = await conn.execute(text("SELECT plan FROM organizations WHERE id = :oid"), {"oid": ORG_ID})
        print(f"Post-Upgrade Plan: {r.scalar()}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(force_upgrade())
