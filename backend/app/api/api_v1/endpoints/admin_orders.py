"""
Admin Order Management endpoints for GoShopGhana
Allows admins to view, filter, and manage all orders
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.db.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.product import Product
from app.schemas.order import (
    OrderResponse, OrderSummary, OrderStatusUpdate,
    OrderWithPaymentAttempts, PaymentAttemptResponse
)
from app.crud.order import (
    get_order_by_id, get_all_orders, update_order_status,
    get_order_items, get_order_statistics
)
from app.crud.payment_attempt import get_order_payment_attempts
from app.crud.warehouse import (
    check_stock_availability, deduct_stock_for_order, release_reserved_stock
)
from datetime import datetime
from decimal import Decimal
import math

router = APIRouter()


@router.get("/orders", response_model=dict)
async def list_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    payment_status_filter: Optional[PaymentStatus] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all orders with pagination and filters (Admin only)
    """
    skip = (page - 1) * per_page
    
    # Build query
    query = db.query(Order)
    
    # Apply filters
    if status_filter:
        # Map common filter terms to actual statuses
        if status_filter == 'processing':
            # Processing means preparing or dispatched
            query = query.filter(Order.status.in_(['preparing', 'PREPARING', 'dispatched', 'DISPATCHED']))
        elif status_filter == 'in_transit':
            query = query.filter(Order.status.in_(['dispatched', 'DISPATCHED']))
        else:
            query = query.filter(Order.status == status_filter)
    
    if payment_status_filter:
        query = query.filter(Order.payment_status == payment_status_filter)
    
    if search:
        # Search by order ID or user email
        query = query.join(User, Order.user_id == User.id).filter(
            (Order.id.ilike(f"%{search}%")) | 
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    
    # Get total count
    total = query.count()
    
    # Get orders with pagination
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(per_page).all()
    
    # Convert to summary format
    order_summaries = []
    for order in orders:
        items = get_order_items(db, order.id)
        
        # Get user info
        user = db.query(User).filter(User.id == order.user_id).first()
        
        order_summaries.append({
            "id": order.id,
            "user_id": order.user_id,
            "user_email": user.email if user else None,
            "user_name": user.full_name if user else None,
            "user_phone": user.phone if user else None,
            "status": order.status,
            "payment_status": order.payment_status,
            "total": float(order.total_cedis) / 100,
            "item_count": len(items),
            "created_at": order.created_at.isoformat(),
            "payment_method": order.payment_method,
            "delivery_address": order.delivery_address
        })
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return {
        "orders": order_summaries,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages
    }


@router.get("/orders/stats")
async def get_admin_order_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get order statistics for admin dashboard
    """
    # Total orders
    total_orders = db.query(func.count(Order.id)).scalar()
    
    # Orders by status
    pending_payment = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.PENDING_PAYMENT
    ).scalar()
    
    payment_failed = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.PAYMENT_FAILED
    ).scalar()
    
    confirmed = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.CONFIRMED
    ).scalar()
    
    preparing = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.PREPARING
    ).scalar()
    
    dispatched = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.DISPATCHED
    ).scalar()
    
    delivered = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.DELIVERED
    ).scalar()
    
    cancelled = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.CANCELLED
    ).scalar()
    
    # Total revenue (completed payments only)
    total_revenue = db.query(func.sum(Order.total_cedis)).filter(
        Order.payment_status == PaymentStatus.COMPLETED
    ).scalar() or 0
    
    return {
        "total_orders": total_orders,
        "pending_payment": pending_payment,
        "payment_failed": payment_failed,
        "confirmed": confirmed,
        "preparing": preparing,
        "dispatched": dispatched,
        "delivered": delivered,
        "cancelled": cancelled,
        "total_revenue": float(total_revenue) / 100,
        "currency": "GHS"
    }


# IMPORTANT: Specific routes must come BEFORE dynamic routes
# Place /orders/by-products and /orders/by-delivery-date BEFORE /orders/{order_id}

@router.get("/orders/by-products")
async def get_orders_by_products(
    status_filter: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get orders grouped by products with aggregates
    Shows total quantity ordered, order count, and customer count per product
    """
    from sqlalchemy import func, distinct
    from app.models.order import OrderItem
    
    # Build base query
    query = db.query(
        OrderItem.product_id,
        OrderItem.product_name,
        OrderItem.product_image_url,
        OrderItem.unit_type,
        func.sum(OrderItem.quantity).label('total_quantity'),
        func.count(distinct(OrderItem.order_id)).label('total_orders'),
        func.count(distinct(Order.user_id)).label('unique_customers')
    ).join(Order, OrderItem.order_id == Order.id)
    
    # Apply filters
    if status_filter:
        if status_filter == 'paid':
            query = query.filter(Order.payment_status == PaymentStatus.COMPLETED)
        elif status_filter == 'approved':
            query = query.filter(Order.approved_at.isnot(None))
        else:
            query = query.filter(Order.status == status_filter)
    
    if date_from:
        query = query.filter(Order.created_at >= date_from)
    
    if date_to:
        query = query.filter(Order.created_at <= date_to)
    
    # Group by product
    query = query.group_by(
        OrderItem.product_id,
        OrderItem.product_name,
        OrderItem.product_image_url,
        OrderItem.unit_type
    ).order_by(func.sum(OrderItem.quantity).desc())
    
    results = query.all()
    
    # Format response
    products = []
    for result in results:
        # Get product image with fallback
        product_image = result.product_image_url
        if not product_image:
            product = db.query(Product).filter(Product.id == result.product_id).first()
            if product and product.images:
                if isinstance(product.images, list) and len(product.images) > 0:
                    product_image = product.images[0]
                elif isinstance(product.images, str):
                    product_image = product.images
        
        # Get orders for this product
        orders_query = db.query(
            Order.id,
            Order.user_id,
            Order.status,
            Order.payment_status,
            Order.created_at,
            Order.approved_at,
            OrderItem.quantity
        ).join(OrderItem, Order.id == OrderItem.order_id).filter(
            OrderItem.product_id == result.product_id
        )
        
        # Apply same filters to orders
        if status_filter:
            if status_filter == 'paid':
                orders_query = orders_query.filter(Order.payment_status == PaymentStatus.COMPLETED)
            elif status_filter == 'approved':
                orders_query = orders_query.filter(Order.approved_at.isnot(None))
            else:
                orders_query = orders_query.filter(Order.status == status_filter)
        
        if date_from:
            orders_query = orders_query.filter(Order.created_at >= date_from)
        if date_to:
            orders_query = orders_query.filter(Order.created_at <= date_to)
        
        orders = orders_query.all()
        
        # Format orders
        orders_list = []
        for order in orders:
            # Get user info
            user = db.query(User).filter(User.id == order.user_id).first()
            
            orders_list.append({
                'order_id': order.id,
                'user_name': user.full_name if user else 'Guest',
                'user_email': user.email if user else None,
                'quantity': float(order.quantity),
                'status': order.status,
                'payment_status': order.payment_status,
                'created_at': order.created_at.isoformat(),
                'approved_at': order.approved_at.isoformat() if order.approved_at else None
            })
        
        products.append({
            'product_id': result.product_id,
            'product_name': result.product_name,
            'product_image': product_image,
            'unit_type': result.unit_type,
            'total_quantity': float(result.total_quantity),
            'total_orders': result.total_orders,
            'unique_customers': result.unique_customers,
            'orders': orders_list
        })
    
    return {
        'products': products,
        'total_products': len(products)
    }


@router.get("/orders/by-delivery-date")
async def get_orders_by_delivery_date(
    status_filter: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get orders grouped by delivery date with countdown timers
    Shows orders organized by their estimated delivery date
    """
    from sqlalchemy import func, case
    from datetime import datetime, timedelta
    
    # Build base query - get all orders
    query = db.query(Order)
    
    # Apply additional filters
    if status_filter:
        if status_filter == 'dispatched':
            query = query.filter(Order.dispatched_at.isnot(None))
        elif status_filter == 'not_dispatched':
            query = query.filter(Order.dispatched_at.is_(None))
        else:
            query = query.filter(Order.status == status_filter)
    
    # Filter by delivery date range
    if date_from:
        query = query.filter(Order.estimated_delivery_time >= date_from)
    
    if date_to:
        query = query.filter(Order.estimated_delivery_time <= date_to)
    
    # Get orders
    orders = query.order_by(Order.estimated_delivery_time.asc()).all()
    
    # Group by delivery date
    delivery_dates = {}
    now = datetime.now()
    
    for order in orders:
        # Determine delivery date
        if order.estimated_delivery_time:
            delivery_date = order.estimated_delivery_time.date()
        else:
            # Default to 3 days from order creation
            delivery_date = (order.created_at + timedelta(days=3)).date()
        
        date_key = delivery_date.isoformat()
        
        if date_key not in delivery_dates:
            # Calculate countdown
            delivery_datetime = datetime.combine(delivery_date, datetime.min.time())
            time_diff = delivery_datetime - now
            countdown_hours = int(time_diff.total_seconds() / 3600)
            
            # Determine urgency
            if countdown_hours < 0:
                urgency = 'overdue'
            elif countdown_hours < 24:
                urgency = 'urgent'
            elif countdown_hours < 48:
                urgency = 'soon'
            else:
                urgency = 'normal'
            
            delivery_dates[date_key] = {
                'date': date_key,
                'countdown_hours': countdown_hours,
                'urgency': urgency,
                'total_orders': 0,
                'dispatched_orders': 0,
                'pending_dispatch': 0,
                'orders': []
            }
        
        # Get order items count
        items = get_order_items(db, order.id)
        items_count = len(items)
        
        # Get user info
        user = db.query(User).filter(User.id == order.user_id).first()
        
        # Get delivery address
        delivery_address = order.delivery_address or {}
        address_text = delivery_address.get('address', 'N/A')
        if delivery_address.get('city'):
            address_text += f", {delivery_address['city']}"
        
        order_data = {
            'order_id': order.id,
            'user_name': user.full_name if user else 'Guest',
            'user_phone': user.phone if user else None,
            'delivery_address': address_text,
            'delivery_notes': order.delivery_notes,
            'items_count': items_count,
            'total': float(order.total_cedis) / 100,
            'status': order.status,
            'payment_status': order.payment_status,
            'created_at': order.created_at.isoformat(),
            'approved_at': order.approved_at.isoformat() if order.approved_at else None,
            'dispatched_at': order.dispatched_at.isoformat() if order.dispatched_at else None,
            'is_dispatched': order.dispatched_at is not None
        }
        
        delivery_dates[date_key]['orders'].append(order_data)
        delivery_dates[date_key]['total_orders'] += 1
        
        if order.dispatched_at:
            delivery_dates[date_key]['dispatched_orders'] += 1
        else:
            delivery_dates[date_key]['pending_dispatch'] += 1
    
    # Convert to list and sort by date
    delivery_list = sorted(delivery_dates.values(), key=lambda x: x['date'])
    
    return {
        'delivery_dates': delivery_list,
        'total_dates': len(delivery_list),
        'total_orders': sum(d['total_orders'] for d in delivery_list)
    }


@router.get("/orders/{order_id}", response_model=OrderWithPaymentAttempts)
async def get_order_details(
    order_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed order information including payment attempts (Admin only)
    """
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Get order items
    items = get_order_items(db, order_id)
    items_data = []
    for item in items:
        # Check if it's a package or product
        item_type = getattr(item, 'item_type', 'product') or 'product'
        package_id = getattr(item, 'package_id', None)
        package_items_snapshot = getattr(item, 'package_items_snapshot', None)
        
        # Fallback to product/package image if not in order item
        product_image = item.product_image_url
        if not product_image:
            if item_type == 'package' and package_id:
                from app.models.package import Package
                package = db.query(Package).filter(Package.id == package_id).first()
                if package:
                    product_image = package.image_url
            elif item.product_id:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product and product.images:
                    # Get first image from images array
                    if isinstance(product.images, list) and len(product.images) > 0:
                        product_image = product.images[0]
                    elif isinstance(product.images, str):
                        product_image = product.images
        
        items_data.append({
            "id": item.id,
            "order_id": item.order_id,
            "product_id": item.product_id,
            "package_id": package_id,
            "item_type": item_type,
            "product_name": item.product_name,
            "product_image_url": product_image,
            "price_per_unit_cedis": item.price_per_unit_cedis,
            "unit_type": item.unit_type,
            "quantity": item.quantity,
            "line_total_cedis": item.line_total_cedis,
            "price_per_unit": float(item.price_per_unit_cedis) / 100,
            "line_total": float(item.line_total_cedis) / 100,
            "package_items_snapshot": package_items_snapshot
        })
    
    # Get user information
    user = db.query(User).filter(User.id == order.user_id).first()
    user_name = user.full_name if user else None
    user_email = user.email if user else None
    user_phone = user.phone if user else None
    
    # Get payment attempts
    attempts = get_order_payment_attempts(db, order_id)
    attempts_data = []
    for attempt in attempts:
        attempts_data.append(PaymentAttemptResponse(
            id=attempt.id,
            order_id=attempt.order_id,
            amount=float(attempt.amount_cedis) / 100,
            payment_reference=attempt.payment_reference,
            status=attempt.status,
            payment_method=attempt.payment_method,
            error_message=attempt.error_message,
            created_at=attempt.created_at
        ))
    
    return OrderWithPaymentAttempts(
        id=order.id,
        user_id=order.user_id,
        user_name=user_name,
        user_email=user_email,
        user_phone=user_phone,
        status=order.status,
        subtotal_cedis=order.subtotal_cedis,
        delivery_fee_cedis=order.delivery_fee_cedis,
        tax_cedis=order.tax_cedis,
        total_cedis=order.total_cedis,
        delivery_price=order.delivery_price,
        delivery_method=order.delivery_method,
        delivery_distance=order.delivery_distance,
        is_free_delivery=order.is_free_delivery,
        coupon_code=order.coupon_code,
        coupon_discount=order.coupon_discount,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        payment_reference=order.payment_reference,
        payment_completed_at=order.payment_completed_at,
        delivery_address=order.delivery_address,
        delivery_notes=order.delivery_notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        delivered_at=order.delivered_at,
        items=items_data,
        payment_attempts=attempts_data,
        subtotal=float(order.subtotal_cedis) / 100,
        delivery_fee=float(order.delivery_fee_cedis) / 100,
        tax=float(order.tax_cedis) / 100,
        total=float(order.total_cedis) / 100
    )


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status_admin(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update order status (Admin only)
    Admins can change to any status
    """
    order = update_order_status(db, order_id, status_update.status)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Get items for response
    items = get_order_items(db, order_id)
    items_data = []
    for item in items:
        items_data.append({
            "id": item.id,
            "order_id": item.order_id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "product_image_url": item.product_image_url,
            "price_per_unit_cedis": item.price_per_unit_cedis,
            "unit_type": item.unit_type,
            "quantity": item.quantity,
            "line_total_cedis": item.line_total_cedis,
            "price_per_unit": float(item.price_per_unit_cedis) / 100,
            "line_total": float(item.line_total_cedis) / 100
        })
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        subtotal_cedis=order.subtotal_cedis,
        delivery_fee_cedis=order.delivery_fee_cedis,
        tax_cedis=order.tax_cedis,
        total_cedis=order.total_cedis,
        delivery_price=order.delivery_price,
        delivery_method=order.delivery_method,
        delivery_distance=order.delivery_distance,
        is_free_delivery=order.is_free_delivery,
        coupon_code=order.coupon_code,
        coupon_discount=order.coupon_discount,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        payment_reference=order.payment_reference,
        payment_completed_at=order.payment_completed_at,
        delivery_address=order.delivery_address,
        delivery_notes=order.delivery_notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        delivered_at=order.delivered_at,
        items=items_data,
        subtotal=float(order.subtotal_cedis) / 100,
        delivery_fee=float(order.delivery_fee_cedis) / 100,
        tax=float(order.tax_cedis) / 100,
        total=float(order.total_cedis) / 100
    )


@router.post("/orders/{order_id}/approve")
async def approve_order(
    order_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approve an order and deduct from inventory (Admin only)
    
    This endpoint:
    1. Verifies payment is completed
    2. Checks stock availability for all items
    3. Deducts stock from inventory
    4. Updates order status to CONFIRMED
    5. Records admin who approved
    """
    # Get order
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if already approved
    if order.approved_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order already approved on {order.approved_at}"
        )
    
    # Check payment status
    if order.payment_status != PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve order with payment status: {order.payment_status}. Payment must be completed first."
        )
    
    # Get order items
    items = get_order_items(db, order_id)
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has no items"
        )
    
    # Check stock availability for all items first
    stock_issues = []
    for item in items:
        is_available, message = check_stock_availability(
            db, 
            item.product_id, 
            Decimal(str(item.quantity))
        )
        if not is_available:
            stock_issues.append(f"{item.product_name}: {message}")
    
    if stock_issues:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Insufficient stock for some items",
                "issues": stock_issues
            }
        )
    
    # Deduct stock for all items
    try:
        for item in items:
            success, message = deduct_stock_for_order(
                db,
                item.product_id,
                Decimal(str(item.quantity)),
                order_id,
                current_admin.id
            )
            if not success:
                # Rollback will happen automatically
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to deduct stock for {item.product_name}: {message}"
                )
        
        # Update order status and approval info
        order.status = OrderStatus.CONFIRMED
        order.approved_at = datetime.now()
        order.approved_by = current_admin.id
        
        db.commit()
        db.refresh(order)
        
        return {
            "message": "Order approved successfully",
            "order_id": order_id,
            "approved_at": order.approved_at,
            "approved_by": current_admin.id,
            "status": order.status,
            "items_processed": len(items)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving order: {str(e)}"
        )


