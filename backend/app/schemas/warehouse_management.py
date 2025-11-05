"""
Pydantic schemas for Warehouse Management System
"""

from typing import Optional, List, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal


# ==================== Warehouse Location Schemas ====================

class WarehouseLocationBase(BaseModel):
    """Base schema for warehouse location"""
    name: str = Field(..., max_length=100, description="Location name")
    code: str = Field(..., max_length=50, description="Unique location code")
    zone_type: str = Field(..., description="Zone type: cold_room, freezer, dry_storage, ambient, refrigerated")
    capacity: Optional[Decimal] = Field(None, description="Maximum capacity")
    temperature_min: Optional[Decimal] = Field(None, description="Minimum temperature in Celsius")
    temperature_max: Optional[Decimal] = Field(None, description="Maximum temperature in Celsius")
    humidity_level: Optional[str] = Field(None, max_length=50, description="Humidity level")
    description: Optional[str] = None
    is_active: bool = True


class WarehouseLocationCreate(WarehouseLocationBase):
    """Schema for creating warehouse location"""
    pass


class WarehouseLocationUpdate(BaseModel):
    """Schema for updating warehouse location"""
    name: Optional[str] = Field(None, max_length=100)
    zone_type: Optional[str] = None
    capacity: Optional[Decimal] = None
    current_utilization: Optional[Decimal] = None
    temperature_min: Optional[Decimal] = None
    temperature_max: Optional[Decimal] = None
    humidity_level: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class WarehouseLocationResponse(WarehouseLocationBase):
    """Schema for warehouse location response"""
    id: str
    current_utilization: Decimal
    utilization_percentage: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Goods Received Note (GRN) Schemas ====================

class GoodsReceivedNoteBase(BaseModel):
    """Base schema for GRN"""
    supplier_id: str
    product_id: str
    batch_number: Optional[str] = Field(None, max_length=100)
    
    # Dual quantity support (at least one required)
    quantity_received_pieces: Optional[Decimal] = Field(None, description="Quantity in pieces")
    quantity_received_weight: Optional[Decimal] = Field(None, description="Quantity by weight")
    weight_unit: Optional[str] = Field(None, max_length=20, description="Weight unit: kg, g, lbs")
    
    # Costing
    unit_cost: Decimal = Field(..., gt=0, description="Cost per unit")
    
    # Dates
    delivery_date: datetime
    manufacturing_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    
    # Location
    warehouse_location_id: str
    
    # Images
    images: Optional[List[str]] = Field(None, description="Array of image URLs or base64 strings")
    
    # Notes
    notes: Optional[str] = None

    @validator('quantity_received_pieces', 'quantity_received_weight')
    def at_least_one_quantity(cls, v, values):
        """Ensure at least one quantity type is provided"""
        if 'quantity_received_pieces' in values:
            if not v and not values.get('quantity_received_pieces'):
                raise ValueError('At least one of quantity_received_pieces or quantity_received_weight must be provided')
        return v


class GoodsReceivedNoteCreate(GoodsReceivedNoteBase):
    """Schema for creating GRN"""
    pass


class GoodsReceivedNoteUpdate(BaseModel):
    """Schema for updating GRN"""
    batch_number: Optional[str] = None
    quantity_received_pieces: Optional[Decimal] = None
    quantity_received_weight: Optional[Decimal] = None
    weight_unit: Optional[str] = None
    unit_cost: Optional[Decimal] = None
    delivery_date: Optional[datetime] = None
    manufacturing_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    warehouse_location_id: Optional[str] = None
    quality_check_status: Optional[str] = None
    quality_notes: Optional[str] = None
    images: Optional[List[str]] = None
    notes: Optional[str] = None


class QualityCheckUpdate(BaseModel):
    """Schema for quality check update"""
    quality_check_status: str = Field(..., description="pending, approved, rejected, partial")
    quality_notes: Optional[str] = None


class GoodsReceivedNoteResponse(GoodsReceivedNoteBase):
    """Schema for GRN response"""
    id: str
    grn_number: str
    total_cost: Decimal
    quality_check_status: str
    quality_check_by: Optional[str] = None
    quality_check_date: Optional[datetime] = None
    quality_notes: Optional[str] = None
    received_by: str
    is_perishable: bool
    days_until_expiry: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    supplier_name: Optional[str] = None
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class GoodsReceivedNoteListResponse(BaseModel):
    """Schema for GRN list response"""
    items: List[GoodsReceivedNoteResponse]
    total: int
    page: int
    page_size: int


