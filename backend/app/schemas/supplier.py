"""
Supplier schemas for GoShopGhana
Pydantic models for supplier management
"""

from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer, EmailStr
from app.models.supplier import SupplierType, SupplierStatus


# Supplier schemas
class SupplierBase(BaseModel):
    name: str
    supplier_type: SupplierType
    contact_person: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    alternative_phone: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    business_registration: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    bank_details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    specialization: Optional[List[str]] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    supplier_type: Optional[SupplierType] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    alternative_phone: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    business_registration: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    bank_details: Optional[Dict[str, Any]] = None
    verification_status: Optional[SupplierStatus] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    specialization: Optional[List[str]] = None


class SupplierResponse(SupplierBase):
    id: str
    supplier_code: str
    rating: Decimal
    total_supplies: int
    on_time_delivery_rate: Decimal
    quality_rating: Decimal
    verification_status: SupplierStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_supply_date: Optional[datetime] = None
    verified_at: Optional[datetime] = None

    @validator('location', pre=True)
    def validate_location(cls, v):
        """Convert string location to dict format"""
        if isinstance(v, str):
            return {"address": v}
        return v

    @validator('bank_details', pre=True)
    def validate_bank_details(cls, v):
        """Handle string bank details"""
        if isinstance(v, str):
            return {"details": v}
        return v

    @field_serializer('created_at', 'updated_at', 'last_supply_date', 'verified_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


class SupplierListResponse(BaseModel):
    suppliers: List[SupplierResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Supplier Product schemas
class SupplierProductBase(BaseModel):
    product_id: str
    supply_capacity: Optional[Decimal] = None
    unit_cost: Decimal
    minimum_order_quantity: Decimal = Decimal("1")
    lead_time_days: int = 1
    images: Optional[List[str]] = []  # Supplier's product photos
    is_preferred: bool = False
    notes: Optional[str] = None
    quality_notes: Optional[str] = None

    @validator('unit_cost', 'minimum_order_quantity')
    def validate_positive(cls, v):
        if v <= 0:
            raise ValueError('Value must be greater than 0')
        return v


class SupplierProductCreate(SupplierProductBase):
    pass


class SupplierProductUpdate(BaseModel):
    supply_capacity: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    minimum_order_quantity: Optional[Decimal] = None
    lead_time_days: Optional[int] = None
    images: Optional[List[str]] = None  # Supplier's product photos
    next_expected_date: Optional[datetime] = None
    is_preferred: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    quality_notes: Optional[str] = None


class SupplierProductResponse(SupplierProductBase):
    id: str
    supplier_id: str
    last_supply_date: Optional[datetime] = None
    next_expected_date: Optional[datetime] = None
    total_supplied: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at', 'last_supply_date', 'next_expected_date')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


# Supplier Performance
class SupplierPerformance(BaseModel):
    supplier_id: str
    supplier_name: str
    total_supplies: int
    on_time_deliveries: int
    late_deliveries: int
    on_time_rate: float
    average_quality_rating: float
    total_products_supplied: int
    total_value: Decimal
    last_supply_date: Optional[datetime] = None

    @field_serializer('last_supply_date')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None


# Supplier Filter
class SupplierFilter(BaseModel):
    supplier_type: Optional[SupplierType] = None
    verification_status: Optional[SupplierStatus] = None
    is_active: Optional[bool] = None
    search: Optional[str] = None  # Search in name, contact_person, phone
    min_rating: Optional[float] = None
    location: Optional[str] = None  # Search in location
