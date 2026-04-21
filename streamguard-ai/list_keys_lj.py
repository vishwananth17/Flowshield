import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "c76fec34-b17b-4bc4-bea5-8a247703eff8"

async def list_keys():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print(f"Listing active keys for Org {ORG_ID}...")
        result = await session.execute(text("SELECT name, key_prefix, key_hash, is_active FROM api_keys WHERE org_id = :oid"), {"oid": ORG_ID})
        keys = result.all()
        for name, prefix, khash, active in keys:
            print(f"Name: {name:20} | Prefix: {prefix:15} | Active: {active} | Hash: {khash}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_keys())
