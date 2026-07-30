import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.transaction import Transaction

async def main():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Transaction).order_by(Transaction.created_at.desc()).limit(10))
        txs = res.scalars().all()
        print(f"Total transactions in database: {len(txs)}")
        for t in txs:
            print(f"- ID: {t.external_id} | Merchant: {t.merchant_name} | Channel: {t.channel} | Risk: {t.risk_score} | Time: {t.created_at}")

if __name__ == "__main__":
    asyncio.run(main())