@router.post("/orders/{order_id}/dispatch")
async def dispatch_order(
    order_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Mark an order as dispatched
    Records who dispatched it and when
    """
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if already dispatched
    if order.dispatched_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order already dispatched on {order.dispatched_at}"
        )
    
    # Check if approved
    if not order.approved_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be approved before dispatch"
        )
    
    # Update order
    order.dispatched_at = datetime.now()
    order.dispatched_by = current_admin.id
    order.status = OrderStatus.DISPATCHED
    
    db.commit()
    db.refresh(order)
    
    return {
        'message': 'Order dispatched successfully',
        'order_id': order_id,
        'dispatched_at': order.dispatched_at,
        'dispatched_by': current_admin.id,
        'status': order.status
    }


@router.post("/orders/bulk-dispatch")
async def bulk_dispatch_orders(
    order_ids: List[str],
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Mark multiple orders as dispatched
    Useful for dispatching all orders for a delivery date
    """
    if not order_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No order IDs provided"
        )
    
    results = {
        'successful': [],
        'failed': [],
        'total': len(order_ids)
    }
    
    for order_id in order_ids:
        try:
            order = get_order_by_id(db, order_id)
            if not order:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': 'Order not found'
                })
                continue
            
            if order.dispatched_at:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': f'Already dispatched on {order.dispatched_at}'
                })
                continue
            
            if not order.approved_at:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': 'Order not approved'
                })
                continue
            
            # Dispatch order
            order.dispatched_at = datetime.now()
            order.dispatched_by = current_admin.id
            order.status = OrderStatus.DISPATCHED
            
            db.commit()
            
            results['successful'].append({
                'order_id': order_id
            })
            
        except Exception as e:
            db.rollback()
            results['failed'].append({
                'order_id': order_id,
                'reason': str(e)
            })
    
    return {
        'message': f'Processed {results["total"]} orders',
        'successful_count': len(results['successful']),
        'failed_count': len(results['failed']),
        'results': results
    }


