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
    WarehouseAnalytics, InventoryFilter, StockTakeRequest, StockTakeResponse,
    AllocateToShopRequest, AssignLocationRequest, InventoryListResponse
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
from app.models.warehouse import MovementType, AlertStatus, AlertType, RestockStatus, WarehouseInventory

router = APIRouter()


# Inventory Endpoints
@router.get("/inventory", response_model=InventoryListResponse)
async def list_inventory(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    zone: str = Query(None),
    supplier_id: str = Query(None),
    low_stock_only: bool = Query(False),
    out_of_stock_only: bool = Query(False),
    expiring_soon_only: bool = Query(False),
    search: Optional[str] = Query(None, description="Search in product name"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all inventory with filtering and search (Admin only)
    Includes product details for publish/unpublish functionality
    Returns paginated response with total count
    """
    from app.models.product import Product
    
    filters = InventoryFilter(
        zone=zone,
        supplier_id=supplier_id,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
        expiring_soon_only=expiring_soon_only,
        search=search
    )
    
    skip = (page - 1) * per_page
    inventory, total = get_all_inventory(db, skip=skip, limit=per_page, filters=filters)
    
    # Enrich with product details and filter out supplier products
    result = []
    for inv in inventory:
        product = db.query(Product).filter(Product.id == inv.product_id).first()
        
        # Skip supplier products - they should only show after GRN is received
        if product and product.created_by_type == 'supplier' and not product.in_warehouse:
            continue
            
        inv_dict = WarehouseInventoryResponse.model_validate(inv).model_dump()
        if product:
            inv_dict['product_name'] = product.name
            inv_dict['product_description'] = product.description
            inv_dict['is_published'] = product.is_published
            inv_dict['created_by_type'] = product.created_by_type
        result.append(WarehouseInventoryResponse(**inv_dict))
    
    # Calculate pagination based on actual total from database
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return InventoryListResponse(
        items=result,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/inventory/{product_id}", response_model=WarehouseInventoryResponse)
async def get_product_inventory(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get inventory for a specific product with full details (Admin only)
    Includes product details and warehouse location information
    """
    from app.models.product import Product
    from app.models.warehouse import WarehouseLocation
    
    inventory = get_inventory_by_product(db, product_id)
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in inventory"
        )
    
    # Enrich with product and location details
    inv_dict = WarehouseInventoryResponse.model_validate(inventory).model_dump()
    
    # Get product details
    product = db.query(Product).filter(Product.id == inventory.product_id).first()
    if product:
        inv_dict['product_name'] = product.name
        inv_dict['product_description'] = product.description
        inv_dict['is_published'] = product.is_published
        inv_dict['created_by_type'] = product.created_by_type
        inv_dict['price_per_unit'] = product.price_per_unit  # Selling price to customers
        inv_dict['product_cost_price'] = product.cost_price  # What we paid supplier
    
    # Get location details
    if inventory.warehouse_location_id:
        location = db.query(WarehouseLocation).filter(
            WarehouseLocation.id == inventory.warehouse_location_id
        ).first()
        if location:
            inv_dict['location_name'] = location.name
            inv_dict['location_code'] = location.code
            inv_dict['zone_type'] = location.zone_type.value if location.zone_type else None
            inv_dict['temperature_min'] = location.temperature_min
            inv_dict['temperature_max'] = location.temperature_max
    
    return WarehouseInventoryResponse(**inv_dict)


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
    from app.utils.audit_logger import log_inventory_update
    from app.crud.product import get_product_by_id
    
    # Get product name for logging
    product = get_product_by_id(db, product_id)
    product_name = product.name if product else "Unknown Product"
    
    # Track changes
    changes = update_data.dict(exclude_unset=True)
    
    inventory = update_inventory(db, product_id, update_data)
    
    # Log the inventory update
    if changes:
        log_inventory_update(
            db=db,
            user_id=current_user.id,
            user_email=current_user.email,
            product_id=product_id,
            product_name=product_name,
            changes=changes
        )
    
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
    from app.utils.audit_logger import log_stock_adjustment
    from app.crud.product import get_product_by_id
    
    # Get product name for logging
    product = get_product_by_id(db, adjustment.product_id)
    product_name = product.name if product else "Unknown Product"
    
    inventory = adjust_inventory(db, adjustment, current_user.id)
    
    # Log the stock adjustment
    log_stock_adjustment(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        product_id=adjustment.product_id,
        product_name=product_name,
        adjustment_type=adjustment.adjustment_type,
        quantity=adjustment.quantity,
        reason=adjustment.reason
    )
    
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


# Supplier Product Publishing
@router.put("/products/{product_id}/publish")
async def publish_product_to_shop(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Publish a warehouse product to the shop
    Product must be in warehouse and not already published
    """
    from app.models.product import Product
    from app.models.warehouse import WarehouseInventory
    
    # Get product
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if product is in warehouse
    if not product.in_warehouse:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product must be in warehouse before publishing"
        )
    
    # Check if already published
    if product.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is already published"
        )
    
    # Check warehouse inventory
    inventory = db.query(WarehouseInventory).filter(
        WarehouseInventory.product_id == product_id
    ).first()
    
    if not inventory or inventory.quantity_available <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish product with no stock in warehouse"
        )
    
    # Publish product
    product.is_published = True
    product.is_active = True
    product.stock_quantity = inventory.quantity_available
    
    db.commit()
    db.refresh(product)
    
    return {
        "message": "Product published to shop successfully",
        "product_id": product.id,
        "product_name": product.name,
        "stock_quantity": product.stock_quantity
    }


@router.put("/products/{product_id}/unpublish")
async def unpublish_product_from_shop(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Unpublish a product from the shop (move back to warehouse only)
    """
    from app.models.product import Product
    
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if not product.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is not published"
        )
    
    # Unpublish - only change is_published, keep is_active=True
    # Product should remain in warehouse and admin products page
    product.is_published = False
    # DO NOT set is_active = False (product should stay in warehouse/admin)
    
    db.commit()
    db.refresh(product)
    
    return {
        "message": "Product unpublished from shop successfully",
        "product_id": product.id,
        "product_name": product.name
    }


@router.post("/inventory/{product_id}/allocate-to-shop")
async def allocate_quantity_to_shop(
    product_id: str,
    request: AllocateToShopRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Allocate a specific quantity from warehouse to shop
    This reserves quantity for shop sales while keeping remainder in warehouse
    """
    from app.models.product import Product
    from app.models.warehouse import MovementType
    
    # Get inventory
    inventory = get_inventory_by_product(db, product_id)
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in warehouse inventory"
        )
    
    # Validate quantity available
    if request.quantity > inventory.quantity_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient quantity. Available: {inventory.quantity_available}, Requested: {request.quantity}"
        )
    
    # Update inventory - move from available to reserved
    inventory.quantity_available -= request.quantity
    inventory.quantity_reserved += request.quantity
    
    # Create movement record
    movement_data = InventoryMovementCreate(
        product_id=product_id,
        movement_type=MovementType.TRANSFER,
        quantity=request.quantity,
        from_location="Warehouse",
        to_location="Shop",
        reason="Allocated to shop for sales",
        notes=request.notes,
        performed_by_id=current_user.id
    )
    create_movement(db, movement_data, current_user.id)
    
    # Update product to published if not already
    product = db.query(Product).filter(Product.id == product_id).first()
    if product and not product.is_published:
        product.is_published = True
        product.is_active = True
    
    db.commit()
    db.refresh(inventory)
    
    return {
        "message": "Quantity allocated to shop successfully",
        "product_id": product_id,
        "allocated_quantity": float(request.quantity),
        "remaining_in_warehouse": float(inventory.quantity_available),
        "reserved_for_shop": float(inventory.quantity_reserved)
    }


@router.put("/inventory/{product_id}/assign-location")
async def assign_warehouse_location(
    product_id: str,
    request: AssignLocationRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Assign a product to a specific warehouse location/zone
    """
    from app.models.warehouse import WarehouseLocation
    
    # Get inventory
    inventory = get_inventory_by_product(db, product_id)
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in warehouse inventory"
        )
    
    # Validate location exists
    location = db.query(WarehouseLocation).filter(
        WarehouseLocation.id == request.warehouse_location_id
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse location not found"
        )
    
    if not location.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Warehouse location is not active"
        )
    
    # Store old location for movement record
    old_location = inventory.warehouse_location_id
    old_location_name = None
    if old_location:
        old_loc = db.query(WarehouseLocation).filter(WarehouseLocation.id == old_location).first()
        if old_loc:
            old_location_name = old_loc.name
    
    # Update inventory location
    inventory.warehouse_location_id = request.warehouse_location_id
    inventory.location_in_warehouse = request.location_in_warehouse
    inventory.zone = location.zone_type.value if location.zone_type else None
    
    # Create movement record if location changed
    if old_location != request.warehouse_location_id:
        movement_data = InventoryMovementCreate(
            product_id=product_id,
            movement_type=MovementType.TRANSFER,
            quantity=inventory.quantity_available,
            from_location=old_location_name or "Unassigned",
            to_location=location.name,
            reason="Location assignment",
            notes=request.notes,
            performed_by_id=current_user.id
        )
        create_movement(db, movement_data, current_user.id)
    
    db.commit()
    db.refresh(inventory)
    
    return {
        "message": "Warehouse location assigned successfully",
        "product_id": product_id,
        "location_name": location.name,
        "location_code": location.code,
        "zone_type": location.zone_type.value if location.zone_type else None,
        "shelf_bin": request.location_in_warehouse
    }


