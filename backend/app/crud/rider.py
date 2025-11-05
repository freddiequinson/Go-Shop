"""
CRUD operations for Rider and Delivery management
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from app.models.rider import (
    Rider, DeliveryAssignment, RiderLocation,
    VehicleType, RiderStatus, DeliveryStatus
)
from app.schemas.rider import (
    RiderCreate, RiderUpdate, RiderFilter,
    DeliveryAssignmentCreate, DeliveryAssignmentUpdate,
    RiderLocationCreate, RiderStatusUpdate, DeliveryStatusUpdate
)


def generate_rider_code() -> str:
    """Generate unique rider code"""
    return f"RDR-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


# Rider CRUD operations
def create_rider(db: Session, rider: RiderCreate) -> Rider:
    """Create a new rider"""
    # Exclude full_name and email (they're only for user creation, not Rider model fields)
    rider_data = rider.model_dump(exclude={'full_name', 'email'})
    
    db_rider = Rider(
        id=str(uuid.uuid4()),
        rider_code=generate_rider_code(),
        **rider_data
    )
    db.add(db_rider)
    db.commit()
    db.refresh(db_rider)
    return db_rider


def get_rider_by_id(db: Session, rider_id: str) -> Optional[Rider]:
    """Get rider by ID"""
    return db.query(Rider).filter(Rider.id == rider_id).first()


def get_rider_by_user_id(db: Session, user_id: str) -> Optional[Rider]:
    """Get rider by user ID"""
    return db.query(Rider).filter(Rider.user_id == user_id).first()


def get_rider_by_code(db: Session, rider_code: str) -> Optional[Rider]:
    """Get rider by code"""
    return db.query(Rider).filter(Rider.rider_code == rider_code).first()


def get_riders(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    filters: Optional[RiderFilter] = None
) -> Tuple[List[Rider], int]:
    """Get all riders with filtering"""
    query = db.query(Rider)
    
    if filters:
        if filters.current_status:
            query = query.filter(Rider.current_status == filters.current_status)
        
        if filters.vehicle_type:
            query = query.filter(Rider.vehicle_type == filters.vehicle_type)
        
        if filters.is_active is not None:
            query = query.filter(Rider.is_active == filters.is_active)
        
        if filters.is_verified is not None:
            query = query.filter(Rider.is_verified == filters.is_verified)
        
        if filters.is_online is not None:
            query = query.filter(Rider.is_online == filters.is_online)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Rider.rider_code.ilike(search_term),
                    Rider.phone.ilike(search_term)
                )
            )
        
        if filters.min_rating:
            query = query.filter(Rider.rating >= filters.min_rating)
        
        if filters.coverage_area:
            # Search in JSON coverage_areas field
            query = query.filter(
                Rider.coverage_areas.cast(db.String).ilike(f"%{filters.coverage_area}%")
            )
    
    total = query.count()
    riders = query.order_by(Rider.created_at.desc()).offset(skip).limit(limit).all()
    
    return riders, total


def update_rider(db: Session, rider_id: str, rider_update: RiderUpdate) -> Optional[Rider]:
    """Update rider"""
    db_rider = get_rider_by_id(db, rider_id)
    if not db_rider:
        return None
    
    update_data = rider_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rider, field, value)
    
    db.commit()
    db.refresh(db_rider)
    return db_rider


def update_rider_status(db: Session, rider_id: str, status: RiderStatus) -> Optional[Rider]:
    """Update rider status"""
    db_rider = get_rider_by_id(db, rider_id)
    if not db_rider:
        return None
    
    db_rider.current_status = status
    db_rider.last_active_at = datetime.utcnow()
    
    if status == RiderStatus.AVAILABLE:
        db_rider.is_online = True
    elif status == RiderStatus.OFF_DUTY:
        db_rider.is_online = False
    
    db.commit()
    db.refresh(db_rider)
    return db_rider


def delete_rider(db: Session, rider_id: str) -> bool:
    """Delete rider (hard delete)"""
    db_rider = get_rider_by_id(db, rider_id)
    if not db_rider:
        return False
    
    # Hard delete - actually remove from database
    db.delete(db_rider)
    db.commit()
    return True


def verify_rider(db: Session, rider_id: str) -> Optional[Rider]:
    """Verify a rider"""
    db_rider = get_rider_by_id(db, rider_id)
    if not db_rider:
        return None
    
    db_rider.is_verified = True
    db_rider.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(db_rider)
    return db_rider


def get_available_riders(db: Session, coverage_area: Optional[str] = None) -> List[Rider]:
    """Get available riders"""
    query = db.query(Rider).filter(
        Rider.is_active == True,
        Rider.is_verified == True,
        Rider.is_online == True,
        Rider.current_status == RiderStatus.AVAILABLE
    )
    
    if coverage_area:
        query = query.filter(
            Rider.coverage_areas.cast(db.String).ilike(f"%{coverage_area}%")
        )
    
    return query.all()


# Delivery Assignment CRUD
def create_delivery_assignment(
    db: Session,
    assignment: DeliveryAssignmentCreate,
    assigned_by: str
) -> DeliveryAssignment:
    """Create a delivery assignment"""
    db_assignment = DeliveryAssignment(
        id=str(uuid.uuid4()),
        assigned_by=assigned_by,
        **assignment.model_dump()
    )
    
    # Calculate rider commission
    if assignment.delivery_fee:
        rider = get_rider_by_id(db, assignment.rider_id)
        if rider:
            db_assignment.rider_commission = assignment.delivery_fee * (rider.commission_rate / 100)
    
    db.add(db_assignment)
    
    # Update rider status
    rider = get_rider_by_id(db, assignment.rider_id)
    if rider:
        rider.current_status = RiderStatus.ON_DELIVERY
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def get_delivery_assignment(db: Session, assignment_id: str) -> Optional[DeliveryAssignment]:
    """Get delivery assignment by ID"""
    return db.query(DeliveryAssignment).filter(DeliveryAssignment.id == assignment_id).first()


def get_delivery_by_order(db: Session, order_id: str) -> Optional[DeliveryAssignment]:
    """Get delivery assignment by order ID"""
    return db.query(DeliveryAssignment).filter(DeliveryAssignment.order_id == order_id).first()


def get_rider_deliveries(
    db: Session,
    rider_id: str,
    status: Optional[DeliveryStatus] = None,
    skip: int = 0,
    limit: int = 20
) -> List[DeliveryAssignment]:
    """Get deliveries for a rider"""
    query = db.query(DeliveryAssignment).filter(DeliveryAssignment.rider_id == rider_id)
    
    if status:
        query = query.filter(DeliveryAssignment.status == status)
    
    return query.order_by(DeliveryAssignment.created_at.desc()).offset(skip).limit(limit).all()


def get_active_deliveries(db: Session, skip: int = 0, limit: int = 50) -> List[DeliveryAssignment]:
    """Get all active deliveries"""
    return db.query(DeliveryAssignment).filter(
        DeliveryAssignment.status.in_([
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.ACCEPTED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
            DeliveryStatus.ARRIVED
        ])
    ).order_by(DeliveryAssignment.created_at.desc()).offset(skip).limit(limit).all()


def update_delivery_assignment(
    db: Session,
    assignment_id: str,
    update_data: DeliveryAssignmentUpdate
) -> Optional[DeliveryAssignment]:
    """Update delivery assignment"""
    db_assignment = get_delivery_assignment(db, assignment_id)
    if not db_assignment:
        return None
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Update timestamps based on status
    if "status" in update_dict:
        new_status = update_dict["status"]
        now = datetime.utcnow()
        
        if new_status == DeliveryStatus.ACCEPTED:
            db_assignment.accepted_at = now
        elif new_status == DeliveryStatus.PICKED_UP:
            db_assignment.picked_up_at = now
        elif new_status == DeliveryStatus.IN_TRANSIT:
            db_assignment.in_transit_at = now
        elif new_status == DeliveryStatus.ARRIVED:
            db_assignment.arrived_at = now
        elif new_status == DeliveryStatus.DELIVERED:
            db_assignment.delivered_at = now
            # Update rider status back to available
            rider = get_rider_by_id(db, db_assignment.rider_id)
            if rider:
                rider.current_status = RiderStatus.AVAILABLE
                rider.total_deliveries += 1
                rider.successful_deliveries += 1
                update_rider_performance(db, rider)
        elif new_status == DeliveryStatus.FAILED:
            db_assignment.failed_at = now
            rider = get_rider_by_id(db, db_assignment.rider_id)
            if rider:
                rider.current_status = RiderStatus.AVAILABLE
                rider.total_deliveries += 1
                rider.failed_deliveries += 1
                update_rider_performance(db, rider)
        elif new_status == DeliveryStatus.CANCELLED:
            rider = get_rider_by_id(db, db_assignment.rider_id)
            if rider:
                rider.current_status = RiderStatus.AVAILABLE
                rider.cancelled_deliveries += 1
    
    for field, value in update_dict.items():
        setattr(db_assignment, field, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def update_rider_performance(db: Session, rider: Rider):
    """Update rider performance metrics"""
    if rider.total_deliveries > 0:
        # Calculate success rate
        rider.on_time_delivery_rate = Decimal(
            (rider.successful_deliveries / rider.total_deliveries) * 100
        )
        
        # Calculate average delivery time
        completed_deliveries = db.query(DeliveryAssignment).filter(
            DeliveryAssignment.rider_id == rider.id,
            DeliveryAssignment.status == DeliveryStatus.DELIVERED,
            DeliveryAssignment.picked_up_at.isnot(None),
            DeliveryAssignment.delivered_at.isnot(None)
        ).all()
        
        if completed_deliveries:
            total_time = sum(
                (d.delivered_at - d.picked_up_at).total_seconds() / 60
                for d in completed_deliveries
            )
            rider.average_delivery_time_minutes = int(total_time / len(completed_deliveries))
        
        # Calculate average rating
        ratings = db.query(func.avg(DeliveryAssignment.customer_rating)).filter(
            DeliveryAssignment.rider_id == rider.id,
            DeliveryAssignment.customer_rating.isnot(None)
        ).scalar()
        
        if ratings:
            rider.rating = Decimal(str(ratings))
    
    db.commit()


# Rider Location CRUD
def create_rider_location(
    db: Session,
    rider_id: str,
    location: RiderLocationCreate
) -> RiderLocation:
    """Record rider location"""
    db_location = RiderLocation(
        id=str(uuid.uuid4()),
        rider_id=rider_id,
        **location.model_dump()
    )
    db.add(db_location)
    
    # Update rider's last active time
    rider = get_rider_by_id(db, rider_id)
    if rider:
        rider.last_active_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_location)
    return db_location


def get_rider_current_location(db: Session, rider_id: str) -> Optional[RiderLocation]:
    """Get rider's most recent location"""
    return db.query(RiderLocation).filter(
        RiderLocation.rider_id == rider_id
    ).order_by(RiderLocation.timestamp.desc()).first()


