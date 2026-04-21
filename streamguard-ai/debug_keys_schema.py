import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'api_keys'"))
        cols = [row[0] for row in r]
        print(f"API_KEYS_COLUMNS: {cols}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
