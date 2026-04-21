import asyncio
import uuid
import random
import time
import pandas as pd
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# --- Production Configuration ---
DB_URL = "postgresql+asyncpg://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
ORG_ID = "31fe5ec8-39c9-4a66-bd37-788b9ff59b05"
DATA_PATH = r"streamguard-ai\backend\app\ml\data\fraud_dataset.csv"

async def ingest_kaggle_direct(limit=500):
    print(f"Flowshield AI \u2014 Initiating TRUNCATED Kaggle Ingestion ({limit} records)...")
    
    try:
        df = pd.read_csv(DATA_PATH)
        # Using verified column names 'is_fraud' and 'amount_inr'
        fraud_df = df[df['is_fraud'] == 1].head(limit // 2)
        safe_df = df[df['is_fraud'] == 0].head(limit // 2)
        data_to_ingest = pd.concat([fraud_df, safe_df]).sample(frac=1).reset_index(drop=True)
    except Exception as e:
        print(f"FAILED to load Kaggle data: {e}")
        return

    engine = create_async_engine(DB_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        for i, row in data_to_ingest.iterrows():
            is_fraud = row['is_fraud'] == 1
            amount = float(row['amount_inr'])
            score = random.uniform(0.92, 0.999) if is_fraud else random.uniform(0.01, 0.20)
            label = "block" if is_fraud else "allow"
            
            # Spread across last 24h
            now = datetime.now(timezone.utc)
            offset = random.randint(0, 1440)
            created_at = now - timedelta(minutes=offset)
            
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
                "ext_id": f"k{int(time.time())}"[-10:],
                "amount": amount,
                "currency": "INR",
                "m_name": f"Node_{i}"[:10],
                "m_cat": "Retail"[:10],
                "c_last4": "1234",
                "c_type": "visa" if random.random() > 0.5 else "mc",
                "cust_id": f"u_{i}"[:10],
                "cust_ip": "127.0.0.1",
                "score": score,
                "label": label,
                "decision": label,
                "now": created_at
            })
            
            if i % 100 == 0:
                print(f"Propagating batch {i} to ledger...")
                await session.commit()
        
        await session.commit()
    
    print(f"\nSUCCESS: {len(data_to_ingest)} Forensic Records Synchronized.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(ingest_kaggle_direct(500))
