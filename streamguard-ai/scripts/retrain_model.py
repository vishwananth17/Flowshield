import asyncio
import os
import pandas as pd
import numpy as np
import joblib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sklearn.ensemble import IsolationForest

# Import models to query
import sys
# Add backend to path to import app models
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.models.transaction import Transaction

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/streamguard")

async def retrain():
    print("Connecting to database...")
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("Fetching transactions...")
        result = await session.execute(select(Transaction).limit(10000))
        txs = result.scalars().all()
        
        if len(txs) < 50:
            print(f"Not enough data to retrain ({len(txs)} transactions). Need at least 50.")
            return

        print(f"Loaded {len(txs)} transactions. Processing features...")
        
        data = []
        for tx in txs:
            # Feature extraction logic matching app/ml/model.py
            amt_log = np.log1p(float(tx.amount))
            time_feat = abs(tx.created_at.hour - 12) / 12.0
            # Simulating cross border logic: if card country != US
            cb_feat = 1.0 if tx.card_country != "US" else 0.0
            data.append([amt_log, time_feat, cb_feat])
        
        X = np.array(data)
        
        print("Training IsolationForest...")
        model = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
        model.fit(X)
        
        model_path = "backend/model.joblib"
        joblib.dump(model, model_path)
        print(f"Model saved to {model_path}")

if __name__ == "__main__":
    asyncio.run(retrain())