@router.post("/inventory/sync-all-products")
async def sync_all_products_to_warehouse(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Sync all products to warehouse inventory (Admin only)
    Creates warehouse_inventory records for products that don't have them
    """
    from app.models.product import Product
    
    # Get all active products created by admin only (exclude supplier products)
    # Supplier products should only enter warehouse via GRN
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.created_by_type == 'admin'
    ).all()
    
    synced_count = 0
    existing_count = 0
    
    for product in products:
        # Check if inventory exists
        existing = db.query(WarehouseInventory).filter(
            WarehouseInventory.product_id == product.id
        ).first()
        
        if not existing:
            # Create new inventory record
            new_inventory = WarehouseInventory(
                product_id=product.id,
                quantity_available=product.stock_quantity or 0,
                quantity_reserved=0,
                quantity_damaged=0,
                reorder_level=10,  # Default reorder level
                cost_price=product.cost_price,
                total_value=(product.stock_quantity or 0) * (product.cost_price or 0),
                supplier_id=product.supplier_id
            )
            db.add(new_inventory)
            synced_count += 1
        else:
            existing_count += 1
    
    db.commit()
    
    return {
        "message": "Products synced to warehouse successfully",
        "synced_count": synced_count,
        "existing_count": existing_count,
        "total_products": len(products)
    }
