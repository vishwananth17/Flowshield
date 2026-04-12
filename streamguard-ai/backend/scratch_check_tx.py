import asyncio
import os
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.alert import Alert

async def check():
    async with AsyncSessionLocal() as session:
        # Check tx count
        tx_count = await session.execute(select(func.count(Transaction.id)))
        txs = tx_count.scalar()
        
        # Check alert count
        alert_count = await session.execute(select(func.count(Alert.id)))
        alerts = alert_count.scalar()
        
        # Check recent tx
        result = await session.execute(select(Transaction).order_by(Transaction.created_at.desc()).limit(5))
        recent_txs = result.scalars().all()
        
        print(f"Total Transactions: {txs}")
        print(f"Total Alerts: {alerts}")
        print("\nRecent Transactions:")
        for tx in recent_txs:
            print(f"- {tx.merchant_name}: {tx.currency} {tx.amount} ({tx.risk_label}) at {tx.created_at}")

if __name__ == "__main__":
    asyncio.run(check())
