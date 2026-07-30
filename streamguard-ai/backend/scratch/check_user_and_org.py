import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.organization import Organization
from app.models.api_key import ApiKey
from app.models.transaction import Transaction

async def main():
    async with AsyncSessionLocal() as session:
        print("=== ORGANIZATIONS ===")
        orgs = (await session.execute(select(Organization))).scalars().all()
        for o in orgs:
            print(f"Org ID: {o.id} | Name: {o.name} | Created: {o.created_at}")

        print("\n=== USERS ===")
        users = (await session.execute(select(User))).scalars().all()
        for u in users:
            print(f"User ID: {u.id} | Email: {u.email} | Org ID: {u.org_id}")

        print("\n=== API KEYS ===")
        keys = (await session.execute(select(ApiKey))).scalars().all()
        for k in keys:
            print(f"Key ID: {k.id} | Name: {k.name} | Org ID: {k.org_id} | Prefix: {k.key_prefix}")

        print("\n=== TRANSACTIONS PER ORG ===")
        txs = (await session.execute(select(Transaction))).scalars().all()
        org_tx_count = {}
        for t in txs:
            org_tx_count[str(t.org_id)] = org_tx_count.get(str(t.org_id), 0) + 1
        for oid, count in org_tx_count.items():
            print(f"Org ID: {oid} => {count} transactions")

if __name__ == "__main__":
    asyncio.run(main())
