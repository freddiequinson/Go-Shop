"""
Rider Portal API Endpoints
Endpoints for riders to manage their deliveries and profile
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.deps import get_current_rider, get_db
from app.models.rider import Rider
from app.models.order import Order
from app.schemas.rider import RiderResponse, RiderUpdate
from app.crud.rider import update_rider
from app.api.api_v1.endpoints.order_delivery import verify_otp

router = APIRouter()


@router.get("/me", response_model=RiderResponse)
async def get_my_profile(
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Get current rider's profile
    """
    return RiderResponse.model_validate(rider)


@router.put("/me", response_model=RiderResponse)
async def update_my_profile(
    rider_update: RiderUpdate,
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Update current rider's profile
    """
    updated_rider = update_rider(db, rider.id, rider_update)
    return RiderResponse.model_validate(updated_rider)


@router.get("/my-stats")
async def get_my_stats(
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Get current rider's statistics
    """
    # Calculate today's deliveries
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_deliveries = db.query(Order).filter(
        Order.rider_id == rider.id,
        Order.status == "delivered",
        Order.delivered_at >= today_start
    ).count()
    
    # Calculate today's earnings (assuming delivery fee goes to rider)
    today_orders = db.query(Order).filter(
        Order.rider_id == rider.id,
        Order.status == "delivered",
        Order.delivered_at >= today_start
    ).all()
    
    today_earnings = sum(float(order.delivery_fee_cedis or 0) / 100 for order in today_orders)
    
    return {
        "total_deliveries": rider.total_deliveries,
        "successful_deliveries": rider.successful_deliveries,
        "failed_deliveries": rider.failed_deliveries,
        "cancelled_deliveries": rider.cancelled_deliveries,
        "rating": float(rider.rating) if rider.rating else 0.0,
        "success_rate": (rider.successful_deliveries / rider.total_deliveries * 100) if rider.total_deliveries > 0 else 0,
        "today_deliveries": today_deliveries,
        "today_earnings": today_earnings,
        "is_online": rider.is_online,
        "is_verified": rider.is_verified,
        "current_status": rider.current_status
    }


@router.get("/my-deliveries")
async def get_my_deliveries(
    status: Optional[str] = Query(None),
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Get current rider's deliveries
    """
    query = db.query(Order).filter(Order.rider_id == rider.id)
    
    if status:
        if status == "pending":
            # Orders that are dispatched but not delivered
            query = query.filter(Order.status == "dispatched")
        elif status == "completed":
            query = query.filter(Order.status == "delivered")
        elif status == "in_progress":
            query = query.filter(Order.status == "dispatched")
    
    orders = query.order_by(Order.created_at.desc()).all()
    
    # Format response
    deliveries = []
    for order in orders:
        # Get customer info
        from app.models.user import User
        customer = db.query(User).filter(User.id == order.user_id).first()
        
        delivery = {
            "id": order.id,
            "order_id": order.id,
            "order_number": order.id[:8],
            "customer_name": customer.full_name if customer else "N/A",
            "customer_phone": customer.phone if customer else "N/A",
            "delivery_address": order.delivery_address,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "estimated_delivery_time": order.estimated_delivery_time.isoformat() if order.estimated_delivery_time else None,
            "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
            "delivery_fee": float(order.delivery_fee_cedis or 0) / 100,
            "total_amount": float(order.total_cedis or 0) / 100,
            "payment_status": order.payment_status,
            "delivery_notes": order.delivery_notes
        }
        deliveries.append(delivery)
    
    return {
        "deliveries": deliveries,
        "total": len(deliveries)
    }


@router.post("/deliveries/{order_id}/accept")
async def accept_delivery(
    order_id: str,
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Accept a delivery assignment
    """
    order = db.query(Order).filter(Order.id == order_id, Order.rider_id == rider.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found or not assigned to you"
        )
    
    # Update order status if needed
    if order.status != "dispatched":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery cannot be accepted in current status"
        )
    
    return {
        "message": "Delivery accepted",
        "order_id": order_id
    }


@router.post("/deliveries/{order_id}/start")
async def start_delivery(
    order_id: str,
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Start a delivery (mark as in progress)
    """
    order = db.query(Order).filter(Order.id == order_id, Order.rider_id == rider.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found or not assigned to you"
        )
    
    if order.status != "dispatched":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery must be in dispatched status to start"
        )
    
    # Update rider status
    from app.models.rider import RiderStatus
    rider.current_status = RiderStatus.ON_DELIVERY
    rider.is_online = True
    db.commit()
    
    return {
        "message": "Delivery started",
        "order_id": order_id,
        "status": "in_progress"
    }


@router.post("/deliveries/{order_id}/request-otp")
async def request_delivery_otp(
    order_id: str,
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Generate and send OTP to customer for delivery verification
    """
    order = db.query(Order).filter(Order.id == order_id, Order.rider_id == rider.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found or not assigned to you"
        )
    
    if order.status != "dispatched":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery must be in progress to request OTP"
        )
    
    # Generate OTP
    from app.crud.delivery_otp import generate_otp
    otp_code = generate_otp(db, order_id, rider.id)
    
    # Get customer info
    from app.models.user import User
    from app.core.sms import send_sms
    from app.core.email import send_email
    
    customer = db.query(User).filter(User.id == order.user_id).first()
    
    # Get phone from delivery address if not in customer profile
    customer_phone = customer.phone if customer and customer.phone else None
    if not customer_phone and isinstance(order.delivery_address, dict):
        customer_phone = order.delivery_address.get('phone') or order.delivery_address.get('contact_phone')
    
    customer_email = customer.email if customer else None
    
    # Send OTP via SMS
    if customer_phone:
        try:
            send_sms(
                customer_phone,
                f"Your Go-Shop delivery code is: {otp_code}. Please provide this code to the rider to complete your delivery. Order #{order.id[:8]}"
            )
        except Exception as e:
            print(f"Failed to send OTP SMS: {e}")
    
    # Send OTP via Email
    if customer_email:
        try:
            send_email(
                email_to=customer_email,
                subject="Your Delivery Verification Code",
                html_content=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #303A4D;">Delivery Verification Code</h2>
                    <p>Your Go-Shop delivery is here!</p>
                    <div style="background: #FED141; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #303A4D;">{otp_code}</h1>
                    </div>
                    <p>Please provide this 6-digit code to the delivery rider to complete your order.</p>
                    <p style="color: #666; font-size: 14px;">Order #{order.id[:8]}</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">This code will expire in 15 minutes.</p>
                </div>
                """
            )
        except Exception as e:
            print(f"Failed to send OTP email: {e}")
    
    return {
        "message": "OTP sent to customer via SMS and Email",
        "order_id": order_id
    }


@router.post("/deliveries/{order_id}/complete")
async def complete_delivery(
    order_id: str,
    otp_code: str,
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Complete a delivery with OTP verification
    """
    order = db.query(Order).filter(Order.id == order_id, Order.rider_id == rider.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found or not assigned to you"
        )
    
    if order.status != "dispatched":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery must be in progress to complete"
        )
    
    # Verify OTP
    from app.crud.delivery_otp import verify_otp
    is_valid = verify_otp(db, order_id, otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    # Update order status
    order.status = "delivered"
    order.delivered_at = datetime.utcnow()
    
    # Update rider stats
    rider.successful_deliveries += 1
    rider.total_deliveries += 1
    rider.current_status = "available"
    
    db.commit()
    
    # Send confirmation SMS to customer
    from app.models.user import User
    from app.core.sms import send_sms
    
    customer = db.query(User).filter(User.id == order.user_id).first()
    
    # Get phone from delivery address if not in customer profile
    customer_phone = customer.phone if customer and customer.phone else None
    if not customer_phone and isinstance(order.delivery_address, dict):
        customer_phone = order.delivery_address.get('phone') or order.delivery_address.get('contact_phone')
    
    if customer_phone:
        try:
            send_sms(
                customer_phone,
                f"Your order #{order.id[:8]} has been delivered! Thank you for shopping with Go-Shop Ghana."
            )
        except Exception as e:
            print(f"Failed to send delivery confirmation SMS: {e}")
    
    return {
        "message": "Delivery completed successfully",
        "order_id": order_id,
        "delivered_at": order.delivered_at.isoformat()
    }


from pydantic import BaseModel

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    order_id: Optional[str] = None
    accuracy: Optional[float] = None
    speed_kmh: Optional[float] = None
    heading: Optional[float] = None

@router.post("/location")
async def update_location(
    location_data: LocationUpdate,
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Update current rider's location with optional order tracking
    """
    from app.models.rider import RiderLocation
    from uuid import uuid4
    
    location = RiderLocation(
        id=str(uuid4()),
        rider_id=rider.id,
        order_id=location_data.order_id,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        accuracy=location_data.accuracy,
        speed_kmh=location_data.speed_kmh,
        heading=location_data.heading,
        timestamp=datetime.utcnow()
    )
    
    db.add(location)
    db.commit()
    
    return {
        "message": "Location updated",
        "latitude": location_data.latitude,
        "longitude": location_data.longitude,
        "order_id": location_data.order_id,
        "timestamp": location.timestamp.isoformat()
    }


@router.get("/my-pickups")
async def get_my_pickups(
    status: Optional[str] = Query(None),
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Get pickup requests (warehouse to customer deliveries)
    This is an alias for my-deliveries for compatibility
    """
    return await get_my_deliveries(status, rider, db)


@router.get("/deliveries/{order_id}")
async def get_delivery_detail(
    order_id: str,
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific delivery
    """
    order = db.query(Order).filter(Order.id == order_id, Order.rider_id == rider.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found or not assigned to you"
        )
    
    # Get customer info
    from app.models.user import User
    customer = db.query(User).filter(User.id == order.user_id).first()
    
    # Get phone from delivery address if not in customer profile
    customer_phone = customer.phone if customer and customer.phone else None
    if not customer_phone and isinstance(order.delivery_address, dict):
        customer_phone = order.delivery_address.get('phone') or order.delivery_address.get('contact_phone')
    
    # Get order items
    from app.models.order import OrderItem
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    
    return {
        "id": order.id,
        "order_number": order.id[:8],
        "customer_name": customer.full_name if customer else "N/A",
        "customer_phone": customer_phone or "N/A",
        "customer_email": customer.email if customer else "N/A",
        "delivery_address": order.delivery_address,
        "status": order.status,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "estimated_delivery_time": order.estimated_delivery_time.isoformat() if order.estimated_delivery_time else None,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
        "delivery_fee": float(order.delivery_fee_cedis or 0) / 100,
        "total_amount": float(order.total_cedis or 0) / 100,
        "payment_status": order.payment_status,
        "payment_method": order.payment_method,
        "delivery_notes": order.delivery_notes,
        "items": [{
            "product_name": item.product_name,
            "quantity": float(item.quantity),
            "price": float(item.price_per_unit_cedis or 0) / 100,
            "line_total": float(item.line_total_cedis or 0) / 100
        } for item in order_items]
    }


@router.get("/delivery-map")
async def get_delivery_map(
    rider: Rider = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    """
    Get all pending/active deliveries with location data for map view
    """
    # Get all dispatched orders (pending deliveries)
    orders = db.query(Order).filter(
        Order.rider_id == rider.id,
        Order.status == "dispatched"
    ).order_by(Order.created_at.desc()).all()
    
    # Format response with location data
    deliveries = []
    for order in orders:
        # Get customer info
        from app.models.user import User
        customer = db.query(User).filter(User.id == order.user_id).first()
        
        # Extract location data
        delivery_address = order.delivery_address
        latitude = None
        longitude = None
        address = None
        
        if isinstance(delivery_address, dict):
            latitude = delivery_address.get('latitude')
            longitude = delivery_address.get('longitude')
            address = delivery_address.get('address', 'N/A')
        elif isinstance(delivery_address, str):
            address = delivery_address
        
        # Only include deliveries with valid coordinates
        if latitude and longitude:
            delivery = {
                "id": order.id,
                "order_number": order.id[:8],
                "customer_name": customer.full_name if customer else "N/A",
                "customer_phone": customer.phone if customer else "N/A",
                "address": address,
                "latitude": float(latitude),
                "longitude": float(longitude),
                "status": order.status,
                "delivery_fee": float(order.delivery_fee_cedis or 0) / 100,
                "total_amount": float(order.total_cedis or 0) / 100,
                "estimated_delivery_time": order.estimated_delivery_time.isoformat() if order.estimated_delivery_time else None,
                "delivery_notes": order.delivery_notes
            }
            deliveries.append(delivery)
    
    return {
        "deliveries": deliveries,
        "total": len(deliveries),
        "rider_location": {
            "latitude": rider.base_location.get('latitude') if isinstance(rider.base_location, dict) else None,
            "longitude": rider.base_location.get('longitude') if isinstance(rider.base_location, dict) else None
        }
    }
