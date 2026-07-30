import asyncio
import uuid
from datetime import datetime, UTC
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from app.models.integration import Integration
from app.models.transaction import Transaction

async def main():
    async with AsyncSessionLocal() as session:
        # 1. Target Org: ssx (bsvishwananth@gmail.com)
        target_org_id = uuid.UUID("31fe5ec8-39c9-4a66-bd37-788b9ff59b05")
        
        # 2. Re-assign any misallocated transactions to ssx
        misallocated_res = await session.execute(
            select(Transaction).where(Transaction.org_id != target_org_id)
        )
        mis_txs = misallocated_res.scalars().all()
        reassigned_count = 0
        for t in mis_txs:
            if t.merchant_name and "Shopify" in t.merchant_name:
                t.org_id = target_org_id
                reassigned_count += 1
        
        # 3. Create or update Integration for a5hm61-z0.myshopify.com
        integ_res = await session.execute(
            select(Integration).where(Integration.platform == "shopify")
        )
        integ = integ_res.scalar_one_or_none()
        if integ:
            integ.org_id = target_org_id
            integ.store_url = "https://a5hm61-z0.myshopify.com"
            integ.store_name = "Shopify Store (a5hm61-z0)"
            integ.status = "active"
            integ.last_event_at = datetime.now(UTC)
        else:
            new_integ = Integration(
                org_id=target_org_id,
                platform="shopify",
                connection_method="no_code_oauth",
                store_name="Shopify Store (a5hm61-z0)",
                store_url="https://a5hm61-z0.myshopify.com",
                status="active",
                last_event_at=datetime.now(UTC)
            )
            session.add(new_integ)
            
        await session.commit()
        print(f"SUCCESS: Linked a5hm61-z0.myshopify.com to Org {target_org_id} (ssx). Reassigned {reassigned_count} transactions!")

if __name__ == "__main__":
    asyncio.run(main())
