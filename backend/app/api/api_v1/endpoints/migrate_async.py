"""
Async migration endpoint that doesn't block the request
Starts migration in background and returns immediately
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.product import Product
from app.utils.spaces_client import get_spaces_client
from app.core.config import settings
from typing import Dict
import os

router = APIRouter()

MIGRATION_SECRET = os.getenv('MIGRATION_SECRET', 'change-this-secret')

# Track migration status
migration_status = {
    "running": False,
    "total_processed": 0,
    "migrated": 0,
    "errors": 0,
    "last_error": None
}

def run_migration_background(db: Session, limit: int = 10):
    """Run migration in background"""
    global migration_status
    
    try:
        migration_status["running"] = True
        spaces = get_spaces_client()
        
        # Use database query to find products with base64 images
        from sqlalchemy import cast, String
        
        all_products = db.query(Product).filter(
            Product.images.isnot(None),
            cast(Product.images, String).like('%data:image%')
        ).limit(limit).all()
        
        for product in all_products:
            try:
                if not product.images:
                    continue
                
                has_base64 = any(img.startswith('data:image') for img in product.images)
                if not has_base64:
                    continue
                
                new_image_urls = []
                for idx, image_data in enumerate(product.images):
                    if not image_data:
                        continue
                    
                    if image_data.startswith('http'):
                        new_image_urls.append(image_data)
                        continue
                    
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
                    product.images = new_image_urls
                    db.commit()
                    migration_status["migrated"] += 1
                
                migration_status["total_processed"] += 1
                
            except Exception as e:
                migration_status["errors"] += 1
                migration_status["last_error"] = str(e)
                db.rollback()
        
    except Exception as e:
        migration_status["last_error"] = str(e)
    finally:
        migration_status["running"] = False
        db.close()


@router.post("/start")
async def start_migration(
    background_tasks: BackgroundTasks,
    secret: str,
    limit: int = 10,
    db: Session = Depends(get_db)
) -> Dict:
    """
    Start migration in background
    Returns immediately, migration continues in background
    """
    if secret != MIGRATION_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    if migration_status["running"]:
        return {
            "success": False,
            "message": "Migration already running",
            "status": migration_status
        }
    
    # Reset counters
    migration_status["total_processed"] = 0
    migration_status["migrated"] = 0
    migration_status["errors"] = 0
    migration_status["last_error"] = None
    
    # Start background task
    background_tasks.add_task(run_migration_background, db, limit)
    
    return {
        "success": True,
        "message": f"Migration started for up to {limit} products",
        "status": migration_status
    }


@router.get("/progress")
async def get_migration_progress() -> Dict:
    """Get current migration progress"""
    return {
        "status": migration_status,
        "message": "Migration running" if migration_status["running"] else "Migration idle"
    }
