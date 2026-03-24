"""
Guest Order endpoints for GoShopGhana
Allows users to order without authentication
"""

import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.guest_order import (
    GuestOrderCreate,
    GuestOrderResponse,
    OrderTrackingRequest
)
from app.schemas.order import OrderResponse
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.crud.order import get_order_with_items
from app.core.notifications import send_order_confirmation
from app.models.user import User
from decimal import Decimal

logger = logging.getLogger(__name__)
router = APIRouter()


def generate_tracking_token() -> str:
    """Generate a secure tracking token"""
    return secrets.token_urlsafe(32)


@router.post("/", response_model=GuestOrderResponse)
async def create_guest_order(
    order_data: GuestOrderCreate,
    db: Session = Depends(get_db)
):
    """
    Create order as guest (no authentication required)
    """
    try:
        # Calculate order totals
        subtotal_cedis = Decimal('0')
        order_items_data = []
        
        for item in order_data.cart_items:
            product = db.query(Product).filter(Product.id == item['product_id']).first()
            if not product:
                raise ValueError(f"Product {item['product_id']} not found")
            
            if product.stock_quantity < item['quantity']:
                raise ValueError(f"Insufficient stock for {product.name}")
            
            line_total = product.price_per_unit_cedis * Decimal(str(item['quantity']))
            subtotal_cedis += line_total
            
            order_items_data.append({
                'product': product,
                'quantity': item['quantity'],
                'line_total': line_total
            })
        
        # Calculate fees
        delivery_fee_cedis = Decimal('0')  # Free delivery
        tax_cedis = subtotal_cedis * Decimal('0.10')  # 10% tax
        total_cedis = subtotal_cedis + delivery_fee_cedis + tax_cedis
        
        # Create order
        order = Order(
            user_id=None,  # No user for guest orders
            status=OrderStatus.PENDING,
            subtotal_cedis=subtotal_cedis,
            delivery_fee_cedis=delivery_fee_cedis,
            tax_cedis=tax_cedis,
            total_cedis=total_cedis,
            delivery_address=order_data.delivery_address,
            delivery_notes=order_data.delivery_notes
        )
        
        db.add(order)
        db.flush()  # Get order ID
        
        # Create order items
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data['product'].id,
                product_name=item_data['product'].name,
                product_image_url=item_data['product'].primary_image_url or item_data['product'].image_url,
                price_per_unit_cedis=item_data['product'].price_per_unit_cedis,
                unit_type=item_data['product'].unit_type,
                quantity=Decimal(str(item_data['quantity'])),
                line_total_cedis=item_data['line_total']
            )
            db.add(order_item)
            
            # Update stock
            item_data['product'].stock_quantity -= item_data['quantity']
        
        # Generate tracking token
        tracking_token = generate_tracking_token()
        
        # Store tracking token in delivery_notes (temporary solution)
        # In production, create a separate tracking_tokens table
        if order.delivery_notes:
            order.delivery_notes += f"\n[TRACKING_TOKEN:{tracking_token}]"
        else:
            order.delivery_notes = f"[TRACKING_TOKEN:{tracking_token}]"
        
        db.commit()
        db.refresh(order)
        
        # Create temporary user object for notifications
        temp_user = User(
            full_name=order_data.guest_info.full_name,
            email=order_data.guest_info.email,
            phone=order_data.guest_info.phone
        )
        
        # Send order confirmation
        try:
            send_order_confirmation(order, temp_user)
            logger.info(f"Guest order confirmation sent for order {order.id}")
        except Exception as e:
            logger.error(f"Failed to send guest order confirmation: {e}")
        
        tracking_url = f"https://www.goshopghana.com/track/{order.id}?token={tracking_token}"
        
        return GuestOrderResponse(
            order_id=order.id,
            tracking_token=tracking_token,
            tracking_url=tracking_url,
            total=float(total_cedis) / 100,
            message="Order placed successfully! Check your email and SMS for confirmation."
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/track", response_model=OrderResponse)
async def track_guest_order(
    tracking_request: OrderTrackingRequest,
    db: Session = Depends(get_db)
):
    """
    Track guest order using order ID and phone number
    """
    try:
        order = db.query(Order).filter(Order.id == tracking_request.order_id).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Verify phone number matches delivery address
        delivery_phone = order.delivery_address.get('phone', '') if order.delivery_address else ''
        
        # Normalize phone numbers for comparison
        input_phone = tracking_request.phone.replace(' ', '').replace('-', '').replace('+', '')
        stored_phone = delivery_phone.replace(' ', '').replace('-', '').replace('+', '')
        
        # Remove leading zeros and country codes for comparison
        input_phone = input_phone.lstrip('0').lstrip('233')
        stored_phone = stored_phone.lstrip('0').lstrip('233')
        
        if input_phone != stored_phone:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Phone number does not match order"
            )
        
        # Get order with items
        order_details = get_order_with_items(db, order.id, None)
        
        order_response = OrderResponse(
            id=order.id,
            user_id=order.user_id or "guest",
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to track guest order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track order"
        )
