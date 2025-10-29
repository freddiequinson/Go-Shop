"""
Supplier management endpoints for GoShopGhana Admin
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import math

from app.db.database import get_db
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierResponse, SupplierListResponse,
    SupplierProductCreate, SupplierProductUpdate, SupplierProductResponse,
    SupplierPerformance, SupplierFilter
)
from app.crud.supplier import (
    create_supplier, get_supplier_by_id, get_suppliers, update_supplier,
    delete_supplier, verify_supplier, create_supplier_product,
    get_supplier_products, get_product_suppliers, update_supplier_product,
    set_preferred_supplier, get_supplier_performance, search_suppliers,
    get_top_suppliers
)
from app.core.deps import get_current_admin
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_new_supplier(
    supplier: SupplierCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new supplier (Admin only)
    """
    db_supplier = create_supplier(db, supplier)
    return SupplierResponse.model_validate(db_supplier)


@router.get("/", response_model=SupplierListResponse)
async def list_suppliers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    supplier_type: str = Query(None),
    verification_status: str = Query(None),
    is_active: bool = Query(None),
    search: str = Query(None),
    min_rating: float = Query(None),
    location: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all suppliers with filtering (Admin only)
    """
    filters = SupplierFilter(
        supplier_type=supplier_type,
        verification_status=verification_status,
        is_active=is_active,
        search=search,
        min_rating=min_rating,
        location=location
    )
    
    skip = (page - 1) * per_page
    suppliers, total = get_suppliers(db, skip=skip, limit=per_page, filters=filters)
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return SupplierListResponse(
        suppliers=[SupplierResponse.model_validate(s) for s in suppliers],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/search")
async def search_suppliers_endpoint(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Search suppliers by name, code, or contact (Admin only)
    """
    suppliers = search_suppliers(db, q, limit)
    return [SupplierResponse.model_validate(s) for s in suppliers]


@router.get("/top")
async def get_top_suppliers_endpoint(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get top performing suppliers (Admin only)
    """
    suppliers = get_top_suppliers(db, limit)
    return [SupplierResponse.model_validate(s) for s in suppliers]


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get supplier by ID (Admin only)
    """
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return SupplierResponse.model_validate(supplier)


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier_endpoint(
    supplier_id: str,
    supplier_update: SupplierUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update supplier (Admin only)
    """
    supplier = update_supplier(db, supplier_id, supplier_update)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return SupplierResponse.model_validate(supplier)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete (deactivate) supplier (Admin only)
    """
    success = delete_supplier(db, supplier_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return None


@router.post("/{supplier_id}/verify", response_model=SupplierResponse)
async def verify_supplier_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verify a supplier (Admin only)
    """
    supplier = verify_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return SupplierResponse.model_validate(supplier)


@router.get("/{supplier_id}/performance", response_model=SupplierPerformance)
async def get_supplier_performance_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get supplier performance metrics (Admin only)
    """
    performance = get_supplier_performance(db, supplier_id)
    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return performance


# Supplier Products endpoints
@router.post("/{supplier_id}/products", response_model=SupplierProductResponse, status_code=status.HTTP_201_CREATED)
async def link_product_to_supplier(
    supplier_id: str,
    supplier_product: SupplierProductCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Link a product to a supplier (Admin only)
    """
    # Verify supplier exists
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    db_supplier_product = create_supplier_product(db, supplier_id, supplier_product)
    return SupplierProductResponse.model_validate(db_supplier_product)


@router.get("/{supplier_id}/products", response_model=List[SupplierProductResponse])
async def get_supplier_products_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all products from a supplier (Admin only)
    """
    supplier_products = get_supplier_products(db, supplier_id)
    return [SupplierProductResponse.model_validate(sp) for sp in supplier_products]


@router.put("/products/{supplier_product_id}", response_model=SupplierProductResponse)
async def update_supplier_product_endpoint(
    supplier_product_id: str,
    update_data: SupplierProductUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update supplier product link (Admin only)
    """
    supplier_product = update_supplier_product(db, supplier_product_id, update_data)
    if not supplier_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier product link not found"
        )
    return SupplierProductResponse.model_validate(supplier_product)


@router.post("/products/{product_id}/set-preferred/{supplier_id}")
async def set_preferred_supplier_endpoint(
    product_id: str,
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Set preferred supplier for a product (Admin only)
    """
    success = set_preferred_supplier(db, product_id, supplier_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to set preferred supplier"
        )
    return {"message": "Preferred supplier set successfully"}


@router.get("/products/{product_id}/suppliers", response_model=List[SupplierProductResponse])
async def get_product_suppliers_endpoint(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all suppliers for a product (Admin only)
    """
    suppliers = get_product_suppliers(db, product_id)
    return [SupplierProductResponse.model_validate(sp) for sp in suppliers]
