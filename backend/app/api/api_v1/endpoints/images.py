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
import io
from PIL import Image

router = APIRouter()

@router.get("/{product_id}")
async def get_product_image(
    product_id: str,
    image_index: int = 0,
    db: Session = Depends(get_db)
):
    """Serve optimized product image from base64
    
    Args:
        product_id: Product UUID
        image_index: Index of the image to retrieve (default: 0 for primary image)
        db: Database session
    
    Returns:
        Binary image data (optimized) with appropriate content type
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

    # Optimize image using PIL
    try:
        # Open image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed (for JPEG conversion)
        if img.mode in ('RGBA', 'P') and mime_type.lower() in ('jpeg', 'jpg'):
            img = img.convert('RGB')
            
        # Resize if too large (max 800x800)
        max_size = (800, 800)
        if img.width > max_size[0] or img.height > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
        # Save to bytes with optimization
        output = io.BytesIO()
        format_name = mime_type.upper()
        if format_name == 'JPG':
            format_name = 'JPEG'
            
        # Use JPEG for non-transparent images for better compression
        if format_name == 'PNG' and img.mode == 'RGB':
            format_name = 'JPEG'
            mime_type = 'jpeg'
            
        save_kwargs = {'optimize': True}
        if format_name == 'JPEG':
            save_kwargs['quality'] = 85
            
        img.save(output, format=format_name, **save_kwargs)
        image_bytes = output.getvalue()
        
    except Exception as e:
        # Fallback to original bytes if optimization fails
        print(f"Image optimization failed: {e}")
        pass
    
    # Return image with aggressive caching headers for mobile performance
    return Response(
        content=image_bytes,
        media_type=f"image/{mime_type}",
        headers={
            "Cache-Control": "public, max-age=604800, immutable",  # Cache for 7 days, immutable
            "ETag": f'"{product_id}-{image_index}-opt"',
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",  # Allow CORS for images
        }
    )
