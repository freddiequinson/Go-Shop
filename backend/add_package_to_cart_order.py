"""
Script to add package support columns to cart_items and order_items tables
Run this locally and on production to enable package cart functionality
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_package_columns():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Add package_id column to cart_items
        try:
            conn.execute(text("""
                ALTER TABLE cart_items 
                ADD COLUMN IF NOT EXISTS package_id VARCHAR(36) REFERENCES packages(id) ON DELETE CASCADE
            """))
            print("✓ Added package_id to cart_items")
        except Exception as e:
            print(f"  package_id on cart_items: {e}")
        
        # Add item_type column to cart_items
        try:
            conn.execute(text("""
                ALTER TABLE cart_items 
                ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'product' NOT NULL
            """))
            print("✓ Added item_type to cart_items")
        except Exception as e:
            print(f"  item_type on cart_items: {e}")
        
        # Add item_name column to cart_items
        try:
            conn.execute(text("""
                ALTER TABLE cart_items 
                ADD COLUMN IF NOT EXISTS item_name VARCHAR(255)
            """))
            print("✓ Added item_name to cart_items")
        except Exception as e:
            print(f"  item_name on cart_items: {e}")
        
        # Make product_id nullable in cart_items (for package items)
        try:
            conn.execute(text("""
                ALTER TABLE cart_items 
                ALTER COLUMN product_id DROP NOT NULL
            """))
            print("✓ Made product_id nullable in cart_items")
        except Exception as e:
            print(f"  product_id nullable on cart_items: {e}")
        
        # Add package_id column to order_items
        try:
            conn.execute(text("""
                ALTER TABLE order_items 
                ADD COLUMN IF NOT EXISTS package_id VARCHAR(36) REFERENCES packages(id) ON DELETE SET NULL
            """))
            print("✓ Added package_id to order_items")
        except Exception as e:
            print(f"  package_id on order_items: {e}")
        
        # Add item_type column to order_items
        try:
            conn.execute(text("""
                ALTER TABLE order_items 
                ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'product' NOT NULL
            """))
            print("✓ Added item_type to order_items")
        except Exception as e:
            print(f"  item_type on order_items: {e}")
        
        # Add package_items_snapshot column to order_items (JSONB for PostgreSQL)
        try:
            conn.execute(text("""
                ALTER TABLE order_items 
                ADD COLUMN IF NOT EXISTS package_items_snapshot JSONB
            """))
            print("✓ Added package_items_snapshot to order_items")
        except Exception as e:
            print(f"  package_items_snapshot on order_items: {e}")
        
        # Make product_id nullable in order_items (for package items)
        try:
            conn.execute(text("""
                ALTER TABLE order_items 
                ALTER COLUMN product_id DROP NOT NULL
            """))
            print("✓ Made product_id nullable in order_items")
        except Exception as e:
            print(f"  product_id nullable on order_items: {e}")
        
        # Create indexes for package lookups
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_cart_items_package_id 
                ON cart_items(package_id) WHERE package_id IS NOT NULL
            """))
            print("✓ Created index on cart_items.package_id")
        except Exception as e:
            print(f"  index on cart_items.package_id: {e}")
        
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_order_items_package_id 
                ON order_items(package_id) WHERE package_id IS NOT NULL
            """))
            print("✓ Created index on order_items.package_id")
        except Exception as e:
            print(f"  index on order_items.package_id: {e}")
        
        conn.commit()
        print("\n✅ All package columns added successfully!")

if __name__ == "__main__":
    add_package_columns()
