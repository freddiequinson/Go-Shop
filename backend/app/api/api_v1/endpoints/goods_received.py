"""
Goods Received Notes (GRN) API endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.core.deps import get_current_admin, get_current_active_user
from app.models.user import User
from app.schemas.warehouse_management import (
    GoodsReceivedNoteCreate,
    GoodsReceivedNoteUpdate,
    GoodsReceivedNoteResponse,
    GoodsReceivedNoteListResponse,
    QualityCheckUpdate
)
from app.crud import goods_received as crud

router = APIRouter()


@router.post("/", response_model=GoodsReceivedNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_grn(
    grn: GoodsReceivedNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new Goods Received Note (GRN)
    
    Automatically generates GRN number and sets received_by to current user
    """
    return crud.create_grn(db, grn, current_user.id)


@router.get("/", response_model=GoodsReceivedNoteListResponse)
async def list_grns(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    supplier_id: Optional[str] = Query(None, description="Filter by supplier"),
    product_id: Optional[str] = Query(None, description="Filter by product"),
    quality_status: Optional[str] = Query(None, description="Filter by quality check status"),
    start_date: Optional[datetime] = Query(None, description="Filter by delivery date (start)"),
    end_date: Optional[datetime] = Query(None, description="Filter by delivery date (end)"),
    search: Optional[str] = Query(None, description="Search by GRN number or batch number"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    List all GRNs with filters (Admin only)
    """
    grns = crud.get_grns(
        db,
        skip=skip,
        limit=limit,
        supplier_id=supplier_id,
        product_id=product_id,
        quality_status=quality_status,
        start_date=start_date,
        end_date=end_date,
        search=search
    )
    
    total = crud.count_grns(
        db,
        supplier_id=supplier_id,
        product_id=product_id,
        quality_status=quality_status,
        start_date=start_date,
        end_date=end_date,
        search=search
    )
    
    return GoodsReceivedNoteListResponse(
        items=grns,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/stats")
async def get_grn_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get GRN statistics (Admin only)
    """
    return crud.get_grn_stats(db)


@router.get("/pending-quality-check", response_model=List[GoodsReceivedNoteResponse])
async def get_pending_quality_checks(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get GRNs pending quality check (Admin only)
    """
    return crud.get_pending_quality_checks(db, limit)


@router.get("/supplier/{supplier_id}", response_model=List[GoodsReceivedNoteResponse])
async def get_grns_by_supplier(
    supplier_id: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get all GRNs for a specific supplier (Admin only)
    """
    return crud.get_grns_by_supplier(db, supplier_id, limit)


@router.get("/{grn_id}", response_model=GoodsReceivedNoteResponse)
async def get_grn(
    grn_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get GRN by ID (Admin only)
    """
    grn = crud.get_grn(db, grn_id)
    if not grn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GRN not found"
        )
    return grn


@router.put("/{grn_id}", response_model=GoodsReceivedNoteResponse)
async def update_grn(
    grn_id: str,
    grn_update: GoodsReceivedNoteUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Update GRN (Admin only)
    
    Note: Cannot update if already approved
    """
    existing_grn = crud.get_grn(db, grn_id)
    if not existing_grn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GRN not found"
        )
    
    if existing_grn.quality_check_status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update approved GRN"
        )
    
    grn = crud.update_grn(db, grn_id, grn_update)
    return grn


@router.put("/{grn_id}/quality-check", response_model=GoodsReceivedNoteResponse)
async def update_quality_check(
    grn_id: str,
    quality_update: QualityCheckUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Update quality check status (Admin only)
    
    When approved, automatically updates warehouse inventory
    """
    grn = crud.update_quality_check(db, grn_id, quality_update, current_admin.id)
    if not grn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GRN not found"
        )
    return grn


@router.post("/{grn_id}/approve", response_model=GoodsReceivedNoteResponse)
async def approve_grn(
    grn_id: str,
    notes: Optional[str] = Query(None, description="Quality check notes"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Quick approve GRN (Admin only)
    
    Shortcut for updating quality check to approved
    Auto-updates supplier performance metrics
    """
    from app.utils.supplier_performance import update_supplier_performance_from_grn
    import logging
    
    logger = logging.getLogger(__name__)
    
    quality_update = QualityCheckUpdate(
        quality_check_status="approved",
        quality_notes=notes
    )
    
    grn = crud.update_quality_check(db, grn_id, quality_update, current_admin.id)
    if not grn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GRN not found"
        )
    
    # Auto-update supplier performance
    try:
        update_supplier_performance_from_grn(db, grn_id)
        logger.info(f"Supplier performance updated for GRN {grn_id}")
    except Exception as e:
        logger.error(f"Failed to update supplier performance: {e}")
        # Don't fail the approval if performance update fails
    
    # Replace product photos with GRN photos (received goods photos)
    try:
        from app.models.product import Product
        
        if grn.images and len(grn.images) > 0:
            product = db.query(Product).filter(Product.id == grn.product_id).first()
            if product:
                # Replace product photos with actual received photos
                product.images = grn.images
                product.in_warehouse = True  # Mark as in warehouse
                product.supplier_id = grn.supplier_id  # Track current supplier
                db.commit()
                logger.info(f"Product {grn.product_id} photos replaced with GRN {grn_id} photos")
    except Exception as e:
        logger.error(f"Failed to replace product photos: {e}")
        # Don't fail the approval if photo replacement fails
    
    return grn


@router.post("/{grn_id}/reject", response_model=GoodsReceivedNoteResponse)
async def reject_grn(
    grn_id: str,
    reason: str = Query(..., description="Rejection reason"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Quick reject GRN (Admin only)
    
    Shortcut for updating quality check to rejected
    """
    quality_update = QualityCheckUpdate(
        quality_check_status="rejected",
        quality_notes=reason
    )
    
    grn = crud.update_quality_check(db, grn_id, quality_update, current_admin.id)
    if not grn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GRN not found"
        )
    
    return grn
