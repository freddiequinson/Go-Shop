"""
Warehouse and Inventory management endpoints for GoShopGhana Admin
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import math

from app.db.database import get_db
from app.schemas.warehouse import (
    WarehouseInventoryCreate, WarehouseInventoryUpdate, WarehouseInventoryResponse,
    InventoryMovementCreate, InventoryMovementResponse, InventoryAdjustment,
    StockAlertCreate, StockAlertUpdate, StockAlertResponse,
    RestockOrderCreate, RestockOrderUpdate, RestockOrderResponse, RestockOrderListResponse,
    WarehouseAnalytics, InventoryFilter, StockTakeRequest, StockTakeResponse
)
from app.crud.warehouse import (
    get_or_create_inventory, get_inventory_by_product, get_all_inventory,
    update_inventory, adjust_inventory, stock_take,
    create_movement, get_movements,
    get_alerts, resolve_alert,
    create_restock_order, get_restock_orders, update_restock_order,
    receive_restock_order, get_warehouse_analytics
)
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.warehouse import MovementType, AlertStatus, AlertType, RestockStatus

router = APIRouter()


# Inventory Endpoints
@router.get("/inventory", response_model=List[WarehouseInventoryResponse])
async def list_inventory(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    zone: str = Query(None),
    supplier_id: str = Query(None),
    low_stock_only: bool = Query(False),
    out_of_stock_only: bool = Query(False),
    expiring_soon_only: bool = Query(False),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all inventory with filtering (Admin only)
    """
    filters = InventoryFilter(
        zone=zone,
        supplier_id=supplier_id,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
        expiring_soon_only=expiring_soon_only
    )
    
    skip = (page - 1) * per_page
    inventory, total = get_all_inventory(db, skip=skip, limit=per_page, filters=filters)
    
    return [WarehouseInventoryResponse.model_validate(inv) for inv in inventory]


@router.get("/inventory/{product_id}", response_model=WarehouseInventoryResponse)
async def get_product_inventory(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get inventory for a specific product (Admin only)
    """
    inventory = get_inventory_by_product(db, product_id)
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in inventory"
        )
    return WarehouseInventoryResponse.model_validate(inventory)


@router.put("/inventory/{product_id}", response_model=WarehouseInventoryResponse)
async def update_product_inventory(
    product_id: str,
    update_data: WarehouseInventoryUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update product inventory settings (Admin only)
    """
    inventory = update_inventory(db, product_id, update_data)
    return WarehouseInventoryResponse.model_validate(inventory)


@router.post("/inventory/adjust", response_model=WarehouseInventoryResponse)
async def adjust_inventory_endpoint(
    adjustment: InventoryAdjustment,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Manually adjust inventory (Admin only)
    """
    inventory = adjust_inventory(db, adjustment, current_user.id)
    return WarehouseInventoryResponse.model_validate(inventory)


@router.post("/inventory/stock-take", response_model=StockTakeResponse)
async def perform_stock_take(
    stock_take: StockTakeRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Perform stock take and adjust if needed (Admin only)
    """
    result = stock_take(db, stock_take, current_user.id)
    return result


# Movement Endpoints
@router.get("/movements", response_model=List[InventoryMovementResponse])
async def list_movements(
    product_id: str = Query(None),
    movement_type: MovementType = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get inventory movement history (Admin only)
    """
    movements = get_movements(db, product_id, movement_type, skip, limit)
    return [InventoryMovementResponse.model_validate(m) for m in movements]


@router.post("/movements", response_model=InventoryMovementResponse, status_code=status.HTTP_201_CREATED)
async def create_movement_endpoint(
    movement: InventoryMovementCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Record an inventory movement (Admin only)
    """
    db_movement = create_movement(db, movement, current_user.id)
    return InventoryMovementResponse.model_validate(db_movement)


# Alert Endpoints
@router.get("/alerts", response_model=List[StockAlertResponse])
async def list_alerts(
    status_filter: AlertStatus = Query(None),
    alert_type: AlertType = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get stock alerts (Admin only)
    """
    alerts, total = get_alerts(db, status_filter, alert_type, skip, limit)
    return [StockAlertResponse.model_validate(a) for a in alerts]


@router.put("/alerts/{alert_id}/resolve", response_model=StockAlertResponse)
async def resolve_alert_endpoint(
    alert_id: str,
    resolution_notes: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Resolve a stock alert (Admin only)
    """
    alert = resolve_alert(db, alert_id, current_user.id, resolution_notes)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return StockAlertResponse.model_validate(alert)


# Restock Order Endpoints
@router.post("/restock", response_model=RestockOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_restock_order_endpoint(
    restock_order: RestockOrderCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a restock order (Admin only)
    """
    order = create_restock_order(db, restock_order, current_user.id)
    return RestockOrderResponse.model_validate(order)


@router.get("/restock", response_model=RestockOrderListResponse)
async def list_restock_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: RestockStatus = Query(None),
    supplier_id: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get restock orders (Admin only)
    """
    skip = (page - 1) * per_page
    orders, total = get_restock_orders(db, status_filter, supplier_id, skip, per_page)
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return RestockOrderListResponse(
        orders=[RestockOrderResponse.model_validate(o) for o in orders],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/restock/{order_id}", response_model=RestockOrderResponse)
async def get_restock_order(
    order_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get restock order by ID (Admin only)
    """
    orders, _ = get_restock_orders(db, skip=0, limit=1)
    order = next((o for o in orders if o.id == order_id), None)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restock order not found"
        )
    return RestockOrderResponse.model_validate(order)


@router.put("/restock/{order_id}", response_model=RestockOrderResponse)
async def update_restock_order_endpoint(
    order_id: str,
    update_data: RestockOrderUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update restock order (Admin only)
    """
    order = update_restock_order(db, order_id, update_data)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restock order not found"
        )
    return RestockOrderResponse.model_validate(order)


@router.post("/restock/{order_id}/receive", response_model=RestockOrderResponse)
async def receive_restock_order_endpoint(
    order_id: str,
    quantity_received: float = Query(..., gt=0),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Mark restock order as received and update inventory (Admin only)
    """
    from decimal import Decimal
    order = receive_restock_order(db, order_id, Decimal(str(quantity_received)), current_user.id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restock order not found"
        )
    return RestockOrderResponse.model_validate(order)


# Analytics Endpoint
@router.get("/analytics", response_model=WarehouseAnalytics)
async def get_warehouse_analytics_endpoint(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get warehouse analytics (Admin only)
    """
    analytics = get_warehouse_analytics(db)
    return analytics


# Quick Access Endpoints
@router.get("/low-stock", response_model=List[WarehouseInventoryResponse])
async def get_low_stock_products(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get products with low stock (Admin only)
    """
    filters = InventoryFilter(low_stock_only=True)
    inventory, _ = get_all_inventory(db, skip=0, limit=limit, filters=filters)
    return [WarehouseInventoryResponse.model_validate(inv) for inv in inventory]


@router.get("/expiring", response_model=List[WarehouseInventoryResponse])
async def get_expiring_products(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get products expiring soon (Admin only)
    """
    filters = InventoryFilter(expiring_soon_only=True)
    inventory, _ = get_all_inventory(db, skip=0, limit=limit, filters=filters)
    return [WarehouseInventoryResponse.model_validate(inv) for inv in inventory]
