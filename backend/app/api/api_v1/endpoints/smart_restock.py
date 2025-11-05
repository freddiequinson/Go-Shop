"""
Smart Restock API endpoints
Intelligently matches products with suppliers for restocking
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.models.product import Product
from app.models.supplier import Supplier, SupplierProduct
from app.core.deps import get_current_user

router = APIRouter()


class SupplierInfo(BaseModel):
    """Supplier information for restock"""
    supplier_id: str
    supplier_name: str
    supplier_type: str
    unit_cost: float
    lead_time_days: int
    supply_capacity: Optional[float]
    minimum_order_quantity: float
    rating: float
    quality_rating: float
    on_time_delivery_rate: float
    is_preferred: bool
    last_supply_date: Optional[str]
    phone: str
    email: Optional[str]


class SmartRestockResponse(BaseModel):
    """Response for smart restock query"""
    product_exists: bool
    product_id: str
    product_name: str
    current_stock: Optional[float]
    unit_type: str
    suppliers_available: List[SupplierInfo]
    recommended_action: str  # "create_direct_order" or "create_supply_request"
    recommended_supplier_id: Optional[str]
    total_suppliers: int


@router.post("/smart-restock", response_model=SmartRestockResponse)
async def smart_restock(
    product_id: str,
    quantity_needed: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Smart restock endpoint that finds suppliers for a product
    
    Returns:
    - List of suppliers who can supply the product
    - Recommended action (direct order or supply request)
    - Supplier comparison data
    """
    
    # Get product details
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Find all suppliers who can supply this product
    supplier_products = db.query(SupplierProduct).filter(
        SupplierProduct.product_id == product_id,
        SupplierProduct.is_active == True
    ).all()
    
    suppliers_info = []
    for sp in supplier_products:
        supplier = db.query(Supplier).filter(
            Supplier.id == sp.supplier_id,
            Supplier.is_active == True
        ).first()
        
        if supplier:
            suppliers_info.append(SupplierInfo(
                supplier_id=supplier.id,
                supplier_name=supplier.name,
                supplier_type=supplier.supplier_type.value,
                unit_cost=float(sp.unit_cost),
                lead_time_days=sp.lead_time_days,
                supply_capacity=float(sp.supply_capacity) if sp.supply_capacity else None,
                minimum_order_quantity=float(sp.minimum_order_quantity),
                rating=float(supplier.rating),
                quality_rating=float(supplier.quality_rating),
                on_time_delivery_rate=float(supplier.on_time_delivery_rate),
                is_preferred=sp.is_preferred,
                last_supply_date=sp.last_supply_date.isoformat() if sp.last_supply_date else None,
                phone=supplier.phone,
                email=supplier.email
            ))
    
    # Sort suppliers by: preferred first, then by rating, then by cost
    suppliers_info.sort(
        key=lambda x: (
            not x.is_preferred,  # Preferred first (False < True)
            -x.rating,  # Higher rating first
            x.unit_cost  # Lower cost first
        )
    )
    
    # Determine recommended action
    if len(suppliers_info) > 0:
        recommended_action = "create_direct_order"
        recommended_supplier_id = suppliers_info[0].supplier_id
    else:
        recommended_action = "create_supply_request"
        recommended_supplier_id = None
    
    return SmartRestockResponse(
        product_exists=True,
        product_id=product.id,
        product_name=product.name,
        current_stock=float(product.stock_quantity) if product.stock_quantity else 0,
        unit_type=product.unit_type.value,
        suppliers_available=suppliers_info,
        recommended_action=recommended_action,
        recommended_supplier_id=recommended_supplier_id,
        total_suppliers=len(suppliers_info)
    )


@router.get("/product-suppliers/{product_name}", response_model=List[SupplierInfo])
async def get_suppliers_by_product_name(
    product_name: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all suppliers who can supply a product by name
    Useful for searching suppliers during product addition
    """
    
    # Find product by name (case-insensitive)
    product = db.query(Product).filter(
        Product.name.ilike(f"%{product_name}%")
    ).first()
    
    if not product:
        return []
    
    # Find all suppliers for this product
    supplier_products = db.query(SupplierProduct).filter(
        SupplierProduct.product_id == product.id,
        SupplierProduct.is_active == True
    ).all()
    
    suppliers_info = []
    for sp in supplier_products:
        supplier = db.query(Supplier).filter(
            Supplier.id == sp.supplier_id,
            Supplier.is_active == True
        ).first()
        
        if supplier:
            suppliers_info.append(SupplierInfo(
                supplier_id=supplier.id,
                supplier_name=supplier.name,
                supplier_type=supplier.supplier_type.value,
                unit_cost=float(sp.unit_cost),
                lead_time_days=sp.lead_time_days,
                supply_capacity=float(sp.supply_capacity) if sp.supply_capacity else None,
                minimum_order_quantity=float(sp.minimum_order_quantity),
                rating=float(supplier.rating),
                quality_rating=float(supplier.quality_rating),
                on_time_delivery_rate=float(supplier.on_time_delivery_rate),
                is_preferred=sp.is_preferred,
                last_supply_date=sp.last_supply_date.isoformat() if sp.last_supply_date else None,
                phone=supplier.phone,
                email=supplier.email
            ))
    
    return suppliers_info
