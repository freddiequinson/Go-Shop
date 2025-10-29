"""Rename cents columns to cedis for Ghana market

Revision ID: b246b14e79e9
Revises: 138b3bd2d37e
Create Date: 2025-09-22 02:26:03.441002

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b246b14e79e9'
down_revision = '138b3bd2d37e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename cents columns to cedis in orders table
    op.alter_column('orders', 'subtotal_cents', new_column_name='subtotal_cedis')
    op.alter_column('orders', 'delivery_fee_cents', new_column_name='delivery_fee_cedis')
    op.alter_column('orders', 'tax_cents', new_column_name='tax_cedis')
    op.alter_column('orders', 'total_cents', new_column_name='total_cedis')
    
    # Rename cents columns to cedis in order_items table
    op.alter_column('order_items', 'price_per_unit_cents', new_column_name='price_per_unit_cedis')
    op.alter_column('order_items', 'line_total_cents', new_column_name='line_total_cedis')
    
    # Rename cents columns to cedis in cart_items table
    op.alter_column('cart_items', 'price_per_unit_cents', new_column_name='price_per_unit_cedis')
    op.alter_column('cart_items', 'line_total_cents', new_column_name='line_total_cedis')


def downgrade() -> None:
    # Revert cedis columns back to cents in cart_items table
    op.alter_column('cart_items', 'line_total_cedis', new_column_name='line_total_cents')
    op.alter_column('cart_items', 'price_per_unit_cedis', new_column_name='price_per_unit_cents')
    
    # Revert cedis columns back to cents in order_items table
    op.alter_column('order_items', 'line_total_cedis', new_column_name='line_total_cents')
    op.alter_column('order_items', 'price_per_unit_cedis', new_column_name='price_per_unit_cents')
    
    # Revert cedis columns back to cents in orders table
    op.alter_column('orders', 'total_cedis', new_column_name='total_cents')
    op.alter_column('orders', 'tax_cedis', new_column_name='tax_cents')
    op.alter_column('orders', 'delivery_fee_cedis', new_column_name='delivery_fee_cents')
    op.alter_column('orders', 'subtotal_cedis', new_column_name='subtotal_cents')
