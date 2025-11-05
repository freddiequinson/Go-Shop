"""
Delivery Settings API endpoints for GoShopGhana
Admin management and Yango API integration
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.crud import delivery_settings as crud_settings
from app.schemas.delivery_settings import (
    DeliverySettingsCreate,
    DeliverySettingsUpdate,
    DeliverySettingsResponse,
    DeliveryPriceRequest,
    DeliveryPriceResponse
)
from app.core.delivery_calculator import calculate_delivery_price_unified

router = APIRouter()


# Public endpoint - Get active delivery settings (without sensitive data)
@router.get("/active", response_model=DeliverySettingsResponse)
async def get_active_settings(db: Session = Depends(get_db)):
    """
    Get active delivery settings (public - for calculating delivery prices)
    Sensitive data like API keys are not exposed
    """
    settings = crud_settings.get_delivery_settings(db)
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active delivery settings found. Please contact admin."
        )
    return settings


# Public endpoint - Calculate delivery price
@router.post("/calculate-price", response_model=DeliveryPriceResponse)
async def calculate_price(
    request: DeliveryPriceRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate delivery price using configured pricing method
    Supports: flat rate, distance-based, zone-based, and Yango API
    Public endpoint - users can check delivery cost before checkout
    """
    settings = crud_settings.get_delivery_settings(db)
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery settings not configured. Please contact admin."
        )
    
    try:
        price_data = calculate_delivery_price_unified(
            settings=settings,
            destination_lat=request.destination_latitude,
            destination_lon=request.destination_longitude,
            zone_name=request.zone_name,
            fare_class=request.fare_class
        )
        
        return DeliveryPriceResponse(**price_data)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate delivery price: {str(e)}"
        )


# Admin endpoints
@router.get("/", response_model=DeliverySettingsResponse)
async def get_settings_admin(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get delivery settings (admin only - includes sensitive data)
    """
    settings = crud_settings.get_delivery_settings(db)
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No delivery settings found"
        )
    return settings


@router.post("/", response_model=DeliverySettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_settings_admin(
    settings: DeliverySettingsCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create delivery settings (admin only)
    This will deactivate any existing settings
    """
    return crud_settings.create_delivery_settings(db, settings)


@router.put("/{settings_id}", response_model=DeliverySettingsResponse)
async def update_settings_admin(
    settings_id: str,
    settings_update: DeliverySettingsUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update delivery settings (admin only)
    """
    updated_settings = crud_settings.update_delivery_settings(db, settings_id, settings_update)
    if not updated_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery settings not found"
        )
    return updated_settings


@router.delete("/{settings_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_settings_admin(
    settings_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete delivery settings (admin only)
    """
    success = crud_settings.delete_delivery_settings(db, settings_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery settings not found"
        )