@router.post("/orders/bulk-approve")
async def bulk_approve_orders(
    order_ids: List[str],
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approve multiple orders at once
    Useful for approving all orders for a specific product
    """
    if not order_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No order IDs provided"
        )
    
    results = {
        'successful': [],
        'failed': [],
        'total': len(order_ids)
    }
    
    for order_id in order_ids:
        try:
            # Get order
            order = get_order_by_id(db, order_id)
            if not order:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': 'Order not found'
                })
                continue
            
            # Check if already approved
            if order.approved_at:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': f'Already approved on {order.approved_at}'
                })
                continue
            
            # Check payment status
            if order.payment_status != PaymentStatus.COMPLETED:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': f'Payment not completed ({order.payment_status})'
                })
                continue
            
            # Get order items
            items = get_order_items(db, order_id)
            if not items:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': 'Order has no items'
                })
                continue
            
            # Check stock availability
            stock_issues = []
            for item in items:
                is_available, message = check_stock_availability(
                    db, 
                    item.product_id, 
                    Decimal(str(item.quantity))
                )
                if not is_available:
                    stock_issues.append(f"{item.product_name}: {message}")
            
            if stock_issues:
                results['failed'].append({
                    'order_id': order_id,
                    'reason': 'Insufficient stock',
                    'details': stock_issues
                })
                continue
            
            # Deduct stock for all items
            for item in items:
                success, message = deduct_stock_for_order(
                    db,
                    item.product_id,
                    Decimal(str(item.quantity)),
                    order_id,
                    current_admin.id
                )
                if not success:
                    raise Exception(f"Failed to deduct stock for {item.product_name}: {message}")
            
            # Update order status
            order.status = OrderStatus.CONFIRMED
            order.approved_at = datetime.now()
            order.approved_by = current_admin.id
            
            db.commit()
            
            results['successful'].append({
                'order_id': order_id,
                'items_processed': len(items)
            })
            
        except Exception as e:
            db.rollback()
            results['failed'].append({
                'order_id': order_id,
                'reason': str(e)
            })
    
    return {
        'message': f'Processed {results["total"]} orders',
        'successful_count': len(results['successful']),
        'failed_count': len(results['failed']),
        'results': results
    }


@router.delete("/orders/{order_id}")
async def delete_order_admin(
    order_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Permanently delete an order and all its items (Admin only)
    """
    from app.models.order import OrderItem, PaymentAttempt as PaymentAttemptModel
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Delete related payment attempts
    db.query(PaymentAttemptModel).filter(PaymentAttemptModel.order_id == order_id).delete()
    # Delete order items
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
    # Delete the order itself
    db.delete(order)
    db.commit()
    
    return {
        "message": "Order deleted successfully",
        "order_id": order_id
    }


@router.post("/orders/{order_id}/manual-payment-confirm")
async def manual_payment_confirm(
    order_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    TEMPORARY ENDPOINT: Manually confirm payment for legacy orders
    This is a temporary fix for orders stuck in pending status on Digital Ocean
    TODO: Remove this endpoint after fixing all legacy orders
    """
    # Get order
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Only allow for pending/processing payments
    if order.payment_status not in [PaymentStatus.PENDING, PaymentStatus.PROCESSING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot manually confirm payment with status: {order.payment_status}"
        )
    
    # Update payment status
    order.payment_status = PaymentStatus.COMPLETED
    order.status = OrderStatus.CONFIRMED
    order.payment_method = order.payment_method or "manual_confirmation"
    order.payment_completed_at = datetime.now()
    
    # Clear user's cart
    from app.crud.cart import clear_cart
    try:
        clear_cart(db, order.user_id)
    except:
        pass  # Cart might already be cleared
    
    db.commit()
    
    return {
        "message": "Payment manually confirmed successfully",
        "order_id": order_id,
        "payment_status": order.payment_status,
        "order_status": order.status
    }
