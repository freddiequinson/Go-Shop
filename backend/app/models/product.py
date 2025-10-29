"""
Product model for GoShopGhana
"""

from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, Enum, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class UnitType(str, enum.Enum):
    """Product unit types for quantified sales"""
    KG = "kg"
    GRAM = "gram"
    PIECE = "piece"
    LITER = "liter"
    PACK = "pack"


class Product(Base):
    """Product model with quantified sales support"""
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Basic product information
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    
    # Quantified sales pricing
    price_per_unit = Column(Numeric(10, 2), nullable=False)  # Price per kg/gram/liter/etc
    unit_type = Column(Enum(UnitType), nullable=False)
    price_per_quantity = Column(Numeric(10, 2), nullable=True)  # Optional: Price per piece/pack
    minimum_quantity = Column(Numeric(8, 2), default=1, nullable=False)
    
    # Inventory
    stock_quantity = Column(Numeric(10, 2), nullable=True)  # NULL means unlimited
    
    # Warehouse management
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    warehouse_location = Column(String(100), nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=True)
    margin_percentage = Column(Numeric(5, 2), nullable=True)
    
    # Product identification
    sku = Column(String(100), unique=True, nullable=True, index=True)
    barcode = Column(String(100), nullable=True)
    
    # Physical properties
    weight = Column(Numeric(8, 2), nullable=True)  # In kg
    dimensions = Column(JSON, nullable=True)  # {length, width, height} in cm
    
    # Perishable tracking
    is_perishable = Column(Boolean, default=False, nullable=False)
    shelf_life_days = Column(Integer, nullable=True)
    
    # Media
    images = Column(JSON, nullable=True)  # Array of image URLs or base64
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships (commented out to avoid circular imports for now)
    # seller = relationship("User", back_populates="products")
    # category = relationship("Category", back_populates="products")
    
    # Review and messaging relationships
    reviews = relationship("Review", back_populates="product")
    product_rating = relationship("ProductRating", back_populates="product", uselist=False)
    conversations = relationship("Conversation", back_populates="product")

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price={self.price_per_unit}/{self.unit_type})>"


class Category(Base):
    """Product category model"""
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(String, ForeignKey("categories.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships (commented out to avoid circular imports for now)
    # products = relationship("Product", back_populates="category")
    # parent = relationship("Category", remote_side=[id])

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"
