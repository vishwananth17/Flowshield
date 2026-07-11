import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import get_settings

async def check():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            result = await session.execute(text("SELECT version_num FROM alembic_version"))
            versions = result.all()
            print(f"Versions in alembic_version: {[v[0] for v in versions]}")
        except Exception as e:
            print(f"Error reading alembic_version: {e}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
