"""
Order Payment endpoints for GoShopGhana
Handles payment initialization, verification, and retry for orders
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.order import Order, OrderStatus, PaymentStatus
from app.schemas.order import (
    OrderPaymentInitRequest, OrderPaymentInitResponse,
    OrderPaymentVerifyResponse, OrderWithPaymentAttempts,
    PaymentAttemptResponse
)
from app.crud.order import get_order_by_id
from app.crud.payment_attempt import (
    create_payment_attempt, get_order_payment_attempts,
    update_payment_attempt_status, get_payment_attempt_by_reference
)
from app.services.paystack import paystack_service
from datetime import datetime, timezone
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/{order_id}/initialize-payment", response_model=OrderPaymentInitResponse)
async def initialize_order_payment(
    order_id: str,
    request: OrderPaymentInitRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Initialize Paystack payment for an order
    Creates payment session and returns authorization URL
    """
    # Get order
    order = get_order_by_id(db, order_id, current_user.id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order can be paid
    if order.payment_status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has already been paid"
        )
    
    if order.status not in [OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be paid in current status"
        )
    
    try:
        # Generate unique reference
        reference = paystack_service.generate_reference()
        
        # Prepare metadata
        metadata = {
            "user_id": current_user.id,
            "user_email": current_user.email,
            "order_id": order_id,
            "order_type": "product_order"
        }
        
        # Initialize payment with Paystack
        paystack_response = await paystack_service.initialize_payment(
            email=current_user.email,
            amount_cedis=int(order.total_cedis),
            reference=reference,
            callback_url=request.callback_url or f"http://localhost:3000/checkout/payment/{order_id}/verify",
            metadata=metadata
        )
        
        if not paystack_response.get("status"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment initialization failed: {paystack_response.get('message', 'Unknown error')}"
            )
        
        # Extract response data
        data = paystack_response["data"]
        
        # Create payment attempt record
        create_payment_attempt(
            db=db,
            order_id=order_id,
            amount_cedis=int(order.total_cedis),
            payment_reference=reference,
            status=PaymentStatus.PENDING,
            paystack_response=paystack_response
        )
        
        # Update order with payment reference
        order.payment_reference = reference
        order.payment_status = PaymentStatus.PROCESSING
        db.commit()
        
        return OrderPaymentInitResponse(
            order_id=order_id,
            payment_reference=reference,
            authorization_url=data["authorization_url"],
            access_code=data["access_code"],
            amount=float(order.total_cedis) / 100,
            currency="GHS",
            status="pending"
        )
        
    except Exception as e:
        logger.error(f"Payment initialization error for order {order_id}: {type(e).__name__}")
        
        # Create failed payment attempt
        create_payment_attempt(
            db=db,
            order_id=order_id,
            amount_cedis=int(order.total_cedis),
            status=PaymentStatus.FAILED,
            error_message=str(e)
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment initialization failed. Please try again."
        )


