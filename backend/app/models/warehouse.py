"""
Warehouse models for GoShopGhana
Inventory management and tracking
"""

from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects import postgresql
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


class ZoneType(str, enum.Enum):
    """Warehouse zone types"""
    COLD_ROOM = "cold_room"
    FREEZER = "freezer"
    DRY_STORAGE = "dry_storage"
    AMBIENT = "ambient"
    REFRIGERATED = "refrigerated"


class QualityCheckStatus(str, enum.Enum):
    """Quality check status for GRN"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PARTIAL = "partial"


class WastageReason(str, enum.Enum):
    """Reasons for wastage"""
    EXPIRED = "expired"
    DAMAGED = "damaged"
    RETURNED = "returned"
    CONTAMINATED = "contaminated"
    SPOILED = "spoiled"
    OTHER = "other"


class PickListStatus(str, enum.Enum):
    """Pick list status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


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
    warehouse_location_id = Column(String, ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    location_in_warehouse = Column(String(100), nullable=True)  # Shelf/bin number
    zone = Column(String(50), nullable=True)  # Warehouse zone (e.g., "Cold Storage", "Dry Goods")
    
    # Tracking
    received_date = Column(DateTime(timezone=True), nullable=True)  # Last received
    manufacturing_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)  # For perishables
    batch_number = Column(String(100), nullable=True)
    
    # Perishable tracking
    is_perishable = Column(Boolean, default=False, nullable=False)
    storage_condition = Column(String(100), nullable=True)
    
    # Supplier info
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    
    # Costing
    unit_cost = Column(Numeric(10, 2), nullable=True)
    total_cost = Column(Numeric(12, 2), nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=True)  # Average cost (legacy)
    total_value = Column(Numeric(12, 2), nullable=True)  # quantity * cost_price (legacy)
    
    # Dual quantity support
    quantity_in_pieces = Column(Numeric(10, 2), nullable=True)
    quantity_in_weight = Column(Numeric(10, 2), nullable=True)
    weight_unit = Column(String(20), nullable=True)  # kg, g, lbs
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_counted_at = Column(DateTime(timezone=True), nullable=True)  # Last physical count

    # Relationships
    movements = relationship("InventoryMovement", back_populates="inventory")
    alerts = relationship("StockAlert", back_populates="inventory")
    warehouse_location = relationship("WarehouseLocation", back_populates="inventory_items")

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


class WarehouseLocation(Base):
    """Warehouse location/zone management"""
    __tablename__ = "warehouse_locations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True, index=True)
    
    # Zone details
    zone_type = Column(Enum(ZoneType), nullable=False)
    capacity = Column(Numeric(10, 2), nullable=True)
    current_utilization = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Environmental conditions
    temperature_min = Column(Numeric(5, 2), nullable=True)  # Celsius
    temperature_max = Column(Numeric(5, 2), nullable=True)  # Celsius
    humidity_level = Column(String(50), nullable=True)
    
    # Additional info
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    inventory_items = relationship("WarehouseInventory", back_populates="warehouse_location")
    grn_records = relationship("GoodsReceivedNote", back_populates="warehouse_location")

    @property
    def utilization_percentage(self):
        """Calculate utilization percentage"""
        if self.capacity and self.capacity > 0:
            return (self.current_utilization / self.capacity) * 100
        return 0

    def __repr__(self):
        return f"<WarehouseLocation(name={self.name}, zone={self.zone_type})>"


