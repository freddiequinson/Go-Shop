"""
Helper functions for uploading images to DigitalOcean Spaces
Automatically converts base64 images to CDN URLs
"""
from typing import List, Optional
from app.utils.spaces_client import get_spaces_client
import os

def process_product_images(images: List[str], product_id: str) -> List[str]:
    """
    Process product images: upload base64 to Spaces, keep URLs as-is
    
    Args:
        images: List of image data (base64 or URLs)
        product_id: Product UUID
        
    Returns:
        List of CDN URLs
    """
    # Check if Spaces is configured
    spaces_configured = all([
        os.getenv('SPACES_ACCESS_KEY'),
        os.getenv('SPACES_SECRET_KEY')
    ])
    
    # If Spaces not configured, return images as-is (fallback to old behavior)
    if not spaces_configured:
        return images
    
    try:
        spaces = get_spaces_client()
        processed_images = []
        
        for idx, image_data in enumerate(images):
            # If already a URL, keep it
            if image_data.startswith('http://') or image_data.startswith('https://'):
                processed_images.append(image_data)
                continue
            
            # If base64, upload to Spaces
            if image_data.startswith('data:image'):
                try:
                    cdn_url = spaces.upload_base64_image(
                        base64_data=image_data,
                        product_id=product_id,
                        image_index=idx,
                        optimize=True
                    )
                    processed_images.append(cdn_url)
                except Exception as e:
                    print(f"Failed to upload image {idx} for product {product_id}: {e}")
                    # Fallback: keep base64 if upload fails
                    processed_images.append(image_data)
            else:
                # Unknown format, keep as-is
                processed_images.append(image_data)
        
        return processed_images
        
    except Exception as e:
        print(f"Image processing failed for product {product_id}: {e}")
        # Fallback: return original images
        return images
