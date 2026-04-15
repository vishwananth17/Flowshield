import uuid
from datetime import datetime, UTC
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

class Waitlist(Base):
    __tablename__ = "waitlist"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    company = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.utcnow())
