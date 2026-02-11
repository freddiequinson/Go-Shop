"""add package support to cart and order items

Revision ID: add_package_cart_001
Revises: add_packages_001
Create Date: 2026-02-11

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_package_cart_001'
down_revision = 'add_packages_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add package support columns to cart_items
    op.execute("""
        ALTER TABLE cart_items 
        ADD COLUMN IF NOT EXISTS package_id VARCHAR(36) REFERENCES packages(id) ON DELETE CASCADE
    """)
    op.execute("""
        ALTER TABLE cart_items 
        ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'product' NOT NULL
    """)
    op.execute("""
        ALTER TABLE cart_items 
        ADD COLUMN IF NOT EXISTS item_name VARCHAR(255)
    """)
    # Make product_id nullable (it was NOT NULL before)
    op.execute("""
        ALTER TABLE cart_items 
        ALTER COLUMN product_id DROP NOT NULL
    """)
    
    # Add package support columns to order_items
    op.execute("""
        ALTER TABLE order_items 
        ADD COLUMN IF NOT EXISTS package_id VARCHAR(36) REFERENCES packages(id) ON DELETE SET NULL
    """)
    op.execute("""
        ALTER TABLE order_items 
        ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'product' NOT NULL
    """)
    op.execute("""
        ALTER TABLE order_items 
        ADD COLUMN IF NOT EXISTS package_items_snapshot JSONB
    """)
    # Make product_id nullable (it was NOT NULL before)
    op.execute("""
        ALTER TABLE order_items 
        ALTER COLUMN product_id DROP NOT NULL
    """)
    
    # Create indexes for package lookups
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_cart_items_package_id 
        ON cart_items(package_id) WHERE package_id IS NOT NULL
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_order_items_package_id 
        ON order_items(package_id) WHERE package_id IS NOT NULL
    """)


def downgrade():
    # Remove indexes
    op.execute("DROP INDEX IF EXISTS idx_cart_items_package_id")
    op.execute("DROP INDEX IF EXISTS idx_order_items_package_id")
    
    # Remove columns from order_items
    op.execute("ALTER TABLE order_items DROP COLUMN IF EXISTS package_items_snapshot")
    op.execute("ALTER TABLE order_items DROP COLUMN IF EXISTS item_type")
    op.execute("ALTER TABLE order_items DROP COLUMN IF EXISTS package_id")
    op.execute("ALTER TABLE order_items ALTER COLUMN product_id SET NOT NULL")
    
    # Remove columns from cart_items
    op.execute("ALTER TABLE cart_items DROP COLUMN IF EXISTS item_name")
    op.execute("ALTER TABLE cart_items DROP COLUMN IF EXISTS item_type")
    op.execute("ALTER TABLE cart_items DROP COLUMN IF EXISTS package_id")
    op.execute("ALTER TABLE cart_items ALTER COLUMN product_id SET NOT NULL")
