import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def list_keys():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT id, org_id, name, key_prefix FROM api_keys"))
        for row in r:
            print(f"ID: {row[0]} | OrgID: {row[1]} | Name: {row[2]} | Prefix: {row[3]}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_keys())
