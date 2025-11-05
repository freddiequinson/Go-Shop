"""
CRUD operations for Warehouse Locations
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid

from app.models.warehouse import WarehouseLocation, ZoneType
from app.schemas.warehouse_management import (
    WarehouseLocationCreate,
    WarehouseLocationUpdate
)


def create_location(db: Session, location: WarehouseLocationCreate) -> WarehouseLocation:
    """Create a new warehouse location"""
    db_location = WarehouseLocation(
        id=str(uuid.uuid4()),
        name=location.name,
        code=location.code,
        zone_type=location.zone_type,
        capacity=location.capacity,
        temperature_min=location.temperature_min,
        temperature_max=location.temperature_max,
        humidity_level=location.humidity_level,
        description=location.description,
        is_active=location.is_active
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


def get_location(db: Session, location_id: str) -> Optional[WarehouseLocation]:
    """Get warehouse location by ID"""
    return db.query(WarehouseLocation).filter(WarehouseLocation.id == location_id).first()


def get_location_by_code(db: Session, code: str) -> Optional[WarehouseLocation]:
    """Get warehouse location by code"""
    return db.query(WarehouseLocation).filter(WarehouseLocation.code == code).first()


def get_locations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    zone_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None
) -> List[WarehouseLocation]:
    """Get list of warehouse locations with filters"""
    query = db.query(WarehouseLocation)
    
    # Filter by zone type
    if zone_type:
        query = query.filter(WarehouseLocation.zone_type == zone_type)
    
    # Filter by active status
    if is_active is not None:
        query = query.filter(WarehouseLocation.is_active == is_active)
    
    # Search by name or code
    if search:
        query = query.filter(
            or_(
                WarehouseLocation.name.ilike(f"%{search}%"),
                WarehouseLocation.code.ilike(f"%{search}%")
            )
        )
    
    return query.offset(skip).limit(limit).all()


def count_locations(
    db: Session,
    zone_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None
) -> int:
    """Count warehouse locations with filters"""
    query = db.query(WarehouseLocation)
    
    if zone_type:
        query = query.filter(WarehouseLocation.zone_type == zone_type)
    
    if is_active is not None:
        query = query.filter(WarehouseLocation.is_active == is_active)
    
    if search:
        query = query.filter(
            or_(
                WarehouseLocation.name.ilike(f"%{search}%"),
                WarehouseLocation.code.ilike(f"%{search}%")
            )
        )
    
    return query.count()


def update_location(
    db: Session,
    location_id: str,
    location_update: WarehouseLocationUpdate
) -> Optional[WarehouseLocation]:
    """Update warehouse location"""
    db_location = get_location(db, location_id)
    if not db_location:
        return None
    
    update_data = location_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_location, field, value)
    
    db.commit()
    db.refresh(db_location)
    return db_location


def delete_location(db: Session, location_id: str) -> bool:
    """Delete warehouse location"""
    db_location = get_location(db, location_id)
    if not db_location:
        return False
    
    db.delete(db_location)
    db.commit()
    return True


def get_locations_by_zone(db: Session, zone_type: str) -> List[WarehouseLocation]:
    """Get all locations of a specific zone type"""
    return db.query(WarehouseLocation).filter(
        WarehouseLocation.zone_type == zone_type,
        WarehouseLocation.is_active == True
    ).all()


def get_available_capacity(db: Session, location_id: str) -> Optional[float]:
    """Get available capacity for a location"""
    location = get_location(db, location_id)
    if not location or not location.capacity:
        return None
    
    return float(location.capacity - location.current_utilization)


def update_utilization(
    db: Session,
    location_id: str,
    quantity_change: float
) -> Optional[WarehouseLocation]:
    """Update location utilization (add or subtract)"""
    location = get_location(db, location_id)
    if not location:
        return None
    
    location.current_utilization += quantity_change
    
    # Ensure utilization doesn't go negative
    if location.current_utilization < 0:
        location.current_utilization = 0
    
    db.commit()
    db.refresh(location)
    return location


def get_location_stats(db: Session) -> dict:
    """Get warehouse location statistics"""
    total_locations = db.query(WarehouseLocation).count()
    active_locations = db.query(WarehouseLocation).filter(
        WarehouseLocation.is_active == True
    ).count()
    
    # Count by zone type
    zone_counts = {}
    for zone in ZoneType:
        count = db.query(WarehouseLocation).filter(
            WarehouseLocation.zone_type == zone.value
        ).count()
        zone_counts[zone.value] = count
    
    # Calculate total capacity and utilization
    locations = db.query(WarehouseLocation).filter(
        WarehouseLocation.capacity.isnot(None)
    ).all()
    
    total_capacity = sum(float(loc.capacity) for loc in locations if loc.capacity)
    total_utilization = sum(float(loc.current_utilization) for loc in locations)
    
    avg_utilization = (total_utilization / total_capacity * 100) if total_capacity > 0 else 0
    
    return {
        "total_locations": total_locations,
        "active_locations": active_locations,
        "inactive_locations": total_locations - active_locations,
        "by_zone_type": zone_counts,
        "total_capacity": total_capacity,
        "total_utilization": total_utilization,
        "available_capacity": total_capacity - total_utilization,
        "average_utilization_percentage": round(avg_utilization, 2)
    }
