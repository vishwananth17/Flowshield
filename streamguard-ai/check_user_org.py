import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def check_user_org():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Auditing user-to-organization mapping...")
        result = await session.execute(text("""
            SELECT u.email, o.id, o.name 
            FROM users u 
            JOIN organizations o ON u.org_id = o.id 
            WHERE u.email = 'bsvishwananth@gmail.com'
        """))
        mapping = result.first()
        if mapping:
            print(f"User: {mapping[0]}")
            print(f"Org ID: {mapping[1]}")
            print(f"Org Name: {mapping[2]}")
        else:
            print("User not found in cloud ledger shard.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_user_org())
