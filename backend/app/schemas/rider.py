"""
Rider schemas for GoShopGhana
Pydantic models for rider and delivery management
"""

from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer
from app.models.rider import VehicleType, RiderStatus, DeliveryStatus


# Rider schemas
class RiderBase(BaseModel):
    vehicle_type: VehicleType
    vehicle_number: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    phone: str
    alternative_phone: Optional[str] = None
    emergency_contact: Optional[Dict[str, Any]] = None
    base_location: Optional[Dict[str, Any]] = None
    coverage_areas: Optional[List[str]] = None
    commission_rate: Decimal = Decimal("10.0")
    notes: Optional[str] = None
    skills: Optional[List[str]] = None


class RiderCreate(RiderBase):
    user_id: str


class RiderUpdate(BaseModel):
    vehicle_type: Optional[VehicleType] = None
    vehicle_number: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None
    phone: Optional[str] = None
    alternative_phone: Optional[str] = None
    emergency_contact: Optional[Dict[str, Any]] = None
    base_location: Optional[Dict[str, Any]] = None
    coverage_areas: Optional[List[str]] = None
    current_status: Optional[RiderStatus] = None
    commission_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    notes: Optional[str] = None
    skills: Optional[List[str]] = None


class RiderResponse(RiderBase):
    id: str
    user_id: str
    rider_code: str
    current_status: RiderStatus
    rating: Decimal
    total_deliveries: int
    successful_deliveries: int
    failed_deliveries: int
    cancelled_deliveries: int
    average_delivery_time_minutes: int
    on_time_delivery_rate: Decimal
    total_earnings: Decimal
    is_active: bool
    is_verified: bool
    is_online: bool
    created_at: datetime
    updated_at: datetime
    last_active_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

    @field_serializer('created_at', 'updated_at', 'last_active_at', 'verified_at', 'license_expiry', 'insurance_expiry')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


class RiderListResponse(BaseModel):
    riders: List[RiderResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Delivery Assignment schemas
class DeliveryAssignmentBase(BaseModel):
    order_id: str
    rider_id: str
    pickup_location: Optional[Dict[str, Any]] = None
    delivery_location: Optional[Dict[str, Any]] = None
    estimated_distance_km: Optional[Decimal] = None
    estimated_delivery_time: Optional[datetime] = None
    delivery_fee: Optional[Decimal] = None
    special_instructions: Optional[str] = None
    items_description: Optional[str] = None


class DeliveryAssignmentCreate(DeliveryAssignmentBase):
    pass


class DeliveryAssignmentUpdate(BaseModel):
    status: Optional[DeliveryStatus] = None
    actual_distance_km: Optional[Decimal] = None
    actual_delivery_time: Optional[datetime] = None
    customer_signature: Optional[str] = None
    proof_of_delivery: Optional[List[str]] = None
    delivery_notes: Optional[str] = None
    failure_reason: Optional[str] = None
    customer_rating: Optional[Decimal] = None
    customer_feedback: Optional[str] = None

    @validator('customer_rating')
    def validate_rating(cls, v):
        if v is not None and (v < 0 or v > 5):
            raise ValueError('Rating must be between 0 and 5')
        return v


class DeliveryAssignmentResponse(DeliveryAssignmentBase):
    id: str
    status: DeliveryStatus
    assigned_at: datetime
    accepted_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    in_transit_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    actual_distance_km: Optional[Decimal] = None
    actual_delivery_time: Optional[datetime] = None
    customer_signature: Optional[str] = None
    proof_of_delivery: Optional[List[str]] = None
    delivery_notes: Optional[str] = None
    failure_reason: Optional[str] = None
    customer_rating: Optional[Decimal] = None
    customer_feedback: Optional[str] = None
    rider_commission: Optional[Decimal] = None
    assigned_by: str
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at', 'assigned_at', 'accepted_at', 'picked_up_at', 
                     'in_transit_at', 'arrived_at', 'delivered_at', 'failed_at', 
                     'estimated_delivery_time', 'actual_delivery_time')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True


class DeliveryListResponse(BaseModel):
    deliveries: List[DeliveryAssignmentResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Rider Location schemas
class RiderLocationCreate(BaseModel):
    latitude: Decimal
    longitude: Decimal
    accuracy: Optional[Decimal] = None
    speed_kmh: Optional[Decimal] = None
    heading: Optional[Decimal] = None
    battery_level: Optional[int] = None
    network_type: Optional[str] = None
    timestamp: datetime

    @validator('latitude')
    def validate_latitude(cls, v):
        if v < -90 or v > 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @validator('longitude')
    def validate_longitude(cls, v):
        if v < -180 or v > 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v


class RiderLocationResponse(RiderLocationCreate):
    id: str
    rider_id: str
    created_at: datetime

    @field_serializer('created_at', 'timestamp')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    class Config:
        from_attributes = True


# Rider Performance
class RiderPerformance(BaseModel):
    rider_id: str
    rider_code: str
    rider_name: str
    total_deliveries: int
    successful_deliveries: int
    failed_deliveries: int
    success_rate: float
    average_rating: float
    on_time_rate: float
    average_delivery_time_minutes: int
    total_earnings: Decimal
    total_distance_km: Decimal
    deliveries_this_week: int
    deliveries_this_month: int


# Rider Filter
class RiderFilter(BaseModel):
    current_status: Optional[RiderStatus] = None
    vehicle_type: Optional[VehicleType] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_online: Optional[bool] = None
    search: Optional[str] = None  # Search in rider_code, phone
    min_rating: Optional[float] = None
    coverage_area: Optional[str] = None


# Status Update
class RiderStatusUpdate(BaseModel):
    current_status: RiderStatus


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
    notes: Optional[str] = None
