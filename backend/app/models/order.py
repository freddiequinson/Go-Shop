"""
Order models for GoShopGhana
"""

from sqlalchemy import Column, String, Numeric, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class OrderStatus(str, enum.Enum):
    """Order status types"""
    # Lowercase values (new standard)
    PENDING_PAYMENT = "pending_payment"
    PAYMENT_FAILED = "payment_failed"
    PENDING_LOWER = "pending"
    CONFIRMED_LOWER = "confirmed"
    PREPARING_LOWER = "preparing"
    DISPATCHED_LOWER = "dispatched"
    DELIVERED_LOWER = "delivered"
    CANCELLED_LOWER = "cancelled"
    # Uppercase values (legacy - for backward compatibility)
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    """Payment status types"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Order(Base):
    """Order model"""
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Order details
    status = Column(Enum(OrderStatus, values_callable=lambda x: [e.value for e in x]), default=OrderStatus.PENDING.value, nullable=False)
    
    # Pricing
    subtotal_cedis = Column(Numeric(12, 0), nullable=False)  # Store in cedis to avoid float issues
    delivery_fee_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    tax_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    total_cedis = Column(Numeric(12, 0), nullable=False)
    
    # Delivery Pricing Details
    delivery_price = Column(Numeric(10, 2), nullable=True)  # Actual delivery price in GHS
    delivery_method = Column(String, nullable=True)  # flat, distance, zone, yango
    delivery_distance = Column(Numeric(10, 2), nullable=True)  # Distance in km
    is_free_delivery = Column(String, default="false", nullable=False)  # Boolean as string
    
    # Coupon Details
    coupon_code = Column(String, nullable=True)
    coupon_discount = Column(Numeric(10, 2), nullable=True)  # Discount amount in GHS
    
    # Payment Details
    payment_status = Column(Enum(PaymentStatus, values_callable=lambda x: [e.value for e in x]), default=PaymentStatus.PENDING.value, nullable=False)
    payment_method = Column(String, nullable=True)  # card, mobile_money, bank_transfer
    payment_reference = Column(String, nullable=True)  # Paystack reference
    payment_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Delivery information
    delivery_address = Column(JSONB, nullable=True)  # Store address as JSONB for PostgreSQL
    delivery_notes = Column(Text, nullable=True)
    rider_id = Column(String, ForeignKey("riders.id"), nullable=True)
    
    # Delivery tracking
    estimated_delivery_time = Column(DateTime(timezone=True), nullable=True)
    actual_delivery_time = Column(DateTime(timezone=True), nullable=True)
    
    # Delivery feedback
    delivery_rating = Column(Numeric(3, 2), nullable=True)
    delivery_feedback = Column(Text, nullable=True)
    
    # Admin Actions
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    dispatched_by = Column(String, ForeignKey("users.id"), nullable=True)
    
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
    delivery_otp = relationship("DeliveryOTP", back_populates="order", uselist=False)

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
    product_image_url = Column(Text, nullable=True)  # TEXT to support base64 images
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


class PaymentAttempt(Base):
    """Payment attempt tracking for orders"""
    __tablename__ = "payment_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    
    # Payment details
    amount_cedis = Column(Numeric(12, 0), nullable=False)
    payment_reference = Column(String, nullable=True)
    status = Column(Enum(PaymentStatus, values_callable=lambda x: [e.value for e in x]), nullable=False)
    payment_method = Column(String, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    paystack_response = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<PaymentAttempt(id={self.id}, order_id={self.order_id}, status={self.status}, amount={self.amount_cedis/100})>"
