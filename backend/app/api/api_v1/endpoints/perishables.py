"""
Perishables Management API endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta

from app.db.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.warehouse import GoodsReceivedNote, WastageRecord, WastageReason
from app.models.product import Product
from app.schemas.warehouse_management import (
    PerishableAlert,
    PerishableAlertsResponse,
    WastageRecordCreate,
    WastageRecordResponse,
    WastageRecordListResponse,
    WastageAnalytics
)
import uuid

router = APIRouter()


@router.get("/expiring-soon", response_model=List[PerishableAlert])
async def get_expiring_soon(
    days: int = Query(14, ge=1, le=90, description="Days until expiry"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get products expiring within N days (Admin only)
    """
    now = datetime.utcnow()
    expiry_threshold = now + timedelta(days=days)
    
    grns = db.query(GoodsReceivedNote, Product).join(
        Product, GoodsReceivedNote.product_id == Product.id
    ).filter(
        and_(
            GoodsReceivedNote.expiry_date.isnot(None),
            GoodsReceivedNote.expiry_date > now,
            GoodsReceivedNote.expiry_date <= expiry_threshold,
            GoodsReceivedNote.quality_check_status == "approved"
        )
    ).order_by(GoodsReceivedNote.expiry_date).all()
    
    alerts = []
    for grn, product in grns:
        days_left = (grn.expiry_date - now).days
        
        # Determine urgency
        if days_left <= 3:
            urgency = "critical"
        elif days_left <= 7:
            urgency = "high"
        elif days_left <= 14:
            urgency = "medium"
        else:
            urgency = "low"
        
        alerts.append(PerishableAlert(
            product_id=product.id,
            product_name=product.name,
            batch_number=grn.batch_number,
            expiry_date=grn.expiry_date,
            days_until_expiry=days_left,
            quantity_pieces=grn.quantity_received_pieces,
            quantity_weight=grn.quantity_received_weight,
            warehouse_location=grn.warehouse_location_id,
            urgency=urgency
        ))
    
    return alerts


