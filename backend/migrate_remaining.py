"""
Migrate remaining base64 products directly
Connects to production database and migrates products
"""
import sys
from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import SessionLocal
from app.models.product import Product
from app.utils.spaces_client import get_spaces_client

def migrate_remaining():
    db = SessionLocal()
    spaces = get_spaces_client()
    
    try:
        print("\n" + "="*80)
        print("MIGRATING REMAINING BASE64 PRODUCTS")
        print("="*80)
        
        # Get all products with images
        products = db.query(Product).filter(Product.images.isnot(None)).all()
        
        migrated = 0
        skipped = 0
        errors = []
        
        for product in products:
            if not product.images or len(product.images) == 0:
                continue
            
            # Check if has base64
            has_base64 = any(img.startswith('data:image') for img in product.images)
            
            if not has_base64:
                continue
            
            print(f"\nMigrating: {product.name[:50]}")
            
            try:
                new_image_urls = []
                
                for idx, image_data in enumerate(product.images):
                    if not image_data:
                        continue
                    
                    # Skip if already CDN
                    if image_data.startswith('http'):
                        new_image_urls.append(image_data)
                        print(f"  Image {idx}: Already CDN ✓")
                        continue
                    
                    # Skip if not base64
                    if not image_data.startswith('data:image'):
                        new_image_urls.append(image_data)
                        continue
                    
                    # Upload to Spaces
                    print(f"  Image {idx}: Uploading...", end='')
                    cdn_url = spaces.upload_base64_image(
                        base64_data=image_data,
                        product_id=str(product.id),
                        image_index=idx,
                        optimize=True
                    )
                    new_image_urls.append(cdn_url)
                    print(f" ✓")
                
                if new_image_urls:
                    # Update product
                    product.images = new_image_urls
                    db.commit()
                    migrated += 1
                    print(f"  ✓ Product migrated successfully!")
                else:
                    skipped += 1
                    
            except Exception as e:
                print(f"  ✗ Error: {e}")
                errors.append({
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "error": str(e)
                })
                db.rollback()
        
        print("\n" + "="*80)
        print("MIGRATION COMPLETE")
        print("="*80)
        print(f"Migrated: {migrated}")
        print(f"Skipped: {skipped}")
        print(f"Errors: {len(errors)}")
        
        if errors:
            print("\nErrors:")
            for err in errors[:10]:
                print(f"  - {err['product_name']}: {err['error']}")
        
        print("="*80 + "\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    migrate_remaining()
