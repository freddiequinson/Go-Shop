"""
Delivery Price Calculator for GoShopGhana
Supports multiple pricing methods: flat, distance-based, zone-based, and Yango API
"""

import math
import logging
from typing import Dict, Any, Optional
from app.core.yango import calculate_delivery_price as yango_calculate, YangoAPIError

logger = logging.getLogger(__name__)


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two GPS coordinates using Haversine formula
    
    Args:
        lat1, lon1: First coordinate
        lat2, lon2: Second coordinate
        
    Returns:
        Distance in kilometers
    """
    # Earth radius in kilometers
    R = 6371.0
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    distance = R * c
    return round(distance, 2)


def calculate_flat_rate(
    flat_rate: float,
    currency: str = "GHS"
) -> Dict[str, Any]:
    """
    Calculate flat rate delivery price
    
    Args:
        flat_rate: Fixed delivery price
        currency: Currency code
        
    Returns:
        Dict with price details
    """
    return {
        "price": float(flat_rate),
        "currency": currency,
        "pricing_method": "flat",
        "is_free_delivery": flat_rate == 0,
        "price_breakdown": {
            "flat_rate": float(flat_rate)
        }
    }


def calculate_distance_based(
    warehouse_lat: float,
    warehouse_lon: float,
    destination_lat: float,
    destination_lon: float,
    base_price: float,
    price_per_km: float,
    free_delivery_radius: float,
    max_delivery_distance: float,
    currency: str = "GHS"
) -> Dict[str, Any]:
    """
    Calculate distance-based delivery price
    
    Args:
        warehouse_lat, warehouse_lon: Warehouse coordinates
        destination_lat, destination_lon: Delivery coordinates
        base_price: Base delivery fee
        price_per_km: Price per kilometer
        free_delivery_radius: Free delivery within this radius (km)
        max_delivery_distance: Maximum delivery distance (km)
        currency: Currency code
        
    Returns:
        Dict with price details
        
    Raises:
        ValueError: If distance exceeds maximum
    """
    # Calculate distance
    distance = calculate_distance(
        warehouse_lat, warehouse_lon,
        destination_lat, destination_lon
    )
    
    # Check if within delivery range
    if distance > max_delivery_distance:
        raise ValueError(
            f"Delivery location is {distance}km away. "
            f"Maximum delivery distance is {max_delivery_distance}km."
        )
    
    # Check for free delivery
    if distance <= free_delivery_radius:
        return {
            "price": 0.0,
            "currency": currency,
            "pricing_method": "distance",
            "distance": distance,
            "is_free_delivery": True,
            "price_breakdown": {
                "distance": distance,
                "free_delivery_radius": free_delivery_radius,
                "message": f"Free delivery within {free_delivery_radius}km"
            }
        }
    
    # Calculate price
    distance_charge = (distance - free_delivery_radius) * price_per_km
    total_price = base_price + distance_charge
    
    return {
        "price": round(float(total_price), 2),
        "currency": currency,
        "pricing_method": "distance",
        "distance": distance,
        "is_free_delivery": False,
        "price_breakdown": {
            "base_price": float(base_price),
            "distance": distance,
            "chargeable_distance": round(distance - free_delivery_radius, 2),
            "price_per_km": float(price_per_km),
            "distance_charge": round(float(distance_charge), 2),
            "total": round(float(total_price), 2)
        }
    }


def calculate_zone_based(
    zone_name: str,
    zone_prices: Dict[str, float],
    currency: str = "GHS"
) -> Dict[str, Any]:
    """
    Calculate zone-based delivery price
    
    Args:
        zone_name: Name of the delivery zone
        zone_prices: Dictionary mapping zone names to prices
        currency: Currency code
        
    Returns:
        Dict with price details
        
    Raises:
        ValueError: If zone not found
    """
    if not zone_prices:
        raise ValueError("Zone prices not configured")
    
    if zone_name not in zone_prices:
        available_zones = ", ".join(zone_prices.keys())
        raise ValueError(
            f"Zone '{zone_name}' not found. "
            f"Available zones: {available_zones}"
        )
    
    price = zone_prices[zone_name]
    
    return {
        "price": float(price),
        "currency": currency,
        "pricing_method": "zone",
        "is_free_delivery": price == 0,
        "price_breakdown": {
            "zone_name": zone_name,
            "zone_price": float(price)
        }
    }


def calculate_delivery_price_unified(
    settings: Any,  # DeliverySettings model
    destination_lat: float,
    destination_lon: float,
    zone_name: Optional[str] = None,
    fare_class: Optional[str] = None
) -> Dict[str, Any]:
    """
    Unified delivery price calculator
    Routes to appropriate calculation method based on settings
    
    Args:
        settings: DeliverySettings model instance
        destination_lat: Destination latitude
        destination_lon: Destination longitude
        zone_name: Zone name (for zone-based pricing)
        fare_class: Fare class (for Yango pricing)
        
    Returns:
        Dict with price details
        
    Raises:
        ValueError: If pricing method not supported or configuration invalid
    """
    pricing_method = settings.pricing_method
    
    if pricing_method == "flat":
        return calculate_flat_rate(
            flat_rate=float(settings.flat_rate or 10.00),
            currency=settings.currency
        )
    
    elif pricing_method == "distance":
        return calculate_distance_based(
            warehouse_lat=settings.warehouse_latitude,
            warehouse_lon=settings.warehouse_longitude,
            destination_lat=destination_lat,
            destination_lon=destination_lon,
            base_price=float(settings.base_price or 5.00),
            price_per_km=float(settings.price_per_km or 2.00),
            free_delivery_radius=settings.free_delivery_radius or 2.0,
            max_delivery_distance=settings.max_delivery_distance or 20.0,
            currency=settings.currency
        )
    
    elif pricing_method == "zone":
        if not zone_name:
            raise ValueError("Zone name is required for zone-based pricing")
        
        return calculate_zone_based(
            zone_name=zone_name,
            zone_prices=settings.zone_prices or {},
            currency=settings.currency
        )
    
    elif pricing_method == "yango":
        # Check if Yango credentials are configured
        if not settings.yango_clid or not settings.yango_apikey:
            raise ValueError(
                "Yango API credentials not configured. "
                "Please configure in admin settings or use a different pricing method."
            )
        
        try:
            yango_data = yango_calculate(
                warehouse_lat=settings.warehouse_latitude,
                warehouse_lon=settings.warehouse_longitude,
                destination_lat=destination_lat,
                destination_lon=destination_lon,
                clid=settings.yango_clid,
                apikey=settings.yango_apikey,
                fare_class=fare_class or settings.default_fare_class,
                ref=settings.yango_ref or "goshopghana"
            )
            
            # Convert to unified format
            return {
                "price": yango_data["price"],
                "currency": yango_data["currency"],
                "pricing_method": "yango",
                "distance": yango_data.get("distance", 0) / 1000 if yango_data.get("distance") else None,  # Convert to km
                "is_free_delivery": False,
                "min_price": yango_data.get("min_price"),
                "time": yango_data.get("time"),
                "waiting_time": yango_data.get("waiting_time"),
                "class_name": yango_data.get("class_name"),
                "class_text": yango_data.get("class_text"),
                "yango_link": yango_data.get("yango_link"),
                "price_breakdown": {
                    "yango_price": yango_data["price"],
                    "min_price": yango_data.get("min_price"),
                    "fare_class": yango_data.get("class_text")
                }
            }
            
        except YangoAPIError as e:
            logger.error(f"Yango API error: {e}")
            raise ValueError(f"Failed to calculate Yango price: {str(e)}")
    
    else:
        raise ValueError(
            f"Unsupported pricing method: {pricing_method}. "
            f"Supported methods: flat, distance, zone, yango"
        )
