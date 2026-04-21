import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def inspect_row():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        print("Extracting physical row keys...")
        result = await conn.execute(text("SELECT * FROM transactions LIMIT 1"))
        row = result.first()
        if row:
            # result.keys() provides the column names
            print(f"Physical Keys: {', '.join(result.keys())}")
        else:
            print("Table is empty, fallback to information_schema (already did that).")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(inspect_row())
