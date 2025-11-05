"""
Order Delivery Management Endpoints
Handles order packaging, rider assignment, and OTP verification
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.core.deps import get_current_admin, get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.rider import Rider
from app.crud.delivery_otp import create_delivery_otp, verify_otp
from app.core.sms import send_sms
from app.core.email import send_email

router = APIRouter()


class SendForDeliveryRequest(BaseModel):
    rider_id: str


class VerifyDeliveryRequest(BaseModel):
    otp_code: str


@router.post("/orders/{order_id}/package")
async def package_order(
    order_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Mark order as packaged (Admin only)
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if payment is completed
    if order.payment_status == 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot package order: Payment is still pending. Please wait for payment confirmation."
        )
    
    if order.payment_status == 'processing':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot package order: Payment is still being processed. Please wait for payment to complete."
        )
    
    if order.payment_status == 'failed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot package order: Payment has failed. Customer needs to retry payment."
        )
    
    if order.payment_status != 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot package order: Payment status is '{order.payment_status}'. Only completed payments can be packaged."
        )
    
    # Update order status to preparing (packaged)
    order.status = "preparing"
    db.commit()
    
    return {
        "message": "Order marked as packaged and ready for delivery",
        "order_id": order_id,
        "status": "preparing"
    }


@router.post("/orders/{order_id}/send-for-delivery")
async def send_order_for_delivery(
    order_id: str,
    request: SendForDeliveryRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Assign rider and send order for delivery
    Generates OTP and sends via SMS/Email to customer
    """
    # Get order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order is preparing (packaged)
    if order.status not in ['preparing', 'PREPARING']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be packaged (preparing status) before sending for delivery"
        )
    
    # Get rider
    rider = db.query(Rider).filter(Rider.id == request.rider_id).first()
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    
    # Get rider's user info for name
    from app.models.user import User as UserModel
    rider_user = db.query(UserModel).filter(UserModel.id == rider.user_id).first()
    rider_name = rider_user.full_name if rider_user else "Rider"
    
    # Generate OTP
    otp = create_delivery_otp(db, order_id, request.rider_id)
    
    # Update order to dispatched (out for delivery)
    order.status = "dispatched"
    order.rider_id = request.rider_id
    db.commit()
    
    # Get user info
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.id == order.user_id).first()
    
    if user and user.phone:
        # Send SMS to customer
        sms_message = f"""Hi {user.full_name},

Your Go-Shop order #{order.id[:8]} is out for delivery!

Delivery Code: {otp.otp_code}

Please provide this code to the rider when your order arrives.

Rider: {rider_name}
Phone: {rider.phone}

Track: www.goshopghana.com/orders/{order_id}
"""
        try:
            send_sms(user.phone, sms_message)
        except Exception as e:
            print(f"Failed to send SMS: {e}")
    
    if user and user.email:
        # Send Email to customer
        email_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #303A4D;">Your Order is On The Way! 🚚</h2>
            <p>Hi {user.full_name},</p>
            <p>Great news! Your order <strong>#{order.id[:8]}</strong> is out for delivery.</p>
            
            <div style="background: #FED141; padding: 30px; text-align: center; margin: 20px 0; border-radius: 10px;">
                <h1 style="margin: 0; font-size: 48px; color: #303A4D;">{otp.otp_code}</h1>
                <p style="margin: 10px 0 0 0; color: #303A4D; font-weight: bold;">Delivery Verification Code</p>
            </div>
            
            <div style="background: #F4F2E6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Rider Details:</strong></p>
                <p style="margin: 5px 0;">Name: {rider_name}</p>
                <p style="margin: 5px 0;">Phone: <a href="tel:{rider.phone}">{rider.phone}</a></p>
            </div>
            
            <p>Please provide the code above to the rider when your order arrives.</p>
            <p><a href="www.goshopghana.com/orders/{order_id}" style="color: #FED141;">Track Your Order</a></p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This code is valid for 24 hours. For support, call 0241293754
            </p>
        </div>
        """
        try:
            send_email(user.email, "Your Order is Out for Delivery", email_html)
        except Exception as e:
            print(f"Failed to send email: {e}")
    
    # Notify rider via SMS
    if rider.phone:
        # Extract address and coordinates for Google Maps
        delivery_address = order.delivery_address
        address_text = "N/A"
        maps_link = ""
        
        if isinstance(delivery_address, dict):
            address_text = delivery_address.get('address', 'N/A')
            lat = delivery_address.get('latitude')
            lng = delivery_address.get('longitude')
            
            # Create Google Maps navigation link if coordinates available
            if lat and lng:
                maps_link = f"\nNavigate: https://maps.google.com/?q={lat},{lng}"
            elif address_text and address_text != 'N/A':
                # Fallback to address search
                maps_link = f"\nNavigate: https://maps.google.com/?q={address_text.replace(' ', '+')}"
        else:
            address_text = str(delivery_address) if delivery_address else 'N/A'
        
        rider_sms = f"""New Delivery Assignment!

Order: #{order.id[:8]}
Customer: {user.full_name if user else 'N/A'}
Phone: {user.phone if user else 'N/A'}
Address: {address_text}{maps_link}

Login: www.goshopghana.com/rider
"""
        try:
            send_sms(rider.phone, rider_sms)
        except Exception as e:
            print(f"Failed to send rider SMS: {e}")
    
    return {
        "message": "Order sent for delivery",
        "order_id": order_id,
        "otp_code": otp.otp_code,  # For admin reference
        "rider": {
            "id": rider.id,
            "name": rider_name,
            "phone": rider.phone
        }
    }


@router.post("/orders/{order_id}/verify-delivery")
async def verify_delivery(
    order_id: str,
    request: VerifyDeliveryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify delivery with OTP code (Rider auth)
    """
    # Verify OTP
    is_valid = verify_otp(db, order_id, request.otp_code)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    # Update order status
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.status = "delivered"
    order.delivered_at = datetime.utcnow()
    db.commit()
    
    # Notify customer
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.id == order.user_id).first()
    
    if user and user.phone:
        try:
            send_sms(
                user.phone,
                f"Your order #{order.id[:8]} has been delivered! Thank you for shopping with Go-Shop Ghana."
            )
        except Exception as e:
            print(f"Failed to send delivery confirmation SMS: {e}")
    
    return {
        "message": "Delivery verified successfully",
        "order_id": order_id,
        "delivered_at": order.delivered_at
    }
