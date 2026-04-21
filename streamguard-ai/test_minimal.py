import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from datetime import datetime, timezone

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check_timestamps():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Auditing telemetry timestamps...")
        result = await session.execute(text("SELECT id, created_at, risk_score FROM transactions ORDER BY created_at DESC LIMIT 5"))
        rows = result.all()
        now = datetime.now(timezone.utc)
        print(f"Current UTC: {now}")
        for tid, cat, score in rows:
            print(f"ID: {str(tid)[:8]} | Created: {cat} | Score: {score}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_timestamps())
