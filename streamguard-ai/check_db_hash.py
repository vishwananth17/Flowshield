import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check_db_hash():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Scrutinizing DB hashes...")
        result = await session.execute(text("SELECT key_hash, key_prefix FROM api_keys WHERE name = 'Kaggle Ingestion Key'"))
        rows = result.all()
        for kh, kp in rows:
            print(f"DB Hash:   {kh}")
            print(f"DB Prefix: {kp}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db_hash())
