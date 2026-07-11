import sys
import os
import asyncio

# Ensure backend source is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.services.retrain_service import RetrainService
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

async def main():
    settings = get_settings()
    print("Connecting to database...")
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    print("Initiating monthly model retraining pipeline...")
    async with async_session() as session:
        results = await RetrainService.retrain_model_pipeline(session)
        print("\nRetraining Run Execution Details:")
        print(f"  Status: {results.get('status')}")
        
        if results.get("status") == "completed":
            print(f"  Challenger Version: {results.get('candidate_version')}")
            print(f"  PR-AUC: {results.get('pr_auc'):.4f}")
            print(f"  ROC-AUC: {results.get('roc_auc'):.4f}")
            print(f"  Registered Status: {results.get('registered_status')}")
            print(f"  Execution Time: {results.get('training_latency_sec')} seconds")
        else:
            print(f"  Reason: {results.get('message')}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
