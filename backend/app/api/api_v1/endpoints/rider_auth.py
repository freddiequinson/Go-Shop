"""
Rider Authentication Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.models.rider import Rider

router = APIRouter()


class RiderLoginRequest(BaseModel):
    username: str
    password: str


class RiderResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: str
    rider_code: str
    vehicle_type: str
    rating: float
    total_deliveries: int
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/rider/login")
async def rider_login(
    credentials: RiderLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Rider login endpoint
    Returns JWT token and rider info
    """
    # Find user by username
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if user is a rider
    rider = db.query(Rider).filter(Rider.user_id == user.id).first()
    
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a rider"
        )
    
    if not rider.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rider account is inactive"
        )
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": user.id, "type": "rider"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rider": {
            "id": rider.id,
            "user_id": rider.user_id,
            "full_name": user.full_name,
            "phone": rider.phone,
            "rider_code": rider.rider_code,
            "vehicle_type": rider.vehicle_type.value if rider.vehicle_type else None,
            "rating": float(rider.rating) if rider.rating else 0.0,
            "total_deliveries": rider.total_deliveries,
            "is_active": rider.is_active
        }
    }


@router.get("/rider/me")
async def get_current_rider(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current rider info
    """
    rider = db.query(Rider).filter(Rider.user_id == current_user.id).first()
    
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    
    return {
        "id": rider.id,
        "user_id": rider.user_id,
        "full_name": current_user.full_name,
        "phone": rider.phone,
        "rider_code": rider.rider_code,
        "vehicle_type": rider.vehicle_type.value if rider.vehicle_type else None,
        "rating": float(rider.rating) if rider.rating else 0.0,
        "total_deliveries": rider.total_deliveries,
        "successful_deliveries": rider.successful_deliveries,
        "is_active": rider.is_active,
        "is_online": rider.is_online
    }


@router.get("/riders/my-deliveries")
async def get_my_deliveries(
    status: str = "pending",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get rider's assigned deliveries
    """
    rider = db.query(Rider).filter(Rider.user_id == current_user.id).first()
    
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    
    from app.models.order import Order
    
    # Get orders assigned to this rider
    query = db.query(Order).filter(Order.rider_id == rider.id)
    
    if status == "pending":
        query = query.filter(Order.delivery_status == "out_for_delivery")
    
    orders = query.all()
    
    deliveries = []
    for order in orders:
        from app.models.user import User as UserModel
        user = db.query(UserModel).filter(UserModel.id == order.user_id).first()
        
        deliveries.append({
            "id": order.id,
            "order_id": order.id,
            "order_number": order.order_number if hasattr(order, 'order_number') else None,
            "customer_name": user.full_name if user else "N/A",
            "customer_phone": user.phone if user else "N/A",
            "delivery_address": order.delivery_address.get('address', 'N/A') if isinstance(order.delivery_address, dict) else str(order.delivery_address),
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "items": len(order.items) if hasattr(order, 'items') else 0
        })
    
    return deliveries


@router.get("/riders/my-pickups")
async def get_my_pickups(
    status: str = "pending",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get rider's warehouse pickup assignments
    """
    # This would integrate with supply offers/warehouse system
    # For now, return empty array
    return []


@router.get("/riders/my-stats")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get rider's performance stats
    """
    rider = db.query(Rider).filter(Rider.user_id == current_user.id).first()
    
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    
    from app.models.order import Order
    from datetime import datetime, timedelta
    
    today = datetime.utcnow().date()
    
    # Today's deliveries
    today_deliveries = db.query(Order).filter(
        Order.rider_id == rider.id,
        Order.created_at >= datetime.combine(today, datetime.min.time())
    ).count()
    
    # Completed today
    completed_today = db.query(Order).filter(
        Order.rider_id == rider.id,
        Order.delivery_status == "delivered",
        Order.delivered_at >= datetime.combine(today, datetime.min.time())
    ).count()
    
    # Pending
    pending = db.query(Order).filter(
        Order.rider_id == rider.id,
        Order.delivery_status == "out_for_delivery"
    ).count()
    
    return {
        "today_deliveries": today_deliveries,
        "completed_today": completed_today,
        "pending": pending,
        "total_deliveries": rider.total_deliveries,
        "successful_deliveries": rider.successful_deliveries,
        "rating": float(rider.rating) if rider.rating else 0.0
    }
