"""
DigitalOcean Spaces client for image uploads
S3-compatible object storage with built-in CDN
"""
import boto3
from botocore.client import Config
import os
from typing import Optional
import base64
import io
from PIL import Image
import uuid

class SpacesClient:
    def __init__(self):
        """Initialize Spaces client with credentials from environment"""
        self.spaces_key = os.getenv('SPACES_ACCESS_KEY')
        self.spaces_secret = os.getenv('SPACES_SECRET_KEY')
        self.spaces_name = os.getenv('SPACES_NAME', 'goshop-images')
        self.spaces_region = os.getenv('SPACES_REGION', 'lon1')
        self.cdn_endpoint = os.getenv('SPACES_CDN_ENDPOINT', f'https://{self.spaces_name}.{self.spaces_region}.cdn.digitaloceanspaces.com')
        
        # Initialize S3 client for Spaces
        self.client = boto3.client(
            's3',
            region_name=self.spaces_region,
            endpoint_url=f'https://{self.spaces_region}.digitaloceanspaces.com',
            aws_access_key_id=self.spaces_key,
            aws_secret_access_key=self.spaces_secret,
            config=Config(signature_version='s3v4')
        )
    
    def upload_base64_image(
        self, 
        base64_data: str, 
        product_id: str, 
        image_index: int = 0,
        optimize: bool = True
    ) -> str:
        """
        Upload base64 image to Spaces and return CDN URL
        
        Args:
            base64_data: Base64 encoded image (with or without data:image prefix)
            product_id: Product UUID
            image_index: Image index for multiple images
            optimize: Whether to optimize image before upload
            
        Returns:
            CDN URL of uploaded image
        """
        # Remove data:image prefix if present
        if base64_data.startswith('data:image'):
            base64_data = base64_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(base64_data)
        
        # Optimize image if requested
        if optimize:
            image_bytes = self._optimize_image(image_bytes)
        
        # Generate file path: product-images/{product_id}/{index}.jpg
        file_key = f"product-images/{product_id}/{image_index}.jpg"
        
        # Upload to Spaces
        self.client.put_object(
            Bucket=self.spaces_name,
            Key=file_key,
            Body=image_bytes,
            ACL='public-read',
            ContentType='image/jpeg',
            CacheControl='public, max-age=31536000',  # Cache for 1 year
            Metadata={
                'product_id': product_id,
                'image_index': str(image_index)
            }
        )
        
        # Return CDN URL
        return f"{self.cdn_endpoint}/{file_key}"
    
    def _optimize_image(self, image_bytes: bytes) -> bytes:
        """
        Optimize image: resize and compress
        
        Args:
            image_bytes: Original image bytes
            
        Returns:
            Optimized image bytes
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert RGBA to RGB
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Resize if too large (max 1200x1200 for high quality)
            max_size = (1200, 1200)
            if img.width > max_size[0] or img.height > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save as JPEG with good quality
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            print(f"Image optimization failed: {e}")
            return image_bytes
    
    def delete_image(self, product_id: str, image_index: int = 0):
        """Delete image from Spaces"""
        file_key = f"product-images/{product_id}/{image_index}.jpg"
        self.client.delete_object(
            Bucket=self.spaces_name,
            Key=file_key
        )
    
    def delete_product_images(self, product_id: str):
        """Delete all images for a product"""
        prefix = f"product-images/{product_id}/"
        
        # List all objects with this prefix
        response = self.client.list_objects_v2(
            Bucket=self.spaces_name,
            Prefix=prefix
        )
        
        if 'Contents' in response:
            for obj in response['Contents']:
                self.client.delete_object(
                    Bucket=self.spaces_name,
                    Key=obj['Key']
                )

# Singleton instance
_spaces_client: Optional[SpacesClient] = None

def get_spaces_client() -> SpacesClient:
    """Get or create Spaces client singleton"""
    global _spaces_client
    if _spaces_client is None:
        _spaces_client = SpacesClient()
    return _spaces_client
