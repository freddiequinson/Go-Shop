"""
Migration script to upload existing base64 images to DigitalOcean Spaces

Usage:
    python -m scripts.migrate_images_to_spaces [--dry-run] [--limit N]
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.database import SessionLocal
from app.models.product import Product
from app.utils.spaces_client import get_spaces_client
import argparse
from tqdm import tqdm

def migrate_images(dry_run: bool = False, limit: int = None):
    """
    Migrate base64 images to Spaces
    
    Args:
        dry_run: If True, don't actually upload or modify database
        limit: Maximum number of products to process
    """
    db = SessionLocal()
    spaces = get_spaces_client()
    
    try:
        # Get all products with base64 images
        query = db.query(Product).filter(Product.images.isnot(None))
        
        if limit:
            query = query.limit(limit)
        
        products = query.all()
        total = len(products)
        
        print(f"Found {total} products with images")
        if dry_run:
            print("DRY RUN MODE - No changes will be made")
        
        migrated = 0
        skipped = 0
        errors = 0
        
        for product in tqdm(products, desc="Migrating images"):
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
                    
                    if not dry_run:
                        # Upload to Spaces
                        cdn_url = spaces.upload_base64_image(
                            base64_data=image_data,
                            product_id=str(product.id),
                            image_index=idx,
                            optimize=True
                        )
                        new_image_urls.append(cdn_url)
                        print(f"  ✓ Uploaded image {idx} for product {product.name}")
                    else:
                        print(f"  [DRY RUN] Would upload image {idx} for product {product.name}")
                        new_image_urls.append(f"https://cdn.example.com/product-images/{product.id}/{idx}.jpg")
                
                if not dry_run and new_image_urls:
                    # Update product with new URLs
                    product.images = new_image_urls
                    db.commit()
                
                migrated += 1
                
            except Exception as e:
                errors += 1
                print(f"  ✗ Error migrating product {product.id}: {e}")
                db.rollback()
        
        print("\n" + "="*50)
        print(f"Migration Summary:")
        print(f"  Total products: {total}")
        print(f"  Migrated: {migrated}")
        print(f"  Skipped: {skipped}")
        print(f"  Errors: {errors}")
        print("="*50)
        
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate product images to DigitalOcean Spaces")
    parser.add_argument('--dry-run', action='store_true', help='Run without making changes')
    parser.add_argument('--limit', type=int, help='Limit number of products to process')
    
    args = parser.parse_args()
    
    # Check for required environment variables
    required_vars = ['SPACES_ACCESS_KEY', 'SPACES_SECRET_KEY']
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing and not args.dry_run:
        print(f"Error: Missing required environment variables: {', '.join(missing)}")
        print("\nPlease set in your .env file:")
        print("  SPACES_ACCESS_KEY=your_access_key")
        print("  SPACES_SECRET_KEY=your_secret_key")
        print("  SPACES_NAME=goshop-images")
        print("  SPACES_REGION=nyc3")
        print("  SPACES_CDN_ENDPOINT=https://goshop-images.nyc3.cdn.digitaloceanspaces.com")
        sys.exit(1)
    
    migrate_images(dry_run=args.dry_run, limit=args.limit)
