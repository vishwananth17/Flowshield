import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import uuid
import random
from datetime import datetime, timezone

DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

async def saturate():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Get all Org IDs
        r = await session.execute(text("SELECT id, name FROM organizations"))
        orgs = r.all()
        
        print(f"Detected {len(orgs)} organizations. Initiating Universal Premium Elevation & Hydration...")
        
        for org_id, name in orgs:
            # Upgrade Plan
            await session.execute(text("UPDATE organizations SET plan = 'premium' WHERE id = :oid"), {"oid": org_id})
            
            # Inject 50 "Live" records for 24h visibility
            for i in range(50):
                is_fraud = random.random() > 0.8
                await session.execute(text("""
                    INSERT INTO transactions (id, org_id, external_id, amount, currency, merchant_name, merchant_category, 
                    card_last_four, card_type, customer_id, customer_ip, customer_country, risk_score, risk_label, decision, created_at, detection_latency_ms)
                    VALUES (:id, :oid, :ext, :amt, 'INR', :mname, 'Retail', '1234', 'visa', 'u1', '1.1.1.1', 'IN', :score, :label, :dec, :now, 200)
                """), {
                    "id": uuid.uuid4(), "oid": org_id, "ext": f"t_{uuid.uuid4().hex[:8]}", "amt": random.uniform(100, 10000),
                    "mname": "Global Test", "score": 0.99 if is_fraud else 0.01, "label": "block" if is_fraud else "allow",
                    "dec": "block" if is_fraud else "allow", "now": datetime.now(timezone.utc)
                })
            print(f"SUCCESS: Organization '{name}' [{org_id}] is now Hydrated & Premium.")
            
        await session.commit()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(saturate())
