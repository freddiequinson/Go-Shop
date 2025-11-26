"""
Migration endpoint - trigger image migration to Spaces
SECURITY: This should be protected or removed after migration
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.product import Product
from app.utils.spaces_client import get_spaces_client
from typing import Dict
import os

router = APIRouter()

# Simple secret key for protection - set in environment
MIGRATION_SECRET = os.getenv("MIGRATION_SECRET", "change-this-secret-key")

@router.post("/images-to-spaces")
async def migrate_images_to_spaces(
    secret: str,
    limit: int = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
) -> Dict:
    """
    Migrate product images from base64 to DigitalOcean Spaces
    
    Args:
        secret: Secret key for authorization
        limit: Optional limit on number of products to migrate
        
    Returns:
        Migration status and summary
        
    Usage:
        POST /api/v1/migrate/images-to-spaces?secret=your-secret&limit=20
    """
    # Check secret
    if secret != MIGRATION_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    try:
        spaces = get_spaces_client()
        
        # Get ALL products with images first
        all_products = db.query(Product).filter(Product.images.isnot(None)).all()
        
        # Filter for products that actually have base64 images
        products_with_base64 = []
        for p in all_products:
            if p.images and any(img.startswith('data:image') for img in p.images):
                products_with_base64.append(p)
                if limit and len(products_with_base64) >= limit:
                    break
        
        products = products_with_base64
        total = len(products)
        
        migrated = 0
        skipped = 0
        errors = []
        
        for product in products:
            try:
                if not product.images or len(product.images) == 0:
                    skipped += 1
                    continue
                
                new_image_urls = []
                
                for idx, image_data in enumerate(product.images):
                    # Skip if already a URL
                    if image_data.startswith('http://') or image_data.startswith('https://'):
                        new_image_urls.append(image_data)
                        continue
                    
                    # Skip if not base64
                    if not image_data.startswith('data:image'):
                        new_image_urls.append(image_data)
                        continue
                    
                    # Upload to Spaces
                    cdn_url = spaces.upload_base64_image(
                        base64_data=image_data,
                        product_id=str(product.id),
                        image_index=idx,
                        optimize=True
                    )
                    new_image_urls.append(cdn_url)
                
                if new_image_urls:
                    # Update product with new URLs
                    product.images = new_image_urls
                    db.commit()
                
                migrated += 1
                
            except Exception as e:
                errors.append({
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "error": str(e)
                })
                db.rollback()
        
        return {
            "success": True,
            "summary": {
                "total_products": total,
                "migrated": migrated,
                "skipped": skipped,
                "errors": len(errors)
            },
            "errors": errors[:10] if errors else [],  # Return first 10 errors
            "message": f"Successfully migrated {migrated} products to Spaces CDN"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.get("/status")
async def migration_status(db: Session = Depends(get_db)) -> Dict:
    """
    Check migration status - how many products still have base64 images
    
    Returns:
        Count of products with base64 vs CDN URLs
    """
    try:
        # Get all products with images
        products = db.query(Product).filter(Product.images.isnot(None)).all()
        
        base64_count = 0
        cdn_count = 0
        mixed_count = 0
        
        for product in products:
            if not product.images or len(product.images) == 0:
                continue
            
            has_base64 = any(img.startswith('data:image') for img in product.images)
            has_cdn = any(img.startswith('https://goshop-images') for img in product.images)
            
            if has_base64 and has_cdn:
                mixed_count += 1
            elif has_base64:
                base64_count += 1
            elif has_cdn:
                cdn_count += 1
        
        return {
            "total_products": len(products),
            "using_base64": base64_count,
            "using_cdn": cdn_count,
            "mixed": mixed_count,
            "migration_complete": base64_count == 0 and mixed_count == 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
