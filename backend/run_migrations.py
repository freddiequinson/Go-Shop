"""
Master migration script - runs all pending migrations
Add this to your DigitalOcean build/run command or run manually after deploy
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_all_migrations():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Add package columns to cart_items and order_items
        try:
            conn.execute(text("ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS package_id VARCHAR(36) REFERENCES packages(id)"))
            conn.execute(text("ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'product' NOT NULL"))
            conn.execute(text("ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(255)"))
            conn.execute(text("ALTER TABLE cart_items ALTER COLUMN product_id DROP NOT NULL"))
            print("✓ cart_items package columns")
        except Exception as e:
            print(f"  cart_items: {e}")

        try:
            conn.execute(text("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS package_id VARCHAR(36)"))
            conn.execute(text("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'product' NOT NULL"))
            conn.execute(text("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS package_items_snapshot JSONB"))
            conn.execute(text("ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL"))
            print("✓ order_items package columns")
        except Exception as e:
            print(f"  order_items: {e}")

        # Add contents_description to packages
        try:
            conn.execute(text("ALTER TABLE packages ADD COLUMN IF NOT EXISTS contents_description TEXT"))
            print("✓ packages.contents_description")
        except Exception as e:
            print(f"  contents_description: {e}")

        # Add show_savings to packages
        try:
            conn.execute(text("ALTER TABLE packages ADD COLUMN IF NOT EXISTS show_savings BOOLEAN DEFAULT TRUE NOT NULL"))
            print("✓ packages.show_savings")
        except Exception as e:
            print(f"  show_savings: {e}")

        # Add image_shape to packages
        try:
            conn.execute(text("ALTER TABLE packages ADD COLUMN IF NOT EXISTS image_shape VARCHAR(50) DEFAULT 'heart' NOT NULL"))
            print("✓ packages.image_shape")
        except Exception as e:
            print(f"  image_shape: {e}")

        conn.commit()
        print("\n✅ All migrations complete!")

if __name__ == "__main__":
    run_all_migrations()
