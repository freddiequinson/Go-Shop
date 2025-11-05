"""
CRUD operations for Coupons
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponValidateRequest, CouponBenefit
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


def get_coupon_by_id(db: Session, coupon_id: str) -> Optional[Coupon]:
    """Get coupon by ID"""
    return db.query(Coupon).filter(Coupon.id == coupon_id).first()


def get_coupon_by_code(db: Session, code: str) -> Optional[Coupon]:
    """Get coupon by code (case-insensitive)"""
    return db.query(Coupon).filter(func.upper(Coupon.code) == code.upper()).first()


def list_coupons(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    public_only: bool = False
) -> List[Coupon]:
    """List coupons with filters"""
    query = db.query(Coupon)
    
    if active_only:
        now = datetime.utcnow()
        query = query.filter(
            and_(
                Coupon.is_active == True,
                Coupon.valid_from <= now,
                Coupon.valid_until >= now
            )
        )
    
    if public_only:
        query = query.filter(Coupon.is_public == True)
    
    return query.order_by(Coupon.created_at.desc()).offset(skip).limit(limit).all()


def create_coupon(db: Session, coupon: CouponCreate) -> Coupon:
    """Create new coupon"""
    db_coupon = Coupon(**coupon.model_dump())
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon


def update_coupon(db: Session, coupon_id: str, coupon_update: CouponUpdate) -> Optional[Coupon]:
    """Update coupon"""
    db_coupon = get_coupon_by_id(db, coupon_id)
    if not db_coupon:
        return None
    
    update_data = coupon_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_coupon, field, value)
    
    db.commit()
    db.refresh(db_coupon)
    return db_coupon


def delete_coupon(db: Session, coupon_id: str) -> bool:
    """Delete coupon"""
    db_coupon = get_coupon_by_id(db, coupon_id)
    if not db_coupon:
        return False
    
    db.delete(db_coupon)
    db.commit()
    return True


def increment_coupon_usage(db: Session, coupon_id: str) -> bool:
    """Increment coupon usage count"""
    db_coupon = get_coupon_by_id(db, coupon_id)
    if not db_coupon:
        return False
    
    db_coupon.uses_count += 1
    db.commit()
    return True


def validate_coupon(
    db: Session,
    request: CouponValidateRequest
) -> tuple[bool, str, Optional[CouponBenefit]]:
    """
    Validate coupon and calculate benefits
    
    Returns: (is_valid, message, benefits)
    """
    # Get coupon
    coupon = get_coupon_by_code(db, request.code)
    if not coupon:
        return False, "Invalid coupon code", None
    
    # Check if active
    if not coupon.is_active:
        return False, "This coupon is no longer active", None
    
    # Check validity dates
    from datetime import timezone
    now = datetime.now(timezone.utc)
    if now < coupon.valid_from:
        return False, f"This coupon is not valid yet. Valid from {coupon.valid_from.strftime('%Y-%m-%d')}", None
    
    if now > coupon.valid_until:
        return False, "This coupon has expired", None
    
    # Check max uses
    if coupon.max_uses and coupon.uses_count >= coupon.max_uses:
        return False, "This coupon has reached its maximum usage limit", None
    
    # Check user type restriction
    if coupon.user_type_restriction and request.user_type:
        if coupon.user_type_restriction != 'all' and coupon.user_type_restriction != request.user_type:
            return False, f"This coupon is only for {coupon.user_type_restriction}s", None
    
    # Check first order only
    if coupon.first_order_only and not request.is_first_order:
        return False, "This coupon is only valid for first orders", None
    
    # Check minimum order amount
    if coupon.min_order_amount and request.order_amount < coupon.min_order_amount:
        return False, f"Minimum order amount of GHS {coupon.min_order_amount} required", None
    
    # Check specific products/categories
    if coupon.specific_product_ids and request.product_ids:
        has_matching_product = any(pid in coupon.specific_product_ids for pid in request.product_ids)
        if not has_matching_product:
            return False, "This coupon is not valid for the products in your cart", None
    
    if coupon.specific_category_ids and request.category_ids:
        has_matching_category = any(cid in coupon.specific_category_ids for cid in request.category_ids)
        if not has_matching_category:
            return False, "This coupon is not valid for the product categories in your cart", None
    
    # Calculate benefits
    benefits = calculate_coupon_benefits(coupon, request)
    
    return True, "Coupon applied successfully!", benefits


def calculate_coupon_benefits(coupon: Coupon, request: CouponValidateRequest) -> CouponBenefit:
    """Calculate actual benefits from coupon"""
    
    benefits = CouponBenefit(
        coupon_id=coupon.id,
        coupon_code=coupon.code,
        coupon_name=coupon.name,
        benefit_type=coupon.benefit_type,
        success_message=""
    )
    
    # Free Delivery
    if coupon.benefit_type == "free_delivery" or coupon.free_delivery:
        benefits.free_delivery = True
        benefits.success_message = "🎉 FREE DELIVERY!"
    
    # Delivery Discount
    elif coupon.benefit_type == "delivery_discount":
        if coupon.delivery_discount_percent:
            # Will be calculated in checkout with actual delivery price
            benefits.delivery_discount_percent = coupon.delivery_discount_percent
            benefits.success_message = f"{coupon.delivery_discount_percent}% off delivery"
        elif coupon.delivery_discount_fixed:
            benefits.delivery_discount = coupon.delivery_discount_fixed
            benefits.success_message = f"GHS {coupon.delivery_discount_fixed} off delivery"
    
    # Wallet Credit
    elif coupon.benefit_type == "wallet_credit":
        if coupon.wallet_credit_amount:
            benefits.wallet_credit = coupon.wallet_credit_amount
            benefits.success_message = f"GHS {coupon.wallet_credit_amount} added to your wallet!"
    
    # Product Discount
    elif coupon.benefit_type == "product_discount":
        if coupon.product_discount_percent:
            discount = (request.order_amount * coupon.product_discount_percent) / 100
            # Apply max discount cap if set
            if coupon.max_discount_amount:
                discount = min(discount, coupon.max_discount_amount)
                if discount == coupon.max_discount_amount:
                    benefits.max_discount_applied = True
            benefits.product_discount = Decimal(str(discount))
            benefits.product_discount_percent = coupon.product_discount_percent
            benefits.success_message = f"{coupon.product_discount_percent}% off your order!"
        elif coupon.product_discount_fixed:
            discount = min(coupon.product_discount_fixed, request.order_amount)
            benefits.product_discount = discount
            benefits.success_message = f"GHS {discount} off your order!"
    
    # Specific Product Discount
    elif coupon.benefit_type == "specific_product":
        if coupon.product_discount_percent:
            # Will be calculated in checkout for specific products only
            benefits.product_discount_percent = coupon.product_discount_percent
            benefits.success_message = f"{coupon.product_discount_percent}% off selected products!"
        elif coupon.product_discount_fixed:
            benefits.product_discount = coupon.product_discount_fixed
            benefits.success_message = f"GHS {coupon.product_discount_fixed} off selected products!"
    
    # Calculate total discount
    benefits.total_discount = benefits.delivery_discount + benefits.product_discount
    
    # Add restrictions info
    if coupon.min_order_amount:
        benefits.restrictions = f"Min order: GHS {coupon.min_order_amount}"
    
    return benefits


def get_coupon_stats(db: Session) -> dict:
    """Get coupon statistics"""
    now = datetime.utcnow()
    
    total = db.query(func.count(Coupon.id)).scalar()
    
    active = db.query(func.count(Coupon.id)).filter(
        and_(
            Coupon.is_active == True,
            Coupon.valid_from <= now,
            Coupon.valid_until >= now
        )
    ).scalar()
    
    expired = db.query(func.count(Coupon.id)).filter(
        Coupon.valid_until < now
    ).scalar()
    
    total_uses = db.query(func.sum(Coupon.uses_count)).scalar() or 0
    
    most_used = db.query(Coupon).order_by(Coupon.uses_count.desc()).first()
    
    return {
        "total_coupons": total,
        "active_coupons": active,
        "expired_coupons": expired,
        "total_uses": total_uses,
        "most_used_coupon": most_used
    }


def get_user_coupon_usage_count(db: Session, user_id: str, coupon_id: str) -> int:
    """Get how many times a user has used a specific coupon"""
    # This would require a coupon_usage table to track per-user usage
    # For now, return 0 as placeholder
    # TODO: Implement coupon_usage tracking table
    return 0


def can_user_use_coupon(db: Session, user_id: str, coupon_id: str) -> bool:
    """Check if user can use a coupon based on per-user limits"""
    coupon = get_coupon_by_id(db, coupon_id)
    if not coupon:
        return False
    
    if not coupon.max_uses_per_user:
        return True
    
    usage_count = get_user_coupon_usage_count(db, user_id, coupon_id)
    return usage_count < coupon.max_uses_per_user
