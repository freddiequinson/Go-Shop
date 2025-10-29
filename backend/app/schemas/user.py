"""
User schemas for GoShopGhana
Pydantic models for request/response validation
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, validator
from app.models.user import UserType, VerificationStatus, PremiumTier

# Base user schema
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    user_type: UserType = UserType.BUYER
    location: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    bio: Optional[str] = None
    referral_source: Optional[str] = None

# User creation schema (for registration)
class UserCreate(UserBase):
    password: str
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None  # Base64 encoded image (optional)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not v.replace('_', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v

# User update schema
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None  # Base64 encoded image
    referral_source: Optional[str] = None

# User response schema (what we return to client)
class UserResponse(UserBase):
    id: str
    verification_status: VerificationStatus
    premium_tier: PremiumTier
    is_active: bool
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    
    class Config:
        from_attributes = True

# Login request schema
class UserLogin(BaseModel):
    username: str
    password: str

# Token response schema
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Token data schema (for JWT payload)
class TokenData(BaseModel):
    user_id: Optional[str] = None
