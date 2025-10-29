"""
Cleanup script to remove duplicate farmer_kofi accounts
Keep only the most recent one and remove the rest
"""

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, desc
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from app.models.user import User

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def cleanup_duplicate_farmers():
    """Remove duplicate farmer_kofi accounts, keep the most recent one"""
    db = SessionLocal()
    
    try:
        print("🧹 Cleaning up duplicate farmer_kofi accounts...")
        
        # Find all farmer_kofi accounts (username starts with farmer_kofi)
        farmer_accounts = db.query(User).filter(
            User.username.like('farmer_kofi%')
        ).order_by(desc(User.created_at)).all()
        
        print(f"📋 Found {len(farmer_accounts)} farmer_kofi accounts:")
        for i, account in enumerate(farmer_accounts):
            print(f"   {i+1}. {account.username} ({account.email}) - Created: {account.created_at}")
        
        if len(farmer_accounts) <= 1:
            print("✅ No duplicates to clean up!")
            return
        
        # Keep the most recent one (first in desc order)
        keep_account = farmer_accounts[0]
        accounts_to_delete = farmer_accounts[1:]
        
        print(f"\n✅ Keeping: {keep_account.username} ({keep_account.email})")
        print(f"🗑️  Removing {len(accounts_to_delete)} duplicate accounts:")
        
        # Delete duplicate accounts
        for account in accounts_to_delete:
            print(f"   - Deleting: {account.username} ({account.email})")
            
            # First, delete any products created by this user
            from app.models.product import Product
            products = db.query(Product).filter(Product.seller_id == account.id).all()
            if products:
                print(f"     - Deleting {len(products)} products by this user")
                for product in products:
                    db.delete(product)
            
            # Delete the user account
            db.delete(account)
        
        # Commit all deletions
        db.commit()
        
        print(f"\n✅ Cleanup complete!")
        print(f"   - Kept: {keep_account.username}")
        print(f"   - Removed: {len(accounts_to_delete)} duplicate accounts")
        
        # Show remaining farmer accounts
        remaining_farmers = db.query(User).filter(
            User.username.like('farmer_kofi%')
        ).all()
        
        print(f"\n📋 Remaining farmer_kofi accounts: {len(remaining_farmers)}")
        for account in remaining_farmers:
            print(f"   - {account.username} ({account.email})")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

def cleanup_duplicate_products():
    """Remove duplicate products with same name from same seller"""
    db = SessionLocal()
    
    try:
        print("\n🧹 Cleaning up duplicate products...")
        
        from app.models.product import Product
        from sqlalchemy import func
        
        # Find products with duplicate names from same seller
        duplicate_products = db.query(
            Product.seller_id,
            Product.name,
            func.count(Product.id).label('count')
        ).group_by(
            Product.seller_id,
            Product.name
        ).having(func.count(Product.id) > 1).all()
        
        if not duplicate_products:
            print("✅ No duplicate products found!")
            return
        
        print(f"📋 Found {len(duplicate_products)} sets of duplicate products:")
        
        total_deleted = 0
        for seller_id, product_name, count in duplicate_products:
            print(f"   - '{product_name}': {count} duplicates")
            
            # Get all products with this name from this seller
            products = db.query(Product).filter(
                Product.seller_id == seller_id,
                Product.name == product_name
            ).order_by(desc(Product.created_at)).all()
            
            # Keep the most recent one, delete the rest
            keep_product = products[0]
            products_to_delete = products[1:]
            
            print(f"     - Keeping: {keep_product.id} (created: {keep_product.created_at})")
            
            for product in products_to_delete:
                print(f"     - Deleting: {product.id} (created: {product.created_at})")
                db.delete(product)
                total_deleted += 1
        
        db.commit()
        print(f"\n✅ Removed {total_deleted} duplicate products!")
        
    except Exception as e:
        print(f"❌ Error during product cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 GoShopGhana Duplicate Account Cleanup")
    print("=" * 50)
    
    # Clean up duplicate farmer accounts
    cleanup_duplicate_farmers()
    
    # Clean up duplicate products
    cleanup_duplicate_products()
    
    print("\n" + "=" * 50)
    print("🎯 Cleanup Summary:")
    print("   - Duplicate farmer_kofi accounts removed")
    print("   - Duplicate products removed") 
    print("   - Database cleaned up!")
    print("\n✨ Ready for clean testing!")
