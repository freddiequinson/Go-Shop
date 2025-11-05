"""
Delivery Settings model for GoShopGhana
Stores warehouse location and Yango API credentials
"""

from sqlalchemy import Column, String, Float, Boolean, Numeric, JSON
from app.db.database import Base
import uuid


class DeliverySettings(Base):
    """Delivery settings for custom and Yango API integration"""
    __tablename__ = "delivery_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Warehouse location
    warehouse_name = Column(String, nullable=False, default="Main Warehouse")
    warehouse_latitude = Column(Float, nullable=False)  # e.g., 5.6037
    warehouse_longitude = Column(Float, nullable=False)  # e.g., -0.1870
    warehouse_address = Column(String, nullable=True)
    
    # Pricing Method: 'flat', 'distance', 'zone', 'yango'
    pricing_method = Column(String, nullable=False, default="flat")
    
    # Flat Rate Pricing
    flat_rate = Column(Numeric(10, 2), nullable=True, default=10.00)  # GH₵10 flat rate
    
    # Distance-Based Pricing
    base_price = Column(Numeric(10, 2), nullable=True, default=5.00)  # Base fee
    price_per_km = Column(Numeric(10, 2), nullable=True, default=2.00)  # GH₵2 per km
    free_delivery_radius = Column(Float, nullable=True, default=2.0)  # Free within 2km
    max_delivery_distance = Column(Float, nullable=True, default=20.0)  # Max 20km
    
    # Zone-Based Pricing (JSON: {zone_name: price})
    zone_prices = Column(JSON, nullable=True)  # {"Accra Central": 10, "East Legon": 15, ...}
    
    # Yango API credentials (optional)
    yango_clid = Column(String, nullable=True)  # Client ID
    yango_apikey = Column(String, nullable=True)  # API Key
    yango_ref = Column(String, nullable=True, default="goshopghana")  # Reference ID
    default_fare_class = Column(String, default="econom")  # econom, business, comfortplus, minivan, vip
    
    # Settings
    is_active = Column(Boolean, default=True)
    currency = Column(String, default="GHS")
    
    # Additional settings
    notes = Column(String, nullable=True)
