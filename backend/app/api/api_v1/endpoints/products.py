"""
Product management endpoints for GoShopGhana
Ghana market focused with quantified sales support
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductFilter, ProductListResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse, GhanaProductSuggestion,
    ProductShopResponse, ProductShopListResponse
)
from app.crud.product import (
    get_products, get_product_by_id, create_product, update_product, delete_product,
    get_categories, get_category_by_id, create_category, update_category, delete_category,
    get_products_by_seller, search_products, get_product_statistics
)
from app.models.warehouse import WarehouseInventory
from app.core.deps import get_current_active_user, get_current_seller, get_current_admin
from app.models.user import User
from app.models.product import Product
import math

router = APIRouter()


@router.get("/", response_model=ProductListResponse)
async def get_products_list(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price in GHS"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price in GHS"),
    unit_type: Optional[str] = Query(None, description="Filter by unit type"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    seller_id: Optional[str] = Query(None, description="Filter by seller"),
    created_by_type: Optional[str] = Query(None, description="Filter by creator type: 'admin' or 'supplier'"),
    in_warehouse: Optional[bool] = Query(None, description="Filter by warehouse status"),
    db: Session = Depends(get_db)
):
    """
    Get all products with filtering, search and pagination
    Supports Ghana market specific filtering
    """
    # Create filter object
    filters = ProductFilter(
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        unit_type=unit_type,
        search=search,
        seller_id=seller_id,
        created_by_type=created_by_type,
        in_warehouse=in_warehouse
    )
    
    # Calculate offset
    skip = (page - 1) * per_page
    
    # Get products
    products, total = get_products(db, skip=skip, limit=per_page, filters=filters)
    
    # Calculate pagination info
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return ProductListResponse(
        products=[ProductResponse.from_orm(product) for product in products],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/shop", response_model=ProductShopListResponse)
async def get_products_for_shop(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name"),
    db: Session = Depends(get_db)
):
    """
    Lightweight endpoint for shop/mobile - returns minimal product data
    Excludes heavy fields like images array, descriptions, etc.
    """
    # Create filter object (only essential filters)
    filters = ProductFilter(
        category_id=category_id,
        search=search
    )
    
    # Calculate offset
    skip = (page - 1) * per_page
    
    # Get products
    products, total = get_products(db, skip=skip, limit=per_page, filters=filters)
    
    # Calculate pagination info
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    # Convert to lightweight response
    shop_products = []
    for product in products:
        shop_products.append(ProductShopResponse(
            id=product.id,
            name=product.name,
            price_per_unit=product.price_per_unit,
            unit_type=product.unit_type,
            stock_quantity=product.stock_quantity,
            category_id=product.category_id,
            is_active=product.is_active,
            primary_image_url=product.images[0] if product.images and len(product.images) > 0 else None
        ))
    
    return ProductShopListResponse(
        products=shop_products,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.post("/", response_model=ProductResponse)
async def create_new_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    """
    Create a new product (sellers and admins only)
    Supports Ghana market quantified sales
    """
    from app.utils.audit_logger import log_product_created
    
    # Validate category exists if provided
    if product.category_id:
        category = get_category_by_id(db, product.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found"
            )
    
    # Create product
    db_product = create_product(db, product, current_user.id)
    
    # Log product creation
    log_product_created(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        product_id=db_product.id,
        product_name=db_product.name
    )
    
    return ProductResponse.from_orm(db_product)


@router.get("/search")
async def search_products_endpoint(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """
    Search products by name or description
    """
    products = search_products(db, q, limit)
    return [ProductResponse.from_orm(product) for product in products]


@router.get("/my-products", response_model=List[ProductResponse])
async def get_my_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    """
    Get current seller's products
    """
    products = get_products_by_seller(db, current_user.id, skip, limit)
    return [ProductResponse.from_orm(product) for product in products]


@router.get("/statistics")
async def get_product_stats(
    current_user: User = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    """
    Get product statistics for current seller
    """
    stats = get_product_statistics(db, current_user.id)
    return stats


@router.get("/suggestions")
async def get_ghana_product_suggestions():
    """
    Get common Ghana market product suggestions
    """
    return {
        "suggestions": GhanaProductSuggestion.get_common_products(),
        "message": "Common products for Ghana market with suggested pricing in GHS"
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_details(
    product_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific product by ID
    """
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return ProductResponse.from_orm(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product_details(
    product_id: str,
    product_update: ProductUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a product (owner or admin only)
    """
    from app.utils.audit_logger import log_product_updated
    
    user_type = current_user.user_type.value if hasattr(current_user.user_type, 'value') else current_user.user_type
    is_admin = user_type == "admin"
    
    # Get original product for comparison
    original_product = get_product_by_id(db, product_id)
    if not original_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Validate category exists if being updated
    if product_update.category_id:
        category = get_category_by_id(db, product_update.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found"
            )
    
    # Track changes
    changes = {}
    update_data = product_update.dict(exclude_unset=True)
    for field, new_value in update_data.items():
        old_value = getattr(original_product, field, None)
        if old_value != new_value:
            changes[field] = {
                "old": str(old_value) if old_value is not None else None,
                "new": str(new_value) if new_value is not None else None
            }
    
    updated_product = update_product(db, product_id, product_update, current_user.id, is_admin)
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't have permission to update it"
        )
    
    # Log the update
    if changes:
        log_product_updated(
            db=db,
            user_id=current_user.id,
            user_email=current_user.email,
            product_id=updated_product.id,
            product_name=updated_product.name,
            changes=changes
        )
    
    return ProductResponse.from_orm(updated_product)


@router.delete("/{product_id}")
async def delete_product_endpoint(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a product (owner or admin only)
    """
    from app.utils.audit_logger import log_product_deleted
    
    user_type = current_user.user_type.value if hasattr(current_user.user_type, 'value') else current_user.user_type
    is_admin = user_type == "admin"
    
    # Get product details before deletion
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product_name = product.name
    
    deleted_product = delete_product(db, product_id, current_user.id, is_admin)
    if not deleted_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't have permission to delete it"
        )
    
    # Log product deletion
    log_product_deleted(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        product_id=product_id,
        product_name=product_name
    )
    
    return {"message": "Product deleted successfully"}


# Category endpoints
@router.get("/categories/", response_model=List[CategoryResponse])
async def get_categories_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all product categories with product counts (only published products)
    """
    categories = get_categories(db, skip, limit)
    
    # Add product count for each category (only active, published products with stock)
    result = []
    for category in categories:
        category_dict = CategoryResponse.from_orm(category).dict()
        
        # Count published products in this category
        product_count = db.query(Product).filter(
            Product.category_id == category.id,
            Product.is_active == True,
            Product.is_published == True,
            Product.stock_quantity > 0
        ).count()
        
        category_dict['product_count'] = product_count
        result.append(category_dict)
    
    return result


@router.post("/categories/", response_model=CategoryResponse)
async def create_new_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new category (admin only)
    """
    # Validate parent category exists if provided
    if category.parent_id:
        parent = get_category_by_id(db, category.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found"
            )
    
    db_category = create_category(db, category)
    return CategoryResponse.from_orm(db_category)


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category_details(
    category_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific category by ID
    """
    category = get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return CategoryResponse.from_orm(category)


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category_details(
    category_id: str,
    category_update: CategoryUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update a category (admin only)
    """
    updated_category = update_category(db, category_id, category_update)
    if not updated_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return CategoryResponse.from_orm(updated_category)


@router.delete("/categories/{category_id}")
async def delete_category_endpoint(
    category_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a category (admin only)
    """
    deleted_category = delete_category(db, category_id)
    if not deleted_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return {"message": "Category deleted successfully"}


# Warehouse integration endpoints
@router.get("/{product_id}/warehouse-stock")
async def get_product_warehouse_stock(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get warehouse stock information for a product
    """
    # Check if product exists
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get warehouse inventory
    warehouse_inv = db.query(WarehouseInventory).filter(
        WarehouseInventory.product_id == product_id
    ).first()
    
    if not warehouse_inv:
        return {
            "product_id": product_id,
            "has_warehouse_record": False,
            "quantity_available": 0,
            "quantity_reserved": 0,
            "quantity_total": 0
        }
    
    return {
        "product_id": product_id,
        "has_warehouse_record": True,
        "quantity_available": float(warehouse_inv.quantity_available),
        "quantity_reserved": float(warehouse_inv.quantity_reserved),
        "quantity_total": float(warehouse_inv.quantity_available + warehouse_inv.quantity_reserved),
        "warehouse_location_id": warehouse_inv.warehouse_location_id,
        "is_perishable": warehouse_inv.is_perishable,
        "expiry_date": warehouse_inv.expiry_date.isoformat() if warehouse_inv.expiry_date else None,
        "batch_number": warehouse_inv.batch_number
    }


@router.post("/{product_id}/publish")
async def publish_product_to_shop(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Publish product to shop (make visible to customers)
    Admin only
    """
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product.is_published = True
    db.commit()
    
    return {
        "message": "Product published to shop successfully",
        "product_id": product_id,
        "is_published": True
    }


@router.post("/{product_id}/unpublish")
async def unpublish_product_from_shop(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Unpublish product from shop (hide from customers)
    Admin only
    """
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product.is_published = False
    db.commit()
    
    return {
        "message": "Product unpublished from shop successfully",
        "product_id": product_id,
        "is_published": False
    }
