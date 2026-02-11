"""
Package API endpoints for GoShopGhana
Handles seasonal events and promotional packages
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import math

from app.db.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.package import SeasonalEvent, Package, PackageItem
from app.core.deps import get_current_user, get_current_admin
from app.crud.package import (
    create_seasonal_event, get_seasonal_event, get_seasonal_events,
    get_active_seasonal_events, update_seasonal_event, delete_seasonal_event,
    create_package, get_package, get_packages, get_packages_for_event,
    update_package, delete_package,
    add_package_item, update_package_item, remove_package_item,
    get_package_items, update_package_original_value, get_package_with_product_details
)
from app.schemas.package import (
    SeasonalEventCreate, SeasonalEventUpdate, SeasonalEventResponse, SeasonalEventListResponse,
    PackageCreate, PackageUpdate, PackageResponse, PackageListResponse, PackageDetailResponse,
    PackageItemCreate, PackageItemUpdate, PackageItemResponse,
    ActiveSeasonalEventResponse, AddPackageToCartRequest
)
router = APIRouter()


# ============== Public Endpoints ==============

@router.get("/active", response_model=List[ActiveSeasonalEventResponse])
async def get_active_events(db: Session = Depends(get_db)):
    """
    Get all currently active seasonal events with their packages.
    Used for displaying on landing page and shop page.
    """
    events = get_active_seasonal_events(db)
    
    result = []
    for event in events:
        # Get active packages for this event
        packages = get_packages_for_event(db, event.id, active_only=True)
        
        package_list = []
        for pkg in packages:
            items_count = len(pkg.items) if pkg.items else 0
            savings = None
            if pkg.original_value and pkg.package_price:
                savings = pkg.original_value - pkg.package_price
            
            package_list.append(PackageListResponse(
                id=pkg.id,
                name=pkg.name,
                description=pkg.description,
                image_url=pkg.image_url,
                package_price=pkg.package_price,
                original_value=pkg.original_value,
                savings=savings,
                items_count=items_count,
                is_active=pkg.is_active,
                is_featured=pkg.is_featured,
                show_savings=pkg.show_savings if hasattr(pkg, 'show_savings') else True,
                image_shape=pkg.image_shape if hasattr(pkg, 'image_shape') else "heart",
                display_order=pkg.display_order
            ))
        
        result.append(ActiveSeasonalEventResponse(
            id=event.id,
            name=event.name,
            description=event.description,
            color_code=event.color_code,
            promo_image_url=event.promo_image_url,
            lottie_animation=event.lottie_animation,
            show_popup=event.show_popup,
            packages=package_list
        ))
    
    return result


@router.get("/package/{package_id}", response_model=PackageDetailResponse)
async def get_package_details(
    package_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed package information including all items with product details.
    Used for package detail view and add to cart.
    """
    result = get_package_with_product_details(db, package_id)
    if not result:
        raise HTTPException(status_code=404, detail="Package not found")
    
    pkg = result["package"]
    event = pkg.seasonal_event
    
    if not pkg.is_active:
        raise HTTPException(status_code=404, detail="Package is not available")
    
    savings = None
    if pkg.original_value and pkg.package_price:
        savings = pkg.original_value - pkg.package_price
    
    return PackageDetailResponse(
        id=pkg.id,
        name=pkg.name,
        description=pkg.description,
        image_url=pkg.image_url,
        package_price=pkg.package_price,
        original_value=pkg.original_value,
        savings=savings,
        stock_quantity=pkg.stock_quantity,
        is_active=pkg.is_active,
        items=[PackageItemResponse(**item) for item in result["items"]],
        event_name=event.name if event else "",
        event_color=event.color_code if event else "#000000",
        event_end_date=event.end_date if event else datetime.now(timezone.utc)
    )