class GoodsReceivedNote(Base):
    """Goods Received Notes (GRN) for tracking supplier deliveries"""
    __tablename__ = "goods_received_notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    grn_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # References
    supplier_id = Column(String, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String(100), nullable=True)
    
    # Dual quantity support (pieces OR weight OR both)
    quantity_received_pieces = Column(Numeric(10, 2), nullable=True)
    quantity_received_weight = Column(Numeric(10, 2), nullable=True)
    weight_unit = Column(String(20), nullable=True)  # kg, g, lbs
    
    # Costing
    unit_cost = Column(Numeric(10, 2), nullable=False)
    total_cost = Column(Numeric(12, 2), nullable=False)
    
    # Dates
    delivery_date = Column(DateTime(timezone=True), nullable=False)
    manufacturing_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    
    # Location
    warehouse_location_id = Column(String, ForeignKey("warehouse_locations.id", ondelete="RESTRICT"), nullable=False)
    
    # Quality check
    quality_check_status = Column(Enum(QualityCheckStatus), default=QualityCheckStatus.PENDING, nullable=False)
    quality_check_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    quality_check_date = Column(DateTime(timezone=True), nullable=True)
    quality_notes = Column(Text, nullable=True)
    
    # Images (JSON array)
    images = Column(postgresql.JSONB, nullable=True)
    
    # Additional info
    notes = Column(Text, nullable=True)
    received_by = Column(String, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    # Supplier rating (added when receiving order)
    supplier_rating = Column(Numeric(2, 1), nullable=True)  # 1.0 to 5.0
    supplier_feedback = Column(Text, nullable=True)
    rated_at = Column(DateTime(timezone=True), nullable=True)
    rated_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    warehouse_location = relationship("WarehouseLocation", back_populates="grn_records")

    @property
    def is_perishable(self):
        """Check if product is perishable"""
        return self.expiry_date is not None

    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        if self.expiry_date:
            delta = self.expiry_date - func.now()
            return delta.days
        return None

    def __repr__(self):
        return f"<GoodsReceivedNote(grn_number={self.grn_number}, status={self.quality_check_status})>"


class WastageRecord(Base):
    """Track wastage of products"""
    __tablename__ = "wastage_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String(100), nullable=True)
    
    # Dual quantity support
    quantity_wasted_pieces = Column(Numeric(10, 2), nullable=True)
    quantity_wasted_weight = Column(Numeric(10, 2), nullable=True)
    weight_unit = Column(String(20), nullable=True)
    
    # Reason
    reason = Column(Enum(WastageReason), nullable=False)
    warehouse_location_id = Column(String, ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    
    # Cost
    cost_value = Column(Numeric(12, 2), nullable=True)
    
    # Images (for documentation)
    images = Column(postgresql.JSONB, nullable=True)
    
    # Details
    notes = Column(Text, nullable=True)
    recorded_by = Column(String, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<WastageRecord(product_id={self.product_id}, reason={self.reason})>"


class PickList(Base):
    """Pick lists for order fulfillment"""
    __tablename__ = "pick_lists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pick_list_number = Column(String(50), nullable=False, unique=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    
    # Status
    status = Column(Enum(PickListStatus), default=PickListStatus.PENDING, nullable=False)
    assigned_to = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    
    # Details
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    items = relationship("PickListItem", back_populates="pick_list", cascade="all, delete-orphan")

    @property
    def is_complete(self):
        """Check if all items are picked"""
        return all(item.picked for item in self.items)

    @property
    def completion_percentage(self):
        """Calculate completion percentage"""
        if not self.items:
            return 0
        picked_count = sum(1 for item in self.items if item.picked)
        return (picked_count / len(self.items)) * 100

    def __repr__(self):
        return f"<PickList(number={self.pick_list_number}, status={self.status})>"


class PickListItem(Base):
    """Individual items in a pick list"""
    __tablename__ = "pick_list_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pick_list_id = Column(String, ForeignKey("pick_lists.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String(100), nullable=True)
    warehouse_location_id = Column(String, ForeignKey("warehouse_locations.id", ondelete="SET NULL"), nullable=True)
    
    # Dual quantity support
    quantity_to_pick_pieces = Column(Numeric(10, 2), nullable=True)
    quantity_to_pick_weight = Column(Numeric(10, 2), nullable=True)
    quantity_picked_pieces = Column(Numeric(10, 2), default=0, nullable=True)
    quantity_picked_weight = Column(Numeric(10, 2), default=0, nullable=True)
    weight_unit = Column(String(20), nullable=True)
    
    # Status
    picked = Column(Boolean, default=False, nullable=False)
    picked_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    pick_list = relationship("PickList", back_populates="items")

    def __repr__(self):
        return f"<PickListItem(product_id={self.product_id}, picked={self.picked})>"
