"""
Shopping cart models for GoShopGhana
Supports Ghana market quantified sales with units
"""

import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Cart(Base):
    """Shopping cart model - one per user"""
    __tablename__ = "carts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships (commented out to avoid circular imports for now)
    # user = relationship("User", back_populates="cart")
    # items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Cart(id={self.id}, user_id={self.user_id})>"


class CartItem(Base):
    """Cart item model - products added to cart with quantities"""
    __tablename__ = "cart_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id = Column(String, ForeignKey("carts.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    # Quantity in the product's unit type (kg, piece, liter, etc.)
    quantity = Column(Numeric(8, 2), nullable=False)
    
    # Price snapshot at time of adding to cart (in GHS cedis)
    price_per_unit_cedis = Column(Numeric(10, 0), nullable=False)
    
    # Calculated line total (in GHS cedis)
    line_total_cedis = Column(Numeric(12, 0), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships (commented out to avoid circular imports for now)
    # cart = relationship("Cart", back_populates="items")
    # product = relationship("Product")

    def __repr__(self):
        return f"<CartItem(id={self.id}, product_id={self.product_id}, quantity={self.quantity})>"

    @property
    def price_per_unit(self):
        """Get price per unit in GHS (converted from cedis)"""
        return float(self.price_per_unit_cedis) / 100

    @property
    def line_total(self):
        """Get line total in GHS (converted from cedis)"""
        return float(self.line_total_cedis) / 100

    def calculate_line_total(self):
        """Calculate and update line total based on quantity and price"""
        self.line_total_cedis = self.price_per_unit_cedis * self.quantity
        return self.line_total_cedis
