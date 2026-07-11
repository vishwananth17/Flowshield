import datetime
from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal

from app.models.base import Base


class ModelDriftLog(Base):
    __tablename__ = "model_drift_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    psi_score: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    checked_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    alert_sent: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
