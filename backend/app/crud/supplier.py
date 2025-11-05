"""
CRUD operations for Supplier management
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime
import uuid

from app.models.supplier import Supplier, SupplierProduct, SupplierType, SupplierStatus
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierProductCreate, SupplierProductUpdate, SupplierFilter


def generate_supplier_code() -> str:
    """Generate unique supplier code"""
    return f"SUP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


# Supplier CRUD operations
def create_supplier(db: Session, supplier: SupplierCreate) -> Supplier:
    """Create a new supplier"""
    db_supplier = Supplier(
        id=str(uuid.uuid4()),
        supplier_code=generate_supplier_code(),
        **supplier.model_dump()
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def get_supplier_by_id(db: Session, supplier_id: str) -> Optional[Supplier]:
    """Get supplier by ID"""
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def get_supplier_by_code(db: Session, supplier_code: str) -> Optional[Supplier]:
    """Get supplier by code"""
    return db.query(Supplier).filter(Supplier.supplier_code == supplier_code).first()


def get_suppliers(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    filters: Optional[SupplierFilter] = None
) -> Tuple[List[Supplier], int]:
    """Get all suppliers with filtering"""
    query = db.query(Supplier)
    
    if filters:
        if filters.supplier_type:
            query = query.filter(Supplier.supplier_type == filters.supplier_type)
        
        if filters.verification_status:
            query = query.filter(Supplier.verification_status == filters.verification_status)
        
        if filters.is_active is not None:
            query = query.filter(Supplier.is_active == filters.is_active)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Supplier.name.ilike(search_term),
                    Supplier.contact_person.ilike(search_term),
                    Supplier.phone.ilike(search_term)
                )
            )
        
        if filters.min_rating:
            query = query.filter(Supplier.rating >= filters.min_rating)
        
        if filters.location:
            # Search in JSON location field
            query = query.filter(
                Supplier.location.cast(db.String).ilike(f"%{filters.location}%")
            )
    
    total = query.count()
    suppliers = query.order_by(Supplier.created_at.desc()).offset(skip).limit(limit).all()
    
    return suppliers, total


def update_supplier(db: Session, supplier_id: str, supplier_update) -> Optional[Supplier]:
    """Update supplier - accepts SupplierUpdate model or dict"""
    db_supplier = get_supplier_by_id(db, supplier_id)
    if not db_supplier:
        return None
    
    # Handle both dict and Pydantic model
    if isinstance(supplier_update, dict):
        update_data = supplier_update
    else:
        update_data = supplier_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def delete_supplier(db: Session, supplier_id: str) -> bool:
    """Hard delete supplier (permanently removes from database)"""
    db_supplier = get_supplier_by_id(db, supplier_id)
    if not db_supplier:
        return False
    
    # Delete associated user account if exists (find by email)
    if db_supplier.email:
        from app.models.user import User
        db_user = db.query(User).filter(User.email == db_supplier.email).first()
        if db_user and db_user.user_type == "SUPPLIER":
            db.delete(db_user)
    
    # Delete supplier
    db.delete(db_supplier)
    db.commit()
    return True


def verify_supplier(db: Session, supplier_id: str) -> Optional[Supplier]:
    """Verify a supplier"""
    db_supplier = get_supplier_by_id(db, supplier_id)
    if not db_supplier:
        return None
    
    db_supplier.verification_status = SupplierStatus.VERIFIED
    db_supplier.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


# Supplier Product CRUD operations
def create_supplier_product(
    db: Session,
    supplier_id: str,
    supplier_product: SupplierProductCreate
) -> SupplierProduct:
    """Link a product to a supplier"""
    db_supplier_product = SupplierProduct(
        id=str(uuid.uuid4()),
        supplier_id=supplier_id,
        **supplier_product.model_dump()
    )
    db.add(db_supplier_product)
    db.commit()
    db.refresh(db_supplier_product)
    return db_supplier_product


def get_supplier_products(db: Session, supplier_id: str) -> List[SupplierProduct]:
    """Get all products from a supplier"""
    return db.query(SupplierProduct).filter(
        SupplierProduct.supplier_id == supplier_id,
        SupplierProduct.is_active == True
    ).all()


def get_product_suppliers(db: Session, product_id: str) -> List[SupplierProduct]:
    """Get all suppliers for a product"""
    return db.query(SupplierProduct).filter(
        SupplierProduct.product_id == product_id,
        SupplierProduct.is_active == True
    ).all()


def update_supplier_product(
    db: Session,
    supplier_product_id: str,
    update_data: SupplierProductUpdate
) -> Optional[SupplierProduct]:
    """Update supplier product link"""
    db_supplier_product = db.query(SupplierProduct).filter(
        SupplierProduct.id == supplier_product_id
    ).first()
    
    if not db_supplier_product:
        return None
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(db_supplier_product, field, value)
    
    db.commit()
    db.refresh(db_supplier_product)
    return db_supplier_product


def set_preferred_supplier(db: Session, product_id: str, supplier_id: str) -> bool:
    """Set a supplier as preferred for a product"""
    # Remove preferred status from all suppliers for this product
    db.query(SupplierProduct).filter(
        SupplierProduct.product_id == product_id
    ).update({"is_preferred": False})
    
    # Set new preferred supplier
    db.query(SupplierProduct).filter(
        and_(
            SupplierProduct.product_id == product_id,
            SupplierProduct.supplier_id == supplier_id
        )
    ).update({"is_preferred": True})
    
    db.commit()
    return True


def get_supplier_performance(db: Session, supplier_id: str) -> dict:
    """Calculate supplier performance metrics"""
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        return {}
    
    # Get supplier products
    supplier_products = get_supplier_products(db, supplier_id)
    
    # Calculate total value supplied
    total_value = sum(
        float(sp.total_supplied * sp.unit_cost)
        for sp in supplier_products
    )
    
    return {
        "supplier_id": supplier.id,
        "supplier_name": supplier.name,
        "total_supplies": supplier.total_supplies,
        "on_time_deliveries": int(supplier.total_supplies * float(supplier.on_time_delivery_rate) / 100),
        "late_deliveries": supplier.total_supplies - int(supplier.total_supplies * float(supplier.on_time_delivery_rate) / 100),
        "on_time_rate": float(supplier.on_time_delivery_rate),
        "average_quality_rating": float(supplier.quality_rating),
        "total_products_supplied": len(supplier_products),
        "total_value": total_value,
        "last_supply_date": supplier.last_supply_date
    }


def search_suppliers(db: Session, search_term: str, limit: int = 10) -> List[Supplier]:
    """Search suppliers by name, code, or contact"""
    search_pattern = f"%{search_term}%"
    return db.query(Supplier).filter(
        or_(
            Supplier.name.ilike(search_pattern),
            Supplier.supplier_code.ilike(search_pattern),
            Supplier.contact_person.ilike(search_pattern),
            Supplier.phone.ilike(search_pattern)
        ),
        Supplier.is_active == True
    ).limit(limit).all()


def get_top_suppliers(db: Session, limit: int = 10) -> List[Supplier]:
    """Get top performing suppliers"""
    return db.query(Supplier).filter(
        Supplier.is_active == True,
        Supplier.verification_status == SupplierStatus.VERIFIED
    ).order_by(
        Supplier.rating.desc(),
        Supplier.total_supplies.desc()
    ).limit(limit).all()
