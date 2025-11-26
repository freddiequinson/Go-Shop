"""
Quick script to check migration status
Shows how many products still need migration
"""
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import SessionLocal
from app.models.product import Product

def check_status():
    db = SessionLocal()
    
    try:
        # Get all products with images
        products = db.query(Product).filter(Product.images.isnot(None)).all()
        
        base64_count = 0
        cdn_count = 0
        mixed_count = 0
        no_images = 0
        
        base64_products = []
        
        for product in products:
            if not product.images or len(product.images) == 0:
                no_images += 1
                continue
            
            has_base64 = any(img.startswith('data:image') for img in product.images)
            has_cdn = any('digitaloceanspaces.com' in img for img in product.images)
            
            if has_base64 and has_cdn:
                mixed_count += 1
            elif has_base64:
                base64_count += 1
                base64_products.append({
                    'id': str(product.id),
                    'name': product.name,
                    'image_count': len(product.images)
                })
            elif has_cdn:
                cdn_count += 1
        
        print("\n" + "="*60)
        print("MIGRATION STATUS REPORT")
        print("="*60)
        print(f"Total products with images: {len(products)}")
        print(f"  ✅ Using CDN (migrated):  {cdn_count}")
        print(f"  ❌ Using base64 (needs migration): {base64_count}")
        print(f"  ⚠️  Mixed (partially migrated): {mixed_count}")
        print(f"  📭 No images: {no_images}")
        print("="*60)
        
        if base64_count > 0:
            print(f"\n🔄 Need to migrate: {base64_count} products")
            print(f"   Estimated time: {base64_count * 0.1:.1f} minutes")
            print("\nFirst 10 products needing migration:")
            for i, p in enumerate(base64_products[:10], 1):
                print(f"  {i}. {p['name']} ({p['image_count']} images)")
        else:
            print("\n🎉 ALL PRODUCTS MIGRATED! 🎉")
            print("Your shop page is now fully optimized!")
        
        print("="*60 + "\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_status()
