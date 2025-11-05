"""add direct order fields to supply offers

Revision ID: direct_order_001
Revises: warehouse_management_system
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'direct_order_001'
down_revision = ('warehouse_mgmt_001', 'supplier_catalog_001')  # Merge both heads
branch_labels = None
depends_on = None


def upgrade():
    # Add is_direct_order field to supply_offers
    op.add_column('supply_offers', sa.Column('is_direct_order', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add order_source field to supply_offers
    op.add_column('supply_offers', sa.Column('order_source', sa.String(50), nullable=False, server_default='request'))
    
    # Add product_id field to supply_offers (for direct orders without request)
    op.add_column('supply_offers', sa.Column('product_id', sa.String(), nullable=True))
    
    # Add foreign key for product_id
    op.create_foreign_key('fk_supply_offers_product_id', 'supply_offers', 'products', ['product_id'], ['id'])
    
    # Create index for filtering direct orders
    op.create_index('idx_supply_offers_direct_order', 'supply_offers', ['is_direct_order'])
    
    # Make supply_request_id nullable (for direct orders)
    op.alter_column('supply_offers', 'supply_request_id', nullable=True)
    
    # Add product_name to supply_requests (for open requests without product_id)
    op.add_column('supply_requests', sa.Column('product_name', sa.String(255), nullable=True))
    
    # Make product_id nullable in supply_requests (for open requests)
    op.alter_column('supply_requests', 'product_id', nullable=True)


def downgrade():
    # Remove fields from supply_offers
    op.drop_index('idx_supply_offers_direct_order', 'supply_offers')
    op.drop_constraint('fk_supply_offers_product_id', 'supply_offers', type_='foreignkey')
    op.drop_column('supply_offers', 'product_id')
    op.drop_column('supply_offers', 'order_source')
    op.drop_column('supply_offers', 'is_direct_order')
    
    # Revert supply_request_id to not nullable
    op.alter_column('supply_offers', 'supply_request_id', nullable=False)
    
    # Remove fields from supply_requests
    op.drop_column('supply_requests', 'product_name')
    op.alter_column('supply_requests', 'product_id', nullable=False)
