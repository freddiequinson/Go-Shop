"""
Coupon API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.user import User
from app.crud import coupon as crud_coupon
from app.schemas.coupon import (
    CouponCreate,
    CouponUpdate,
    CouponResponse,
    CouponListResponse,
    CouponValidateRequest,
    CouponValidateResponse,
    CouponStatsResponse
)

router = APIRouter()


# Public Endpoints

@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    request: CouponValidateRequest,
    db: Session = Depends(get_db)
):
    """
    Validate a coupon code and get benefits
    Public endpoint - anyone can validate
    """
    is_valid, message, benefits = crud_coupon.validate_coupon(db, request)
    
    if not is_valid:
        return CouponValidateResponse(
            valid=False,
            message=message,
            error=message
        )
    
    return CouponValidateResponse(
        valid=True,
        message=message,
        benefits=benefits
    )


@router.get("/public", response_model=List[CouponResponse])
async def list_public_coupons(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get list of public coupons
    Shows only active, public coupons
    """
    coupons = crud_coupon.list_coupons(
        db,
        skip=skip,
        limit=limit,
        active_only=True,
        public_only=True
    )
    return coupons


# Admin Endpoints

@router.get("/", response_model=CouponListResponse)
async def list_all_coupons(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    List all coupons (Admin only)
    """
    coupons = crud_coupon.list_coupons(db, skip=skip, limit=limit, active_only=active_only)
    stats = crud_coupon.get_coupon_stats(db)
    
    return CouponListResponse(
        coupons=coupons,
        total=stats["total_coupons"],
        active_count=stats["active_coupons"],
        expired_count=stats["expired_coupons"]
    )


@router.post("/", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create new coupon (Admin only)
    """
    # Check if code already exists
    existing = crud_coupon.get_coupon_by_code(db, coupon.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{coupon.code}' already exists"
        )
    
    # Set created_by
    coupon.created_by = current_user.id
    
    return crud_coupon.create_coupon(db, coupon)


@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get coupon by ID (Admin only)
    """
    coupon = crud_coupon.get_coupon_by_id(db, coupon_id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    return coupon


@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    coupon_update: CouponUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update coupon (Admin only)
    """
    coupon = crud_coupon.update_coupon(db, coupon_id, coupon_update)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    return coupon


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(
    coupon_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Delete coupon (Admin only)
    """
    success = crud_coupon.delete_coupon(db, coupon_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    return None


@router.post("/{coupon_id}/toggle-status", response_model=CouponResponse)
async def toggle_coupon_status(
    coupon_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Toggle coupon active status (Admin only)
    """
    coupon = crud_coupon.get_coupon_by_id(db, coupon_id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    coupon_update = CouponUpdate(is_active=not coupon.is_active)
    return crud_coupon.update_coupon(db, coupon_id, coupon_update)


@router.get("/stats/overview", response_model=CouponStatsResponse)
async def get_coupon_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get coupon statistics (Admin only)
    """
    stats = crud_coupon.get_coupon_stats(db)
    
    return CouponStatsResponse(
        total_coupons=stats["total_coupons"],
        active_coupons=stats["active_coupons"],
        expired_coupons=stats["expired_coupons"],
        total_uses=stats["total_uses"],
        total_savings=0,  # TODO: Calculate from orders
        most_used_coupon=stats["most_used_coupon"]
    )


@router.post("/{coupon_id}/duplicate", response_model=CouponResponse)
async def duplicate_coupon(
    coupon_id: str,
    new_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Duplicate an existing coupon with a new code (Admin only)
    """
    original = crud_coupon.get_coupon_by_id(db, coupon_id)
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    # Check if new code exists
    existing = crud_coupon.get_coupon_by_code(db, new_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{new_code}' already exists"
        )
    
    # Create duplicate
    coupon_data = CouponCreate(
        code=new_code,
        name=f"{original.name} (Copy)",
        description=original.description,
        benefit_type=original.benefit_type,
        discount_value=original.discount_value,
        discount_type=original.discount_type,
        free_delivery=original.free_delivery,
        delivery_discount_percent=original.delivery_discount_percent,
        delivery_discount_fixed=original.delivery_discount_fixed,
        wallet_credit_amount=original.wallet_credit_amount,
        product_discount_percent=original.product_discount_percent,
        product_discount_fixed=original.product_discount_fixed,
        specific_product_ids=original.specific_product_ids,
        specific_category_ids=original.specific_category_ids,
        min_order_amount=original.min_order_amount,
        max_discount_amount=original.max_discount_amount,
        max_uses=original.max_uses,
        max_uses_per_user=original.max_uses_per_user,
        user_type_restriction=original.user_type_restriction,
        first_order_only=original.first_order_only,
        valid_from=original.valid_from,
        valid_until=original.valid_until,
        is_active=False,  # Start as inactive
        is_public=original.is_public,
        internal_notes=f"Duplicated from {original.code}",
        created_by=current_user.id
    )
    
    return crud_coupon.create_coupon(db, coupon_data)
