"""
User Address models for GoShopGhana
Stores delivery addresses for users with geolocation support
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class UserAddress(Base):
    """User delivery address model with map coordinates"""
    __tablename__ = "user_addresses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Address label
    label = Column(String(100), nullable=False)  # "Home", "Office", "Mom's House"
    
    # Address details
    street = Column(String(255), nullable=False)
    area = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    
    # Geolocation
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    
    # Additional info
    additional_info = Column(Text, nullable=True)  # "Gate code: 1234", "Behind the church"
    
    # Default address flag
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    # user = relationship("User", back_populates="addresses")

    def __repr__(self):
        return f"<UserAddress(id={self.id}, label={self.label}, user_id={self.user_id}, is_default={self.is_default})>"
    
    def to_dict(self):
        """Convert to dictionary for easy serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "label": self.label,
            "street": self.street,
            "area": self.area,
            "city": self.city,
            "region": self.region,
            "phone": self.phone,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "additional_info": self.additional_info,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
