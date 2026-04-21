import asyncio
import uuid
import random
import time
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

SCENARIOS = [
    {"merchant": "Sovereign Cloud", "amount": 29500.00, "category": "Tech", "country": "US", "risk": "low"},
    {"merchant": "Quantum Exchange", "amount": 145000.00, "category": "Finance", "country": "KY", "risk": "high"},
    {"merchant": "Global Logistics", "amount": 62000.00, "category": "Shipping", "country": "UK", "risk": "low"},
    {"merchant": "Anonymous VPS", "amount": 1200.00, "category": "Tech", "country": "RO", "risk": "high"},
]

async def hydrate_dashboard(count=50):
    print(f"Flowshield AI \u2014 Initiating FINAL Ledger Hydration ({count} records)...")
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        for i in range(count):
            scenario = random.choice(SCENARIOS)
            external_id = f"ext_vfinal_{int(time.time())}_{i}"
            now = datetime.now(timezone.utc)
            
            # Risk logic
            score = random.uniform(0.85, 0.99) if scenario["risk"] == "high" else random.uniform(0.01, 0.25)
            label = "block" if score > 0.8 else "allow"
            
            # NO 'status' column - it doesn't exist in DB
            await session.execute(text("""
                INSERT INTO transactions (
                    id, org_id, external_id, amount, currency, 
                    merchant_name, merchant_category, 
                    card_last_four, card_type, customer_id, customer_ip,
                    risk_score, risk_label, decision, created_at
                ) VALUES (
                    :id, :org_id, :ext_id, :amount, :currency,
                    :m_name, :m_cat, 
                    :c_last4, :c_type, :cust_id, :cust_ip,
                    :score, :label, :decision, :now
                )
            """), {
                "id": uuid.uuid4(),
                "org_id": ORG_ID,
                "ext_id": external_id,
                "amount": scenario["amount"],
                "currency": "USD",
                "m_name": scenario["merchant"],
                "m_cat": scenario["category"],
                "c_last4": str(random.randint(1000, 9999)),
                "c_type": "visa",
                "cust_id": f"cust_vfinal_{i}",
                "cust_ip": f"192.168.1.{random.randint(1,254)}",
                "score": score,
                "label": label,
                "decision": label,
                "now": now
            })
            
            if i % 10 == 0:
                print(f"Propagated {i+1} records...")
        
        await session.commit()
    
    print(f"\nSUCCESS: 50 High-Volume Records Committed for Org {ORG_ID}.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(hydrate_dashboard(50))
