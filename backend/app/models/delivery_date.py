"""
Delivery Date model for GoShopGhana
Admin-managed delivery dates for order scheduling
"""

from sqlalchemy import Column, String, Date, Boolean, Integer
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


class DeliveryDate(Base):
    """Delivery dates managed by admin"""
    __tablename__ = "delivery_dates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(Date, nullable=False, unique=True, index=True)
    day_name = Column(String, nullable=False)  # Monday, Tuesday, etc.
    is_available = Column(Boolean, default=True, nullable=False)
    max_orders = Column(Integer, nullable=True)  # Optional: limit orders per day
    current_orders = Column(Integer, default=0, nullable=False)
    notes = Column(String, nullable=True)  # Admin notes (e.g., "Holiday", "Peak season")
    
    # Relationships
    # orders = relationship("Order", back_populates="delivery_date")
