"""add product publish control

Revision ID: product_publish_001
Revises: warehouse_mgmt_001
Create Date: 2025-11-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'product_publish_001'
down_revision = 'warehouse_mgmt_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_published column to products table
    # Default to True for existing products (backward compatibility)
    op.add_column('products', sa.Column('is_published', sa.Boolean(), nullable=True))
    
    # Set existing products to published
    op.execute("UPDATE products SET is_published = true WHERE is_published IS NULL")
    
    # Make column NOT NULL with default
    op.alter_column('products', 'is_published', nullable=False, server_default=sa.true())


def downgrade():
    op.drop_column('products', 'is_published')
