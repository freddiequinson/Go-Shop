"""add delivery_settings table

Revision ID: add_delivery_settings
Revises: add_delivery_dates
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_delivery_settings'
down_revision = 'add_delivery_dates'
branch_labels = None
depends_on = None


def upgrade():
    # Create delivery_settings table
    op.create_table(
        'delivery_settings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('warehouse_name', sa.String(), nullable=False),
        sa.Column('warehouse_latitude', sa.Float(), nullable=False),
        sa.Column('warehouse_longitude', sa.Float(), nullable=False),
        sa.Column('warehouse_address', sa.String(), nullable=True),
        
        # Pricing method
        sa.Column('pricing_method', sa.String(), nullable=False, server_default='flat'),
        
        # Flat rate pricing
        sa.Column('flat_rate', sa.Numeric(10, 2), nullable=True, server_default='10.00'),
        
        # Distance-based pricing
        sa.Column('base_price', sa.Numeric(10, 2), nullable=True, server_default='5.00'),
        sa.Column('price_per_km', sa.Numeric(10, 2), nullable=True, server_default='2.00'),
        sa.Column('free_delivery_radius', sa.Float(), nullable=True, server_default='2.0'),
        sa.Column('max_delivery_distance', sa.Float(), nullable=True, server_default='20.0'),
        
        # Zone-based pricing
        sa.Column('zone_prices', sa.JSON(), nullable=True),
        
        # Yango API credentials
        sa.Column('yango_clid', sa.String(), nullable=True),
        sa.Column('yango_apikey', sa.String(), nullable=True),
        sa.Column('yango_ref', sa.String(), nullable=True),
        sa.Column('default_fare_class', sa.String(), nullable=True),
        
        # Settings
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('currency', sa.String(), nullable=True, server_default='GHS'),
        sa.Column('notes', sa.String(), nullable=True),
        
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('delivery_settings')
