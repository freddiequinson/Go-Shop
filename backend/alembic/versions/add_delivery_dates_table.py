"""add delivery_dates table

Revision ID: add_delivery_dates
Revises: add_user_addresses
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_delivery_dates'
down_revision = 'add_user_addresses'
branch_labels = None
depends_on = None


def upgrade():
    # Create delivery_dates table
    op.create_table(
        'delivery_dates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('day_name', sa.String(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('max_orders', sa.Integer(), nullable=True),
        sa.Column('current_orders', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date')
    )
    
    # Create index on date for faster queries
    op.create_index('ix_delivery_dates_date', 'delivery_dates', ['date'])


def downgrade():
    # Drop index
    op.drop_index('ix_delivery_dates_date', table_name='delivery_dates')
    
    # Drop table
    op.drop_table('delivery_dates')
