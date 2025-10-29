"""
Rider models for GoShopGhana
Delivery personnel and assignment management
"""

from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, Enum, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class VehicleType(str, enum.Enum):
    """Vehicle types for delivery"""
    BICYCLE = "bicycle"
    MOTORCYCLE = "motorcycle"
    TRICYCLE = "tricycle"
    VAN = "van"
    TRUCK = "truck"
    FOOT = "foot"  # For very local deliveries


class RiderStatus(str, enum.Enum):
    """Rider availability status"""
    AVAILABLE = "available"
    ON_DELIVERY = "on_delivery"
    OFF_DUTY = "off_duty"
    UNAVAILABLE = "unavailable"
    SUSPENDED = "suspended"


class DeliveryStatus(str, enum.Enum):
    """Delivery assignment status"""
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    ARRIVED = "arrived"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class Rider(Base):
    """Rider/Delivery personnel model"""
    __tablename__ = "riders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Rider identification
    rider_code = Column(String(50), unique=True, nullable=False, index=True)
    
    # Vehicle information
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    vehicle_number = Column(String(50), nullable=True)
    vehicle_make_model = Column(String(100), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    
    # License and documentation
    license_number = Column(String(100), nullable=True)
    license_expiry = Column(DateTime(timezone=True), nullable=True)
    insurance_number = Column(String(100), nullable=True)
    insurance_expiry = Column(DateTime(timezone=True), nullable=True)
    
    # Contact information
    phone = Column(String(20), nullable=False)
    alternative_phone = Column(String(20), nullable=True)
    emergency_contact = Column(JSON, nullable=True)  # {name, phone, relationship}
    
    # Location
    base_location = Column(JSON, nullable=True)  # {address, city, region, gps}
    coverage_areas = Column(JSON, nullable=True)  # Array of areas they cover
    
    # Status
    current_status = Column(Enum(RiderStatus), default=RiderStatus.OFF_DUTY, nullable=False)
    
    # Performance metrics
    rating = Column(Numeric(3, 2), default=0.0, nullable=False)  # 0.00 to 5.00
    total_deliveries = Column(Integer, default=0, nullable=False)
    successful_deliveries = Column(Integer, default=0, nullable=False)
    failed_deliveries = Column(Integer, default=0, nullable=False)
    cancelled_deliveries = Column(Integer, default=0, nullable=False)
    average_delivery_time_minutes = Column(Integer, default=0, nullable=False)
    on_time_delivery_rate = Column(Numeric(5, 2), default=0.0, nullable=False)  # Percentage
    
    # Financial
    commission_rate = Column(Numeric(5, 2), default=10.0, nullable=False)  # Percentage
    total_earnings = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Status flags
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_online = Column(Boolean, default=False, nullable=False)
    
    # Additional info
    notes = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)  # Special skills like "cold storage", "fragile items"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    deliveries = relationship("DeliveryAssignment", back_populates="rider")
    locations = relationship("RiderLocation", back_populates="rider", order_by="desc(RiderLocation.timestamp)")

    @property
    def success_rate(self):
        """Calculate delivery success rate"""
        if self.total_deliveries == 0:
            return 0.0
        return (self.successful_deliveries / self.total_deliveries) * 100

    @property
    def current_location(self):
        """Get most recent location"""
        if self.locations:
            return self.locations[0]
        return None

    def __repr__(self):
        return f"<Rider(code={self.rider_code}, status={self.current_status})>"


class DeliveryAssignment(Base):
    """Delivery assignment linking orders to riders"""
    __tablename__ = "delivery_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Assignment details
    order_id = Column(String, ForeignKey("orders.id"), nullable=False, unique=True)
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)
    
    # Status
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.ASSIGNED, nullable=False)
    
    # Timestamps
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    in_transit_at = Column(DateTime(timezone=True), nullable=True)
    arrived_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Delivery details
    pickup_location = Column(JSON, nullable=True)  # Warehouse/store location
    delivery_location = Column(JSON, nullable=True)  # Customer location
    estimated_distance_km = Column(Numeric(8, 2), nullable=True)
    actual_distance_km = Column(Numeric(8, 2), nullable=True)
    
    # Time tracking
    estimated_delivery_time = Column(DateTime(timezone=True), nullable=True)
    actual_delivery_time = Column(DateTime(timezone=True), nullable=True)
    
    # Delivery proof
    customer_signature = Column(Text, nullable=True)  # Base64 image
    proof_of_delivery = Column(JSON, nullable=True)  # Array of base64 images
    delivery_notes = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Customer feedback
    customer_rating = Column(Numeric(3, 2), nullable=True)
    customer_feedback = Column(Text, nullable=True)
    
    # Financial
    delivery_fee = Column(Numeric(10, 2), nullable=True)
    rider_commission = Column(Numeric(10, 2), nullable=True)
    
    # Additional info
    special_instructions = Column(Text, nullable=True)
    items_description = Column(Text, nullable=True)
    
    # Assigned by
    assigned_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    rider = relationship("Rider", back_populates="deliveries")
    # order relationship will be added when we update order model

    @property
    def is_completed(self):
        """Check if delivery is completed"""
        return self.status in [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED]

    @property
    def is_active(self):
        """Check if delivery is active"""
        return self.status in [DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED, 
                               DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT, 
                               DeliveryStatus.ARRIVED]

    @property
    def delivery_duration_minutes(self):
        """Calculate delivery duration"""
        if self.picked_up_at and self.delivered_at:
            return int((self.delivered_at - self.picked_up_at).total_seconds() / 60)
        return None

    def __repr__(self):
        return f"<DeliveryAssignment(order_id={self.order_id}, status={self.status})>"


class RiderLocation(Base):
    """Track rider GPS locations for real-time tracking"""
    __tablename__ = "rider_locations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)
    
    # GPS coordinates
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    accuracy = Column(Numeric(8, 2), nullable=True)  # Accuracy in meters
    
    # Speed and heading
    speed_kmh = Column(Numeric(6, 2), nullable=True)
    heading = Column(Numeric(5, 2), nullable=True)  # Direction in degrees
    
    # Battery and network
    battery_level = Column(Integer, nullable=True)  # Percentage
    network_type = Column(String(20), nullable=True)  # 3G, 4G, 5G, WiFi
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    rider = relationship("Rider", back_populates="locations")

    def __repr__(self):
        return f"<RiderLocation(rider_id={self.rider_id}, lat={self.latitude}, lon={self.longitude})>"
