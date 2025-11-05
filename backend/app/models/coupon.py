"""
Coupon model for GoShopGhana
Comprehensive coupon system with multiple benefit types
"""

from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base
import uuid


class Coupon(Base):
    """Coupon model with multiple benefit types"""
    __tablename__ = "coupons"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic Info
    code = Column(String, unique=True, nullable=False, index=True)  # e.g., "FREESHIP", "SAVE20"
    name = Column(String, nullable=False)  # Display name
    description = Column(String, nullable=True)
    
    # Benefit Type: 'free_delivery', 'delivery_discount', 'wallet_credit', 'product_discount', 'specific_product'
    benefit_type = Column(String, nullable=False)
    
    # Discount Values (use based on benefit_type)
    discount_value = Column(Numeric(10, 2), nullable=True)  # Amount or percentage value
    discount_type = Column(String, nullable=True)  # 'percentage' or 'fixed'
    
    # Delivery Benefits
    free_delivery = Column(Boolean, default=False)  # Override delivery to free
    delivery_discount_percent = Column(Numeric(5, 2), nullable=True)  # % off delivery
    delivery_discount_fixed = Column(Numeric(10, 2), nullable=True)  # Fixed amount off delivery
    
    # Wallet Credit
    wallet_credit_amount = Column(Numeric(10, 2), nullable=True)  # Add to wallet
    
    # Product Discounts
    product_discount_percent = Column(Numeric(5, 2), nullable=True)  # % off products
    product_discount_fixed = Column(Numeric(10, 2), nullable=True)  # Fixed amount off
    
    # Specific Product Targeting
    specific_product_ids = Column(JSON, nullable=True)  # List of product IDs
    specific_category_ids = Column(JSON, nullable=True)  # List of category IDs
    
    # Restrictions
    min_order_amount = Column(Numeric(10, 2), nullable=True)  # Minimum order value
    max_discount_amount = Column(Numeric(10, 2), nullable=True)  # Cap on discount
    
    # Usage Limits
    max_uses = Column(Integer, nullable=True)  # Total uses allowed
    max_uses_per_user = Column(Integer, default=1)  # Uses per user
    uses_count = Column(Integer, default=0)  # Current usage count
    
    # User Restrictions
    user_type_restriction = Column(String, nullable=True)  # 'buyer', 'seller', 'all'
    first_order_only = Column(Boolean, default=False)  # Only for first order
    
    # Validity
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Show in public coupon list
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String, nullable=True)  # Admin user ID
    
    # Notes
    internal_notes = Column(String, nullable=True)  # Admin notes
