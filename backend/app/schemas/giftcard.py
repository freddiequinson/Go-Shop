"""
Gift Card schemas for GoShopGhana
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from app.models.giftcard import GiftCardStatus, GiftCardType


class GiftCardCreate(BaseModel):
    """Schema for creating a gift card"""
    amount: float = Field(..., gt=0, description="Amount in GHS")
    card_type: GiftCardType = Field(default=GiftCardType.EXPIRY)
    expiry_days: Optional[int] = Field(None, gt=0, le=365, description="Days until expiry (for expiry cards)")
    description: Optional[str] = None
    
    @validator('expiry_days')
    def validate_expiry(cls, v, values):
        if values.get('card_type') == GiftCardType.EXPIRY and v is None:
            raise ValueError("expiry_days is required for expiry gift cards")
        if values.get('card_type') == GiftCardType.NON_EXPIRY and v is not None:
            raise ValueError("expiry_days should not be set for non-expiry gift cards")
        return v


class GiftCardBatchCreate(BaseModel):
    """Schema for creating multiple gift cards"""
    amount: float = Field(..., gt=0)
    quantity: int = Field(..., gt=0, le=100, description="Number of cards to generate (max 100)")
    card_type: GiftCardType = Field(default=GiftCardType.EXPIRY)
    expiry_days: Optional[int] = Field(None, gt=0, le=365)
    description: Optional[str] = None


class GiftCardResponse(BaseModel):
    """Schema for gift card response"""
    id: str
    code: str
    pin: str  # Only shown once during creation
    amount: float
    original_amount: float
    card_type: GiftCardType
    status: GiftCardStatus
    expires_at: Optional[datetime]
    generated_by_id: str
    redeemed_by_id: Optional[str]
    redeemed_at: Optional[datetime]
    hash_chain: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GiftCardPublicResponse(BaseModel):
    """Public gift card info (without sensitive data)"""
    id: str
    code: str
    amount: float
    card_type: GiftCardType
    status: GiftCardStatus
    expires_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class GiftCardRedeem(BaseModel):
    """Schema for redeeming a gift card"""
    code: str = Field(..., min_length=16, max_length=20)
    pin: str = Field(..., min_length=6, max_length=6)


class GiftCardVerify(BaseModel):
    """Schema for verifying a gift card"""
    code: str = Field(..., min_length=16, max_length=20)


class GiftCardVerifyResponse(BaseModel):
    """Response for gift card verification"""
    valid: bool
    amount: Optional[float] = None
    status: Optional[GiftCardStatus] = None
    expires_at: Optional[datetime] = None
    message: str


class GiftCardTransactionResponse(BaseModel):
    """Schema for gift card transaction"""
    id: str
    giftcard_id: str
    transaction_type: str
    amount: float
    user_id: str
    transaction_hash: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class GiftCardStats(BaseModel):
    """Gift card statistics"""
    total_generated: int
    total_active: int
    total_redeemed: int
    total_expired: int
    total_value_cedis: float
    total_redeemed_value_cedis: float