@router.post("/package/{package_id}/add-to-cart")
async def add_package_to_cart(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a package to the user's cart as a single item.
    The package is added with its package price, not the sum of individual products.
    """
    from app.models.cart import Cart, CartItem
    from decimal import Decimal
    
    # Get the package with details
    result = get_package_with_product_details(db, package_id)
    if not result:
        raise HTTPException(status_code=404, detail="Package not found")
    
    pkg = result["package"]
    
    if not pkg.is_active:
        raise HTTPException(status_code=400, detail="Package is not available")
    
    # Check stock if applicable
    if pkg.stock_quantity is not None and pkg.stock_quantity <= 0:
        raise HTTPException(status_code=400, detail="Package is out of stock")
    
    # Get or create user's cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.flush()
    
    # Check if package already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.package_id == package_id
    ).first()
    
    if existing_item:
        # Increment quantity
        existing_item.quantity = existing_item.quantity + 1
        existing_item.line_total_cedis = existing_item.price_per_unit_cedis * existing_item.quantity
        db.commit()
        return {
            "message": "Package quantity updated in cart",
            "cart_item_id": existing_item.id,
            "quantity": float(existing_item.quantity),
            "package_name": pkg.name,
            "package_price": float(pkg.package_price),
            "line_total": float(existing_item.line_total_cedis) / 100
        }
    
    # Create new cart item for the package
    # Price is stored in cedis (multiply by 100)
    price_cedis = int(Decimal(str(pkg.package_price)) * 100)
    
    cart_item = CartItem(
        cart_id=cart.id,
        product_id=None,  # No product, it's a package
        package_id=package_id,
        item_type="package",
        item_name=pkg.name,
        quantity=1,
        price_per_unit_cedis=price_cedis,
        line_total_cedis=price_cedis
    )
    
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    
    return {
        "message": "Package added to cart",
        "cart_item_id": cart_item.id,
        "quantity": 1,
        "package_name": pkg.name,
        "package_price": float(pkg.package_price),
        "line_total": float(pkg.package_price),
        "items_included": len(result["items"])
    }


# ============== Admin Endpoints - Seasonal Events ==============

@router.get("/admin/events", response_model=List[SeasonalEventListResponse])
async def admin_list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: List all seasonal events with pagination.
    """
    events, total = get_seasonal_events(db, skip=skip, limit=limit, active_only=active_only)
    now = datetime.now(timezone.utc)
    
    result = []
    for event in events:
        is_current = event.start_date <= now <= event.end_date
        packages_count = len(event.packages) if event.packages else 0
        
        result.append(SeasonalEventListResponse(
            id=event.id,
            name=event.name,
            description=event.description,
            color_code=event.color_code,
            promo_image_url=event.promo_image_url,
            lottie_animation=event.lottie_animation,
            start_date=event.start_date,
            end_date=event.end_date,
            show_popup=event.show_popup,
            is_active=event.is_active,
            is_current=is_current,
            packages_count=packages_count
        ))
    
    return result


@router.post("/admin/events", response_model=SeasonalEventResponse)
async def admin_create_event(
    event: SeasonalEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Create a new seasonal event.
    """
    db_event = create_seasonal_event(db, event, created_by=current_user.id)
    
    now = datetime.now(timezone.utc)
    is_current = db_event.start_date <= now <= db_event.end_date
    
    return SeasonalEventResponse(
        id=db_event.id,
        name=db_event.name,
        description=db_event.description,
        color_code=db_event.color_code,
        promo_image_url=db_event.promo_image_url,
        lottie_animation=db_event.lottie_animation,
        start_date=db_event.start_date,
        end_date=db_event.end_date,
        show_popup=db_event.show_popup,
        is_active=db_event.is_active,
        created_at=db_event.created_at,
        updated_at=db_event.updated_at,
        created_by=db_event.created_by,
        packages=[],
        is_current=is_current,
        packages_count=0
    )


@router.get("/admin/events/{event_id}", response_model=SeasonalEventResponse)
async def admin_get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Get a specific seasonal event with all packages.
    """
    event = get_seasonal_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    now = datetime.now(timezone.utc)
    is_current = event.start_date <= now <= event.end_date
    
    package_list = []
    for pkg in event.packages:
        items_count = len(pkg.items) if pkg.items else 0
        savings = None
        if pkg.original_value and pkg.package_price:
            savings = pkg.original_value - pkg.package_price
        
        package_list.append(PackageListResponse(
            id=pkg.id,
            name=pkg.name,
            description=pkg.description,
            image_url=pkg.image_url,
            package_price=pkg.package_price,
            original_value=pkg.original_value,
            savings=savings,
            items_count=items_count,
            is_active=pkg.is_active,
            is_featured=pkg.is_featured,
            display_order=pkg.display_order
        ))
    
    return SeasonalEventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        color_code=event.color_code,
        promo_image_url=event.promo_image_url,
        lottie_animation=event.lottie_animation,
        start_date=event.start_date,
        end_date=event.end_date,
        show_popup=event.show_popup,
        is_active=event.is_active,
        created_at=event.created_at,
        updated_at=event.updated_at,
        created_by=event.created_by,
        packages=package_list,
        is_current=is_current,
        packages_count=len(package_list)
    )


@router.put("/admin/events/{event_id}", response_model=SeasonalEventResponse)
async def admin_update_event(
    event_id: str,
    event_update: SeasonalEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Update a seasonal event.
    """
    updated = update_seasonal_event(db, event_id, event_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return await admin_get_event(event_id, db, current_user)


@router.delete("/admin/events/{event_id}")
async def admin_delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Delete a seasonal event and all its packages.
    """
    success = delete_seasonal_event(db, event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event deleted successfully"}


# ============== Admin Endpoints - Packages ==============

@router.get("/admin/packages", response_model=List[PackageResponse])
async def admin_list_packages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    event_id: Optional[str] = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: List all packages with optional filtering.
    """
    packages, total = get_packages(
        db, skip=skip, limit=limit,
        event_id=event_id, active_only=active_only
    )
    
    result = []
    for pkg in packages:
        items_count = len(pkg.items) if pkg.items else 0
        savings = None
        if pkg.original_value and pkg.package_price:
            savings = pkg.original_value - pkg.package_price
        
        # Get items with product details
        items_response = []
        for item in pkg.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            items_response.append(PackageItemResponse(
                id=item.id,
                package_id=item.package_id,
                product_id=item.product_id,
                quantity=item.quantity,
                created_at=item.created_at,
                product_name=product.name if product else None,
                product_image=product.images[0] if product and product.images else None,
                product_price=product.price_per_unit if product else None,
                product_unit=product.unit_type.value if product and product.unit_type else None
            ))
        
        result.append(PackageResponse(
            id=pkg.id,
            event_id=pkg.event_id,
            name=pkg.name,
            description=pkg.description,
            image_url=pkg.image_url,
            package_price=pkg.package_price,
            original_value=pkg.original_value,
            stock_quantity=pkg.stock_quantity,
            display_order=pkg.display_order,
            is_active=pkg.is_active,
            is_featured=pkg.is_featured,
            created_at=pkg.created_at,
            updated_at=pkg.updated_at,
            items=items_response,
            savings=savings,
            items_count=items_count
        ))
    
    return result


@router.post("/admin/packages", response_model=PackageResponse)
async def admin_create_package(
    package: PackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Create a new package with items.
    """
    # Verify event exists
    event = get_seasonal_event(db, package.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Seasonal event not found")
    
    # Verify all products exist
    if package.items:
        for item in package.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(
                    status_code=400,
                    detail=f"Product {item.product_id} not found"
                )
    
    db_package = create_package(db, package)
    
    # Calculate and update original value
    update_package_original_value(db, db_package.id)
    db.refresh(db_package)
    
    # Build response
    items_count = len(db_package.items) if db_package.items else 0
    savings = None
    if db_package.original_value and db_package.package_price:
        savings = db_package.original_value - db_package.package_price
    
    items_response = []
    for item in db_package.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items_response.append(PackageItemResponse(
            id=item.id,
            package_id=item.package_id,
            product_id=item.product_id,
            quantity=item.quantity,
            created_at=item.created_at,
            product_name=product.name if product else None,
            product_image=product.images[0] if product and product.images else None,
            product_price=product.price_per_unit if product else None,
            product_unit=product.unit_type.value if product and product.unit_type else None
        ))
    
    return PackageResponse(
        id=db_package.id,
        event_id=db_package.event_id,
        name=db_package.name,
        description=db_package.description,
        image_url=db_package.image_url,
        package_price=db_package.package_price,
        original_value=db_package.original_value,
        stock_quantity=db_package.stock_quantity,
        display_order=db_package.display_order,
        is_active=db_package.is_active,
        is_featured=db_package.is_featured,
        created_at=db_package.created_at,
        updated_at=db_package.updated_at,
        items=items_response,
        savings=savings,
        items_count=items_count
    )


@router.get("/admin/packages/{package_id}", response_model=PackageResponse)
async def admin_get_package(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Get a specific package with all items.
    """
    pkg = get_package(db, package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    
    items_count = len(pkg.items) if pkg.items else 0
    savings = None
    if pkg.original_value and pkg.package_price:
        savings = pkg.original_value - pkg.package_price
    
    items_response = []
    for item in pkg.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items_response.append(PackageItemResponse(
            id=item.id,
            package_id=item.package_id,
            product_id=item.product_id,
            quantity=item.quantity,
            created_at=item.created_at,
            product_name=product.name if product else None,
            product_image=product.images[0] if product and product.images else None,
            product_price=product.price_per_unit if product else None,
            product_unit=product.unit_type.value if product and product.unit_type else None
        ))
    
    return PackageResponse(
        id=pkg.id,
        event_id=pkg.event_id,
        name=pkg.name,
        description=pkg.description,
        image_url=pkg.image_url,
        package_price=pkg.package_price,
        original_value=pkg.original_value,
        stock_quantity=pkg.stock_quantity,
        display_order=pkg.display_order,
        is_active=pkg.is_active,
        is_featured=pkg.is_featured,
        created_at=pkg.created_at,
        updated_at=pkg.updated_at,
        items=items_response,
        savings=savings,
        items_count=items_count
    )


@router.put("/admin/packages/{package_id}", response_model=PackageResponse)
async def admin_update_package(
    package_id: str,
    package_update: PackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Update a package.
    """
    updated = update_package(db, package_id, package_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Package not found")
    
    return await admin_get_package(package_id, db, current_user)


@router.delete("/admin/packages/{package_id}")
async def admin_delete_package(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Delete a package.
    """
    success = delete_package(db, package_id)
    if not success:
        raise HTTPException(status_code=404, detail="Package not found")
    
    return {"message": "Package deleted successfully"}


# ============== Admin Endpoints - Package Items ==============

@router.post("/admin/packages/{package_id}/items", response_model=PackageItemResponse)
async def admin_add_package_item(
    package_id: str,
    item: PackageItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Add an item to a package.
    """
    # Verify product exists
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=400, detail="Product not found")
    
    db_item = add_package_item(db, package_id, item)
    if not db_item:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Recalculate original value
    update_package_original_value(db, package_id)
    
    return PackageItemResponse(
        id=db_item.id,
        package_id=db_item.package_id,
        product_id=db_item.product_id,
        quantity=db_item.quantity,
        created_at=db_item.created_at,
        product_name=product.name,
        product_image=product.images[0] if product.images else None,
        product_price=product.price_per_unit,
        product_unit=product.unit_type.value if product.unit_type else None
    )


@router.put("/admin/packages/items/{item_id}", response_model=PackageItemResponse)
async def admin_update_package_item(
    item_id: str,
    item_update: PackageItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Update a package item.
    """
    db_item = update_package_item(db, item_id, item_update)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Recalculate original value
    update_package_original_value(db, db_item.package_id)
    
    product = db.query(Product).filter(Product.id == db_item.product_id).first()
    
    return PackageItemResponse(
        id=db_item.id,
        package_id=db_item.package_id,
        product_id=db_item.product_id,
        quantity=db_item.quantity,
        created_at=db_item.created_at,
        product_name=product.name if product else None,
        product_image=product.images[0] if product and product.images else None,
        product_price=product.price_per_unit if product else None,
        product_unit=product.unit_type.value if product and product.unit_type else None
    )


@router.delete("/admin/packages/items/{item_id}")
async def admin_remove_package_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Remove an item from a package.
    """
    # Get item first to get package_id
    db_item = db.query(PackageItem).filter(PackageItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    package_id = db_item.package_id
    
    success = remove_package_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Recalculate original value
    update_package_original_value(db, package_id)
    
    return {"message": "Item removed successfully"}


# ============== Products for Package Selection ==============

@router.get("/admin/available-products")
async def get_available_products(
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Admin: Get available products for adding to packages.
    Returns simplified product list for selection.
    """
    query = db.query(Product).filter(Product.is_active == True)
    
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": float(p.price_per_unit),
                "unit": p.unit_type.value if p.unit_type else "piece",
                "image": p.images[0] if p.images else None,
                "stock": float(p.stock_quantity) if p.stock_quantity else None
            }
            for p in products
        ],
        "total": total
    }