def get_rider_location_history(
    db: Session,
    rider_id: str,
    hours: int = 24,
    limit: int = 100
) -> List[RiderLocation]:
    """Get rider location history"""
    since = datetime.utcnow() - timedelta(hours=hours)
    return db.query(RiderLocation).filter(
        RiderLocation.rider_id == rider_id,
        RiderLocation.timestamp >= since
    ).order_by(RiderLocation.timestamp.desc()).limit(limit).all()


def get_rider_performance(db: Session, rider_id: str) -> dict:
    """Calculate rider performance metrics"""
    rider = get_rider_by_id(db, rider_id)
    if not rider:
        return {}
    
    # Get delivery stats
    deliveries = get_rider_deliveries(db, rider_id, skip=0, limit=1000)
    
    # This week's deliveries
    week_start = datetime.utcnow() - timedelta(days=7)
    deliveries_this_week = len([d for d in deliveries if d.created_at >= week_start])
    
    # This month's deliveries
    month_start = datetime.utcnow() - timedelta(days=30)
    deliveries_this_month = len([d for d in deliveries if d.created_at >= month_start])
    
    # Calculate total distance
    total_distance = sum(
        float(d.actual_distance_km or 0)
        for d in deliveries
        if d.actual_distance_km
    )
    
    return {
        "rider_id": rider.id,
        "rider_code": rider.rider_code,
        "rider_name": f"Rider {rider.rider_code}",  # Would need user name from user table
        "total_deliveries": rider.total_deliveries,
        "successful_deliveries": rider.successful_deliveries,
        "failed_deliveries": rider.failed_deliveries,
        "success_rate": float(rider.on_time_delivery_rate),
        "average_rating": float(rider.rating),
        "on_time_rate": float(rider.on_time_delivery_rate),
        "average_delivery_time_minutes": rider.average_delivery_time_minutes,
        "total_earnings": float(rider.total_earnings),
        "total_distance_km": total_distance,
        "deliveries_this_week": deliveries_this_week,
        "deliveries_this_month": deliveries_this_month
    }


def search_riders(db: Session, search_term: str, limit: int = 10) -> List[Rider]:
    """Search riders by code or phone"""
    search_pattern = f"%{search_term}%"
    return db.query(Rider).filter(
        or_(
            Rider.rider_code.ilike(search_pattern),
            Rider.phone.ilike(search_pattern)
        ),
        Rider.is_active == True
    ).limit(limit).all()


def get_top_riders(db: Session, limit: int = 10) -> List[Rider]:
    """Get top performing riders"""
    return db.query(Rider).filter(
        Rider.is_active == True,
        Rider.is_verified == True
    ).order_by(
        Rider.rating.desc(),
        Rider.successful_deliveries.desc()
    ).limit(limit).all()
