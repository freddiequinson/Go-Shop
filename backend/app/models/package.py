"""
Package model for GoShopGhana - Seasonal promotional packages
"""

from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class SeasonalEvent(Base):
    """Seasonal event model - groups packages under a theme (e.g., Valentine's Day)"""
    __tablename__ = "seasonal_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)  # e.g., "Valentine's Day 2026"
    description = Column(Text, nullable=True)
    color_code = Column(String(7), nullable=False, default="#FF0000")  # Hex color for theme
    
    # Promo image (stored on CDN)
    promo_image_url = Column(String(500), nullable=True)
    
    # Lottie animation file path (relative to public/animations)
    lottie_animation = Column(String(255), nullable=True)
    
    # Duration
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    
    # Display settings
    show_popup = Column(Boolean, default=True, nullable=False)  # Show popup on landing
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    packages = relationship("Package", back_populates="seasonal_event", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SeasonalEvent(id={self.id}, name={self.name})>"


class Package(Base):
    """Package model - a bundle of products sold at a fixed price"""
    __tablename__ = "packages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, ForeignKey("seasonal_events.id"), nullable=False)
    
    # Package details
    name = Column(String(255), nullable=False, index=True)  # e.g., "Romantic Dinner Package"
    description = Column(Text, nullable=True)
    
    # Package image (stored on CDN)
    image_url = Column(String(500), nullable=True)
    
    # Pricing - fixed package price (individual product prices not used)
    package_price = Column(Numeric(10, 2), nullable=False)
    original_value = Column(Numeric(10, 2), nullable=True)  # Sum of individual prices for showing savings
    
    # Stock
    stock_quantity = Column(Integer, nullable=True)  # NULL means unlimited
    
    # Display order
    display_order = Column(Integer, default=0, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=True, nullable=False)  # Show in featured sections
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    seasonal_event = relationship("SeasonalEvent", back_populates="packages", foreign_keys=[event_id])
    items = relationship("PackageItem", back_populates="package", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Package(id={self.id}, name={self.name}, price={self.package_price})>"


class PackageItem(Base):
    """Package item model - products included in a package"""
    __tablename__ = "package_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    package_id = Column(String, ForeignKey("packages.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    # Quantity of this product in the package
    quantity = Column(Integer, default=1, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    package = relationship("Package", back_populates="items")
    product = relationship("Product")

    def __repr__(self):
        return f"<PackageItem(id={self.id}, package_id={self.package_id}, product_id={self.product_id})>"
