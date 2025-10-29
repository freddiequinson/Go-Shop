"""
Fixed order endpoints for GoShopGhana
Ghana market focused order management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.order import (
    OrderResponse, OrderCreate, OrderUpdate, OrderSummary, 
    OrderStats, OrderStatusUpdate
)
from app.models.order import OrderStatus
from app.crud.order import (
    create_order_from_cart, get_order_with_items, get_user_orders,
    get_all_orders, update_order_status, update_order, cancel_order,
    get_order_statistics
)
from app.core.deps import get_current_active_user, get_current_admin
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create order from user's cart
    """
    try:
        order = create_order_from_cart(db, current_user.id, order_data)
        
        # Get order with items for response
        order_details = get_order_with_items(db, order.id, current_user.id)
        
        # Build response with cedis columns
        order_response = OrderResponse(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            subtotal_cedis=order.subtotal_cedis,
            delivery_fee_cedis=order.delivery_fee_cedis,
            tax_cedis=order.tax_cedis,
            total_cedis=order.total_cedis,
            delivery_address=order.delivery_address,
            delivery_notes=order.delivery_notes,
            created_at=order.created_at,
            updated_at=order.updated_at,
            delivered_at=order.delivered_at,
            items=order_details['items'],
            subtotal=float(order.subtotal_cedis) / 100,
            delivery_fee=float(order.delivery_fee_cedis) / 100,
            tax=float(order.tax_cedis) / 100,
            total=float(order.total_cedis) / 100
        )
        
        return order_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.get("/", response_model=List[OrderSummary])
async def get_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's orders
    """
    orders = get_user_orders(db, current_user.id, skip, limit)
    
    # Convert to summary format
    order_summaries = []
    for order in orders:
        # Count items
        from app.crud.order import get_order_items
        items = get_order_items(db, order.id)
        
        summary = OrderSummary(
            id=order.id,
            status=order.status,
            total=float(order.total_cedis) / 100,
            item_count=len(items),
            created_at=order.created_at
        )
        order_summaries.append(summary)
    
    return order_summaries


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed order information
    """
    order_details = get_order_with_items(db, order_id, current_user.id)
    
    if not order_details['order']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order = order_details['order']
    
    order_response = OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        subtotal_cedis=order.subtotal_cedis,
        delivery_fee_cedis=order.delivery_fee_cedis,
        tax_cedis=order.tax_cedis,
        total_cedis=order.total_cedis,
        delivery_address=order.delivery_address,
        delivery_notes=order.delivery_notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        delivered_at=order.delivered_at,
        items=order_details['items'],
        subtotal=float(order.subtotal_cedis) / 100,
        delivery_fee=float(order.delivery_fee_cedis) / 100,
        tax=float(order.tax_cedis) / 100,
        total=float(order.total_cedis) / 100
    )
    
    return order_response


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status_endpoint(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update order status (users can only cancel their own orders)
    """
    # Users can only cancel their own orders
    if status_update.status != OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users can only cancel orders"
        )
    
    try:
        order = cancel_order(db, order_id, current_user.id)
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Get updated order details
        order_details = get_order_with_items(db, order.id, current_user.id)
        
        order_response = OrderResponse(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            subtotal_cedis=order.subtotal_cedis,
            delivery_fee_cedis=order.delivery_fee_cedis,
            tax_cedis=order.tax_cedis,
            total_cedis=order.total_cedis,
            delivery_address=order.delivery_address,
            delivery_notes=order.delivery_notes,
            created_at=order.created_at,
            updated_at=order.updated_at,
            delivered_at=order.delivered_at,
            items=order_details['items'],
            subtotal=float(order.subtotal_cedis) / 100,
            delivery_fee=float(order.delivery_fee_cedis) / 100,
            tax=float(order.tax_cedis) / 100,
            total=float(order.total_cedis) / 100
        )
        
        return order_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stats/summary", response_model=OrderStats)
async def get_order_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get order statistics for current user
    """
    stats = get_order_statistics(db, current_user.id)
    return OrderStats(**stats)
