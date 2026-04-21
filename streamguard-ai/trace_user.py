import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def trace_user():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        print("Tracing 'VISHWANATH' user and organization...")
        result = await conn.execute(text("SELECT id, email, full_name, org_id, plan FROM users"))
        users = result.all()
        for u in users:
            print(f"User: {u.full_name} | Email: {u.email} | Org: {u.org_id} | Plan: {u.plan if hasattr(u, 'plan') else 'N/A'}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(trace_user())
