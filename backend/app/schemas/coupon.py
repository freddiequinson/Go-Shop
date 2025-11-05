"""
Coupon schemas for GoShopGhana
Pydantic models for comprehensive coupon system
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50, description="Coupon code (uppercase)")
    name: str = Field(..., description="Display name for coupon")
    description: Optional[str] = None
    
    # Benefit Type
    benefit_type: str = Field(..., description="Type: free_delivery, delivery_discount, wallet_credit, product_discount, specific_product")
    
    # Discount Values
    discount_value: Optional[Decimal] = None
    discount_type: Optional[str] = Field(None, description="percentage or fixed")
    
    # Delivery Benefits
    free_delivery: bool = False
    delivery_discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    delivery_discount_fixed: Optional[Decimal] = Field(None, ge=0)
    
    # Wallet Credit
    wallet_credit_amount: Optional[Decimal] = Field(None, ge=0)
    
    # Product Discounts
    product_discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    product_discount_fixed: Optional[Decimal] = Field(None, ge=0)
    
    # Specific Product Targeting
    specific_product_ids: Optional[List[str]] = None
    specific_category_ids: Optional[List[str]] = None
    
    # Restrictions
    min_order_amount: Optional[Decimal] = Field(None, ge=0)
    max_discount_amount: Optional[Decimal] = Field(None, ge=0)
    
    # Usage Limits
    max_uses: Optional[int] = Field(None, ge=1)
    max_uses_per_user: int = Field(1, ge=1)
    
    # User Restrictions
    user_type_restriction: Optional[str] = Field(None, description="buyer, seller, or all")
    first_order_only: bool = False
    
    # Validity
    valid_from: datetime
    valid_until: datetime
    
    # Status
    is_active: bool = True
    is_public: bool = True
    
    # Notes
    internal_notes: Optional[str] = None

    @validator('code')
    def code_must_be_uppercase(cls, v):
        return v.upper()

    @validator('benefit_type')
    def validate_benefit_type(cls, v):
        allowed = ['free_delivery', 'delivery_discount', 'wallet_credit', 'product_discount', 'specific_product']
        if v not in allowed:
            raise ValueError(f'benefit_type must be one of: {", ".join(allowed)}')
        return v

    @validator('discount_type')
    def validate_discount_type(cls, v):
        if v and v not in ['percentage', 'fixed']:
            raise ValueError('discount_type must be percentage or fixed')
        return v

    @validator('user_type_restriction')
    def validate_user_type(cls, v):
        if v and v not in ['buyer', 'seller', 'all']:
            raise ValueError('user_type_restriction must be buyer, seller, or all')
        return v


class CouponCreate(CouponBase):
    created_by: Optional[str] = None


class CouponUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    
    # Benefit updates
    benefit_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    discount_type: Optional[str] = None
    
    # Delivery
    free_delivery: Optional[bool] = None
    delivery_discount_percent: Optional[Decimal] = None
    delivery_discount_fixed: Optional[Decimal] = None
    
    # Wallet
    wallet_credit_amount: Optional[Decimal] = None
    
    # Products
    product_discount_percent: Optional[Decimal] = None
    product_discount_fixed: Optional[Decimal] = None
    specific_product_ids: Optional[List[str]] = None
    specific_category_ids: Optional[List[str]] = None
    
    # Restrictions
    min_order_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    user_type_restriction: Optional[str] = None
    first_order_only: Optional[bool] = None
    
    # Validity
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    
    # Status
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    internal_notes: Optional[str] = None


class CouponResponse(CouponBase):
    id: str
    uses_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[str]

    class Config:
        from_attributes = True


class CouponListResponse(BaseModel):
    coupons: List[CouponResponse]
    total: int
    active_count: int
    expired_count: int


class CouponValidateRequest(BaseModel):
    code: str
    user_id: Optional[str] = None
    order_amount: Decimal = Field(..., ge=0)
    product_ids: Optional[List[str]] = None
    category_ids: Optional[List[str]] = None
    user_type: Optional[str] = None
    is_first_order: bool = False


class CouponBenefit(BaseModel):
    """Calculated benefits from a coupon"""
    coupon_id: str
    coupon_code: str
    coupon_name: str
    benefit_type: str
    
    # Delivery benefits
    free_delivery: bool = False
    delivery_discount: Decimal = Field(default=0)
    
    # Wallet credit
    wallet_credit: Decimal = Field(default=0)
    
    # Product discount
    product_discount: Decimal = Field(default=0)
    product_discount_percent: Optional[Decimal] = None
    
    # Total savings
    total_discount: Decimal = Field(default=0)
    
    # Restrictions applied
    min_order_met: bool = True
    max_discount_applied: bool = False
    
    # Messages
    success_message: str
    restrictions: Optional[str] = None


class CouponValidateResponse(BaseModel):
    valid: bool
    message: str
    benefits: Optional[CouponBenefit] = None
    error: Optional[str] = None


class CouponStatsResponse(BaseModel):
    total_coupons: int
    active_coupons: int
    expired_coupons: int
    total_uses: int
    total_savings: Decimal
    most_used_coupon: Optional[CouponResponse] = None
