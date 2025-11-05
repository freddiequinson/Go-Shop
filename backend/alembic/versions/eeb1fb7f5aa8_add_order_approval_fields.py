"""add_order_approval_fields

Revision ID: eeb1fb7f5aa8
Revises: 15757e3e0cf1
Create Date: 2025-11-01 04:12:54.237527

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eeb1fb7f5aa8'
down_revision = '15757e3e0cf1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add approval tracking fields
    op.add_column('orders', sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('approved_by', sa.String(), nullable=True))
    op.add_column('orders', sa.Column('dispatched_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('dispatched_by', sa.String(), nullable=True))
    
    # Add foreign key constraints
    op.create_foreign_key('fk_orders_approved_by', 'orders', 'users', ['approved_by'], ['id'])
    op.create_foreign_key('fk_orders_dispatched_by', 'orders', 'users', ['dispatched_by'], ['id'])
    
    # Add indexes for better query performance
    op.create_index('ix_orders_approved_at', 'orders', ['approved_at'])
    op.create_index('ix_orders_approved_by', 'orders', ['approved_by'])
    op.create_index('ix_orders_dispatched_at', 'orders', ['dispatched_at'])
    op.create_index('ix_orders_dispatched_by', 'orders', ['dispatched_by'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_orders_dispatched_by', table_name='orders')
    op.drop_index('ix_orders_dispatched_at', table_name='orders')
    op.drop_index('ix_orders_approved_by', table_name='orders')
    op.drop_index('ix_orders_approved_at', table_name='orders')
    
    # Drop foreign key constraints
    op.drop_constraint('fk_orders_dispatched_by', 'orders', type_='foreignkey')
    op.drop_constraint('fk_orders_approved_by', 'orders', type_='foreignkey')
    
    # Drop columns
    op.drop_column('orders', 'dispatched_by')
    op.drop_column('orders', 'dispatched_at')
    op.drop_column('orders', 'approved_by')
    op.drop_column('orders', 'approved_at')
