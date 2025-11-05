"""
Yango API Integration for GoShopGhana
Handles delivery price calculation and ride booking
"""

import requests
import logging
from typing import Optional, Dict, Any
from urllib.parse import quote

logger = logging.getLogger(__name__)


class YangoAPIError(Exception):
    """Custom exception for Yango API errors"""
    pass


class YangoService:
    """Service for interacting with Yango API"""
    
    BASE_URL = "https://taxi-routeinfo.taxi.yandex.net"
    DEEPLINK_URL = "https://yango.go.link/route"
    
    def __init__(self, clid: str, apikey: str, ref: str = "goshopghana"):
        """
        Initialize Yango service
        
        Args:
            clid: Client ID from Yango
            apikey: API Key from Yango
            ref: Reference ID for tracking
        """
        self.clid = clid
        self.apikey = apikey
        self.ref = ref
    
    def get_trip_info(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        fare_class: str = "econom",
        lang: str = "en"
    ) -> Dict[str, Any]:
        """
        Get trip information including price and time
        
        Args:
            start_lat: Departure latitude
            start_lon: Departure longitude
            end_lat: Destination latitude
            end_lon: Destination longitude
            fare_class: Fare class (econom, business, comfortplus, minivan, vip)
            lang: Response language
            
        Returns:
            Dict with trip information
            
        Raises:
            YangoAPIError: If API request fails
        """
        url = f"{self.BASE_URL}/taxi_info"
        
        # Format coordinates: lon,lat~lon,lat
        rll = f"{start_lon},{start_lat}~{end_lon},{end_lat}"
        
        params = {
            "clid": self.clid,
            "apikey": self.apikey,
            "rll": rll,
            "class": fare_class,
            "lang": lang
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Yango API response: {data}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Yango API error: {e}")
            raise YangoAPIError(f"Failed to get trip info: {str(e)}")
    
    def get_zone_info(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Get information about Yango services in a region
        
        Args:
            latitude: Region latitude
            longitude: Region longitude
            
        Returns:
            Dict with supported tariffs and services
            
        Raises:
            YangoAPIError: If API request fails
        """
        url = f"{self.BASE_URL}/zone_info"
        
        params = {
            "clid": self.clid,
            "apikey": self.apikey,
            "ll": f"{longitude},{latitude}"
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Yango zone info error: {e}")
            raise YangoAPIError(f"Failed to get zone info: {str(e)}")
    
    def generate_deeplink(
        self,
        start_lat: Optional[float] = None,
        start_lon: Optional[float] = None,
        end_lat: Optional[float] = None,
        end_lon: Optional[float] = None,
        fare_class: Optional[str] = None
    ) -> str:
        """
        Generate deep link to Yango app for ride booking
        
        Args:
            start_lat: Departure latitude (optional)
            start_lon: Departure longitude (optional)
            end_lat: Destination latitude (optional)
            end_lon: Destination longitude (optional)
            fare_class: Fare class (optional)
            
        Returns:
            Deep link URL
        """
        params = []
        
        if start_lat is not None and start_lon is not None:
            params.append(f"start-lat={start_lat}")
            params.append(f"start-lon={start_lon}")
        
        if end_lat is not None and end_lon is not None:
            params.append(f"end-lat={end_lat}")
            params.append(f"end-lon={end_lon}")
        
        if fare_class:
            params.append(f"level={self._get_fare_level(fare_class)}")
        
        params.append(f"ref={self.ref}")
        params.append("adj_t=vokme8e_nd9s9z9")
        params.append("lang=en")
        params.append("adj_deeplink_js=1")
        
        # Fallback URL for web
        fallback_params = []
        if start_lat and start_lon:
            fallback_params.append(f"gfrom={start_lon},{start_lat}")
        if end_lat and end_lon:
            fallback_params.append(f"gto={end_lon},{end_lat}")
        fallback_params.append(f"ref={self.ref}")
        
        fallback_url = f"https://yango.com/en_int/order/?{'&'.join(fallback_params)}"
        params.append(f"adj_fallback={quote(fallback_url)}")
        
        return f"{self.DEEPLINK_URL}?{'&'.join(params)}"
    
    def _get_fare_level(self, fare_class: str) -> int:
        """Map fare class to numeric level"""
        levels = {
            "econom": 50,
            "business": 70,
            "comfortplus": 80,
            "minivan": 85,
            "vip": 90
        }
        return levels.get(fare_class, 50)


def calculate_delivery_price(
    warehouse_lat: float,
    warehouse_lon: float,
    destination_lat: float,
    destination_lon: float,
    clid: str,
    apikey: str,
    fare_class: str = "econom",
    ref: str = "goshopghana"
) -> Dict[str, Any]:
    """
    Calculate delivery price using Yango API
    
    Args:
        warehouse_lat: Warehouse latitude
        warehouse_lon: Warehouse longitude
        destination_lat: Customer destination latitude
        destination_lon: Customer destination longitude
        clid: Yango Client ID
        apikey: Yango API Key
        fare_class: Fare class
        ref: Reference ID
        
    Returns:
        Dict with price, distance, time, and deep link
    """
    service = YangoService(clid, apikey, ref)
    
    # Get trip info
    trip_info = service.get_trip_info(
        warehouse_lat, warehouse_lon,
        destination_lat, destination_lon,
        fare_class
    )
    
    # Generate deep link
    deeplink = service.generate_deeplink(
        warehouse_lat, warehouse_lon,
        destination_lat, destination_lon,
        fare_class
    )
    
    # Extract first option (should match requested fare class)
    if trip_info.get("options") and len(trip_info["options"]) > 0:
        option = trip_info["options"][0]
        
        return {
            "price": option.get("price"),
            "min_price": option.get("min_price"),
            "currency": trip_info.get("currency"),
            "distance": trip_info.get("distance"),
            "time": trip_info.get("time"),
            "waiting_time": option.get("waiting_time"),
            "class_name": option.get("class_name"),
            "class_text": option.get("class_text"),
            "price_text": option.get("price_text"),
            "yango_link": deeplink
        }
    
    raise YangoAPIError("No pricing options available for this route")
