"""
Delivery Settings schemas for GoShopGhana
Pydantic models for Yango API integration
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict
from decimal import Decimal


class DeliverySettingsBase(BaseModel):
    warehouse_name: str = Field(default="Main Warehouse")
    warehouse_latitude: float = Field(..., description="Warehouse latitude coordinate")
    warehouse_longitude: float = Field(..., description="Warehouse longitude coordinate")
    warehouse_address: Optional[str] = None
    
    # Pricing method
    pricing_method: str = Field(default="flat", description="Pricing method: flat, distance, zone, or yango")
    
    # Flat rate pricing
    flat_rate: Optional[Decimal] = Field(default=10.00, description="Flat delivery rate")
    
    # Distance-based pricing
    base_price: Optional[Decimal] = Field(default=5.00, description="Base delivery fee")
    price_per_km: Optional[Decimal] = Field(default=2.00, description="Price per kilometer")
    free_delivery_radius: Optional[float] = Field(default=2.0, description="Free delivery within km")
    max_delivery_distance: Optional[float] = Field(default=20.0, description="Maximum delivery distance")
    
    # Zone-based pricing
    zone_prices: Optional[Dict[str, float]] = Field(None, description="Zone name to price mapping")
    
    # Yango API (optional)
    yango_clid: Optional[str] = Field(None, description="Yango Client ID")
    yango_apikey: Optional[str] = Field(None, description="Yango API Key")
    yango_ref: Optional[str] = Field(default="goshopghana", description="Yango Reference ID")
    default_fare_class: str = Field(default="econom", description="Default Yango fare class")
    
    is_active: bool = True
    currency: str = Field(default="GHS")
    notes: Optional[str] = None


class DeliverySettingsCreate(DeliverySettingsBase):
    pass


class DeliverySettingsUpdate(BaseModel):
    warehouse_name: Optional[str] = None
    warehouse_latitude: Optional[float] = None
    warehouse_longitude: Optional[float] = None
    warehouse_address: Optional[str] = None
    pricing_method: Optional[str] = None
    flat_rate: Optional[Decimal] = None
    base_price: Optional[Decimal] = None
    price_per_km: Optional[Decimal] = None
    free_delivery_radius: Optional[float] = None
    max_delivery_distance: Optional[float] = None
    zone_prices: Optional[Dict[str, float]] = None
    yango_clid: Optional[str] = None
    yango_apikey: Optional[str] = None
    yango_ref: Optional[str] = None
    is_active: Optional[bool] = None
    default_fare_class: Optional[str] = None
    currency: Optional[str] = None
    notes: Optional[str] = None


class DeliverySettingsResponse(DeliverySettingsBase):
    id: str

    class Config:
        from_attributes = True


class DeliveryPriceRequest(BaseModel):
    """Request for calculating delivery price"""
    destination_latitude: float
    destination_longitude: float
    zone_name: Optional[str] = None  # For zone-based pricing
    fare_class: Optional[str] = "econom"  # For Yango pricing


class DeliveryPriceResponse(BaseModel):
    """Response with delivery pricing"""
    price: float
    currency: str
    pricing_method: str  # flat, distance, zone, yango
    distance: Optional[float] = None  # in km
    price_breakdown: Optional[Dict[str, float]] = None  # Detailed breakdown
    is_free_delivery: bool = False
    
    # Yango-specific fields (when using Yango)
    min_price: Optional[float] = None
    time: Optional[float] = None  # in seconds
    waiting_time: Optional[float] = None  # in seconds
    class_name: Optional[str] = None
    class_text: Optional[str] = None
    yango_link: Optional[str] = None  # Deep link to Yango app
