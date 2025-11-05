"""
CRUD operations for Goods Received Notes (GRN)
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime, timedelta
import uuid

from app.models.warehouse import GoodsReceivedNote, QualityCheckStatus, WarehouseInventory
from app.schemas.warehouse_management import (
    GoodsReceivedNoteCreate,
    GoodsReceivedNoteUpdate,
    QualityCheckUpdate
)


def generate_grn_number(db: Session) -> str:
    """Generate unique GRN number"""
    # Format: GRN-YYYYMMDD-XXX
    today = datetime.utcnow()
    date_str = today.strftime("%Y%m%d")
    
    # Count GRNs created today
    count = db.query(GoodsReceivedNote).filter(
        func.date(GoodsReceivedNote.created_at) == today.date()
    ).count()
    
    sequence = str(count + 1).zfill(3)
    return f"GRN-{date_str}-{sequence}"


def create_grn(
    db: Session,
    grn: GoodsReceivedNoteCreate,
    received_by: str
) -> GoodsReceivedNote:
    """Create a new GRN"""
    # Calculate total cost
    if grn.quantity_received_pieces:
        total_cost = float(grn.unit_cost) * float(grn.quantity_received_pieces)
    elif grn.quantity_received_weight:
        total_cost = float(grn.unit_cost) * float(grn.quantity_received_weight)
    else:
        total_cost = 0
    
    db_grn = GoodsReceivedNote(
        id=str(uuid.uuid4()),
        grn_number=generate_grn_number(db),
        supplier_id=grn.supplier_id,
        product_id=grn.product_id,
        batch_number=grn.batch_number,
        quantity_received_pieces=grn.quantity_received_pieces,
        quantity_received_weight=grn.quantity_received_weight,
        weight_unit=grn.weight_unit,
        unit_cost=grn.unit_cost,
        total_cost=total_cost,
        delivery_date=grn.delivery_date,
        manufacturing_date=grn.manufacturing_date,
        expiry_date=grn.expiry_date,
        warehouse_location_id=grn.warehouse_location_id,
        images=grn.images,
        notes=grn.notes,
        received_by=received_by
    )
    
    db.add(db_grn)
    db.commit()
    db.refresh(db_grn)
    
    return db_grn


def get_grn(db: Session, grn_id: str) -> Optional[GoodsReceivedNote]:
    """Get GRN by ID"""
    return db.query(GoodsReceivedNote).filter(GoodsReceivedNote.id == grn_id).first()


def get_grn_by_number(db: Session, grn_number: str) -> Optional[GoodsReceivedNote]:
    """Get GRN by number"""
    return db.query(GoodsReceivedNote).filter(
        GoodsReceivedNote.grn_number == grn_number
    ).first()


def get_grns(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[str] = None,
    product_id: Optional[str] = None,
    quality_status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None
) -> List[GoodsReceivedNote]:
    """Get list of GRNs with filters"""
    from app.models.supplier import Supplier
    from app.models.product import Product
    
    query = db.query(GoodsReceivedNote)
    
    if supplier_id:
        query = query.filter(GoodsReceivedNote.supplier_id == supplier_id)
    
    if product_id:
        query = query.filter(GoodsReceivedNote.product_id == product_id)
    
    if quality_status:
        query = query.filter(GoodsReceivedNote.quality_check_status == quality_status)
    
    if start_date:
        query = query.filter(GoodsReceivedNote.delivery_date >= start_date)
    
    if end_date:
        query = query.filter(GoodsReceivedNote.delivery_date <= end_date)
    
    if search:
        query = query.filter(
            or_(
                GoodsReceivedNote.grn_number.ilike(f"%{search}%"),
                GoodsReceivedNote.batch_number.ilike(f"%{search}%")
            )
        )
    
    grns = query.order_by(GoodsReceivedNote.created_at.desc()).offset(skip).limit(limit).all()
    
    # Enrich GRNs with supplier and product names
    for grn in grns:
        supplier = db.query(Supplier).filter(Supplier.id == grn.supplier_id).first()
        product = db.query(Product).filter(Product.id == grn.product_id).first()
        grn.supplier_name = supplier.name if supplier else None
        grn.product_name = product.name if product else None
    
    return grns


def count_grns(
    db: Session,
    supplier_id: Optional[str] = None,
    product_id: Optional[str] = None,
    quality_status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None
) -> int:
    """Count GRNs with filters"""
    query = db.query(GoodsReceivedNote)
    
    if supplier_id:
        query = query.filter(GoodsReceivedNote.supplier_id == supplier_id)
    
    if product_id:
        query = query.filter(GoodsReceivedNote.product_id == product_id)
    
    if quality_status:
        query = query.filter(GoodsReceivedNote.quality_check_status == quality_status)
    
    if start_date:
        query = query.filter(GoodsReceivedNote.delivery_date >= start_date)
    
    if end_date:
        query = query.filter(GoodsReceivedNote.delivery_date <= end_date)
    
    if search:
        query = query.filter(
            or_(
                GoodsReceivedNote.grn_number.ilike(f"%{search}%"),
                GoodsReceivedNote.batch_number.ilike(f"%{search}%")
            )
        )
    
    return query.count()


def update_grn(
    db: Session,
    grn_id: str,
    grn_update: GoodsReceivedNoteUpdate
) -> Optional[GoodsReceivedNote]:
    """Update GRN"""
    db_grn = get_grn(db, grn_id)
    if not db_grn:
        return None
    
    update_data = grn_update.dict(exclude_unset=True)
    
    # Recalculate total cost if quantities or unit cost changed
    if any(k in update_data for k in ['quantity_received_pieces', 'quantity_received_weight', 'unit_cost']):
        unit_cost = update_data.get('unit_cost', db_grn.unit_cost)
        pieces = update_data.get('quantity_received_pieces', db_grn.quantity_received_pieces)
        weight = update_data.get('quantity_received_weight', db_grn.quantity_received_weight)
        
        if pieces:
            update_data['total_cost'] = float(unit_cost) * float(pieces)
        elif weight:
            update_data['total_cost'] = float(unit_cost) * float(weight)
    
    for field, value in update_data.items():
        setattr(db_grn, field, value)
    
    db.commit()
    db.refresh(db_grn)
    return db_grn


def update_quality_check(
    db: Session,
    grn_id: str,
    quality_update: QualityCheckUpdate,
    checked_by: str
) -> Optional[GoodsReceivedNote]:
    """Update quality check status"""
    db_grn = get_grn(db, grn_id)
    if not db_grn:
        return None
    
    db_grn.quality_check_status = quality_update.quality_check_status
    db_grn.quality_notes = quality_update.quality_notes
    db_grn.quality_check_by = checked_by
    db_grn.quality_check_date = datetime.utcnow()
    
    db.commit()
    db.refresh(db_grn)
    
    # If approved, update inventory
    if quality_update.quality_check_status == QualityCheckStatus.APPROVED.value:
        update_inventory_from_grn(db, db_grn)
    
    return db_grn


def update_inventory_from_grn(db: Session, grn: GoodsReceivedNote):
    """Update warehouse inventory when GRN is approved"""
    from app.models.product import Product
    
    # Get or create inventory record
    inventory = db.query(WarehouseInventory).filter(
        WarehouseInventory.product_id == grn.product_id
    ).first()
    
    if not inventory:
        # Create new inventory record
        inventory = WarehouseInventory(
            id=str(uuid.uuid4()),
            product_id=grn.product_id,
            quantity_available=0,
            quantity_reserved=0,
            quantity_damaged=0
        )
        db.add(inventory)
    
    # Update quantities
    if grn.quantity_received_pieces:
        if inventory.quantity_in_pieces:
            inventory.quantity_in_pieces += grn.quantity_received_pieces
        else:
            inventory.quantity_in_pieces = grn.quantity_received_pieces
        
        # Also update main quantity_available
        inventory.quantity_available += grn.quantity_received_pieces
    
    if grn.quantity_received_weight:
        if inventory.quantity_in_weight:
            inventory.quantity_in_weight += grn.quantity_received_weight
        else:
            inventory.quantity_in_weight = grn.quantity_received_weight
            inventory.weight_unit = grn.weight_unit
        
        # If no pieces, use weight for quantity_available
        if not grn.quantity_received_pieces:
            inventory.quantity_available += grn.quantity_received_weight
    
    # Update other fields
    inventory.warehouse_location_id = grn.warehouse_location_id
    inventory.batch_number = grn.batch_number
    inventory.received_date = grn.delivery_date
    inventory.expiry_date = grn.expiry_date
    inventory.manufacturing_date = grn.manufacturing_date
    inventory.is_perishable = grn.expiry_date is not None
    inventory.supplier_id = grn.supplier_id
    inventory.unit_cost = grn.unit_cost
    
    # Calculate total value
    if inventory.quantity_available and inventory.unit_cost:
        inventory.total_cost = float(inventory.quantity_available) * float(inventory.unit_cost)
    
    # Mark product as in warehouse (for supplier products)
    product = db.query(Product).filter(Product.id == grn.product_id).first()
    if product and not product.in_warehouse:
        product.in_warehouse = True
    
    db.commit()


def get_pending_quality_checks(db: Session, limit: int = 50) -> List[GoodsReceivedNote]:
    """Get GRNs pending quality check"""
    return db.query(GoodsReceivedNote).filter(
        GoodsReceivedNote.quality_check_status == QualityCheckStatus.PENDING.value
    ).order_by(GoodsReceivedNote.created_at).limit(limit).all()


def get_grns_by_supplier(
    db: Session,
    supplier_id: str,
    limit: int = 100
) -> List[GoodsReceivedNote]:
    """Get all GRNs for a supplier"""
    return db.query(GoodsReceivedNote).filter(
        GoodsReceivedNote.supplier_id == supplier_id
    ).order_by(GoodsReceivedNote.created_at.desc()).limit(limit).all()


def get_grn_stats(db: Session) -> dict:
    """Get GRN statistics"""
    total_grns = db.query(GoodsReceivedNote).count()
    
    # Count by status
    pending = db.query(GoodsReceivedNote).filter(
        GoodsReceivedNote.quality_check_status == QualityCheckStatus.PENDING.value
    ).count()
    
    approved = db.query(GoodsReceivedNote).filter(
        GoodsReceivedNote.quality_check_status == QualityCheckStatus.APPROVED.value
    ).count()
    
    rejected = db.query(GoodsReceivedNote).filter(
        GoodsReceivedNote.quality_check_status == QualityCheckStatus.REJECTED.value
    ).count()
    
    # Total value
    total_value = db.query(func.sum(GoodsReceivedNote.total_cost)).filter(
        GoodsReceivedNote.quality_check_status == QualityCheckStatus.APPROVED.value
    ).scalar() or 0
    
    # This month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = db.query(GoodsReceivedNote).filter(
        GoodsReceivedNote.created_at >= month_start
    ).count()
    
    return {
        "total_grns": total_grns,
        "pending_quality_check": pending,
        "approved": approved,
        "rejected": rejected,
        "total_value_approved": float(total_value),
        "grns_this_month": this_month
    }
