"""
CRUD operations for Delivery OTP
"""

import random
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
import uuid

from app.models.delivery_otp import DeliveryOTP


def generate_otp_code() -> str:
    """Generate 6-digit OTP code"""
    return str(random.randint(100000, 999999))


def create_delivery_otp(db: Session, order_id: str, rider_id: str) -> DeliveryOTP:
    """
    Create OTP for delivery verification
    Valid for 24 hours
    """
    otp_code = generate_otp_code()
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    otp = DeliveryOTP(
        id=str(uuid.uuid4()),
        order_id=order_id,
        rider_id=rider_id,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False
    )
    
    db.add(otp)
    db.commit()
    db.refresh(otp)
    
    return otp


def get_otp_by_order(db: Session, order_id: str) -> Optional[DeliveryOTP]:
    """Get OTP for an order"""
    return db.query(DeliveryOTP).filter(
        DeliveryOTP.order_id == order_id
    ).first()


def verify_otp(db: Session, order_id: str, otp_code: str) -> bool:
    """
    Verify OTP code for an order
    Returns True if valid and not expired
    """
    otp = db.query(DeliveryOTP).filter(
        DeliveryOTP.order_id == order_id,
        DeliveryOTP.otp_code == otp_code,
        DeliveryOTP.is_used == False,
        DeliveryOTP.expires_at > datetime.utcnow()
    ).first()
    
    if otp:
        # Mark as used
        otp.is_used = True
        otp.verified_at = datetime.utcnow()
        db.commit()
        return True
    
    return False


def get_otp_by_code(db: Session, otp_code: str) -> Optional[DeliveryOTP]:
    """Get OTP by code (for verification)"""
    return db.query(DeliveryOTP).filter(
        DeliveryOTP.otp_code == otp_code,
        DeliveryOTP.is_used == False,
        DeliveryOTP.expires_at > datetime.utcnow()
    ).first()


def generate_otp(db: Session, order_id: str, rider_id: str = None) -> str:
    """
    Generate and return OTP code for an order
    Wrapper function for convenience
    """
    # Delete any existing OTP for this order
    db.query(DeliveryOTP).filter(DeliveryOTP.order_id == order_id).delete()
    db.commit()
    
    # Create new OTP
    otp = create_delivery_otp(db, order_id, rider_id or "system")
    return otp.otp_code
