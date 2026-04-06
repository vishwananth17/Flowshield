from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    user_id = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String)
    location = Column(String)
    device_id = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    fraud_risk_score = Column(Float, nullable=True)
    status = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)
