"""
Product Image Library for GoShopGhana
Reusable product images for admin use
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class ProductImageLibrary(Base):
    """Library of reusable product images"""
    __tablename__ = "product_image_library"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Image identification
    product_name = Column(String(255), nullable=False, index=True)  # Generic product name
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    
    # Image data
    image_data = Column(Text, nullable=False)  # Base64 encoded image
    thumbnail = Column(Text, nullable=True)  # Base64 encoded thumbnail
    
    # Image metadata
    file_name = Column(String(255), nullable=True)
    file_size_kb = Column(String(20), nullable=True)
    image_format = Column(String(10), nullable=True)  # jpg, png, webp
    width = Column(String(10), nullable=True)
    height = Column(String(10), nullable=True)
    
    # Searchable tags
    tags = Column(JSON, nullable=True)  # Array of tags for search
    description = Column(Text, nullable=True)
    
    # Usage tracking
    usage_count = Column(String(20), default="0", nullable=False)  # How many products use this
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Upload info
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<ProductImageLibrary(name={self.product_name}, usage={self.usage_count})>"
