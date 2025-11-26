"""
Product CRUD operations for GoShopGhana
Ghana market focused with quantified sales support
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.models.product import Product, Category, UnitType
from app.models.warehouse import WarehouseInventory
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate, ProductFilter
from app.utils.image_upload import process_product_images

def get_product_by_id(db: Session, product_id: str) -> Optional[Product]:
    """Get product by ID"""
    return db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()

def get_products(
    db: Session, 
    skip: int = 0, 
    limit: int = 20,
    filters: Optional[ProductFilter] = None,
    for_shop: bool = True
) -> tuple[List[Product], int]:
    """Get products with filtering and pagination
    
    Args:
        for_shop: If True, only returns active and published products (default for public shop)
    """
    query = db.query(Product)
    
    # For shop view: ALWAYS filter by active and published, regardless of other filters
    if for_shop:
        query = query.filter(Product.is_active == True, Product.is_published == True)
    
    # Apply additional filters
    if filters:
        if filters.category_id:
            query = query.filter(Product.category_id == filters.category_id)
        
        if filters.min_price:
            query = query.filter(Product.price_per_unit >= filters.min_price)
        
        if filters.max_price:
            query = query.filter(Product.price_per_unit <= filters.max_price)
        
        if filters.unit_type:
            query = query.filter(Product.unit_type == filters.unit_type)
        
        if filters.seller_id:
            query = query.filter(Product.seller_id == filters.seller_id)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )
        
        # Only apply these filters if NOT for_shop (admin/seller views)
        if not for_shop:
            if filters.is_active is not None:
                query = query.filter(Product.is_active == filters.is_active)
            
            if filters.is_published is not None:
                query = query.filter(Product.is_published == filters.is_published)
        
        if filters.created_by_type:
            query = query.filter(Product.created_by_type == filters.created_by_type)
        
        if filters.in_warehouse is not None:
            query = query.filter(Product.in_warehouse == filters.in_warehouse)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
    
    return products, total

def get_products_by_seller(db: Session, seller_id: str, skip: int = 0, limit: int = 20) -> List[Product]:
    """Get all products by a specific seller"""
    return db.query(Product).filter(
        Product.seller_id == seller_id
    ).order_by(desc(Product.created_at)).offset(skip).limit(limit).all()

def create_product(db: Session, product: ProductCreate, seller_id: str, 
                   created_by_type: str = 'admin') -> Product:
    """Create a new product - handles both admin and supplier creation"""
    # Create product first to get ID
    db_product = Product(
        seller_id=seller_id,
        name=product.name,
        description=product.description,
        category_id=product.category_id,
        price_per_unit=product.price_per_unit,
        unit_type=product.unit_type,
        price_per_quantity=product.price_per_quantity,
        minimum_quantity=product.minimum_quantity,
        stock_quantity=product.stock_quantity,
        images=[],  # Temporarily empty, will process below
        supplier_id=product.supplier_id,
        cost_price=product.cost_price,
        is_perishable=product.is_perishable,
        shelf_life_days=product.shelf_life_days,
        created_by_type=created_by_type,
        in_warehouse=created_by_type == 'admin',  # Admin products go straight to warehouse
        is_published=product.is_published if product.is_published is not None else (created_by_type == 'admin')
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Process images: upload base64 to Spaces, convert to CDN URLs
    if product.images:
        db_product.images = process_product_images(product.images, str(db_product.id))
        db.commit()
        db.refresh(db_product)
    
    # Only auto-create warehouse inventory for admin products
    # Supplier products get warehouse inventory when GRN is approved
    if created_by_type == 'admin':
        warehouse_inventory = WarehouseInventory(
            product_id=db_product.id,
            quantity_available=product.stock_quantity or 0,
            quantity_reserved=0,
            quantity_damaged=0,
            supplier_id=product.supplier_id,
            cost_price=product.cost_price,
            is_perishable=product.is_perishable or False
        )
        
        db.add(warehouse_inventory)
        db.commit()
    
    return db_product

def update_product(db: Session, product_id: str, product_update: ProductUpdate, user_id: str, is_admin: bool = False) -> Optional[Product]:
    """Update a product (only by owner or admin)"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        return None
    
    # Check permissions
    if not is_admin and db_product.seller_id != user_id:
        return None
    
    # Update fields
    update_data = product_update.dict(exclude_unset=True)
    
    # Process images if being updated
    if 'images' in update_data and update_data['images']:
        update_data['images'] = process_product_images(update_data['images'], product_id)
    
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: str, user_id: str, is_admin: bool = False) -> Optional[Product]:
    """Soft delete a product (only by owner or admin)"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        return None
    
    # Check permissions
    if not is_admin and db_product.seller_id != user_id:
        return None
    
    # Soft delete
    db_product.is_active = False
    db.commit()
    db.refresh(db_product)
    return db_product

def search_products(db: Session, search_term: str, limit: int = 20) -> List[Product]:
    """Search products by name or description"""
    search_pattern = f"%{search_term}%"
    return db.query(Product).filter(
        and_(
            Product.is_active == True,
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern)
            )
        )
    ).order_by(desc(Product.created_at)).limit(limit).all()

# Category CRUD operations
def get_category_by_id(db: Session, category_id: str) -> Optional[Category]:
    """Get category by ID"""
    return db.query(Category).filter(Category.id == category_id, Category.is_active == True).first()

def get_categories(db: Session, skip: int = 0, limit: int = 50) -> List[Category]:
    """Get all active categories"""
    return db.query(Category).filter(
        Category.is_active == True
    ).order_by(Category.name).offset(skip).limit(limit).all()

def get_categories_by_parent(db: Session, parent_id: Optional[str] = None) -> List[Category]:
    """Get categories by parent (None for root categories)"""
    return db.query(Category).filter(
        Category.parent_id == parent_id,
        Category.is_active == True
    ).order_by(Category.name).all()

def create_category(db: Session, category: CategoryCreate) -> Category:
    """Create a new category"""
    db_category = Category(
        name=category.name,
        description=category.description,
        parent_id=category.parent_id
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: str, category_update: CategoryUpdate) -> Optional[Category]:
    """Update a category (admin only)"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    
    if not db_category:
        return None
    
    # Update fields
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: str) -> Optional[Category]:
    """Soft delete a category (admin only)"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    
    if not db_category:
        return None
    
    # Check if category has products
    products_count = db.query(Product).filter(Product.category_id == category_id).count()
    if products_count > 0:
        # Don't delete categories with products, just deactivate
        db_category.is_active = False
    else:
        # Safe to delete
        db.delete(db_category)
    
    db.commit()
    return db_category

def get_product_statistics(db: Session, seller_id: Optional[str] = None) -> dict:
    """Get product statistics"""
    query = db.query(Product)
    
    if seller_id:
        query = query.filter(Product.seller_id == seller_id)
    
    total_products = query.count()
    active_products = query.filter(Product.is_active == True).count()
    inactive_products = total_products - active_products
    
    # Get products by unit type
    unit_stats = {}
    for unit_type in UnitType:
        count = query.filter(Product.unit_type == unit_type).count()
        unit_stats[unit_type.value] = count
    
    return {
        "total_products": total_products,
        "active_products": active_products,
        "inactive_products": inactive_products,
        "by_unit_type": unit_stats
    }
