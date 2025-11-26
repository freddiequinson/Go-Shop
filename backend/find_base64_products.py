"""
Find products that still have base64 images
This helps us understand what's blocking the migration
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

def find_base64_products():
    # Connect to PRODUCTION database
    prod_db_url = os.getenv('DATABASE_URL')
    if not prod_db_url:
        print("ERROR: DATABASE_URL not found in .env")
        return
    
    print(f"Connecting to: {prod_db_url[:30]}...")
    
    db = SessionLocal()
    
    try:
        # Get all products with images
        products = db.query(Product).filter(Product.images.isnot(None)).all()
        
        base64_products = []
        
        for product in products:
            if not product.images or len(product.images) == 0:
                continue
            
            has_base64 = any(img.startswith('data:image') for img in product.images)
            
            if has_base64:
                base64_products.append({
                    'id': str(product.id),
                    'name': product.name,
                    'image_count': len(product.images),
                    'is_published': product.is_published,
                    'is_active': product.is_active,
                    'created_at': product.created_at
                })
        
        print("\n" + "="*80)
        print(f"FOUND {len(base64_products)} PRODUCTS WITH BASE64 IMAGES")
        print("="*80)
        
        if base64_products:
            print("\nFirst 20 products:")
            for i, p in enumerate(base64_products[:20], 1):
                status = "✓" if p['is_published'] and p['is_active'] else "✗"
                print(f"{i:2}. {status} {p['name'][:50]:50} | {p['image_count']} images | {p['created_at']}")
            
            print(f"\n... and {len(base64_products) - 20} more" if len(base64_products) > 20 else "")
            
            # Save IDs to file for batch processing
            with open('base64_product_ids.txt', 'w') as f:
                for p in base64_products:
                    f.write(f"{p['id']}\n")
            
            print(f"\n✓ Saved all {len(base64_products)} product IDs to: base64_product_ids.txt")
        else:
            print("\n🎉 NO PRODUCTS WITH BASE64 IMAGES FOUND!")
        
        print("="*80 + "\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    find_base64_products()
