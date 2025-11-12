"""
Pydantic schemas for Supply Requests and Offers
"""

from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ============= Supply Request Schemas =============

class SupplyRequestBase(BaseModel):
    """Base schema for supply request"""
    product_id: Optional[str] = None  # Nullable for open requests
    product_name: Optional[str] = None  # For open requests without product_id
    quantity_needed: Decimal = Field(gt=0)
    unit_type: str
    supplier_id: Optional[str] = None
    is_open_request: bool = False
    target_categories: Optional[List[str]] = None
    required_by_date: datetime
    delivery_location: Optional[str] = None
    max_budget: Optional[Decimal] = None
    estimated_unit_price: Optional[Decimal] = None
    special_requirements: Optional[str] = None
    internal_notes: Optional[str] = None
    deadline: Optional[datetime] = None


class SupplyRequestCreate(SupplyRequestBase):
    """Schema for creating supply request"""
    pass


class SupplyRequestUpdate(BaseModel):
    """Schema for updating supply request"""
    quantity_needed: Optional[Decimal] = Field(None, gt=0)
    required_by_date: Optional[datetime] = None
    delivery_location: Optional[str] = None
    max_budget: Optional[Decimal] = None
    estimated_unit_price: Optional[Decimal] = None
    special_requirements: Optional[str] = None
    internal_notes: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None


class SupplyRequestResponse(SupplyRequestBase):
    """Schema for supply request response"""
    id: str
    request_number: str
    status: str
    created_by_user_id: str
    accepted_offer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    # Related data
    product_name: Optional[str] = None
    supplier_name: Optional[str] = None
    created_by_name: Optional[str] = None
    offers_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class SupplyRequestFilter(BaseModel):
    """Schema for filtering supply requests"""
    status: Optional[str] = None
    is_open_request: Optional[bool] = None
    product_id: Optional[str] = None
    supplier_id: Optional[str] = None
    created_by_user_id: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


# ============= Supply Offer Schemas =============

class SupplyOfferBase(BaseModel):
    """Base schema for supply offer"""
    supply_request_id: Optional[str] = None  # Nullable for direct orders
    offered_quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    delivery_date: datetime
    delivery_time_hours: Optional[int] = Field(None, gt=0)
    delivery_fee: Decimal = Field(default=Decimal("0"), ge=0)
    quality_guarantee: Optional[str] = None
    sample_available: bool = False
    certifications: Optional[List[str]] = None
    notes: Optional[str] = None
    
    @validator('delivery_date')
    def validate_delivery_date(cls, v):
        from datetime import timezone
        # Make datetime timezone-aware for comparison
        now = datetime.now(timezone.utc)
        # If v is naive, make it aware
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v < now:
            raise ValueError('Delivery date must be in the future')
        return v


class SupplyOfferCreate(SupplyOfferBase):
    """Schema for creating supply offer"""
    
    @property
    def total_price(self) -> Decimal:
        return self.offered_quantity * self.unit_price + self.delivery_fee


class SupplyOfferUpdate(BaseModel):
    """Schema for updating supply offer"""
    offered_quantity: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, gt=0)
    delivery_date: Optional[datetime] = None
    delivery_time_hours: Optional[int] = Field(None, gt=0)
    delivery_fee: Optional[Decimal] = Field(None, ge=0)
    quality_guarantee: Optional[str] = None
    sample_available: Optional[bool] = None
    certifications: Optional[List[str]] = None
    notes: Optional[str] = None


class SupplyOfferResponse(BaseModel):
    """Schema for supply offer response"""
    id: str
    supplier_id: str
    supply_request_id: Optional[str] = None
    offered_quantity: Decimal
    unit_price: Decimal
    delivery_date: datetime  # No validator - allow past dates for historical data
    delivery_time_hours: Optional[int] = None
    delivery_fee: Decimal
    quality_guarantee: Optional[str] = None
    sample_available: bool = False
    certifications: Optional[List[str]] = None
    notes: Optional[str] = None
    total_price: Decimal
    status: str
    is_direct_order: bool = False
    order_source: Optional[str] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    responded_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    
    # Related data
    supplier_name: Optional[str] = None
    supplier_rating: Optional[Decimal] = None
    supplier_on_time_rate: Optional[Decimal] = None
    request_number: Optional[str] = None
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    
    class Config:
        from_attributes = True


class SupplyOfferFilter(BaseModel):
    """Schema for filtering supply offers"""
    supply_request_id: Optional[str] = None
    supplier_id: Optional[str] = None
    status: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class AcceptOfferRequest(BaseModel):
    """Schema for accepting an offer"""
    offer_id: str
    admin_notes: Optional[str] = None


