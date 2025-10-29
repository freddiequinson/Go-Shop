"""
Order schemas for GoShopGhana
Pydantic models for order management with Ghana market support
"""

from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer
from app.models.order import OrderStatus

# Order Item schemas
class OrderItemBase(BaseModel):
    product_id: str
    product_name: str
    product_image_url: Optional[str] = None
    price_per_unit_cedis: Decimal
    unit_type: str
    quantity: Decimal
    line_total_cedis: Decimal

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: Decimal

class OrderItemResponse(OrderItemBase):
    id: str
    order_id: str
    
    # Computed fields for display
    price_per_unit: Optional[float] = None
    line_total: Optional[float] = None

    class Config:
        from_attributes = True

# Order schemas
class OrderBase(BaseModel):
    delivery_address: Optional[Dict[str, Any]] = None
    delivery_notes: Optional[str] = None

class OrderCreate(OrderBase):
    """Create order from cart"""
    pass

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    delivery_address: Optional[Dict[str, Any]] = None
    delivery_notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: str
    user_id: str
    status: OrderStatus
    subtotal_cedis: Decimal
    delivery_fee_cedis: Decimal
    tax_cedis: Decimal
    total_cedis: Decimal
    created_at: datetime
    updated_at: datetime
    delivered_at: Optional[datetime] = None
    
    # Items in the order
    items: List[OrderItemResponse] = []
    
    # Computed fields for display
    subtotal: Optional[float] = None
    delivery_fee: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None

    @field_serializer('created_at', 'updated_at', 'delivered_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Order summary for lists
class OrderSummary(BaseModel):
    id: str
    status: OrderStatus
    total: float
    item_count: int
    created_at: datetime
    
    @field_serializer('created_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

# Order statistics
class OrderStats(BaseModel):
    total_orders: int
    pending_orders: int
    completed_orders: int
    total_revenue: float
    currency: str = "GHS"

# Delivery address schema
class DeliveryAddress(BaseModel):
    street: str
    area: str
    city: str
    region: str
    phone: str
    additional_info: Optional[str] = None

    @validator('phone')
    def validate_phone(cls, v):
        # Basic Ghana phone number validation
        if not v.startswith('+233') and not v.startswith('0'):
            raise ValueError('Phone number must be a valid Ghana number')
        return v

# Order calculations helper
class OrderCalculations:
    """Helper class for order calculations"""
    
    @staticmethod
    def calculate_delivery_fee(items: List[dict], delivery_address: dict) -> Decimal:
        """Calculate delivery fee based on items and location"""
        # Simple delivery fee calculation for Ghana
        # In reality, this would be more complex based on distance, weight, etc.
        base_fee = Decimal('500')  # 5 GHS base fee in cents
        
        # Add extra fee for items requiring special handling
        extra_fee = Decimal('0')
        for item in items:
            if item.get('unit_type') == 'LITER':  # Liquids need special handling
                extra_fee += Decimal('200')  # 2 GHS extra
        
        return base_fee + extra_fee
    
    @staticmethod
    def calculate_tax(subtotal_cedis: Decimal) -> Decimal:
        """Calculate tax (Ghana VAT is typically 12.5%)"""
        # For now, we'll use a simplified 10% tax
        return subtotal_cedis * Decimal('0.10')
    
    @staticmethod
    def calculate_order_totals(cart_items: List[dict], delivery_address: dict = None) -> dict:
        """Calculate all order totals"""
        subtotal_cedis = sum(Decimal(str(item.get('line_total_cedis', 0))) for item in cart_items)
        
        delivery_fee_cedis = OrderCalculations.calculate_delivery_fee(cart_items, delivery_address or {})
        tax_cedis = OrderCalculations.calculate_tax(subtotal_cedis)
        total_cedis = subtotal_cedis + delivery_fee_cedis + tax_cedis
        
        return {
            'subtotal_cedis': subtotal_cedis,
            'delivery_fee_cedis': delivery_fee_cedis,
            'tax_cedis': tax_cedis,
            'total_cedis': total_cedis,
            'subtotal': float(subtotal_cedis) / 100,
            'delivery_fee': float(delivery_fee_cedis) / 100,
            'tax': float(tax_cedis) / 100,
            'total': float(total_cedis) / 100
        }

# Order status update request
class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None
