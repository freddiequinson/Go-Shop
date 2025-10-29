"""
CRUD operations for Product Image Library
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime
import uuid

from app.models.image_library import ProductImageLibrary
from app.schemas.image_library import ImageLibraryCreate, ImageLibraryUpdate, ImageSearch


def create_image(db: Session, image: ImageLibraryCreate, uploaded_by: str) -> ProductImageLibrary:
    """Add image to library"""
    db_image = ProductImageLibrary(
        id=str(uuid.uuid4()),
        uploaded_by=uploaded_by,
        **image.model_dump()
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


def get_image_by_id(db: Session, image_id: str) -> Optional[ProductImageLibrary]:
    """Get image by ID"""
    return db.query(ProductImageLibrary).filter(ProductImageLibrary.id == image_id).first()


def get_images(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: Optional[ImageSearch] = None
) -> Tuple[List[ProductImageLibrary], int]:
    """Get all images with filtering"""
    query = db.query(ProductImageLibrary)
    
    if search:
        if search.search:
            search_term = f"%{search.search}%"
            query = query.filter(
                or_(
                    ProductImageLibrary.product_name.ilike(search_term),
                    ProductImageLibrary.description.ilike(search_term),
                    ProductImageLibrary.tags.cast(db.String).ilike(search_term)
                )
            )
        
        if search.category_id:
            query = query.filter(ProductImageLibrary.category_id == search.category_id)
        
        if search.tags:
            # Search for any of the provided tags
            for tag in search.tags:
                query = query.filter(
                    ProductImageLibrary.tags.cast(db.String).ilike(f"%{tag}%")
                )
        
        if search.is_active is not None:
            query = query.filter(ProductImageLibrary.is_active == search.is_active)
    
    total = query.count()
    images = query.order_by(ProductImageLibrary.created_at.desc()).offset(skip).limit(limit).all()
    
    return images, total


def update_image(db: Session, image_id: str, update_data: ImageLibraryUpdate) -> Optional[ProductImageLibrary]:
    """Update image metadata"""
    db_image = get_image_by_id(db, image_id)
    if not db_image:
        return None
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(db_image, field, value)
    
    db.commit()
    db.refresh(db_image)
    return db_image


def delete_image(db: Session, image_id: str) -> bool:
    """Delete image from library"""
    db_image = get_image_by_id(db, image_id)
    if not db_image:
        return False
    
    db.delete(db_image)
    db.commit()
    return True


def increment_usage_count(db: Session, image_id: str):
    """Increment usage count when image is used"""
    db_image = get_image_by_id(db, image_id)
    if db_image:
        db_image.usage_count = str(int(db_image.usage_count) + 1)
        db.commit()


def get_images_by_category(db: Session, category_id: str, limit: int = 50) -> List[ProductImageLibrary]:
    """Get images for a specific category"""
    return db.query(ProductImageLibrary).filter(
        ProductImageLibrary.category_id == category_id,
        ProductImageLibrary.is_active == True
    ).order_by(ProductImageLibrary.usage_count.desc()).limit(limit).all()


def search_images_by_tags(db: Session, tags: List[str], limit: int = 50) -> List[ProductImageLibrary]:
    """Search images by tags"""
    query = db.query(ProductImageLibrary).filter(ProductImageLibrary.is_active == True)
    
    for tag in tags:
        query = query.filter(
            ProductImageLibrary.tags.cast(db.String).ilike(f"%{tag}%")
        )
    
    return query.order_by(ProductImageLibrary.usage_count.desc()).limit(limit).all()
