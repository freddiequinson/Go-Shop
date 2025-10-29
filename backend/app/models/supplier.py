"""
Supplier models for GoShopGhana
Manage farmers and suppliers for inventory management
"""

from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, Enum, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class SupplierType(str, enum.Enum):
    """Supplier types"""
    FARMER = "farmer"
    WHOLESALER = "wholesaler"
    DISTRIBUTOR = "distributor"
    MANUFACTURER = "manufacturer"


class SupplierStatus(str, enum.Enum):
    """Supplier verification status"""
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class Supplier(Base):
    """Supplier/Farmer model for inventory management"""
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic information
    name = Column(String(255), nullable=False, index=True)
    supplier_code = Column(String(50), unique=True, nullable=False, index=True)
    supplier_type = Column(Enum(SupplierType), nullable=False)
    
    # Contact information
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    alternative_phone = Column(String(20), nullable=True)
    
    # Location
    location = Column(JSON, nullable=True)  # {address, city, region, gps_coordinates}
    
    # Business details
    business_registration = Column(String(100), nullable=True)
    tax_id = Column(String(100), nullable=True)
    payment_terms = Column(String(255), nullable=True)  # e.g., "Net 30", "Cash on delivery"
    bank_details = Column(JSON, nullable=True)  # {bank_name, account_number, account_name}
    
    # Performance metrics
    rating = Column(Numeric(3, 2), default=0.0, nullable=False)  # 0.00 to 5.00
    total_supplies = Column(Integer, default=0, nullable=False)
    on_time_delivery_rate = Column(Numeric(5, 2), default=0.0, nullable=False)  # Percentage
    quality_rating = Column(Numeric(3, 2), default=0.0, nullable=False)
    
    # Status
    verification_status = Column(Enum(SupplierStatus), default=SupplierStatus.PENDING, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Additional info
    notes = Column(Text, nullable=True)
    specialization = Column(JSON, nullable=True)  # Array of product categories they specialize in
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_supply_date = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    supplier_products = relationship("SupplierProduct", back_populates="supplier", cascade="all, delete-orphan")
    restock_orders = relationship("RestockOrder", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier(id={self.id}, name={self.name}, type={self.supplier_type})>"


class SupplierProduct(Base):
    """Link between suppliers and products they can supply"""
    __tablename__ = "supplier_products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    
    # Supply details
    supply_capacity = Column(Numeric(10, 2), nullable=True)  # Maximum they can supply
    unit_cost = Column(Numeric(10, 2), nullable=False)  # Cost per unit from this supplier
    minimum_order_quantity = Column(Numeric(10, 2), default=1, nullable=False)
    lead_time_days = Column(Integer, default=1, nullable=False)  # Days needed for delivery
    
    # Tracking
    last_supply_date = Column(DateTime(timezone=True), nullable=True)
    next_expected_date = Column(DateTime(timezone=True), nullable=True)
    total_supplied = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Status
    is_preferred = Column(Boolean, default=False, nullable=False)  # Preferred supplier for this product
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Additional info
    notes = Column(Text, nullable=True)
    quality_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_products")
    # product relationship will be added when we update product model

    def __repr__(self):
        return f"<SupplierProduct(supplier_id={self.supplier_id}, product_id={self.product_id})>"
