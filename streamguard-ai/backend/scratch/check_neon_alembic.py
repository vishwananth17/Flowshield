import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            result = await session.execute(text("SELECT version_num FROM alembic_version"))
            versions = result.all()
            print(f"Versions in Neon alembic_version: {[v[0] for v in versions]}")
        except Exception as e:
            print(f"Error reading Neon alembic_version: {e}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
