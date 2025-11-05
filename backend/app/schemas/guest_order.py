"""
Guest Order schemas for GoShopGhana
Allows ordering without authentication
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, validator


class GuestInfo(BaseModel):
    """Guest user information"""
    full_name: str
    email: EmailStr
    phone: str
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate Ghana phone number format"""
        if not v:
            raise ValueError('Phone number is required')
        # Remove spaces and dashes
        phone = v.replace(' ', '').replace('-', '')
        # Check if it starts with +233, 233, or 0
        if not (phone.startswith('+233') or phone.startswith('233') or phone.startswith('0')):
            raise ValueError('Phone number must be a valid Ghana number')
        return v


class GuestOrderCreate(BaseModel):
    """Create order as guest"""
    guest_info: GuestInfo
    delivery_address: Dict[str, Any]
    delivery_notes: Optional[str] = None
    delivery_date: Optional[str] = None
    cart_items: list  # List of {product_id, quantity}
    payment_method: str = 'card'  # Default to card for guests
    

class GuestOrderResponse(BaseModel):
    """Response for guest order"""
    order_id: str
    tracking_token: str
    tracking_url: str
    total: float
    message: str


class OrderTrackingRequest(BaseModel):
    """Request to track order"""
    order_id: str
    phone: str  # For verification
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate Ghana phone number format"""
        if not v:
            raise ValueError('Phone number is required')
        phone = v.replace(' ', '').replace('-', '')
        if not (phone.startswith('+233') or phone.startswith('233') or phone.startswith('0')):
            raise ValueError('Phone number must be a valid Ghana number')
        return v
