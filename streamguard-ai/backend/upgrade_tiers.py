import asyncio
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from sqlalchemy import select, update

async def upgrade_all_to_growth():
    async with AsyncSessionLocal() as db:
        print("Searching for organizations...")
        res = await db.execute(select(Organization))
        orgs = res.scalars().all()
        
        for org in orgs:
            print(f"Upgrading {org.name} (Current: {org.plan}) -> Growth")
            org.plan = "growth"
        
        await db.commit()
        print("TIER ELEVATION COMPLETE. Full ML Ensemble Unlocked.")

if __name__ == "__main__":
    asyncio.run(upgrade_all_to_growth())
