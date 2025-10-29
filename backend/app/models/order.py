"""
Order models for GoShopGhana
"""

from sqlalchemy import Column, String, Numeric, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class OrderStatus(str, enum.Enum):
    """Order status types"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    """Order model"""
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Order details
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Pricing
    subtotal_cedis = Column(Numeric(12, 0), nullable=False)  # Store in cedis to avoid float issues
    delivery_fee_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    tax_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    total_cedis = Column(Numeric(12, 0), nullable=False)
    
    # Delivery information
    delivery_address = Column(JSON, nullable=True)  # Store address as JSON
    delivery_notes = Column(Text, nullable=True)
    rider_id = Column(String, ForeignKey("riders.id"), nullable=True)
    
    # Delivery tracking
    estimated_delivery_time = Column(DateTime(timezone=True), nullable=True)
    actual_delivery_time = Column(DateTime(timezone=True), nullable=True)
    
    # Delivery feedback
    delivery_rating = Column(Numeric(3, 2), nullable=True)
    delivery_feedback = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships (commented out to avoid circular imports for now)
    # user = relationship("User", back_populates="orders")
    # items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    # Messaging and review relationships
    conversation = relationship("Conversation", back_populates="order", uselist=False)
    reviews = relationship("Review", back_populates="order")

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status}, total={self.total_cedis/100})>"


class OrderItem(Base):
    """Order item model - snapshot of product at time of order"""
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    # Snapshot of product details at time of order
    product_name = Column(String(255), nullable=False)
    product_image_url = Column(String(500), nullable=True)
    price_per_unit_cedis = Column(Numeric(10, 0), nullable=False)  # Store in cedis
    unit_type = Column(String(20), nullable=False)
    quantity = Column(Numeric(8, 2), nullable=False)
    
    # Calculated totals
    line_total_cedis = Column(Numeric(12, 0), nullable=False)

    # Relationships (commented out to avoid circular imports for now)
    # order = relationship("Order", back_populates="items")
    # product = relationship("Product")

    def __repr__(self):
        return f"<OrderItem(id={self.id}, product={self.product_name}, quantity={self.quantity}, total={self.line_total_cedis/100})>"
