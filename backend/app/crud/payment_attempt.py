"""
CRUD operations for payment attempts
Tracks all payment attempts for orders
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.order import PaymentAttempt, PaymentStatus
from decimal import Decimal


def create_payment_attempt(
    db: Session,
    order_id: str,
    amount_cedis: int,
    payment_reference: Optional[str] = None,
    status: PaymentStatus = PaymentStatus.PENDING,
    payment_method: Optional[str] = None,
    error_message: Optional[str] = None,
    paystack_response: Optional[dict] = None
) -> PaymentAttempt:
    """Create a new payment attempt record"""
    db_attempt = PaymentAttempt(
        order_id=order_id,
        amount_cedis=amount_cedis,
        payment_reference=payment_reference,
        status=status,
        payment_method=payment_method,
        error_message=error_message,
        paystack_response=paystack_response
    )
    
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt


def get_payment_attempt_by_reference(
    db: Session,
    payment_reference: str
) -> Optional[PaymentAttempt]:
    """Get payment attempt by reference"""
    return db.query(PaymentAttempt).filter(
        PaymentAttempt.payment_reference == payment_reference
    ).first()


def get_order_payment_attempts(
    db: Session,
    order_id: str
) -> List[PaymentAttempt]:
    """Get all payment attempts for an order"""
    return db.query(PaymentAttempt).filter(
        PaymentAttempt.order_id == order_id
    ).order_by(desc(PaymentAttempt.created_at)).all()


def update_payment_attempt_status(
    db: Session,
    attempt_id: str,
    status: PaymentStatus,
    error_message: Optional[str] = None,
    paystack_response: Optional[dict] = None
) -> Optional[PaymentAttempt]:
    """Update payment attempt status"""
    attempt = db.query(PaymentAttempt).filter(
        PaymentAttempt.id == attempt_id
    ).first()
    
    if not attempt:
        return None
    
    attempt.status = status
    if error_message:
        attempt.error_message = error_message
    if paystack_response:
        attempt.paystack_response = paystack_response
    
    db.commit()
    db.refresh(attempt)
    return attempt


def get_failed_payment_orders(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 20
) -> List[str]:
    """Get order IDs with failed payments for a user"""
    from app.models.order import Order, OrderStatus
    
    orders = db.query(Order.id).filter(
        Order.user_id == user_id,
        Order.status == OrderStatus.PAYMENT_FAILED
    ).order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    return [order.id for order in orders]
