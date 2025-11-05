"""
CRUD operations for Pick Lists
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid

from app.models.warehouse import PickList, PickListItem, PickListStatus
from app.models.order import Order, OrderItem
from app.schemas.warehouse_management import (
    PickListCreate,
    PickListUpdate,
    PickListItemCreate,
    PickListItemUpdate
)


def generate_pick_list_number(db: Session) -> str:
    """Generate unique pick list number"""
    # Format: PL-YYYYMMDD-XXX
    today = datetime.utcnow()
    date_str = today.strftime("%Y%m%d")
    
    # Count pick lists created today
    count = db.query(PickList).filter(
        func.date(PickList.created_at) == today.date()
    ).count()
    
    sequence = str(count + 1).zfill(3)
    return f"PL-{date_str}-{sequence}"


def create_pick_list(
    db: Session,
    pick_list: PickListCreate
) -> PickList:
    """Create a new pick list"""
    db_pick_list = PickList(
        id=str(uuid.uuid4()),
        pick_list_number=generate_pick_list_number(db),
        order_id=pick_list.order_id,
        priority=pick_list.priority,
        notes=pick_list.notes
    )
    
    db.add(db_pick_list)
    db.flush()  # Get the ID
    
    # Add items if provided
    if pick_list.items:
        for item in pick_list.items:
            db_item = PickListItem(
                id=str(uuid.uuid4()),
                pick_list_id=db_pick_list.id,
                product_id=item.product_id,
                batch_number=item.batch_number,
                warehouse_location_id=item.warehouse_location_id,
                quantity_to_pick_pieces=item.quantity_to_pick_pieces,
                quantity_to_pick_weight=item.quantity_to_pick_weight,
                weight_unit=item.weight_unit,
                notes=item.notes
            )
            db.add(db_item)
    
    db.commit()
    db.refresh(db_pick_list)
    return db_pick_list


def generate_pick_list_from_order(
    db: Session,
    order_id: str
) -> PickList:
    """Auto-generate pick list from order"""
    # Get order with items
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    
    # Create pick list
    db_pick_list = PickList(
        id=str(uuid.uuid4()),
        pick_list_number=generate_pick_list_number(db),
        order_id=order_id,
        priority="medium",
        notes=f"Auto-generated for order {order.id}"
    )
    
    db.add(db_pick_list)
    db.flush()
    
    # Get order items
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    for order_item in order_items:
        # Create pick list item
        db_item = PickListItem(
            id=str(uuid.uuid4()),
            pick_list_id=db_pick_list.id,
            product_id=order_item.product_id,
            quantity_to_pick_pieces=order_item.quantity if order_item.purchase_type == "piece" else None,
            quantity_to_pick_weight=order_item.quantity if order_item.purchase_type == "weight" else None,
            weight_unit="kg" if order_item.purchase_type == "weight" else None
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_pick_list)
    return db_pick_list


def get_pick_list(db: Session, pick_list_id: str) -> Optional[PickList]:
    """Get pick list by ID"""
    return db.query(PickList).filter(PickList.id == pick_list_id).first()


def get_pick_lists(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    priority: Optional[str] = None
) -> List[PickList]:
    """Get list of pick lists with filters"""
    query = db.query(PickList)
    
    if status:
        query = query.filter(PickList.status == status)
    
    if assigned_to:
        query = query.filter(PickList.assigned_to == assigned_to)
    
    if priority:
        query = query.filter(PickList.priority == priority)
    
    return query.order_by(PickList.created_at.desc()).offset(skip).limit(limit).all()


def update_pick_list(
    db: Session,
    pick_list_id: str,
    pick_list_update: PickListUpdate
) -> Optional[PickList]:
    """Update pick list"""
    db_pick_list = get_pick_list(db, pick_list_id)
    if not db_pick_list:
        return None
    
    update_data = pick_list_update.dict(exclude_unset=True)
    
    # Handle status changes
    if 'status' in update_data:
        if update_data['status'] == PickListStatus.IN_PROGRESS.value and not db_pick_list.started_at:
            db_pick_list.started_at = datetime.utcnow()
        elif update_data['status'] == PickListStatus.COMPLETED.value and not db_pick_list.completed_at:
            db_pick_list.completed_at = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_pick_list, field, value)
    
    db.commit()
    db.refresh(db_pick_list)
    return db_pick_list


def assign_pick_list(
    db: Session,
    pick_list_id: str,
    user_id: str
) -> Optional[PickList]:
    """Assign pick list to user"""
    db_pick_list = get_pick_list(db, pick_list_id)
    if not db_pick_list:
        return None
    
    db_pick_list.assigned_to = user_id
    
    # Auto-set to in_progress if pending
    if db_pick_list.status == PickListStatus.PENDING.value:
        db_pick_list.status = PickListStatus.IN_PROGRESS.value
        db_pick_list.started_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_pick_list)
    return db_pick_list


def update_pick_list_item(
    db: Session,
    item_id: str,
    item_update: PickListItemUpdate
) -> Optional[PickListItem]:
    """Update pick list item"""
    db_item = db.query(PickListItem).filter(PickListItem.id == item_id).first()
    if not db_item:
        return None
    
    update_data = item_update.dict(exclude_unset=True)
    
    # If marking as picked, set timestamp
    if 'picked' in update_data and update_data['picked'] and not db_item.picked_at:
        db_item.picked_at = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    
    # Check if all items are picked, auto-complete pick list
    pick_list = db_item.pick_list
    if all(item.picked for item in pick_list.items):
        pick_list.status = PickListStatus.COMPLETED.value
        pick_list.completed_at = datetime.utcnow()
        db.commit()
    
    return db_item


def complete_pick_list(
    db: Session,
    pick_list_id: str
) -> Optional[PickList]:
    """Mark pick list as completed"""
    db_pick_list = get_pick_list(db, pick_list_id)
    if not db_pick_list:
        return None
    
    db_pick_list.status = PickListStatus.COMPLETED.value
    db_pick_list.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_pick_list)
    return db_pick_list


def get_pick_list_stats(db: Session) -> dict:
    """Get pick list statistics"""
    total = db.query(PickList).count()
    
    pending = db.query(PickList).filter(
        PickList.status == PickListStatus.PENDING.value
    ).count()
    
    in_progress = db.query(PickList).filter(
        PickList.status == PickListStatus.IN_PROGRESS.value
    ).count()
    
    completed = db.query(PickList).filter(
        PickList.status == PickListStatus.COMPLETED.value
    ).count()
    
    # Today's pick lists
    today = datetime.utcnow().date()
    today_count = db.query(PickList).filter(
        func.date(PickList.created_at) == today
    ).count()
    
    return {
        "total_pick_lists": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed,
        "today": today_count
    }
