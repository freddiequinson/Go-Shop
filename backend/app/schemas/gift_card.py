"""
Gift Card schemas for GoShopGhana
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class GiftCardBase(BaseModel):
    """Base gift card schema"""
    amount: Decimal = Field(..., gt=0, description="Amount in GHS")
    message: Optional[str] = Field(None, max_length=500, description="Optional message")
    expires_at: Optional[datetime] = Field(None, description="Expiration date")


class GiftCardCreate(GiftCardBase):
    """Schema for creating a gift card"""
    quantity: int = Field(1, ge=1, le=100, description="Number of gift cards to generate")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < Decimal('1.00'):
            raise ValueError('Amount must be at least 1.00 GHS')
        if v > Decimal('10000.00'):
            raise ValueError('Amount cannot exceed 10,000 GHS')
        return v


class GiftCardUpdate(BaseModel):
    """Schema for updating a gift card"""
    status: Optional[str] = Field(None, description="New status")
    message: Optional[str] = Field(None, max_length=500)
    expires_at: Optional[datetime] = None


class GiftCardResponse(GiftCardBase):
    """Schema for gift card response"""
    id: str
    code: str
    status: str
    currency: str = "GHS"
    created_by: Optional[str] = None
    redeemed_by: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    is_valid: bool = Field(default=False, description="Whether card can be redeemed")
    amount_formatted: str = Field(default="", description="Formatted amount")

    class Config:
        from_attributes = True
        
    @validator('amount_formatted', always=True)
    def format_amount(cls, v, values):
        if 'amount' in values:
            return f"GH₵{values['amount']:.2f}"
        return v


class GiftCardRedeem(BaseModel):
    """Schema for redeeming a gift card"""
    code: str = Field(..., min_length=10, max_length=50, description="Gift card code")
    
    @validator('code')
    def validate_code(cls, v):
        # Remove spaces and convert to uppercase
        v = v.replace(' ', '').replace('-', '').upper()
        if len(v) < 10:
            raise ValueError('Invalid gift card code')
        return v


class GiftCardRedeemResponse(BaseModel):
    """Response after redeeming a gift card"""
    success: bool
    message: str
    amount: Decimal
    new_balance: Decimal
    transaction_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class GiftCardListResponse(BaseModel):
    """Response for listing gift cards"""
    items: list[GiftCardResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        from_attributes = True


class GiftCardStats(BaseModel):
    """Gift card statistics"""
    total_created: int
    total_redeemed: int
    total_active: int
    total_expired: int
    total_cancelled: int
    total_value_created: Decimal
    total_value_redeemed: Decimal
    total_value_active: Decimal
    
    class Config:
        from_attributes = True