@router.post("/{order_id}/verify-payment", response_model=OrderPaymentVerifyResponse)
async def verify_order_payment(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Verify payment for an order
    Checks with Paystack and updates order status
    """
    # Get order
    order = get_order_by_id(db, order_id, current_user.id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if not order.payment_reference:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No payment reference found for this order"
        )
    
    try:
        logger.info(f"Verifying payment for order {order_id}")
        
        # Verify payment with Paystack
        paystack_response = await paystack_service.verify_payment(order.payment_reference)
        
        if not paystack_response.get("status"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment verification failed: {paystack_response.get('message', 'Unknown error')}"
            )
        
        # Extract verification data
        data = paystack_response["data"]
        payment_status = data.get("status")
        payment_method = data.get("channel", "card")
        
        # Get payment attempt
        payment_attempt = get_payment_attempt_by_reference(db, order.payment_reference)
        
        if payment_status == "success":
            # Payment successful
            logger.info(f"Payment successful for order {order_id}")
            
            order.payment_status = PaymentStatus.COMPLETED
            order.payment_method = payment_method
            order.payment_completed_at = datetime.now(timezone.utc)
            order.status = OrderStatus.CONFIRMED
            
            # Update payment attempt
            if payment_attempt:
                update_payment_attempt_status(
                    db=db,
                    attempt_id=payment_attempt.id,
                    status=PaymentStatus.COMPLETED,
                    paystack_response=paystack_response
                )
            
            # Clear user's cart
            from app.crud.cart import clear_cart
            clear_cart(db, current_user.id)
            
            db.commit()
            
            # Send payment confirmation with PDF receipt and SMS
            try:
                from app.core.notifications import send_payment_confirmation_with_receipt
                send_payment_confirmation_with_receipt(order, current_user)
            except Exception as e:
                logger.warning(f"Failed to send payment confirmation for order {order_id}: {type(e).__name__}")
                # Don't fail the whole request if notification fails
            
            return OrderPaymentVerifyResponse(
                order_id=order_id,
                payment_reference=order.payment_reference,
                status="success",
                amount=float(order.total_cedis) / 100,
                currency="GHS",
                payment_method=payment_method,
                message="Payment verified successfully. Order confirmed!"
            )
            
        elif payment_status in ["failed", "cancelled", "abandoned"]:
            # Payment failed
            order.payment_status = PaymentStatus.FAILED
            order.status = OrderStatus.PAYMENT_FAILED
            
            # Update payment attempt
            if payment_attempt:
                update_payment_attempt_status(
                    db=db,
                    attempt_id=payment_attempt.id,
                    status=PaymentStatus.FAILED,
                    error_message=f"Payment {payment_status}",
                    paystack_response=paystack_response
                )
            
            db.commit()
            
            return OrderPaymentVerifyResponse(
                order_id=order_id,
                payment_reference=order.payment_reference,
                status="failed",
                amount=float(order.total_cedis) / 100,
                currency="GHS",
                payment_method=payment_method,
                message=f"Payment {payment_status}. Please try again."
            )
        
        else:
            # Payment still pending
            return OrderPaymentVerifyResponse(
                order_id=order_id,
                payment_reference=order.payment_reference,
                status="pending",
                amount=float(order.total_cedis) / 100,
                currency="GHS",
                payment_method=payment_method,
                message="Payment is still being processed"
            )
            
    except Exception as e:
        logger.error(f"Payment verification error for order {order_id}: {type(e).__name__}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment verification failed. Please try again."
        )


@router.post("/webhook")
async def order_payment_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Paystack webhook endpoint for order payment notifications
    This is called directly by Paystack when payment status changes
    No authentication required - uses payment reference for security
    """
    try:
        # Get request body
        body = await request.body()
        
        logger.info("Order payment webhook received from Paystack")
        
        # Parse webhook data
        webhook_data = json.loads(body)
        event = webhook_data.get("event")
        data = webhook_data.get("data", {})
        
        # Handle charge.success event
        if event == "charge.success":
            reference = data.get("reference")
            status_paystack = data.get("status")
            
            if reference and status_paystack == "success":
                # Get payment attempt to find the order
                payment_attempt = get_payment_attempt_by_reference(db, reference)
                
                if payment_attempt:
                    order_id = payment_attempt.order_id
                    
                    # Get the order
                    order = db.query(Order).filter(Order.id == order_id).first()
                    
                    if order and order.payment_status != PaymentStatus.COMPLETED:
                        logger.info(f"Webhook: processing payment for order {order_id}")
                        
                        # Update order payment status
                        order.payment_status = PaymentStatus.COMPLETED
                        order.payment_method = data.get("channel", "card")
                        order.payment_completed_at = datetime.now(timezone.utc)
                        order.status = OrderStatus.CONFIRMED
                        
                        # Update payment attempt
                        update_payment_attempt_status(
                            db=db,
                            attempt_id=payment_attempt.id,
                            status=PaymentStatus.COMPLETED,
                            paystack_response=data
                        )
                        
                        # Clear user's cart
                        from app.crud.cart import clear_cart
                        clear_cart(db, order.user_id)
                        
                        db.commit()
                        logger.info(f"Webhook: order {order_id} payment completed")
                    else:
                        logger.warning(f"Webhook: order not found or already paid")
                else:
                    logger.warning(f"Webhook: payment attempt not found for reference")
            
            elif status_paystack in ["failed", "cancelled", "abandoned"]:
                # Handle failed payment
                payment_attempt = get_payment_attempt_by_reference(db, reference)
                
                if payment_attempt:
                    order_id = payment_attempt.order_id
                    order = db.query(Order).filter(Order.id == order_id).first()
                    
                    if order:
                        order.payment_status = PaymentStatus.FAILED
                        order.status = OrderStatus.PAYMENT_FAILED
                        
                        update_payment_attempt_status(
                            db=db,
                            attempt_id=payment_attempt.id,
                            status=PaymentStatus.FAILED,
                            error_message=f"Payment {status_paystack}",
                            paystack_response=data
                        )
                        
                        db.commit()
                        logger.warning(f"Webhook: order payment marked as FAILED")
        
        # Return 200 OK to Paystack
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {type(e).__name__}")
        # Still return 200 to prevent Paystack from retrying
        return {"status": "error", "message": "Webhook processing error"}


@router.get("/{order_id}/payment-attempts", response_model=OrderWithPaymentAttempts)
async def get_order_with_payment_attempts(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get order with all payment attempts
    Useful for showing payment history and retry options
    """
    # Get order
    order = get_order_by_id(db, order_id, current_user.id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Get payment attempts
    attempts = get_order_payment_attempts(db, order_id)
    
    # Convert to response format
    from app.crud.order import get_order_items
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
