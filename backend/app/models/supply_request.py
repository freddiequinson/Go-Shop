"""
Supply Request and Offer models for GoShopGhana Procurement System
Manage supply requests from admin and offers from suppliers
"""

from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, Enum, ForeignKey, Integer, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class SupplyRequestStatus(str, enum.Enum):
    """Supply request status"""
    DRAFT = "draft"
    SENT = "sent"
    RESPONDED = "responded"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SupplyOfferStatus(str, enum.Enum):
    """Supply offer status"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    RECEIVED = "received"


class SupplyRequest(Base):
    """Supply Request model - Admin requests for products from suppliers"""
    __tablename__ = "supply_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_number = Column(String(50), unique=True, nullable=False, index=True)  # RFS-001
    
    # Request details
    product_id = Column(String, ForeignKey("products.id"), nullable=True)  # Nullable for open requests
    product_name = Column(String(255), nullable=True)  # For open requests without product_id
    quantity_needed = Column(Numeric(10, 2), nullable=False)
    unit_type = Column(String(20), nullable=False)  # kg, liter, pieces, etc.
    
    # Target suppliers
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)  # Specific supplier or null for open
    is_open_request = Column(Boolean, default=False, nullable=False)  # Public marketplace request
    target_categories = Column(ARRAY(String), nullable=True)  # Categories for open requests
    
    # Delivery requirements
    required_by_date = Column(DateTime(timezone=True), nullable=False)
    delivery_location = Column(String(255), nullable=True)
    
    # Budget
    max_budget = Column(Numeric(10, 2), nullable=True)
    estimated_unit_price = Column(Numeric(10, 2), nullable=True)
    
    # Status
    status = Column(
        Enum(
            SupplyRequestStatus,
            values_callable=lambda x: [e.value for e in x],
            name="supplyrequestatus",
        ),
        default=SupplyRequestStatus.DRAFT,
        nullable=False,
    )
    
    # Admin who created
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Accepted offer (if any)
    accepted_offer_id = Column(String, ForeignKey("supply_offers.id"), nullable=True)
    
    # Notes
    special_requirements = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)  # Admin-only notes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)  # Deadline for offers
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    product = relationship("Product", foreign_keys=[product_id])
    supplier = relationship("Supplier", foreign_keys=[supplier_id])
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    offers = relationship("SupplyOffer", back_populates="supply_request", foreign_keys="SupplyOffer.supply_request_id")
    accepted_offer = relationship("SupplyOffer", foreign_keys=[accepted_offer_id], post_update=True)

    def __repr__(self):
        return f"<SupplyRequest(id={self.id}, request_number={self.request_number}, status={self.status})>"


class SupplyOffer(Base):
    """Supply Offer model - Supplier offers in response to supply requests OR direct orders"""
    __tablename__ = "supply_offers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    supply_request_id = Column(String, ForeignKey("supply_requests.id"), nullable=True)  # Nullable for direct orders
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)  # For direct orders
    
    # Direct order fields
    is_direct_order = Column(Boolean, default=False, nullable=False)
    order_source = Column(String(50), default="request", nullable=False)  # 'request' or 'marketplace'
    
    # Offer details
    offered_quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    
    # Delivery
    delivery_date = Column(DateTime(timezone=True), nullable=False)
    delivery_time_hours = Column(Integer, nullable=True)  # How fast they can deliver (in hours)
    delivery_fee = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Quality assurance
    quality_guarantee = Column(Text, nullable=True)
    sample_available = Column(Boolean, default=False, nullable=False)
    certifications = Column(ARRAY(String), nullable=True)  # Quality certifications
    
    # Status
    status = Column(
        Enum(
            SupplyOfferStatus,
            values_callable=lambda x: [e.value for e in x],
            name="supplyofferstatus",
        ),
        default=SupplyOfferStatus.PENDING,
        nullable=False,
    )
    
    # Rejection/withdrawal reason
    rejection_reason = Column(Text, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)  # Admin-only notes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)  # When admin responded
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    supply_request = relationship("SupplyRequest", back_populates="offers", foreign_keys=[supply_request_id])
    supplier = relationship("Supplier", back_populates="supply_offers")
    product = relationship("Product", foreign_keys=[product_id])

    def __repr__(self):
        return f"<SupplyOffer(id={self.id}, supplier_id={self.supplier_id}, status={self.status})>"
