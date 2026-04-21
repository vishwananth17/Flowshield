import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def list_columns():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        print("Auditing absolute physical column list...")
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions'
            ORDER BY column_name
        """))
        columns = [row[0] for row in result.all()]
        print(f"Columns: {', '.join(columns)}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_columns())
