import asyncio
import httpx
from datetime import datetime

# We will simulate a logged-in user request to the stats endpoint
# Since we can't easily get a JWT, we will check the DB aggregations directly
# using the EXACT SQL logic from analytics.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select, func
from datetime import timedelta

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

async def debug_stats():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    now = datetime.utcnow()
    filter_date = now - timedelta(days=1)
    
    async with async_session() as session:
        print(f"Auditing aggregation for Org {ORG_ID} since {filter_date}...")
        
        # 1. Check total in last 24h
        q = text("SELECT count(*) FROM transactions WHERE org_id = :oid AND created_at >= :fdate")
        res = await session.execute(q, {"oid": ORG_ID, "fdate": filter_date})
        count = res.scalar()
        print(f"Total Analyzed (SQL): {count}")
        
        # 2. Check total overall for this org
        q_all = text("SELECT count(*) FROM transactions WHERE org_id = :oid")
        res_all = await session.execute(q_all, {"oid": ORG_ID})
        count_all = res_all.scalar()
        print(f"Total Analyzed (Overall): {count_all}")
        
        # 3. Check physical rows for latest data
        q_rows = text("SELECT id, created_at FROM transactions WHERE org_id = :oid ORDER BY created_at DESC LIMIT 5")
        res_rows = await session.execute(q_rows, {"oid": ORG_ID})
        for r in res_rows:
            print(f"New Record: {r[0]} | Created: {r[1]}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug_stats())
