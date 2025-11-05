"""add delivery and coupon fields to orders

Revision ID: add_delivery_coupon_orders
Revises: add_coupons
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_delivery_coupon_orders'
down_revision = 'add_coupons'
branch_labels = None
depends_on = None


def upgrade():
    # Add delivery pricing fields to orders table
    op.add_column('orders', sa.Column('delivery_price', sa.Numeric(10, 2), nullable=True))
    op.add_column('orders', sa.Column('delivery_method', sa.String(), nullable=True))
    op.add_column('orders', sa.Column('delivery_distance', sa.Numeric(10, 2), nullable=True))
    op.add_column('orders', sa.Column('is_free_delivery', sa.String(), server_default='false', nullable=False))
    
    # Add coupon fields to orders table
    op.add_column('orders', sa.Column('coupon_code', sa.String(), nullable=True))
    op.add_column('orders', sa.Column('coupon_discount', sa.Numeric(10, 2), nullable=True))


def downgrade():
    # Remove coupon fields
    op.drop_column('orders', 'coupon_discount')
    op.drop_column('orders', 'coupon_code')
    
    # Remove delivery pricing fields
    op.drop_column('orders', 'is_free_delivery')
    op.drop_column('orders', 'delivery_distance')
    op.drop_column('orders', 'delivery_method')
    op.drop_column('orders', 'delivery_price')
