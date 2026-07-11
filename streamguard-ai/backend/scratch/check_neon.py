import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check():
    print(f"Connecting to Neon database...")
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Checking tables in Neon database...")
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
