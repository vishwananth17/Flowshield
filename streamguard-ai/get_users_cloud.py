import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def get_users():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Tracing user tethers...")
        result = await session.execute(text("SELECT email, org_id FROM users"))
        users = result.all()
        for email, oid in users:
            print(f"User: {email} | OrgID: {oid}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(get_users())
