"""
Package schemas for GoShopGhana - Seasonal promotional packages
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ============== Package Item Schemas ==============

class PackageItemBase(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)


class PackageItemCreate(PackageItemBase):
    pass


class PackageItemUpdate(BaseModel):
    product_id: Optional[str] = None
    quantity: Optional[int] = None


class PackageItemResponse(PackageItemBase):
    id: str
    package_id: str
    created_at: datetime
    
    # Product details (populated from relationship)
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    product_price: Optional[Decimal] = None
    product_unit: Optional[str] = None

    class Config:
        from_attributes = True


# ============== Package Schemas ==============

class PackageBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    contents_description: Optional[str] = None  # What's included (for packages without linked products)
    image_url: Optional[str] = None
    package_price: Decimal = Field(..., gt=0)
    original_value: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    display_order: int = 0
    is_active: bool = True
    is_featured: bool = True


class PackageCreate(PackageBase):
    event_id: str
    items: Optional[List[PackageItemCreate]] = []


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contents_description: Optional[str] = None
    image_url: Optional[str] = None
    package_price: Optional[Decimal] = None
    original_value: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class PackageResponse(PackageBase):
    id: str
    event_id: str
    created_at: datetime
    updated_at: datetime
    items: List[PackageItemResponse] = []
    
    # Computed fields
    savings: Optional[Decimal] = None  # original_value - package_price
    items_count: int = 0

    class Config:
        from_attributes = True


class PackageListResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    contents_description: Optional[str] = None
    image_url: Optional[str] = None
    package_price: Decimal
    original_value: Optional[Decimal] = None
    savings: Optional[Decimal] = None
    items_count: int = 0
    is_active: bool
    is_featured: bool
    display_order: int

    class Config:
        from_attributes = True


# ============== Seasonal Event Schemas ==============

class SeasonalEventBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color_code: str = Field(default="#FF0000", pattern=r'^#[0-9A-Fa-f]{6}$')
    promo_image_url: Optional[str] = None
    lottie_animation: Optional[str] = None
    start_date: datetime
    end_date: datetime
    show_popup: bool = True
    is_active: bool = True


class SeasonalEventCreate(SeasonalEventBase):
    pass


class SeasonalEventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color_code: Optional[str] = None
    promo_image_url: Optional[str] = None
    lottie_animation: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    show_popup: Optional[bool] = None
    is_active: Optional[bool] = None


class SeasonalEventResponse(SeasonalEventBase):
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    packages: List[PackageListResponse] = []
    
    # Computed fields
    is_current: bool = False  # True if current date is between start and end
    packages_count: int = 0

    class Config:
        from_attributes = True


class SeasonalEventListResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color_code: str
    promo_image_url: Optional[str] = None
    lottie_animation: Optional[str] = None
    start_date: datetime
    end_date: datetime
    show_popup: bool
    is_active: bool
    is_current: bool = False
    packages_count: int = 0

    class Config:
        from_attributes = True


# ============== Public API Schemas ==============

class ActiveSeasonalEventResponse(BaseModel):
    """Response for active seasonal events shown on frontend"""
    id: str
    name: str
    description: Optional[str] = None
    color_code: str
    promo_image_url: Optional[str] = None
    lottie_animation: Optional[str] = None
    show_popup: bool
    packages: List[PackageListResponse] = []

    class Config:
        from_attributes = True


class PackageDetailResponse(BaseModel):
    """Detailed package response for product page"""
    id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    package_price: Decimal
    original_value: Optional[Decimal] = None
    savings: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    is_active: bool
    items: List[PackageItemResponse] = []
    
    # Event info
    event_name: str
    event_color: str
    event_end_date: datetime

    class Config:
        from_attributes = True


# ============== Add to Cart Schema ==============

class AddPackageToCartRequest(BaseModel):
    package_id: str
    quantity: int = Field(default=1, ge=1)
