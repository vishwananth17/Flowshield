import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        print("Auditing all organizations in production...")
        r = await conn.execute(text("SELECT id, name, plan FROM organizations"))
        for row in r:
            print(f"OrgID: {row[0]} | Name: {row[1]} | Plan: {row[2]}")
            
        print("\nChecking transaction count for the suspect OrgID...")
        # Check counts for the one we have been targeting
        r_count = await conn.execute(text("SELECT count(*) FROM transactions WHERE org_id = '31fe5ec8-39c9-4a66-bd37-788b9ff59b05'"))
        print(f"Transactions for 31fe5ec8: {r_count.scalar()}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
