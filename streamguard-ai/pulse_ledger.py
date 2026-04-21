import asyncio
import uuid
import random
import time
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# --- Production Configuration ---
DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"

MERCHANTS = ["Amazon Cloud", "Stripe Gateway", "Apple Store", "Netflix Prime", "Steam Games", "Uber Eats", "Walmart Digital", "Spotify Premium"]
COUNTRIES = ["US", "IN", "GB", "CA", "AE", "SG", "FR", "DE"]

async def heartbeat():
    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    print("[*] Flowshield AI - Sovereign Pulse Engine Activated.")
    print(f"Targeting Org Ledger: {ORG_ID}")
    print("Injecting Live Pulse every 10 seconds. (Ctrl+C to stop)")
    
    counter = 0
    try:
        async with async_session() as session:
            while True:
                counter += 1
                is_fraud = random.random() > 0.8  # 20% Fraud Rate
                amount = round(random.uniform(10, 5000), 2)
                
                # Heuristic Risk Injection
                score = random.uniform(0.91, 0.99) if is_fraud else random.uniform(0.01, 0.15)
                label = "block" if is_fraud else "allow"
                
                # Metadata
                m_name = random.choice(MERCHANTS)
                country = random.choice(COUNTRIES)
                
                await session.execute(text("""
                    INSERT INTO transactions (
                        id, org_id, external_id, amount, currency, 
                        merchant_name, merchant_category, 
                        card_last_four, card_type, customer_id, customer_ip, customer_country,
                        risk_score, risk_label, decision, created_at, detection_latency_ms
                    ) VALUES (
                        :id, :org_id, :ext_id, :amount, :currency,
                        :m_name, :m_cat, 
                        :c_last4, :c_type, :cust_id, :cust_ip, :country,
                        :score, :label, :decision, :now, :latency
                    )
                """), {
                    "id": uuid.uuid4(),
                    "org_id": ORG_ID,
                    "ext_id": f"p_{int(time.time())}"[-10:],
                    "amount": amount,
                    "currency": "INR",
                    "m_name": m_name[:10],
                    "m_cat": "E-Comm"[:10],
                    "c_last4": str(random.randint(1000, 9999)),
                    "c_type": random.choice(["visa", "mc", "amex"]),
                    "cust_id": f"u_{random.randint(100, 999)}",
                    "cust_ip": f"192.168.{random.randint(1,255)}.{random.randint(1,255)}",
                    "country": country,
                    "score": score,
                    "label": label,
                    "decision": label,
                    "now": datetime.now(timezone.utc),
                    "latency": random.randint(150, 800)
                })
                
                await session.commit()
                status = "[BLOCKED]" if is_fraud else "[ALLOWED]"
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Pulse {counter}: {m_name} INR {amount} {status} (Score: {score:.3f})")
                
                await asyncio.sleep(10)
    except Exception as e:
        print(f"[!] Pulse Failure: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(heartbeat())
