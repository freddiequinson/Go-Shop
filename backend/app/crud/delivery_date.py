"""
Delivery Date CRUD operations for GoShopGhana
"""

from typing import List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.delivery_date import DeliveryDate
from app.schemas.delivery_date import DeliveryDateCreate, DeliveryDateUpdate


def get_delivery_date(db: Session, delivery_date_id: str) -> Optional[DeliveryDate]:
    """Get delivery date by ID"""
    return db.query(DeliveryDate).filter(DeliveryDate.id == delivery_date_id).first()


def get_delivery_date_by_date(db: Session, target_date: date) -> Optional[DeliveryDate]:
    """Get delivery date by specific date"""
    return db.query(DeliveryDate).filter(DeliveryDate.date == target_date).first()


def get_all_delivery_dates(db: Session, skip: int = 0, limit: int = 100) -> List[DeliveryDate]:
    """Get all delivery dates (admin view)"""
    return db.query(DeliveryDate).order_by(DeliveryDate.date).offset(skip).limit(limit).all()


def get_available_delivery_dates(db: Session, limit: int = 3) -> List[DeliveryDate]:
    """Get next available delivery dates for users (only dates 48+ hours from now)"""
    from datetime import datetime, timedelta
    
    # Calculate minimum delivery date (48 hours from now)
    min_delivery_datetime = datetime.now() + timedelta(hours=48)
    min_delivery_date = min_delivery_datetime.date()
    
    return (
        db.query(DeliveryDate)
        .filter(
            DeliveryDate.date >= min_delivery_date,
            DeliveryDate.is_available == True
        )
        .order_by(DeliveryDate.date)
        .limit(limit)
        .all()
    )


def create_delivery_date(db: Session, delivery_date: DeliveryDateCreate) -> DeliveryDate:
    """Create new delivery date (admin only)"""
    # Check if date already exists
    existing = get_delivery_date_by_date(db, delivery_date.date)
    if existing:
        raise ValueError(f"Delivery date for {delivery_date.date} already exists")
    
    # Get day name
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_name = day_names[delivery_date.date.weekday()]
    
    db_delivery_date = DeliveryDate(
        date=delivery_date.date,
        day_name=day_name,
        is_available=delivery_date.is_available,
        max_orders=delivery_date.max_orders,
        notes=delivery_date.notes
    )
    db.add(db_delivery_date)
    db.commit()
    db.refresh(db_delivery_date)
    return db_delivery_date


def update_delivery_date(
    db: Session, 
    delivery_date_id: str, 
    delivery_date_update: DeliveryDateUpdate
) -> Optional[DeliveryDate]:
    """Update delivery date (admin only)"""
    db_delivery_date = get_delivery_date(db, delivery_date_id)
    if not db_delivery_date:
        return None
    
    update_data = delivery_date_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_delivery_date, field, value)
    
    db.commit()
    db.refresh(db_delivery_date)
    return db_delivery_date


def delete_delivery_date(db: Session, delivery_date_id: str) -> bool:
    """Delete delivery date (admin only)"""
    db_delivery_date = get_delivery_date(db, delivery_date_id)
    if not db_delivery_date:
        return False
    
    db.delete(db_delivery_date)
    db.commit()
    return True


def increment_order_count(db: Session, delivery_date_id: str) -> Optional[DeliveryDate]:
    """Increment order count when order is placed"""
    db_delivery_date = get_delivery_date(db, delivery_date_id)
    if not db_delivery_date:
        return None
    
    db_delivery_date.current_orders += 1
    db.commit()
    db.refresh(db_delivery_date)
    return db_delivery_date


def bulk_create_delivery_dates(db: Session, start_date: date, days: int = 30) -> List[DeliveryDate]:
    """Bulk create delivery dates for next N days (admin helper)"""
    created_dates = []
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for i in range(days):
        target_date = start_date + timedelta(days=i)
        
        # Skip if already exists
        existing = get_delivery_date_by_date(db, target_date)
        if existing:
            continue
        
        day_name = day_names[target_date.weekday()]
        
        db_delivery_date = DeliveryDate(
            date=target_date,
            day_name=day_name,
            is_available=True
        )
        db.add(db_delivery_date)
        created_dates.append(db_delivery_date)
    
    db.commit()
    return created_dates
