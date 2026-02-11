"""
Package CRUD operations for GoShopGhana
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime, timezone
from decimal import Decimal

from app.models.package import SeasonalEvent, Package, PackageItem
from app.models.product import Product
from app.schemas.package import (
    SeasonalEventCreate, SeasonalEventUpdate,
    PackageCreate, PackageUpdate,
    PackageItemCreate, PackageItemUpdate
)


# ============== Seasonal Event CRUD ==============

def create_seasonal_event(
    db: Session,
    event: SeasonalEventCreate,
    created_by: Optional[str] = None
) -> SeasonalEvent:
    """Create a new seasonal event"""
    db_event = SeasonalEvent(
        name=event.name,
        description=event.description,
        color_code=event.color_code,
        promo_image_url=event.promo_image_url,
        lottie_animation=event.lottie_animation,
        start_date=event.start_date,
        end_date=event.end_date,
        show_popup=event.show_popup,
        is_active=event.is_active,
        created_by=created_by
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_seasonal_event(db: Session, event_id: str) -> Optional[SeasonalEvent]:
    """Get a seasonal event by ID"""
    return db.query(SeasonalEvent).filter(SeasonalEvent.id == event_id).first()


def get_seasonal_events(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    active_only: bool = False
) -> Tuple[List[SeasonalEvent], int]:
    """Get all seasonal events with pagination"""
    query = db.query(SeasonalEvent)
    
    if active_only:
        query = query.filter(SeasonalEvent.is_active == True)
    
    total = query.count()
    events = query.order_by(desc(SeasonalEvent.created_at)).offset(skip).limit(limit).all()
    
    return events, total


def get_active_seasonal_events(db: Session) -> List[SeasonalEvent]:
    """Get currently active seasonal events (within date range)"""
    now = datetime.now(timezone.utc)
    return db.query(SeasonalEvent).filter(
        and_(
            SeasonalEvent.is_active == True,
            SeasonalEvent.start_date <= now,
            SeasonalEvent.end_date >= now
        )
    ).order_by(desc(SeasonalEvent.created_at)).all()


def update_seasonal_event(
    db: Session,
    event_id: str,
    event_update: SeasonalEventUpdate
) -> Optional[SeasonalEvent]:
    """Update a seasonal event"""
    db_event = get_seasonal_event(db, event_id)
    if not db_event:
        return None
    
    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event


def delete_seasonal_event(db: Session, event_id: str) -> bool:
    """Delete a seasonal event and all its packages"""
    db_event = get_seasonal_event(db, event_id)
    if not db_event:
        return False
    
    db.delete(db_event)
    db.commit()
    return True


# ============== Package CRUD ==============

def create_package(
    db: Session,
    package: PackageCreate,
    created_by: Optional[str] = None
) -> Package:
    """Create a new package with items"""
    db_package = Package(
        event_id=package.event_id,
        name=package.name,
        description=package.description,
        image_url=package.image_url,
        package_price=package.package_price,
        original_value=package.original_value,
        stock_quantity=package.stock_quantity,
        display_order=package.display_order,
        is_active=package.is_active,
        is_featured=package.is_featured
    )
    db.add(db_package)
    db.flush()  # Get the package ID
    
    # Add items if provided
    if package.items:
        for item in package.items:
            db_item = PackageItem(
                package_id=db_package.id,
                product_id=item.product_id,
                quantity=item.quantity
            )
            db.add(db_item)
    
    db.commit()
    db.refresh(db_package)
    return db_package


def get_package(db: Session, package_id: str) -> Optional[Package]:
    """Get a package by ID with items"""
    return db.query(Package).filter(Package.id == package_id).first()


def get_packages(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    event_id: Optional[str] = None,
    active_only: bool = False,
    featured_only: bool = False
) -> Tuple[List[Package], int]:
    """Get packages with filtering and pagination"""
    query = db.query(Package)
    
    if event_id:
        query = query.filter(Package.event_id == event_id)
    
    if active_only:
        query = query.filter(Package.is_active == True)
    
    if featured_only:
        query = query.filter(Package.is_featured == True)
    
    total = query.count()
    packages = query.order_by(Package.display_order, desc(Package.created_at)).offset(skip).limit(limit).all()
    
    return packages, total


def get_packages_for_event(db: Session, event_id: str, active_only: bool = True) -> List[Package]:
    """Get all packages for a specific event"""
    query = db.query(Package).filter(Package.event_id == event_id)
    
    if active_only:
        query = query.filter(Package.is_active == True)
    
    return query.order_by(Package.display_order).all()


def update_package(
    db: Session,
    package_id: str,
    package_update: PackageUpdate
) -> Optional[Package]:
    """Update a package"""
    db_package = get_package(db, package_id)
    if not db_package:
        return None
    
    update_data = package_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_package, field, value)
    
    db.commit()
    db.refresh(db_package)
    return db_package


def delete_package(db: Session, package_id: str) -> bool:
    """Delete a package and all its items"""
    db_package = get_package(db, package_id)
    if not db_package:
        return False
    
    db.delete(db_package)
    db.commit()
    return True


# ============== Package Item CRUD ==============

def add_package_item(
    db: Session,
    package_id: str,
    item: PackageItemCreate
) -> Optional[PackageItem]:
    """Add an item to a package"""
    # Verify package exists
    db_package = get_package(db, package_id)
    if not db_package:
        return None
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        return None
    
    db_item = PackageItem(
        package_id=package_id,
        product_id=item.product_id,
        quantity=item.quantity
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_package_item(
    db: Session,
    item_id: str,
    item_update: PackageItemUpdate
) -> Optional[PackageItem]:
    """Update a package item"""
    db_item = db.query(PackageItem).filter(PackageItem.id == item_id).first()
    if not db_item:
        return None
    
    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


def remove_package_item(db: Session, item_id: str) -> bool:
    """Remove an item from a package"""
    db_item = db.query(PackageItem).filter(PackageItem.id == item_id).first()
    if not db_item:
        return False
    
    db.delete(db_item)
    db.commit()
    return True


def get_package_items(db: Session, package_id: str) -> List[PackageItem]:
    """Get all items in a package with product details"""
    return db.query(PackageItem).filter(
        PackageItem.package_id == package_id
    ).order_by(PackageItem.created_at).all()


# ============== Helper Functions ==============

def calculate_original_value(db: Session, package_id: str) -> Decimal:
    """Calculate the sum of individual product prices in a package"""
    items = get_package_items(db, package_id)
    total = Decimal('0')
    
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            total += product.price_per_unit * item.quantity
    
    return total


def update_package_original_value(db: Session, package_id: str) -> Optional[Package]:
    """Recalculate and update the original value of a package"""
    db_package = get_package(db, package_id)
    if not db_package:
        return None
    
    db_package.original_value = calculate_original_value(db, package_id)
    db.commit()
    db.refresh(db_package)
    return db_package


def get_package_with_product_details(db: Session, package_id: str) -> Optional[dict]:
    """Get a package with full product details for each item"""
    db_package = get_package(db, package_id)
    if not db_package:
        return None
    
    items_with_details = []
    for item in db_package.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            items_with_details.append({
                "id": item.id,
                "package_id": item.package_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "created_at": item.created_at,
                "product_name": product.name,
                "product_image": product.images[0] if product.images else None,
                "product_price": product.price_per_unit,
                "product_unit": product.unit_type.value if product.unit_type else None
            })
    
    return {
        "package": db_package,
        "items": items_with_details
    }
