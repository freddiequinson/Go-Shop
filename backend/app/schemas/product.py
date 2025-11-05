"""
Product schemas for GoShopGhana
Pydantic models for Ghana market products with quantified sales
"""

from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, validator
from app.models.product import UnitType

# Base product schema
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    price_per_unit: Decimal
    unit_type: UnitType
    price_per_quantity: Optional[Decimal] = None
    minimum_quantity: Decimal = Decimal("1")
    stock_quantity: Optional[Decimal] = None
    images: Optional[List[str]] = []
    supplier_id: Optional[str] = None
    cost_price: Optional[Decimal] = None
    is_perishable: Optional[bool] = False
    shelf_life_days: Optional[int] = None
    is_published: Optional[bool] = True

    @validator('price_per_unit')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price per unit must be greater than 0')
        if v > 10000:  # Max 10,000 GHS per unit
            raise ValueError('Price per unit cannot exceed 10,000 GHS')
        return v

    @validator('minimum_quantity')
    def validate_minimum_quantity(cls, v):
        if v <= 0:
            raise ValueError('Minimum quantity must be greater than 0')
        return v

    @validator('stock_quantity')
    def validate_stock_quantity(cls, v):
        if v is not None and v < 0:
            raise ValueError('Stock quantity cannot be negative')
        return v

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Product name must be at least 3 characters long')
        if len(v) > 255:
            raise ValueError('Product name cannot exceed 255 characters')
        return v.strip()

# Product creation schema
class ProductCreate(ProductBase):
    pass

# Product update schema
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    price_per_unit: Optional[Decimal] = None
    unit_type: Optional[UnitType] = None
    price_per_quantity: Optional[Decimal] = None
    minimum_quantity: Optional[Decimal] = None
    stock_quantity: Optional[Decimal] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_published: Optional[bool] = None
    supplier_id: Optional[str] = None
    cost_price: Optional[Decimal] = None
    is_perishable: Optional[bool] = None
    shelf_life_days: Optional[int] = None

    @validator('price_per_unit')
    def validate_price(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError('Price per unit must be greater than 0')
            if v > 10000:
                raise ValueError('Price per unit cannot exceed 10,000 GHS')
        return v

    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('Product name must be at least 3 characters long')
            if len(v) > 255:
                raise ValueError('Product name cannot exceed 255 characters')
            return v.strip()
        return v

# Product response schema
from datetime import datetime
from pydantic import field_serializer

class ProductResponse(ProductBase):
    id: str
    seller_id: str
    is_active: bool
    is_published: bool
    created_by_type: str
    in_warehouse: bool
    created_at: datetime
    updated_at: datetime
    supplier_id: Optional[str] = None
    cost_price: Optional[Decimal] = None

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Category name must be at least 2 characters long')
        if len(v) > 255:
            raise ValueError('Category name cannot exceed 255 characters')
        return v.strip()

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if len(v.strip()) < 2:
                raise ValueError('Category name must be at least 2 characters long')
            if len(v) > 255:
                raise ValueError('Category name cannot exceed 255 characters')
            return v.strip()
        return v

class CategoryResponse(CategoryBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Product search and filtering
class ProductFilter(BaseModel):
    category_id: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    unit_type: Optional[UnitType] = None
    search: Optional[str] = None
    is_active: Optional[bool] = True
    is_published: Optional[bool] = None
    seller_id: Optional[str] = None
    created_by_type: Optional[str] = None  # 'admin' or 'supplier'
    in_warehouse: Optional[bool] = None

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    pages: int

# Ghana-specific product suggestions
class GhanaProductSuggestion(BaseModel):
    """Suggestions for Ghana market products"""
    
    @staticmethod
    def get_common_products():
        """Get common Ghanaian products with suggested pricing"""
        return [
            {
                "name": "Fresh Plantain",
                "description": "Sweet ripe plantains from local farms",
                "unit_type": "piece",
                "suggested_price_range": "2.00-4.00 GHS",
                "category": "Tubers & Roots"
            },
            {
                "name": "Yam Tubers",
                "description": "High quality yam tubers for pounding",
                "unit_type": "kg",
                "suggested_price_range": "8.00-12.00 GHS",
                "category": "Tubers & Roots"
            },
            {
                "name": "Cassava",
                "description": "Fresh cassava for gari production",
                "unit_type": "kg",
                "suggested_price_range": "3.00-5.00 GHS",
                "category": "Tubers & Roots"
            },
            {
                "name": "Palm Oil",
                "description": "Pure red palm oil",
                "unit_type": "liter",
                "suggested_price_range": "15.00-25.00 GHS",
                "category": "Palm Products"
            },
            {
                "name": "Garden Eggs",
                "description": "Fresh garden eggs (eggplant)",
                "unit_type": "piece",
                "suggested_price_range": "1.00-2.00 GHS",
                "category": "Fresh Produce"
            },
            {
                "name": "Local Rice",
                "description": "Jasmine rice from Northern Ghana",
                "unit_type": "kg",
                "suggested_price_range": "6.00-10.00 GHS",
                "category": "Grains & Cereals"
            }
        ]
