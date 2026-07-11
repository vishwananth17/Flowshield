import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import get_settings

async def check():
    settings = get_settings()
    print(f"Connecting to database: {settings.database_url}")
    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Checking tables in database...")
        result = await session.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"))
        table_count = result.scalar()
        print(f"Tables found: {table_count}")
        
        print("Listing tables:")
        result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        for row in result:
            print(f" - {row[0]}")
            
        print("\nAuditing transactions columns:")
        try:
            result = await session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'transactions'
            """))
            for row in result:
                print(f" - {row[0]}: {row[1]}")
        except Exception as e:
            print(f"Error auditing transactions: {e}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
