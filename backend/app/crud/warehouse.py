"""
CRUD operations for Warehouse and Inventory management
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from app.models.warehouse import (
    WarehouseInventory, InventoryMovement, StockAlert, RestockOrder,
    MovementType, AlertType, AlertStatus, RestockStatus
)
from app.schemas.warehouse import (
    WarehouseInventoryCreate, WarehouseInventoryUpdate,
    InventoryMovementCreate, InventoryAdjustment,
    StockAlertCreate, StockAlertUpdate,
    RestockOrderCreate, RestockOrderUpdate,
    InventoryFilter, StockTakeRequest
)


def generate_restock_order_number() -> str:
    """Generate unique restock order number"""
    return f"RSO-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


# Warehouse Inventory CRUD
def get_or_create_inventory(db: Session, product_id: str) -> WarehouseInventory:
    """Get or create warehouse inventory for a product"""
    inventory = db.query(WarehouseInventory).filter(
        WarehouseInventory.product_id == product_id
    ).first()
    
    if not inventory:
        inventory = WarehouseInventory(
            id=str(uuid.uuid4()),
            product_id=product_id,
            quantity_available=Decimal("0"),
            quantity_reserved=Decimal("0"),
            quantity_damaged=Decimal("0")
        )
        db.add(inventory)
        db.commit()
        db.refresh(inventory)
    
    return inventory


def get_inventory_by_product(db: Session, product_id: str) -> Optional[WarehouseInventory]:
    """Get inventory for a specific product"""
    return db.query(WarehouseInventory).filter(
        WarehouseInventory.product_id == product_id
    ).first()


def get_all_inventory(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    filters: Optional[InventoryFilter] = None
) -> Tuple[List[WarehouseInventory], int]:
    """Get all inventory with filtering"""
    from app.models.product import Product
    
    query = db.query(WarehouseInventory)
    
    if filters:
        if filters.search:
            # Join with products table for name search
            query = query.join(Product, WarehouseInventory.product_id == Product.id)
            query = query.filter(Product.name.ilike(f"%{filters.search}%"))
        
        if filters.zone:
            query = query.filter(WarehouseInventory.zone == filters.zone)
        
        if filters.supplier_id:
            query = query.filter(WarehouseInventory.supplier_id == filters.supplier_id)
        
        if filters.low_stock_only:
            query = query.filter(
                WarehouseInventory.quantity_available <= WarehouseInventory.reorder_level
            )
        
        if filters.out_of_stock_only:
            query = query.filter(WarehouseInventory.quantity_available == 0)
        
        if filters.expiring_soon_only:
            # Products expiring in next 7 days
            expiry_threshold = datetime.utcnow() + timedelta(days=7)
            query = query.filter(
                WarehouseInventory.expiry_date.isnot(None),
                WarehouseInventory.expiry_date <= expiry_threshold
            )
        
        if filters.min_quantity:
            query = query.filter(WarehouseInventory.quantity_available >= filters.min_quantity)
        
        if filters.max_quantity:
            query = query.filter(WarehouseInventory.quantity_available <= filters.max_quantity)
    
    total = query.count()
    inventory = query.offset(skip).limit(limit).all()
    
    return inventory, total


def update_inventory(
    db: Session,
    product_id: str,
    update_data: WarehouseInventoryUpdate
) -> Optional[WarehouseInventory]:
    """Update inventory"""
    inventory = get_or_create_inventory(db, product_id)
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(inventory, field, value)
    
    # Calculate total value
    if inventory.cost_price and inventory.quantity_available:
        inventory.total_value = inventory.cost_price * inventory.quantity_available
    
    db.commit()
    db.refresh(inventory)
    return inventory


def adjust_inventory(
    db: Session,
    adjustment: InventoryAdjustment,
    performed_by: str
) -> WarehouseInventory:
    """Adjust inventory and record movement"""
    inventory = get_or_create_inventory(db, adjustment.product_id)
    
    # Create movement record
    movement = InventoryMovement(
        id=str(uuid.uuid4()),
        product_id=adjustment.product_id,
        inventory_id=inventory.id,
        movement_type=adjustment.movement_type,
        quantity=adjustment.quantity,
        reason=adjustment.reason,
        notes=adjustment.notes,
        batch_number=adjustment.batch_number,
        unit_cost=adjustment.unit_cost,
        total_cost=adjustment.unit_cost * adjustment.quantity if adjustment.unit_cost else None,
        performed_by=performed_by
    )
    db.add(movement)
    
    # Update inventory based on movement type
    if adjustment.movement_type == MovementType.IN:
        inventory.quantity_available += adjustment.quantity
        inventory.received_date = datetime.utcnow()
    elif adjustment.movement_type == MovementType.OUT:
        inventory.quantity_available -= adjustment.quantity
    elif adjustment.movement_type == MovementType.ADJUSTMENT:
        inventory.quantity_available = adjustment.quantity
    elif adjustment.movement_type in [MovementType.DAMAGED, MovementType.EXPIRED]:
        inventory.quantity_available -= adjustment.quantity
        inventory.quantity_damaged += adjustment.quantity
    
    # Update cost if provided
    if adjustment.unit_cost:
        inventory.cost_price = adjustment.unit_cost
    
    # Calculate total value
    if inventory.cost_price:
        inventory.total_value = inventory.cost_price * inventory.quantity_available
    
    db.commit()
    db.refresh(inventory)
    
    # Check for alerts
    check_and_create_alerts(db, inventory)
    
    return inventory


def stock_take(
    db: Session,
    stock_take: StockTakeRequest,
    performed_by: str
) -> dict:
    """Perform stock take and adjust if needed"""
    inventory = get_inventory_by_product(db, stock_take.product_id)
    if not inventory:
        return {"error": "Product not found in inventory"}
    
    expected = inventory.quantity_available
    counted = stock_take.counted_quantity
    variance = counted - expected
    variance_percentage = (float(variance) / float(expected) * 100) if expected > 0 else 0
    
    result = {
        "product_id": stock_take.product_id,
        "expected_quantity": expected,
        "counted_quantity": counted,
        "variance": variance,
        "variance_percentage": variance_percentage,
        "adjustment_made": False,
        "notes": stock_take.notes
    }
    
    # If there's a variance, create adjustment
    if variance != 0:
        adjustment = InventoryAdjustment(
            product_id=stock_take.product_id,
            quantity=counted,
            movement_type=MovementType.ADJUSTMENT,
            reason=f"Stock take adjustment. Variance: {variance}",
            notes=stock_take.notes
        )
        adjust_inventory(db, adjustment, performed_by)
        result["adjustment_made"] = True
    
    # Update last counted date
    inventory.last_counted_at = datetime.utcnow()
    db.commit()
    
    return result


# Inventory Movement CRUD
def create_movement(
    db: Session,
    movement: InventoryMovementCreate,
    performed_by: str
) -> InventoryMovement:
    """Create inventory movement record"""
    db_movement = InventoryMovement(
        id=str(uuid.uuid4()),
        performed_by=performed_by,
        **movement.model_dump()
    )
    
    if movement.unit_cost and movement.quantity:
        db_movement.total_cost = movement.unit_cost * movement.quantity
    
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement


def get_movements(
    db: Session,
    product_id: Optional[str] = None,
    movement_type: Optional[MovementType] = None,
    skip: int = 0,
    limit: int = 50
) -> List[InventoryMovement]:
    """Get inventory movements with filtering"""
    query = db.query(InventoryMovement)
    
    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)
    
    if movement_type:
        query = query.filter(InventoryMovement.movement_type == movement_type)
    
    return query.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()


# Stock Alert CRUD
def check_and_create_alerts(db: Session, inventory: WarehouseInventory):
    """Check inventory and create alerts if needed"""
    # Check for low stock
    if inventory.reorder_level and inventory.quantity_available <= inventory.reorder_level:
        create_alert_if_not_exists(
            db,
            inventory.product_id,
            AlertType.LOW_STOCK if inventory.quantity_available > 0 else AlertType.OUT_OF_STOCK,
            inventory.reorder_level,
            inventory.quantity_available,
            "high" if inventory.quantity_available == 0 else "medium"
        )
    
    # Check for expiring products
    if inventory.expiry_date:
        days_until_expiry = (inventory.expiry_date - datetime.utcnow()).days
        if days_until_expiry <= 0:
            create_alert_if_not_exists(
                db, inventory.product_id, AlertType.EXPIRED,
                None, None, "critical"
            )
        elif days_until_expiry <= 7:
            create_alert_if_not_exists(
                db, inventory.product_id, AlertType.EXPIRING_SOON,
                None, days_until_expiry, "high"
            )


def create_alert_if_not_exists(
    db: Session,
    product_id: str,
    alert_type: AlertType,
    threshold: Optional[Decimal],
    current: Optional[Decimal],
    priority: str
):
    """Create alert if one doesn't already exist"""
    existing = db.query(StockAlert).filter(
        StockAlert.product_id == product_id,
        StockAlert.alert_type == alert_type,
        StockAlert.status == AlertStatus.ACTIVE
    ).first()
    
    if not existing:
        alert = StockAlert(
            id=str(uuid.uuid4()),
            product_id=product_id,
            alert_type=alert_type,
            threshold_value=threshold,
            current_value=current,
            priority=priority,
            message=f"{alert_type.value.replace('_', ' ').title()} alert for product"
        )
        db.add(alert)
        db.commit()


