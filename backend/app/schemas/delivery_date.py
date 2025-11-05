"""
Delivery Date schemas for GoShopGhana
Pydantic models for delivery date management
"""

from typing import Optional
from datetime import date
from pydantic import BaseModel, field_serializer


# Base schema
class DeliveryDateBase(BaseModel):
    date: date
    is_available: bool = True
    max_orders: Optional[int] = None
    notes: Optional[str] = None


# Create schema (admin only)
class DeliveryDateCreate(DeliveryDateBase):
    pass


# Update schema (admin only)
class DeliveryDateUpdate(BaseModel):
    is_available: Optional[bool] = None
    max_orders: Optional[int] = None
    notes: Optional[str] = None


# Response schema
class DeliveryDateResponse(DeliveryDateBase):
    id: str
    day_name: str
    current_orders: int
    
    @field_serializer('date')
    def serialize_date(self, value: date) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


# User-facing schema (simplified)
class DeliveryDatePublic(BaseModel):
    """Public delivery date info for users during checkout"""
    id: str
    date: date
    day_name: str
    is_available: bool
    slots_remaining: Optional[int] = None  # If max_orders is set
    
    @field_serializer('date')
    def serialize_date(self, value: date) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True
