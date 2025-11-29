"""
Delivery Date API endpoints for GoShopGhana
Admin management and user-facing endpoints
"""

from typing import List
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.deps import get_current_active_user, get_current_admin
from app.models.user import User
from app.crud import delivery_date as crud_delivery_date
from app.schemas.delivery_date import (
    DeliveryDateCreate,
    DeliveryDateUpdate,
    DeliveryDateResponse,
    DeliveryDatePublic
)

router = APIRouter()


# User endpoints (public)
@router.get("/available", response_model=List[DeliveryDatePublic])
async def get_available_delivery_dates(
    limit: int = 3,
    db: Session = Depends(get_db)
):
    """
    Get next available delivery dates for checkout (public endpoint)
    Returns up to 3 future dates that are available
    """
    delivery_dates = crud_delivery_date.get_available_delivery_dates(db, limit=limit)
    
    # Calculate slots remaining if max_orders is set
    public_dates = []
    for dd in delivery_dates:
        slots_remaining = None
        if dd.max_orders:
            slots_remaining = dd.max_orders - dd.current_orders
            # Don't show if fully booked
            if slots_remaining <= 0:
                continue
        
        public_dates.append(DeliveryDatePublic(
            id=dd.id,
            date=dd.date,
            day_name=dd.day_name,
            is_available=dd.is_available,
            slots_remaining=slots_remaining
        ))
    
    return public_dates


# Admin endpoints (protected)
@router.get("/", response_model=List[DeliveryDateResponse])
async def get_all_delivery_dates_admin(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all delivery dates (admin only)
    """
    return crud_delivery_date.get_all_delivery_dates(db, skip=skip, limit=limit)


@router.get("/{delivery_date_id}", response_model=DeliveryDateResponse)
async def get_delivery_date_admin(
    delivery_date_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get specific delivery date (admin only)
    """
    delivery_date = crud_delivery_date.get_delivery_date(db, delivery_date_id)
    if not delivery_date:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery date not found"
        )
    return delivery_date


@router.post("/", response_model=DeliveryDateResponse, status_code=status.HTTP_201_CREATED)
async def create_delivery_date_admin(
    delivery_date: DeliveryDateCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create new delivery date (admin only)
    """
    try:
        return crud_delivery_date.create_delivery_date(db, delivery_date)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/bulk-create", response_model=List[DeliveryDateResponse])
async def bulk_create_delivery_dates_admin(
    days: int = 30,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Bulk create delivery dates for next N days (admin only)
    Useful for initial setup or extending available dates
    """
    start_date = date.today() + timedelta(days=1)  # Start from tomorrow
    created_dates = crud_delivery_date.bulk_create_delivery_dates(db, start_date, days)
    return created_dates


@router.put("/{delivery_date_id}", response_model=DeliveryDateResponse)
async def update_delivery_date_admin(
    delivery_date_id: str,
    delivery_date_update: DeliveryDateUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update delivery date (admin only)
    """
    updated_date = crud_delivery_date.update_delivery_date(db, delivery_date_id, delivery_date_update)
    if not updated_date:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery date not found"
        )
    return updated_date


@router.delete("/{delivery_date_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_delivery_date_admin(
    delivery_date_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete delivery date (admin only)
    """
    success = crud_delivery_date.delete_delivery_date(db, delivery_date_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery date not found"
        )
    return None


@router.delete("/", status_code=status.HTTP_200_OK)
async def delete_all_delivery_dates_admin(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete all delivery dates (admin only)
    """
    count = crud_delivery_date.delete_all_delivery_dates(db)
    return {"message": f"Deleted {count} delivery dates", "count": count}