def get_alerts(
    db: Session,
    status: Optional[AlertStatus] = None,
    alert_type: Optional[AlertType] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[StockAlert], int]:
    """Get stock alerts with filtering"""
    query = db.query(StockAlert)
    
    if status:
        query = query.filter(StockAlert.status == status)
    else:
        query = query.filter(StockAlert.status == AlertStatus.ACTIVE)
    
    if alert_type:
        query = query.filter(StockAlert.alert_type == alert_type)
    
    total = query.count()
    alerts = query.order_by(StockAlert.created_at.desc()).offset(skip).limit(limit).all()
    
    return alerts, total


def resolve_alert(
    db: Session,
    alert_id: str,
    resolved_by: str,
    resolution_notes: Optional[str] = None
) -> Optional[StockAlert]:
    """Resolve a stock alert"""
    alert = db.query(StockAlert).filter(StockAlert.id == alert_id).first()
    if not alert:
        return None
    
    alert.status = AlertStatus.RESOLVED
    alert.resolved_by = resolved_by
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = resolution_notes
    
    db.commit()
    db.refresh(alert)
    return alert


# Restock Order CRUD
def create_restock_order(
    db: Session,
    restock_order: RestockOrderCreate,
    created_by: str
) -> RestockOrder:
    """Create a restock order"""
    total_cost = restock_order.cost_per_unit * restock_order.quantity_ordered
    grand_total = total_cost + restock_order.tax_amount + restock_order.shipping_cost
    
    db_order = RestockOrder(
        id=str(uuid.uuid4()),
        order_number=generate_restock_order_number(),
        total_cost=total_cost,
        grand_total=grand_total,
        created_by=created_by,
        **restock_order.model_dump()
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_restock_orders(
    db: Session,
    status: Optional[RestockStatus] = None,
    supplier_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> Tuple[List[RestockOrder], int]:
    """Get restock orders with filtering"""
    query = db.query(RestockOrder)
    
    if status:
        query = query.filter(RestockOrder.status == status)
    
    if supplier_id:
        query = query.filter(RestockOrder.supplier_id == supplier_id)
    
    total = query.count()
    orders = query.order_by(RestockOrder.created_at.desc()).offset(skip).limit(limit).all()
    
    return orders, total


def update_restock_order(
    db: Session,
    order_id: str,
    update_data: RestockOrderUpdate
) -> Optional[RestockOrder]:
    """Update restock order"""
    order = db.query(RestockOrder).filter(RestockOrder.id == order_id).first()
    if not order:
        return None
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)
    return order


def receive_restock_order(
    db: Session,
    order_id: str,
    quantity_received: Decimal,
    received_by: str
) -> Optional[RestockOrder]:
    """Mark restock order as received and update inventory"""
    order = db.query(RestockOrder).filter(RestockOrder.id == order_id).first()
    if not order:
        return None
    
    order.quantity_received += quantity_received
    order.actual_delivery_date = datetime.utcnow()
    order.received_by = received_by
    
    # Update status
    if order.quantity_received >= order.quantity_ordered:
        order.status = RestockStatus.RECEIVED
    elif order.quantity_received > 0:
        order.status = RestockStatus.PARTIAL
    
    # Update inventory
    adjustment = InventoryAdjustment(
        product_id=order.product_id,
        quantity=quantity_received,
        movement_type=MovementType.IN,
        reason=f"Restock order {order.order_number} received",
        notes=f"Received from supplier",
        unit_cost=order.cost_per_unit
    )
    adjust_inventory(db, adjustment, received_by)
    
    db.commit()
    db.refresh(order)
    return order


def get_warehouse_analytics(db: Session) -> dict:
    """Get warehouse analytics"""
    total_products = db.query(WarehouseInventory).count()
    
    # Calculate total stock value from quantity * unit_cost
    total_value = db.query(
        func.sum(WarehouseInventory.quantity_available * WarehouseInventory.unit_cost)
    ).scalar() or 0
    
    low_stock = db.query(WarehouseInventory).filter(
        WarehouseInventory.quantity_available <= WarehouseInventory.reorder_level
    ).count()
    
    out_of_stock = db.query(WarehouseInventory).filter(
        WarehouseInventory.quantity_available == 0
    ).count()
    
    expiring_soon = db.query(WarehouseInventory).filter(
        WarehouseInventory.expiry_date.isnot(None),
        WarehouseInventory.expiry_date <= datetime.utcnow() + timedelta(days=7)
    ).count()
    
    expired = db.query(WarehouseInventory).filter(
        WarehouseInventory.expiry_date.isnot(None),
        WarehouseInventory.expiry_date <= datetime.utcnow()
    ).count()
    
    # Calculate average stock age
    avg_age = db.query(
        func.avg(func.extract('day', func.now() - WarehouseInventory.received_date))
    ).filter(WarehouseInventory.received_date.isnot(None)).scalar() or 0
    
    # Today's movements
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    movements_today = db.query(InventoryMovement).filter(
        InventoryMovement.created_at >= today_start
    ).count()
    
    received_today = db.query(func.sum(InventoryMovement.quantity)).filter(
        InventoryMovement.movement_type == MovementType.IN,
        InventoryMovement.created_at >= today_start
    ).scalar() or 0
    
    dispatched_today = db.query(func.sum(InventoryMovement.quantity)).filter(
        InventoryMovement.movement_type == MovementType.OUT,
        InventoryMovement.created_at >= today_start
    ).scalar() or 0
    
    # This month's movements
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    movements_this_month = db.query(InventoryMovement).filter(
        InventoryMovement.created_at >= month_start
    ).count()
    
    # Top moving products (most movements this month)
    from app.models.product import Product
    
    top_moving = db.query(
        Product.name.label('product_name'),
        func.count(InventoryMovement.id).label('movement_count')
    ).select_from(InventoryMovement
    ).join(WarehouseInventory, InventoryMovement.inventory_id == WarehouseInventory.id
    ).join(Product, WarehouseInventory.product_id == Product.id
    ).filter(
        InventoryMovement.created_at >= month_start
    ).group_by(
        Product.name
    ).order_by(
        desc('movement_count')
    ).limit(10).all()
    
    top_moving_products = [
        {
            "product_name": item.product_name,
            "total_movements": item.movement_count
        }
        for item in top_moving
    ]
    
    return {
        "total_products": total_products,
        "total_value": float(total_value),
        "total_stock_value": float(total_value),  # Add alias for frontend compatibility
        "low_stock_count": low_stock,
        "low_stock_items": low_stock,  # Add alias for frontend compatibility
        "out_of_stock_count": out_of_stock,
        "out_of_stock_items": out_of_stock,  # Add alias for frontend compatibility
        "expiring_soon_count": expiring_soon,
        "expired_count": expired,
        "average_stock_age_days": float(avg_age),
        "total_movements_today": movements_today,
        "movements_this_month": movements_this_month,  # Add for frontend
        "total_received_today": float(received_today),
        "total_dispatched_today": float(dispatched_today),
        "top_moving_products": top_moving_products  # Add for frontend
    }


# Order Fulfillment Functions
def check_stock_availability(db: Session, product_id: str, quantity: Decimal) -> Tuple[bool, str]:
    """
    Check if sufficient stock is available for an order
    Returns: (is_available, message)
    """
    inventory = get_or_create_inventory(db, product_id)
    
    if inventory.quantity_available >= quantity:
        return True, "Stock available"
    else:
        available = float(inventory.quantity_available)
        needed = float(quantity)
        return False, f"Insufficient stock. Available: {available}, Needed: {needed}"


def reserve_stock_for_order(
    db: Session,
    product_id: str,
    quantity: Decimal,
    order_id: str,
    admin_id: str
) -> Tuple[bool, str]:
    """
    Reserve stock for an order (move from available to reserved)
    This is called when order is placed but not yet approved
    """
    inventory = get_or_create_inventory(db, product_id)
    
    # Check availability
    if inventory.quantity_available < quantity:
        return False, f"Insufficient stock. Available: {float(inventory.quantity_available)}"
    
    # Move from available to reserved
    inventory.quantity_available -= quantity
    inventory.quantity_reserved += quantity
    
    # Create movement record
    movement = InventoryMovement(
        id=str(uuid.uuid4()),
        product_id=product_id,
        inventory_id=inventory.id,
        movement_type=MovementType.OUT,
        quantity=quantity,
        reference_type="order_reservation",
        reference_id=order_id,
        reason=f"Stock reserved for order {order_id}",
        performed_by=admin_id,
        created_at=datetime.now()
    )
    
    db.add(movement)
    db.commit()
    db.refresh(inventory)
    
    return True, "Stock reserved successfully"


def release_reserved_stock(
    db: Session,
    product_id: str,
    quantity: Decimal,
    order_id: str,
    admin_id: str
) -> Tuple[bool, str]:
    """
    Release reserved stock back to available
    This is called when order is cancelled
    """
    inventory = get_or_create_inventory(db, product_id)
    
    # Check if enough reserved
    if inventory.quantity_reserved < quantity:
        return False, f"Not enough reserved stock. Reserved: {float(inventory.quantity_reserved)}"
    
    # Move from reserved back to available
    inventory.quantity_reserved -= quantity
    inventory.quantity_available += quantity
    
    # Create movement record
    movement = InventoryMovement(
        id=str(uuid.uuid4()),
        product_id=product_id,
        inventory_id=inventory.id,
        movement_type=MovementType.IN,
        quantity=quantity,
        reference_type="order_cancellation",
        reference_id=order_id,
        reason=f"Stock released from cancelled order {order_id}",
        performed_by=admin_id,
        created_at=datetime.now()
    )
    
    db.add(movement)
    db.commit()
    db.refresh(inventory)
    
    return True, "Stock released successfully"


def deduct_stock_for_order(
    db: Session,
    product_id: str,
    quantity: Decimal,
    order_id: str,
    admin_id: str
) -> Tuple[bool, str]:
    """
    Deduct stock when order is approved
    This removes from reserved (if reserved) or available
    """
    from app.models.product import Product
    
    inventory = get_or_create_inventory(db, product_id)
    
    # Try to deduct from reserved first
    if inventory.quantity_reserved >= quantity:
        inventory.quantity_reserved -= quantity
        source = "reserved"
    elif inventory.quantity_available >= quantity:
        inventory.quantity_available -= quantity
        source = "available"
    else:
        total_stock = inventory.quantity_available + inventory.quantity_reserved
        return False, f"Insufficient stock. Total available: {float(total_stock)}, Needed: {float(quantity)}"
    
    # Also update product stock_quantity
    product = db.query(Product).filter(Product.id == product_id).first()
    if product and product.stock_quantity is not None:
        product.stock_quantity -= quantity
    
    # Create movement record
    movement = InventoryMovement(
        id=str(uuid.uuid4()),
        product_id=product_id,
        inventory_id=inventory.id,
        movement_type=MovementType.OUT,
        quantity=quantity,
        reference_type="order_fulfillment",
        reference_id=order_id,
        reason=f"Stock deducted for approved order {order_id} (from {source})",
        performed_by=admin_id,
        created_at=datetime.now()
    )
    
    db.add(movement)
    db.commit()
    db.refresh(inventory)
    
    return True, f"Stock deducted successfully from {source}"
