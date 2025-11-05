"""
User Address schemas for GoShopGhana
Pydantic models for address management
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, validator


class UserAddressBase(BaseModel):
    """Base address schema"""
    label: str
    street: str
    area: str
    city: str
    region: str
    phone: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    additional_info: Optional[str] = None
    is_default: bool = False

    @validator('phone')
    def validate_phone(cls, v):
        """Validate Ghana phone number format"""
        if not v:
            return v
        # Remove spaces and dashes
        phone = v.replace(' ', '').replace('-', '')
        # Check if it starts with +233, 233, or 0
        if not (phone.startswith('+233') or phone.startswith('233') or phone.startswith('0')):
            raise ValueError('Phone number must be a valid Ghana number')
        return v


class UserAddressCreate(UserAddressBase):
    """Schema for creating a new address"""
    pass


class UserAddressUpdate(BaseModel):
    """Schema for updating an address"""
    label: Optional[str] = None
    street: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    additional_info: Optional[str] = None
    is_default: Optional[bool] = None

    @validator('phone')
    def validate_phone(cls, v):
        """Validate Ghana phone number format"""
        if not v:
            return v
        phone = v.replace(' ', '').replace('-', '')
        if not (phone.startswith('+233') or phone.startswith('233') or phone.startswith('0')):
            raise ValueError('Phone number must be a valid Ghana number')
        return v


class UserAddressResponse(UserAddressBase):
    """Schema for address response"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserAddressListResponse(BaseModel):
    """Schema for list of addresses"""
    addresses: list[UserAddressResponse]
    total: int
    default_address_id: Optional[str] = None


class SetDefaultAddressRequest(BaseModel):
    """Schema for setting default address"""
    address_id: str
