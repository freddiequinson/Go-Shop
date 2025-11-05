"""add supplier product catalog fields

Revision ID: supplier_catalog_001
Revises: add_supplier_usertype
Create Date: 2025-11-02 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'supplier_catalog_001'
down_revision = 'add_supplier_usertype'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to products table
    op.add_column('products', 
        sa.Column('created_by_type', sa.String(20), server_default='admin', nullable=False))
    op.add_column('products', 
        sa.Column('in_warehouse', sa.Boolean(), server_default='false', nullable=False))
    
    # Create index for efficient filtering
    op.create_index(
        'idx_products_supplier_catalog', 
        'products', 
        ['supplier_id', 'created_by_type', 'in_warehouse']
    )
    
    # Update existing products to be admin-created and in warehouse
    op.execute("""
        UPDATE products 
        SET 
            created_by_type = 'admin', 
            in_warehouse = TRUE 
        WHERE is_published = TRUE
    """)
    
    # Update unpublished products to be in warehouse but not published
    op.execute("""
        UPDATE products 
        SET 
            created_by_type = 'admin', 
            in_warehouse = TRUE 
        WHERE is_published = FALSE
    """)


def downgrade():
    # Drop index
    op.drop_index('idx_products_supplier_catalog', table_name='products')
    
    # Drop columns
    op.drop_column('products', 'in_warehouse')
    op.drop_column('products', 'created_by_type')
