"""
Warehouse schemas for GoShopGhana
Pydantic models for warehouse and inventory management
"""

from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer
from app.models.warehouse import MovementType, AlertType, AlertStatus, RestockStatus


# Warehouse Inventory schemas
class WarehouseInventoryBase(BaseModel):
    quantity_available: Decimal = Decimal("0")
    quantity_reserved: Decimal = Decimal("0")
    quantity_damaged: Decimal = Decimal("0")
    reorder_level: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    location_in_warehouse: Optional[str] = None
    zone: Optional[str] = None
    expiry_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    supplier_id: Optional[str] = None
    cost_price: Optional[Decimal] = None


class WarehouseInventoryCreate(WarehouseInventoryBase):
    product_id: str


class WarehouseInventoryUpdate(BaseModel):
    quantity_available: Optional[Decimal] = None
    quantity_reserved: Optional[Decimal] = None
    quantity_damaged: Optional[Decimal] = None
    reorder_level: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    location_in_warehouse: Optional[str] = None
    zone: Optional[str] = None
    expiry_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    supplier_id: Optional[str] = None
    cost_price: Optional[Decimal] = None


class WarehouseInventoryResponse(WarehouseInventoryBase):
    id: str
    product_id: str
    total_value: Optional[Decimal] = None
    received_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    last_counted_at: Optional[datetime] = None
    warehouse_location_id: Optional[str] = None
    
    # Product details (populated via join)
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    is_published: Optional[bool] = None
    created_by_type: Optional[str] = None
    price_per_unit: Optional[Decimal] = None  # Selling price to customers
    product_cost_price: Optional[Decimal] = None  # What we paid supplier
    
    # Location details (populated via join)
    location_name: Optional[str] = None
    location_code: Optional[str] = None
    zone_type: Optional[str] = None
    temperature_min: Optional[Decimal] = None
    temperature_max: Optional[Decimal] = None

    @field_serializer('created_at', 'updated_at', 'received_date', 'last_counted_at', 'expiry_date')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


class InventoryListResponse(BaseModel):
    """Paginated inventory list response"""
    items: List[WarehouseInventoryResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Inventory Adjustment
class InventoryAdjustment(BaseModel):
    product_id: str
    quantity: Decimal
    movement_type: MovementType
    reason: str
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    unit_cost: Optional[Decimal] = None

    @validator('quantity')
    def validate_quantity(cls, v):
        if v == 0:
            raise ValueError('Quantity cannot be zero')
        return v


# Allocate quantity to shop
class AllocateToShopRequest(BaseModel):
    product_id: str
    quantity: Decimal
    unit: Optional[str] = None  # 'kg', 'pieces', etc.
    notes: Optional[str] = None
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than zero')
        return v


# Assign location
class AssignLocationRequest(BaseModel):
    warehouse_location_id: str
    location_in_warehouse: Optional[str] = None  # Shelf/bin number
    notes: Optional[str] = None


# Inventory Movement schemas
class InventoryMovementBase(BaseModel):
    product_id: str
    movement_type: MovementType
    quantity: Decimal
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    unit_cost: Optional[Decimal] = None


class InventoryMovementCreate(InventoryMovementBase):
    pass


class InventoryMovementResponse(InventoryMovementBase):
    id: str
    inventory_id: Optional[str] = None
    total_cost: Optional[Decimal] = None
    performed_by: str
    created_at: datetime

    @field_serializer('created_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    class Config:
        from_attributes = True


# Stock Alert schemas
class StockAlertBase(BaseModel):
    product_id: str
    alert_type: AlertType
    threshold_value: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    priority: str = "medium"
    message: Optional[str] = None


class StockAlertCreate(StockAlertBase):
    pass


class StockAlertUpdate(BaseModel):
    status: Optional[AlertStatus] = None
    resolution_notes: Optional[str] = None


class StockAlertResponse(StockAlertBase):
    id: str
    inventory_id: Optional[str] = None
    status: AlertStatus
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at', 'resolved_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


# Restock Order schemas
class RestockOrderBase(BaseModel):
    supplier_id: str
    product_id: str
    quantity_ordered: Decimal
    expected_delivery_date: Optional[datetime] = None
    cost_per_unit: Decimal
    tax_amount: Decimal = Decimal("0")
    shipping_cost: Decimal = Decimal("0")
    notes: Optional[str] = None

    @validator('quantity_ordered', 'cost_per_unit')
    def validate_positive(cls, v):
        if v <= 0:
            raise ValueError('Value must be greater than 0')
        return v


class RestockOrderCreate(RestockOrderBase):
    pass


class RestockOrderUpdate(BaseModel):
    expected_delivery_date: Optional[datetime] = None
    status: Optional[RestockStatus] = None
    quantity_received: Optional[Decimal] = None
    actual_delivery_date: Optional[datetime] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    delivery_notes: Optional[str] = None
    quality_check_notes: Optional[str] = None
    notes: Optional[str] = None


class RestockOrderResponse(RestockOrderBase):
    id: str
    order_number: str
    quantity_received: Decimal
    order_date: datetime
    actual_delivery_date: Optional[datetime] = None
    status: RestockStatus
    total_cost: Decimal
    grand_total: Decimal
    payment_status: str
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    delivery_notes: Optional[str] = None
    quality_check_notes: Optional[str] = None
    created_by: str
    received_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at', 'order_date', 'expected_delivery_date', 'actual_delivery_date')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


class RestockOrderListResponse(BaseModel):
    orders: List[RestockOrderResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Warehouse Analytics
class WarehouseAnalytics(BaseModel):
    total_products: int
    total_value: Decimal
    total_stock_value: Optional[Decimal] = None  # Alias for frontend
    low_stock_count: int
    low_stock_items: Optional[int] = None  # Alias for frontend
    out_of_stock_count: int
    out_of_stock_items: Optional[int] = None  # Alias for frontend
    expiring_soon_count: int
    expired_count: int
    average_stock_age_days: float
    total_movements_today: int
    movements_this_month: Optional[int] = None  # For frontend
    total_received_today: Decimal
    total_dispatched_today: Decimal
    top_moving_products: Optional[List[dict]] = []  # For frontend


# Inventory Filter
class InventoryFilter(BaseModel):
    search: Optional[str] = None
    zone: Optional[str] = None
    supplier_id: Optional[str] = None
    low_stock_only: bool = False
    out_of_stock_only: bool = False
    expiring_soon_only: bool = False
    min_quantity: Optional[Decimal] = None
    max_quantity: Optional[Decimal] = None


# Stock Take
class StockTakeRequest(BaseModel):
    product_id: str
    counted_quantity: Decimal
    notes: Optional[str] = None

    @validator('counted_quantity')
    def validate_positive(cls, v):
        if v < 0:
            raise ValueError('Quantity cannot be negative')
        return v


class StockTakeResponse(BaseModel):
    product_id: str
    expected_quantity: Decimal
    counted_quantity: Decimal
    variance: Decimal
    variance_percentage: float
    adjustment_made: bool
    notes: Optional[str] = None
