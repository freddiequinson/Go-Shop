"""add_delivery_otp_table

Revision ID: 308b958a51e6
Revises: add_supplier_rating_grn
Create Date: 2025-11-04 16:04:31.017109

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '308b958a51e6'
down_revision = 'add_supplier_rating_grn'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create delivery_otps table
    op.create_table(
        'delivery_otps',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('order_id', sa.String(), nullable=False),
        sa.Column('rider_id', sa.String(), nullable=False),
        sa.Column('otp_code', sa.String(length=6), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['rider_id'], ['riders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on otp_code for faster lookups
    op.create_index('ix_delivery_otps_otp_code', 'delivery_otps', ['otp_code'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_delivery_otps_otp_code', table_name='delivery_otps')
    
    # Drop table
    op.drop_table('delivery_otps')
