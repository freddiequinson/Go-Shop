"""
Delivery OTP Model for order verification
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class DeliveryOTP(Base):
    """OTP for delivery verification"""
    __tablename__ = "delivery_otps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)
    otp_code = Column(String(6), nullable=False, index=True)  # 6-digit code
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="delivery_otp")
    rider = relationship("Rider", back_populates="delivery_otps")

    def __repr__(self):
        return f"<DeliveryOTP(order_id={self.order_id}, otp_code={self.otp_code}, is_used={self.is_used})>"
