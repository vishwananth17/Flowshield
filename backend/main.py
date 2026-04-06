from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, engine, Base
import models
import schemas
from ml_service import calculate_fraud_risk, evaluate_transaction, model
from streaming_service import publish_transaction
from datetime import datetime
import asyncio

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Continumai - Fraud Detection API", description="Real-time fraud detection using ML.")

# We will handle streaming in a simplified way here, by publishing it to redis,
# and saving to db in background task for real-time perception.
def process_and_save_transaction(db: Session, tx: schemas.TransactionRequest):
    # 1. Evaluate Risk
    score_samples = calculate_fraud_risk(tx.amount, tx.location, tx.user_id)
    score, status, recommendation = evaluate_transaction(tx.amount, tx.location, tx.user_id)
    
    # 2. Save to DB
    db_tx = models.Transaction(
        transaction_id=tx.transaction_id,
        user_id=tx.user_id,
        amount=tx.amount,
        currency=tx.currency,
        location=tx.location,
        device_id=tx.device_id,
        timestamp=tx.timestamp,
        fraud_risk_score=score,
        status=status,
        recommendation=recommendation
    )
    db.add(db_tx)
    try:
        db.commit()
    except Exception as e:
        db.rollback()

@app.post("/analyze_transaction", response_model=schemas.TransactionResponse)
async def analyze_transaction(
    tx: schemas.TransactionRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)):
    
    # 1. Fast path ML prediction for immediate return
    score, status, recommendation = evaluate_transaction(tx.amount, tx.location, tx.user_id)
    
    # 2. Publish to Streaming Pipeline for heavier async tasks & monitoring systems
    publish_transaction(tx.model_dump())
    
    # 3. Offload saving to DB locally
    background_tasks.add_task(process_and_save_transaction, db, tx)
    
    return schemas.TransactionResponse(
        transaction_id=tx.transaction_id,
        fraud_risk_score=score,
        status=status,
        recommendation=recommendation
    )

@app.get("/fraud_alerts", response_model=list[schemas.AlertResponse])
def get_fraud_alerts(limit: int = 50, db: Session = Depends(get_db)):
    try:
        alerts = db.query(models.Transaction)\
                   .filter((models.Transaction.status == "high_risk") | (models.Transaction.status == "medium_risk"))\
                   .order_by(desc(models.Transaction.timestamp))\
                   .limit(limit).all()
        return alerts
    except:
        return []

@app.get("/model_status", response_model=schemas.ModelStatusResponse)
def get_model_status():
    status_str = "healthy" if model is not None else "degraded (fallback simple rules)"
    return schemas.ModelStatusResponse(
        model_name="Isolation Forest Anomaly Detector",
        status=status_str,
        version="v1.0.0",
        accuracy_estimate=0.92  # Dummy value for UI purposes
    )

# Mock endpoint to generate some traffic for testing on the dashboard
@app.post("/generate_mock_traffic")
async def generate_mock_traffic(background_tasks: BackgroundTasks, count: int = 10, db: Session = Depends(get_db)):
    import random
    import uuid
    for i in range(count):
        amount = random.uniform(10.0, 500.0)
        # 10% chance of high fraud
        if random.random() < 0.1:
            amount = random.uniform(1000.0, 10000.0)
            
        tx = schemas.TransactionRequest(
            transaction_id=f"TXN-{uuid.uuid4().hex[:8]}",
            user_id=f"U-{random.randint(100, 999)}",
            amount=amount,
            currency="USD",
            location=random.choice(["New York", "London", "San Francisco", "Tokyo", "Unknown"]),
            device_id=f"device-{random.randint(100, 999)}",
            timestamp=datetime.utcnow()
        )
        background_tasks.add_task(process_and_save_transaction, db, tx)
        
    return {"message": f"Generated {count} mock transactions"}
