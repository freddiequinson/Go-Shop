"""add_order_id_to_rider_locations

Revision ID: c1a150c9c413
Revises: 8d2815f8c8a3
Create Date: 2025-11-05 00:35:29.361665

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c1a150c9c413'
down_revision = '8d2815f8c8a3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add order_id column to rider_locations table
    op.add_column('rider_locations', 
        sa.Column('order_id', sa.String(), nullable=True)
    )
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_rider_locations_order_id',
        'rider_locations', 'orders',
        ['order_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Create indexes for better query performance
    op.create_index(
        'idx_rider_locations_order_id',
        'rider_locations',
        ['order_id']
    )
    
    op.create_index(
        'idx_rider_locations_rider_order',
        'rider_locations',
        ['rider_id', 'order_id', 'timestamp'],
        postgresql_ops={'timestamp': 'DESC'}
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_rider_locations_rider_order', table_name='rider_locations')
    op.drop_index('idx_rider_locations_order_id', table_name='rider_locations')
    
    # Drop foreign key
    op.drop_constraint('fk_rider_locations_order_id', 'rider_locations', type_='foreignkey')
    
    # Drop column
    op.drop_column('rider_locations', 'order_id')
