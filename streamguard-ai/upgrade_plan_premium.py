import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

async def upgrade_plan():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print(f"Elevating organization {ORG_ID} to PREMIUM tier (unlimited analytics)...")
        
        # Update organization plan to 'premium' which is definitely in plan_limits.py
        await session.execute(text("""
            UPDATE organizations 
            SET plan = 'premium' 
            WHERE id = :oid
        """), {"oid": ORG_ID})
        
        await session.commit()
    
    print("\nSUCCESS: Organization elevated to PREMIUM. Analytics gateway activated.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(upgrade_plan())
