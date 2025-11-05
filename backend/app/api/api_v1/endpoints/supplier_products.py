"""
API endpoints for Supplier Product Catalog Management
Allows suppliers to create and manage their own products
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserType
from app.models.supplier import Supplier
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.crud import product as product_crud


router = APIRouter()


def get_current_supplier(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> tuple[Supplier, User]:
    """Get current supplier and user from authenticated user"""
    if current_user.user_type != UserType.SUPPLIER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only suppliers can access this endpoint"
        )
    
    # Get supplier linked to this user by email or phone
    supplier = db.query(Supplier).filter(
        or_(
            Supplier.email == current_user.email,
            Supplier.phone == current_user.phone
        )
    ).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found for this user"
        )
    
    return supplier, current_user


@router.get("/products", response_model=List[ProductResponse])
def get_supplier_products(
    skip: int = 0,
    limit: int = 100,
    in_warehouse: Optional[bool] = None,
    db: Session = Depends(get_db),
    supplier_user: tuple[Supplier, User] = Depends(get_current_supplier)
):
    """
    Get all products in supplier's catalog
    Filter by in_warehouse status if provided
    """
    supplier, user = supplier_user
    
    query = db.query(Product).filter(
        Product.supplier_id == supplier.id,
        Product.created_by_type == 'supplier'
    )
    
    if in_warehouse is not None:
        query = query.filter(Product.in_warehouse == in_warehouse)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.post("/products", response_model=ProductResponse)
def create_supplier_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    supplier_user: tuple[Supplier, User] = Depends(get_current_supplier)
):
    """
    Create a new product in supplier's catalog
    Product will NOT be published to shop until admin approves
    """
    supplier, user = supplier_user
    
    # Override certain fields for supplier products
    product_data.supplier_id = supplier.id
    product_data.is_published = False  # Not visible in shop yet
    
    # Create product with supplier type
    product = product_crud.create_product(
        db, 
        product_data, 
        user.id,  # seller_id
        created_by_type='supplier'
    )
    
    return product


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_supplier_product(
    product_id: str,
    db: Session = Depends(get_db),
    supplier_user: tuple[Supplier, User] = Depends(get_current_supplier)
):
    """
    Get a specific product from supplier's catalog
    """
    supplier, user = supplier_user
    
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.supplier_id == supplier.id,
        Product.created_by_type == 'supplier'
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't have permission to access it"
        )
    
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_supplier_product(
    product_id: str,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    supplier_user: tuple[Supplier, User] = Depends(get_current_supplier)
):
    """
    Update a product in supplier's catalog
    """
    supplier, user = supplier_user
    
    # Check if product belongs to this supplier
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.supplier_id == supplier.id,
        Product.created_by_type == 'supplier'
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't have permission to update it"
        )
    
    # Update product
    updated_product = product_crud.update_product(
        db, 
        product_id, 
        product_data, 
        user.id, 
        is_admin=False
    )
    
    return updated_product


@router.delete("/products/{product_id}")
def delete_supplier_product(
    product_id: str,
    db: Session = Depends(get_db),
    supplier_user: tuple[Supplier, User] = Depends(get_current_supplier)
):
    """
    Delete a product from supplier's catalog
    Can only delete if not in warehouse or published
    """
    supplier, user = supplier_user
    
    # Check if product belongs to this supplier
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.supplier_id == supplier.id,
        Product.created_by_type == 'supplier'
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't have permission to delete it"
        )
    
    # Prevent deletion if product is in warehouse or published
    if product.in_warehouse or product.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product that is in warehouse or published"
        )
    
    # Soft delete product
    product_crud.delete_product(db, product_id, user.id, is_admin=False)
    
    return {"message": "Product deleted successfully"}


@router.put("/products/{product_id}/stock")
def update_product_stock(
    product_id: str,
    stock_quantity: float,
    reason: str = Query(None),
    action: str = Query("add"),
    db: Session = Depends(get_db),
    supplier_user: tuple[Supplier, User] = Depends(get_current_supplier)
):
    """
    Update stock quantity for catalog product and record inventory movement
    """
    from app.models.warehouse import InventoryMovement, MovementType
    import uuid
    
    supplier, user = supplier_user
    
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.supplier_id == supplier.id,
        Product.created_by_type == 'supplier'
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Calculate the quantity change
    from decimal import Decimal
    old_stock = product.stock_quantity or Decimal('0')
    stock_quantity_decimal = Decimal(str(stock_quantity))
    quantity_change = abs(stock_quantity_decimal - old_stock)
    
    # Update product stock
    product.stock_quantity = stock_quantity_decimal
    
    # Record inventory movement
    movement_type = MovementType.IN if action == 'add' else MovementType.ADJUSTMENT
    
    movement = InventoryMovement(
        id=str(uuid.uuid4()),
        product_id=product_id,
        movement_type=movement_type,
        quantity=quantity_change,
        from_location="Supplier" if action == 'reduce' else None,
        to_location="Supplier" if action == 'add' else None,
        reference_type="supplier_stock_update",
        reference_id=product_id,
        reason=reason or f"Stock {action} by supplier",
        notes=f"Stock updated from {old_stock} to {stock_quantity}",
        performed_by=user.id
    )
    
    db.add(movement)
    db.commit()
    db.refresh(product)
    
    return {
        "message": "Stock updated successfully",
        "product_id": product_id,
        "old_stock": float(old_stock),
        "new_stock": float(stock_quantity),
        "quantity_change": float(quantity_change),
        "action": action,
        "reason": reason
    }