# ==================== Wastage Record Schemas ====================

class WastageRecordBase(BaseModel):
    """Base schema for wastage record"""
    product_id: str
    batch_number: Optional[str] = Field(None, max_length=100)
    
    # Dual quantity support
    quantity_wasted_pieces: Optional[Decimal] = Field(None, description="Quantity wasted in pieces")
    quantity_wasted_weight: Optional[Decimal] = Field(None, description="Quantity wasted by weight")
    weight_unit: Optional[str] = Field(None, max_length=20)
    
    # Reason
    reason: str = Field(..., description="expired, damaged, returned, contaminated, spoiled, other")
    warehouse_location_id: Optional[str] = None
    
    # Cost
    cost_value: Optional[Decimal] = Field(None, description="Value of wasted goods")
    
    # Images
    images: Optional[List[str]] = Field(None, description="Documentation images")
    
    # Notes
    notes: Optional[str] = None


class WastageRecordCreate(WastageRecordBase):
    """Schema for creating wastage record"""
    pass


class WastageRecordResponse(WastageRecordBase):
    """Schema for wastage record response"""
    id: str
    recorded_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class WastageRecordListResponse(BaseModel):
    """Schema for wastage record list response"""
    items: List[WastageRecordResponse]
    total: int
    page: int
    page_size: int


# ==================== Pick List Schemas ====================

class PickListItemBase(BaseModel):
    """Base schema for pick list item"""
    product_id: str
    batch_number: Optional[str] = None
    warehouse_location_id: Optional[str] = None
    
    # Dual quantity support
    quantity_to_pick_pieces: Optional[Decimal] = None
    quantity_to_pick_weight: Optional[Decimal] = None
    weight_unit: Optional[str] = None
    
    notes: Optional[str] = None


class PickListItemCreate(PickListItemBase):
    """Schema for creating pick list item"""
    pass


class PickListItemUpdate(BaseModel):
    """Schema for updating pick list item"""
    quantity_picked_pieces: Optional[Decimal] = None
    quantity_picked_weight: Optional[Decimal] = None
    picked: Optional[bool] = None
    notes: Optional[str] = None


class PickListItemResponse(PickListItemBase):
    """Schema for pick list item response"""
    id: str
    pick_list_id: str
    quantity_picked_pieces: Optional[Decimal] = None
    quantity_picked_weight: Optional[Decimal] = None
    picked: bool
    picked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PickListBase(BaseModel):
    """Base schema for pick list"""
    order_id: str
    priority: str = Field("medium", description="low, medium, high, urgent")
    notes: Optional[str] = None


class PickListCreate(PickListBase):
    """Schema for creating pick list"""
    items: Optional[List[PickListItemCreate]] = None


class PickListUpdate(BaseModel):
    """Schema for updating pick list"""
    status: Optional[str] = Field(None, description="pending, in_progress, completed, cancelled")
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None


class PickListAssign(BaseModel):
    """Schema for assigning pick list"""
    assigned_to: str


class PickListResponse(PickListBase):
    """Schema for pick list response"""
    id: str
    pick_list_number: str
    status: str
    assigned_to: Optional[str] = None
    items: List[PickListItemResponse] = []
    is_complete: bool
    completion_percentage: float
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PickListListResponse(BaseModel):
    """Schema for pick list list response"""
    items: List[PickListResponse]
    total: int
    page: int
    page_size: int


# ==================== Analytics & Reports ====================

class WastageAnalytics(BaseModel):
    """Wastage analytics response"""
    total_wastage_value: Decimal
    wastage_by_reason: dict
    wastage_by_product: List[dict]
    wastage_trend: List[dict]


class PerishableAlert(BaseModel):
    """Perishable product alert"""
    product_id: str
    product_name: str
    batch_number: Optional[str]
    expiry_date: datetime
    days_until_expiry: int
    quantity_pieces: Optional[Decimal]
    quantity_weight: Optional[Decimal]
    warehouse_location: str
    urgency: str  # critical, high, medium, low


class PerishableAlertsResponse(BaseModel):
    """Response for perishable alerts"""
    expiring_soon: List[PerishableAlert]
    expired: List[PerishableAlert]
    total_expiring: int
    total_expired: int