@router.get("/expired", response_model=List[PerishableAlert])
async def get_expired_products(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get expired products (Admin only)
    """
    now = datetime.utcnow()
    
    grns = db.query(GoodsReceivedNote, Product).join(
        Product, GoodsReceivedNote.product_id == Product.id
    ).filter(
        and_(
            GoodsReceivedNote.expiry_date.isnot(None),
            GoodsReceivedNote.expiry_date <= now,
            GoodsReceivedNote.quality_check_status == "approved"
        )
    ).order_by(GoodsReceivedNote.expiry_date.desc()).all()
    
    alerts = []
    for grn, product in grns:
        days_expired = (now - grn.expiry_date).days
        
        alerts.append(PerishableAlert(
            product_id=product.id,
            product_name=product.name,
            batch_number=grn.batch_number,
            expiry_date=grn.expiry_date,
            days_until_expiry=-days_expired,  # Negative for expired
            quantity_pieces=grn.quantity_received_pieces,
            quantity_weight=grn.quantity_received_weight,
            warehouse_location=grn.warehouse_location_id,
            urgency="critical"
        ))
    
    return alerts


@router.get("/alerts", response_model=PerishableAlertsResponse)
async def get_perishable_alerts(
    days: int = Query(14, ge=1, le=90),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get comprehensive perishable alerts (Admin only)
    """
    now = datetime.utcnow()
    expiry_threshold = now + timedelta(days=days)
    
    # Expiring soon
    expiring_grns = db.query(GoodsReceivedNote, Product).join(
        Product, GoodsReceivedNote.product_id == Product.id
    ).filter(
        and_(
            GoodsReceivedNote.expiry_date.isnot(None),
            GoodsReceivedNote.expiry_date > now,
            GoodsReceivedNote.expiry_date <= expiry_threshold,
            GoodsReceivedNote.quality_check_status == "approved"
        )
    ).all()
    
    # Expired
    expired_grns = db.query(GoodsReceivedNote, Product).join(
        Product, GoodsReceivedNote.product_id == Product.id
    ).filter(
        and_(
            GoodsReceivedNote.expiry_date.isnot(None),
            GoodsReceivedNote.expiry_date <= now,
            GoodsReceivedNote.quality_check_status == "approved"
        )
    ).all()
    
    expiring_alerts = []
    for grn, product in expiring_grns:
        days_left = (grn.expiry_date - now).days
        urgency = "critical" if days_left <= 3 else "high" if days_left <= 7 else "medium"
        
        expiring_alerts.append(PerishableAlert(
            product_id=product.id,
            product_name=product.name,
            batch_number=grn.batch_number,
            expiry_date=grn.expiry_date,
            days_until_expiry=days_left,
            quantity_pieces=grn.quantity_received_pieces,
            quantity_weight=grn.quantity_received_weight,
            warehouse_location=grn.warehouse_location_id,
            urgency=urgency
        ))
    
    expired_alerts = []
    for grn, product in expired_grns:
        days_expired = (now - grn.expiry_date).days
        
        expired_alerts.append(PerishableAlert(
            product_id=product.id,
            product_name=product.name,
            batch_number=grn.batch_number,
            expiry_date=grn.expiry_date,
            days_until_expiry=-days_expired,
            quantity_pieces=grn.quantity_received_pieces,
            quantity_weight=grn.quantity_received_weight,
            warehouse_location=grn.warehouse_location_id,
            urgency="critical"
        ))
    
    return PerishableAlertsResponse(
        expiring_soon=expiring_alerts,
        expired=expired_alerts,
        total_expiring=len(expiring_alerts),
        total_expired=len(expired_alerts)
    )


@router.get("/by-batch/{batch_number}")
async def get_by_batch(
    batch_number: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get perishable product details by batch number (Admin only)
    """
    grns = db.query(GoodsReceivedNote, Product).join(
        Product, GoodsReceivedNote.product_id == Product.id
    ).filter(
        GoodsReceivedNote.batch_number == batch_number
    ).all()
    
    if not grns:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No products found with batch number: {batch_number}"
        )
    
    results = []
    now = datetime.utcnow()
    
    for grn, product in grns:
        days_until_expiry = None
        is_expired = False
        
        if grn.expiry_date:
            days_until_expiry = (grn.expiry_date - now).days
            is_expired = grn.expiry_date <= now
        
        results.append({
            "grn_id": grn.id,
            "grn_number": grn.grn_number,
            "product_id": product.id,
            "product_name": product.name,
            "batch_number": grn.batch_number,
            "quantity_pieces": float(grn.quantity_received_pieces) if grn.quantity_received_pieces else None,
            "quantity_weight": float(grn.quantity_received_weight) if grn.quantity_received_weight else None,
            "weight_unit": grn.weight_unit,
            "manufacturing_date": grn.manufacturing_date,
            "expiry_date": grn.expiry_date,
            "days_until_expiry": days_until_expiry,
            "is_expired": is_expired,
            "warehouse_location_id": grn.warehouse_location_id,
            "quality_check_status": grn.quality_check_status
        })
    
    return results


@router.post("/mark-wastage", response_model=WastageRecordResponse, status_code=status.HTTP_201_CREATED)
async def mark_as_wastage(
    wastage: WastageRecordCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Mark perishable product as wastage (Admin only)
    """
    db_wastage = WastageRecord(
        id=str(uuid.uuid4()),
        product_id=wastage.product_id,
        batch_number=wastage.batch_number,
        quantity_wasted_pieces=wastage.quantity_wasted_pieces,
        quantity_wasted_weight=wastage.quantity_wasted_weight,
        weight_unit=wastage.weight_unit,
        reason=wastage.reason,
        warehouse_location_id=wastage.warehouse_location_id,
        cost_value=wastage.cost_value,
        images=wastage.images,
        notes=wastage.notes,
        recorded_by=current_admin.id
    )
    
    db.add(db_wastage)
    db.commit()
    db.refresh(db_wastage)
    
    return db_wastage


@router.get("/wastage-report", response_model=WastageAnalytics)
async def get_wastage_report(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get wastage analytics report (Admin only)
    """
    from sqlalchemy import func
    
    query = db.query(WastageRecord)
    
    if start_date:
        query = query.filter(WastageRecord.created_at >= start_date)
    if end_date:
        query = query.filter(WastageRecord.created_at <= end_date)
    
    # Total wastage value
    total_value = query.with_entities(
        func.sum(WastageRecord.cost_value)
    ).scalar() or 0
    
    # Wastage by reason
    by_reason_results = query.with_entities(
        WastageRecord.reason,
        func.count(WastageRecord.id),
        func.sum(WastageRecord.cost_value)
    ).group_by(WastageRecord.reason).all()
    
    by_reason = {
        reason: {"count": count, "value": float(value or 0)}
        for reason, count, value in by_reason_results
    }
    
    # Wastage by product
    by_product_results = query.join(
        Product, WastageRecord.product_id == Product.id
    ).with_entities(
        Product.name,
        func.count(WastageRecord.id),
        func.sum(WastageRecord.cost_value)
    ).group_by(Product.name).order_by(
        func.sum(WastageRecord.cost_value).desc()
    ).limit(10).all()
    
    by_product = [
        {"product_name": name, "count": count, "value": float(value or 0)}
        for name, count, value in by_product_results
    ]
    
    # Wastage trend (by month)
    trend_results = query.with_entities(
        func.date_trunc('month', WastageRecord.created_at).label('month'),
        func.count(WastageRecord.id),
        func.sum(WastageRecord.cost_value)
    ).group_by('month').order_by('month').all()
    
    trend = [
        {
            "month": month.strftime("%Y-%m") if month else None,
            "count": count,
            "value": float(value or 0)
        }
        for month, count, value in trend_results
    ]
    
    return WastageAnalytics(
        total_wastage_value=float(total_value),
        wastage_by_reason=by_reason,
        wastage_by_product=by_product,
        wastage_trend=trend
    )
