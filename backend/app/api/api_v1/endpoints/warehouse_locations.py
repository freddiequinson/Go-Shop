"""
Warehouse Locations API endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.schemas.warehouse_management import (
    WarehouseLocationCreate,
    WarehouseLocationUpdate,
    WarehouseLocationResponse
)
from app.crud import warehouse_locations as crud

router = APIRouter()


@router.post("/", response_model=WarehouseLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse_location(
    location: WarehouseLocationCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Create a new warehouse location (Admin only)
    """
    # Check if code already exists
    existing = crud.get_location_by_code(db, location.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Location with code '{location.code}' already exists"
        )
    
    return crud.create_location(db, location)


@router.get("/", response_model=List[WarehouseLocationResponse])
async def list_warehouse_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    zone_type: Optional[str] = Query(None, description="Filter by zone type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or code"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    List all warehouse locations with filters (Admin only)
    """
    locations = crud.get_locations(
        db,
        skip=skip,
        limit=limit,
        zone_type=zone_type,
        is_active=is_active,
        search=search
    )
    return locations


@router.get("/stats")
async def get_warehouse_location_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get warehouse location statistics (Admin only)
    """
    return crud.get_location_stats(db)


@router.get("/by-zone/{zone_type}", response_model=List[WarehouseLocationResponse])
async def get_locations_by_zone(
    zone_type: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get all active locations of a specific zone type (Admin only)
    """
    locations = crud.get_locations_by_zone(db, zone_type)
    return locations


@router.get("/{location_id}", response_model=WarehouseLocationResponse)
async def get_warehouse_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get warehouse location by ID (Admin only)
    """
    location = crud.get_location(db, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse location not found"
        )
    return location


@router.put("/{location_id}", response_model=WarehouseLocationResponse)
async def update_warehouse_location(
    location_id: str,
    location_update: WarehouseLocationUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Update warehouse location (Admin only)
    """
    location = crud.update_location(db, location_id, location_update)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse location not found"
        )
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Delete warehouse location (Admin only)
    
    Note: This will fail if there are inventory items or GRNs linked to this location
    """
    success = crud.delete_location(db, location_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse location not found"
        )
    return None


@router.get("/{location_id}/available-capacity")
async def get_available_capacity(
    location_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get available capacity for a location (Admin only)
    """
    available = crud.get_available_capacity(db, location_id)
    if available is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found or capacity not set"
        )
    
    location = crud.get_location(db, location_id)
    return {
        "location_id": location_id,
        "location_name": location.name,
        "total_capacity": float(location.capacity) if location.capacity else 0,
        "current_utilization": float(location.current_utilization),
        "available_capacity": available,
        "utilization_percentage": location.utilization_percentage
    }


@router.post("/{location_id}/update-utilization")
async def update_location_utilization(
    location_id: str,
    quantity_change: float = Query(..., description="Quantity to add (positive) or remove (negative)"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Update location utilization (Admin only)
    
    Use positive values to add, negative to remove
    """
    location = crud.update_utilization(db, location_id, quantity_change)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse location not found"
        )
    
    return {
        "location_id": location.id,
        "location_name": location.name,
        "current_utilization": float(location.current_utilization),
        "capacity": float(location.capacity) if location.capacity else 0,
        "utilization_percentage": location.utilization_percentage,
        "message": f"Utilization updated by {quantity_change}"
    }
