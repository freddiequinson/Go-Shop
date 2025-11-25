"""
Image serving endpoint
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud.product import get_product_by_id
import base64
import re

router = APIRouter()

@router.get("/{product_id}")
async def get_product_image(
    product_id: str,
    image_index: int = 0,
    db: Session = Depends(get_db)
):
    """Serve product image from base64
    
    Args:
        product_id: Product UUID
        image_index: Index of the image to retrieve (default: 0 for primary image)
        db: Database session
    
    Returns:
        Binary image data with appropriate content type
    """
    product = get_product_by_id(db, product_id)
    
    if not product or not product.images or len(product.images) == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Validate image index
    if image_index < 0 or image_index >= len(product.images):
        raise HTTPException(
            status_code=404, 
            detail=f"Image index {image_index} not found. Product has {len(product.images)} image(s)"
        )
    
    # Get requested image
    image_data = product.images[image_index]
    
    # Check if it's base64
    if not image_data.startswith('data:image'):
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    # Extract mime type and base64 data
    match = re.match(r'data:image/(\w+);base64,(.+)', image_data)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    mime_type = match.group(1)
    base64_data = match.group(2)
    
    # Decode base64
    try:
        image_bytes = base64.b64decode(base64_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to decode image")
    
    # Return image with aggressive caching headers for mobile performance
    return Response(
        content=image_bytes,
        media_type=f"image/{mime_type}",
        headers={
            "Cache-Control": "public, max-age=604800, immutable",  # Cache for 7 days, immutable
            "ETag": f'"{product_id}-{image_index}"',
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",  # Allow CORS for images
        }
    )
