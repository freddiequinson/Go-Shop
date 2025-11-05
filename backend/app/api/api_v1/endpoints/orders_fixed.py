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
from app.core.notifications import send_order_confirmation, send_order_status_update
import logging

logger = logging.getLogger(__name__)
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
            items=order_details['items'],
            subtotal=float(order.subtotal_cedis) / 100,
            delivery_fee=float(order.delivery_fee_cedis) / 100,
            tax=float(order.tax_cedis) / 100,
            total=float(order.total_cedis) / 100
        )
        
        # Send order confirmation notifications
        try:
            send_order_confirmation(order, current_user)
            logger.info(f"Order confirmation sent for order {order.id}")
        except Exception as e:
            logger.error(f"Failed to send order confirmation: {e}")
            # Don't fail the order creation if notification fails
        
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
        try:
            # Get items
            from app.crud.order import get_order_items
            items = get_order_items(db, order.id)
            
            # Build items list with product info
            items_list = []
            for item in items:
                try:
                    items_list.append({
                        "product_id": item.product_id if hasattr(item, 'product_id') else None,
                        "product_name": item.product_name if hasattr(item, 'product_name') else "Unknown",
                        "quantity": float(item.quantity) if hasattr(item, 'quantity') and item.quantity else 0,
                        "price": float(item.price_cedis) / 100 if hasattr(item, 'price_cedis') and item.price_cedis else 0
                    })
                except Exception as e:
                    logger.error(f"Error processing order item: {e}")
                    continue
            
            summary = OrderSummary(
                id=order.id,
                status=order.status,
                payment_status=order.payment_status,
                payment_method=order.payment_method,
                total=float(order.total_cedis) / 100,
                item_count=len(items),
                created_at=order.created_at,
                estimated_delivery_time=order.estimated_delivery_time,
                items=items_list
            )
            order_summaries.append(summary)
        except Exception as e:
            logger.error(f"Error processing order {order.id}: {e}")
            continue
    
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
        
        # Send order status update notification
        try:
            send_order_status_update(order, current_user, status_update.status.value)
            logger.info(f"Order status update notification sent for order {order.id}")
        except Exception as e:
            logger.error(f"Failed to send order status update notification: {e}")
        
        return order_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{order_id}/pay-with-wallet")
async def pay_order_with_wallet(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Pay for an order using wallet balance
    """
    from app.crud.wallet import get_or_create_wallet, debit_wallet
    from app.models.order import PaymentStatus
    from datetime import datetime, timezone
    from decimal import Decimal
    
    # Get order
    order_details = get_order_with_items(db, order_id, current_user.id)
    if not order_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order = order_details['order']
    
    # Check if order is already paid
    if order.payment_status != PaymentStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already paid or cancelled"
        )
    
    # Get wallet
    wallet = get_or_create_wallet(db, current_user.id)
    
    # Calculate order total in GHS (convert from cedis)
    order_total_ghs = float(order.total_cedis) / 100
    
    # Check wallet balance
    if wallet.balance < order_total_ghs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. You have GH₵{wallet.balance:.2f} but need GH₵{order_total_ghs:.2f}"
        )
    
    # Debit wallet and create transaction
    transaction = debit_wallet(
        db=db,
        user_id=current_user.id,
        amount_cedis=int(order_total_ghs * 100),  # Convert to cedis (cents)
        description=f"Payment for order {order_id}",
        order_id=order_id
    )
    
    # Update order payment status
    order.payment_status = PaymentStatus.COMPLETED.value  # "completed" (lowercase)
    order.payment_method = "wallet"
    order.payment_completed_at = datetime.now(timezone.utc)
    order.status = "confirmed"  # Use lowercase to match frontend expectations
    
    db.commit()
    db.refresh(order)
    
    logger.info(f"Order {order_id} paid with wallet by user {current_user.id}")
    
    return {
        "message": "Payment successful",
        "order_id": order_id,
        "amount_paid": order_total_ghs,
        "remaining_balance": float(wallet.balance)
    }


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


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km using Haversine formula"""
    from math import radians, cos, sin, asin, sqrt
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return round(km, 2)


def calculate_eta(distance_km: float, speed_kmh: float = 30) -> int:
    """Calculate ETA in minutes (default speed: 30 km/h for motorcycles)"""
    if speed_kmh == 0 or distance_km == 0:
        return 0
    hours = distance_km / speed_kmh
    minutes = hours * 60
    return round(minutes)


@router.get("/{order_id}/rider-location")
async def get_rider_location(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current rider location for an order (customer only)
    Real-time tracking for delivery with distance and ETA
    """
    from app.models.order import Order
    from app.models.rider import RiderLocation, Rider
    from datetime import datetime, timedelta
    
    # Verify order belongs to user
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if not order.rider_id:
        return {
            "rider_location": None,
            "message": "No rider assigned yet"
        }
    
    # Get latest location for this order
    location = db.query(RiderLocation).filter(
        RiderLocation.rider_id == order.rider_id,
        RiderLocation.order_id == order_id
    ).order_by(RiderLocation.timestamp.desc()).first()
    
    if not location:
        return {
            "rider_location": None,
            "message": "Rider location not available yet"
        }
    
    # Get rider info
    rider = db.query(Rider).filter(Rider.id == order.rider_id).first()
    
    # Check if location is recent (within 5 minutes)
    is_recent = (datetime.utcnow() - location.timestamp) < timedelta(minutes=5)
    
    # Get rider's user info for name
    rider_user = None
    if rider and rider.user_id:
        from app.models.user import User as UserModel
        rider_user = db.query(UserModel).filter(UserModel.id == rider.user_id).first()
    
    # Calculate distance and ETA
    customer_lat = None
    customer_lng = None
    if isinstance(order.delivery_address, dict):
        customer_lat = order.delivery_address.get('latitude')
        customer_lng = order.delivery_address.get('longitude')
    
    distance_km = None
    eta_minutes = None
    if customer_lat and customer_lng:
        distance_km = calculate_distance(
            float(location.latitude),
            float(location.longitude),
            float(customer_lat),
            float(customer_lng)
        )
        # Use rider's speed if available, otherwise default to 30 km/h
        speed = float(location.speed_kmh) if location.speed_kmh and location.speed_kmh > 0 else 30
        eta_minutes = calculate_eta(distance_km, speed)
    
    return {
        "rider_location": {
            "latitude": float(location.latitude),
            "longitude": float(location.longitude),
            "accuracy": float(location.accuracy) if location.accuracy else None,
            "timestamp": location.timestamp.isoformat(),
            "is_recent": is_recent,
            "last_update": location.timestamp.isoformat(),
            "distance_km": distance_km,
            "eta_minutes": eta_minutes
        },
        "rider_info": {
            "name": rider_user.full_name if rider_user else "Rider",
            "phone": rider.phone if rider else None,
            "vehicle_type": rider.vehicle_type if rider else None
        } if rider else None,
        "order_status": order.status
    }
