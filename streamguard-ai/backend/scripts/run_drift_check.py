import sys
import os
import asyncio

# Ensure backend source is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.services.drift_service import DriftService
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

async def main():
    settings = get_settings()
    print("Connecting to database...")
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    print("Initiating Weekly population stability drift analysis...")
    async with async_session() as session:
        results = await DriftService.run_drift_check(session, alert_email="operator@flowshield.ai")
        print("\nDrift Check Execution Complete:")
        print(f"  Status: {results.get('status')}")
        print(f"  Model Version: {results.get('model_version')}")
        print(f"  Checked Features Count: {results.get('total_features_checked', 0)}")
        print(f"  High Drift Feature Alerts: {results.get('high_drift_count', 0)}")
        
        if results.get("drift_scores"):
            print("\nTop Drift Scores (PSI):")
            sorted_scores = sorted(results["drift_scores"].items(), key=lambda x: x[1], reverse=True)
            for feat, psi in sorted_scores[:5]:
                print(f"  - {feat}: {psi:.4f}")
                
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
