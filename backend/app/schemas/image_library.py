"""
Image Library schemas for GoShopGhana
Pydantic models for product image library
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, field_serializer


# Image Library schemas
class ImageLibraryBase(BaseModel):
    product_name: str
    category_id: Optional[str] = None
    image_data: str  # Base64 encoded
    thumbnail: Optional[str] = None
    file_name: Optional[str] = None
    file_size_kb: Optional[str] = None
    image_format: Optional[str] = None
    width: Optional[str] = None
    height: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None


class ImageLibraryCreate(ImageLibraryBase):
    pass


class ImageLibraryUpdate(BaseModel):
    product_name: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ImageLibraryResponse(BaseModel):
    id: str
    product_name: str
    category_id: Optional[str] = None
    image_data: str
    thumbnail: Optional[str] = None
    file_name: Optional[str] = None
    file_size_kb: Optional[str] = None
    image_format: Optional[str] = None
    width: Optional[str] = None
    height: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    usage_count: str
    is_active: bool
    uploaded_by: str
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    class Config:
        from_attributes = True


class ImageLibraryListResponse(BaseModel):
    images: List[ImageLibraryResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Bulk Upload
class BulkImageUpload(BaseModel):
    images: List[ImageLibraryCreate]


# Image Search
class ImageSearch(BaseModel):
    search: Optional[str] = None  # Search in product_name, tags, description
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = True
