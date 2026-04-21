import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def count_data():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Auditing telemetry commitment...")
        result = await session.execute(text("SELECT count(*) FROM transactions"))
        count = result.scalar()
        print(f"Total Transactions in DB: {count}")
        
        result = await session.execute(text("SELECT org_id, count(*) FROM transactions GROUP BY org_id"))
        rows = result.all()
        for oid, c in rows:
            print(f"Org {oid}: {c} records")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(count_data())
