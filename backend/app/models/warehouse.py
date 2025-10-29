"""
Warehouse models for GoShopGhana
Inventory management and tracking
"""

from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class MovementType(str, enum.Enum):
    """Inventory movement types"""
    IN = "in"  # Stock received
    OUT = "out"  # Stock sold/dispatched
    ADJUSTMENT = "adjustment"  # Manual adjustment
    DAMAGED = "damaged"  # Damaged goods
    EXPIRED = "expired"  # Expired goods
    RETURNED = "returned"  # Customer return
    TRANSFER = "transfer"  # Transfer between locations


class AlertType(str, enum.Enum):
    """Stock alert types"""
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"
    OVERSTOCKED = "overstocked"


class AlertStatus(str, enum.Enum):
    """Alert status"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class RestockStatus(str, enum.Enum):
    """Restock order status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_TRANSIT = "in_transit"
    RECEIVED = "received"
    CANCELLED = "cancelled"
    PARTIAL = "partial"  # Partially received


class WarehouseInventory(Base):
    """Warehouse inventory tracking"""
    __tablename__ = "warehouse_inventory"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False, unique=True)
    
    # Quantity tracking
    quantity_available = Column(Numeric(10, 2), default=0, nullable=False)
    quantity_reserved = Column(Numeric(10, 2), default=0, nullable=False)  # For pending orders
    quantity_damaged = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Reorder management
    reorder_level = Column(Numeric(10, 2), nullable=True)  # Trigger for restock
    reorder_quantity = Column(Numeric(10, 2), nullable=True)  # How much to order
    
    # Location
    location_in_warehouse = Column(String(100), nullable=True)  # Shelf/bin number
    zone = Column(String(50), nullable=True)  # Warehouse zone (e.g., "Cold Storage", "Dry Goods")
    
    # Tracking
    received_date = Column(DateTime(timezone=True), nullable=True)  # Last received
    expiry_date = Column(DateTime(timezone=True), nullable=True)  # For perishables
    batch_number = Column(String(100), nullable=True)
    
    # Supplier info
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    
    # Costing
    cost_price = Column(Numeric(10, 2), nullable=True)  # Average cost
    total_value = Column(Numeric(12, 2), nullable=True)  # quantity * cost_price
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_counted_at = Column(DateTime(timezone=True), nullable=True)  # Last physical count

    # Relationships
    movements = relationship("InventoryMovement", back_populates="inventory")
    alerts = relationship("StockAlert", back_populates="inventory")

    @property
    def quantity_total(self):
        """Total quantity including reserved"""
        return self.quantity_available + self.quantity_reserved

    @property
    def days_in_stock(self):
        """Days since received"""
        if self.received_date:
            return (func.now() - self.received_date).days
        return None

    def __repr__(self):
        return f"<WarehouseInventory(product_id={self.product_id}, available={self.quantity_available})>"


class InventoryMovement(Base):
    """Track all inventory movements"""
    __tablename__ = "inventory_movements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    inventory_id = Column(String, ForeignKey("warehouse_inventory.id"), nullable=True)
    
    # Movement details
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    
    # Location tracking
    from_location = Column(String(100), nullable=True)
    to_location = Column(String(100), nullable=True)
    
    # Reference
    reference_type = Column(String(50), nullable=True)  # order, restock, adjustment
    reference_id = Column(String, nullable=True)  # order_id, restock_id, etc.
    
    # Details
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    batch_number = Column(String(100), nullable=True)
    
    # Cost tracking
    unit_cost = Column(Numeric(10, 2), nullable=True)
    total_cost = Column(Numeric(12, 2), nullable=True)
    
    # Performed by
    performed_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    inventory = relationship("WarehouseInventory", back_populates="movements")

    def __repr__(self):
        return f"<InventoryMovement(type={self.movement_type}, quantity={self.quantity})>"


class StockAlert(Base):
    """Stock alerts for inventory management"""
    __tablename__ = "stock_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    inventory_id = Column(String, ForeignKey("warehouse_inventory.id"), nullable=True)
    
    # Alert details
    alert_type = Column(Enum(AlertType), nullable=False)
    threshold_value = Column(Numeric(10, 2), nullable=True)
    current_value = Column(Numeric(10, 2), nullable=True)
    
    # Status
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False)
    
    # Priority
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, critical
    
    # Message
    message = Column(Text, nullable=True)
    
    # Resolution
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    inventory = relationship("WarehouseInventory", back_populates="alerts")

    def __repr__(self):
        return f"<StockAlert(type={self.alert_type}, status={self.status})>"


class RestockOrder(Base):
    """Purchase orders for restocking inventory"""
    __tablename__ = "restock_orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    
    # Supplier
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    
    # Product
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    # Quantities
    quantity_ordered = Column(Numeric(10, 2), nullable=False)
    quantity_received = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Dates
    order_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expected_delivery_date = Column(DateTime(timezone=True), nullable=True)
    actual_delivery_date = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    status = Column(Enum(RestockStatus), default=RestockStatus.PENDING, nullable=False)
    
    # Costing
    cost_per_unit = Column(Numeric(10, 2), nullable=False)
    total_cost = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0, nullable=False)
    shipping_cost = Column(Numeric(12, 2), default=0, nullable=False)
    grand_total = Column(Numeric(12, 2), nullable=False)
    
    # Payment
    payment_status = Column(String(50), default="pending", nullable=False)
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(100), nullable=True)
    
    # Additional info
    notes = Column(Text, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    quality_check_notes = Column(Text, nullable=True)
    
    # Created by
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    received_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="restock_orders")

    @property
    def is_complete(self):
        """Check if order is fully received"""
        return self.quantity_received >= self.quantity_ordered

    @property
    def is_partial(self):
        """Check if order is partially received"""
        return 0 < self.quantity_received < self.quantity_ordered

    def __repr__(self):
        return f"<RestockOrder(order_number={self.order_number}, status={self.status})>"
