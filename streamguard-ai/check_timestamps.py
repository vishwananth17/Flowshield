import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from datetime import datetime, timezone

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

async def check():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        print(f"Server Time (Local): {datetime.now()}")
        print(f"Server Time (UTC): {datetime.now(timezone.utc)}")
        
        r = await conn.execute(text("SELECT id, created_at FROM transactions WHERE org_id = :oid ORDER BY created_at DESC LIMIT 5"), {"oid": ORG_ID})
        for row in r:
            print(f"TxID: {row[0]} | CreatedAt: {row[1]}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
