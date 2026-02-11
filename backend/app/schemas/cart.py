"""
Cart schemas for GoShopGhana
Pydantic models for shopping cart with Ghana market support
"""

from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer

# Product details for cart items
class CartProductDetails(BaseModel):
    """Minimal product details for cart items"""
    id: str
    name: str
    price_per_unit_cedis: int
    unit_type: str
    image_url: Optional[str] = None
    primary_image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

# Cart Item schemas
class CartItemBase(BaseModel):
    product_id: Optional[str] = None  # Optional for package items
    quantity: Decimal

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        if v > 10000:  # Max 10,000 units
            raise ValueError('Quantity cannot exceed 10,000 units')
        return v

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: Optional[Decimal] = None

    @validator('quantity')
    def validate_quantity(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError('Quantity must be greater than 0')
            if v > 10000:
                raise ValueError('Quantity cannot exceed 10,000 units')
        return v

class CartItemResponse(BaseModel):
    id: str
    cart_id: str
    product_id: Optional[str] = None  # Optional for package items
    package_id: Optional[str] = None  # For package items
    item_type: str = "product"  # 'product' or 'package'
    quantity: Decimal
    price_per_unit_cedis: Decimal
    line_total_cedis: Decimal
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    price_per_unit: Optional[float] = None
    line_total: Optional[float] = None
    subtotal: Optional[float] = None  # For frontend compatibility
    
    # Nested product object (for frontend)
    product: Optional[CartProductDetails] = None
    
    # Flat product details (for backward compatibility)
    product_name: Optional[str] = None
    product_unit_type: Optional[str] = None
    product_minimum_quantity: Optional[Decimal] = None
    product_images: Optional[List[str]] = None

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Cart schemas
class CartBase(BaseModel):
    pass

class CartResponse(CartBase):
    id: str
    user_id: str
    items: List[CartItemResponse] = []
    created_at: datetime
    updated_at: datetime
    
    # Computed totals
    total_items: int = 0
    total_amount_cedis: Decimal = Decimal('0')
    total_amount: float = 0.0

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Cart summary for quick display
class CartSummary(BaseModel):
    total_items: int
    total_amount: float
    currency: str = "GHS"

# Add to cart request
class AddToCartRequest(BaseModel):
    product_id: str
    quantity: Decimal

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v

# Update cart item request
class UpdateCartItemRequest(BaseModel):
    quantity: Decimal

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v

# Cart calculations helper
class CartCalculations:
    """Helper class for cart calculations with Ghana units"""
    
    @staticmethod
    def calculate_line_total(price_per_unit: Decimal, quantity: Decimal) -> Decimal:
        """Calculate line total in cents"""
        price_cents = price_per_unit * 100  # Convert GHS to cents
        return price_cents * quantity
    
    @staticmethod
    def calculate_cart_total(items: List[dict]) -> dict:
        """Calculate cart totals"""
        total_items = len(items)
        total_cents = sum(item.get('line_total_cedis', 0) for item in items)
        total_amount = float(total_cents) / 100  # Convert cents to GHS
        
        return {
            'total_items': total_items,
            'total_amount_cedis': total_cents,
            'total_amount': total_amount,
            'currency': 'GHS'
        }
    
    @staticmethod
    def validate_minimum_quantity(product_min_qty: Decimal, requested_qty: Decimal, unit_type: str) -> bool:
        """Validate if requested quantity meets minimum requirement"""
        if requested_qty < product_min_qty:
            return False
        return True