class SupplierRatingInput(BaseModel):
    """Schema for rating a supplier when receiving order"""
    rating: float  # 1.0 to 5.0
    feedback: Optional[str] = None
    warehouse_location_id: Optional[str] = None
    
    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v < 1.0 or v > 5.0:
            raise ValueError('Rating must be between 1.0 and 5.0')
        return v


class RejectOfferRequest(BaseModel):
    """Schema for rejecting an offer"""
    offer_id: str
    rejection_reason: str


# ============= Price Comparison Schemas =============

class SupplierPriceComparison(BaseModel):
    """Schema for comparing supplier prices"""
    supplier_id: str
    supplier_name: str
    supplier_code: str
    categories: List[str]
    unit_price: Decimal
    available_quantity: Optional[Decimal] = None
    lead_time_days: int
    delivery_fee: Optional[Decimal] = None
    rating: Decimal
    on_time_delivery_rate: Decimal
    quality_rating: Decimal
    total_supplies: int
    is_preferred: bool
    images: Optional[List[str]] = []  # Supplier's product photos
    
    # Calculated fields
    estimated_total: Optional[Decimal] = None
    value_score: Optional[float] = None  # Combined score based on price, rating, delivery
    
    class Config:
        from_attributes = True


class PriceComparisonResponse(BaseModel):
    """Schema for price comparison response"""
    product_id: str
    product_name: str
    suppliers: List[SupplierPriceComparison]
    best_price_supplier_id: Optional[str] = None
    best_value_supplier_id: Optional[str] = None
    average_price: Optional[Decimal] = None
    price_range: Optional[dict] = None  # {"min": X, "max": Y}


# ============= Open Supply Request Schemas =============

class OpenSupplyRequestResponse(SupplyRequestResponse):
    """Schema for open supply request (public marketplace)"""
    offers_count: int = 0
    lowest_offer_price: Optional[Decimal] = None
    highest_offer_price: Optional[Decimal] = None
    average_offer_price: Optional[Decimal] = None
    deadline_remaining_hours: Optional[int] = None


# ============= Dashboard/Stats Schemas =============

class SupplierDashboardStats(BaseModel):
    """Schema for supplier dashboard statistics"""
    supplier_name: str
    pending_requests: int = 0
    active_offers: int = 0
    accepted_offers: int = 0
    completed_deliveries: int = 0
    total_revenue: Decimal = Decimal("0")
    average_rating: Decimal = Decimal("0")
    on_time_delivery_rate: Decimal = Decimal("0")
    recent_requests: List[SupplyRequestResponse] = []
    recent_offers: List[SupplyOfferResponse] = []


class AdminProcurementStats(BaseModel):
    """Schema for admin procurement statistics"""
    total_requests: int = 0
    pending_requests: int = 0
    open_requests: int = 0
    completed_requests: int = 0
    total_offers_received: int = 0
    average_offers_per_request: float = 0.0
    total_procurement_value: Decimal = Decimal("0")
    average_response_time_hours: Optional[float] = None


# ============= Direct Order Schemas =============

class DirectOfferCreate(BaseModel):
    """Schema for creating direct offer from marketplace"""
    product_id: str
    supplier_id: str
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    delivery_date: datetime
    notes: Optional[str] = None
    
    @validator('delivery_date')
    def validate_delivery_date(cls, v):
        from datetime import timezone
        # Make datetime timezone-aware for comparison
        now = datetime.now(timezone.utc)
        # If v is naive, make it aware
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v < now:
            raise ValueError('Delivery date must be in the future')
        return v


class DirectOfferResponse(BaseModel):
    """Schema for direct offer response"""
    id: str
    product_id: str
    supplier_id: str
    offered_quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    delivery_date: datetime
    status: str
    is_direct_order: bool
    order_source: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Related data
    product_name: Optional[str] = None
    supplier_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class BroadcastRequestCreate(BaseModel):
    """Schema for creating broadcast/open supply request"""
    product_name: str  # Name of product (not in catalog)
    category_id: Optional[str] = None
    quantity_needed: Decimal = Field(gt=0)
    unit_type: str
    target_price: Optional[Decimal] = Field(None, gt=0)
    required_by_date: datetime
    special_requirements: Optional[str] = None
    
    @validator('required_by_date')
    def validate_required_date(cls, v):
        if v < datetime.now():
            raise ValueError('Required date must be in the future')
        return v
