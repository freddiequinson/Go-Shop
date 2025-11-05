"""add coupons table

Revision ID: add_coupons
Revises: add_delivery_settings
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = 'add_coupons'
down_revision = 'add_delivery_settings'
branch_labels = None
depends_on = None


def upgrade():
    # Create coupons table
    op.create_table(
        'coupons',
        sa.Column('id', sa.String(), nullable=False),
        
        # Basic Info
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        
        # Benefit Type
        sa.Column('benefit_type', sa.String(), nullable=False),
        
        # Discount Values
        sa.Column('discount_value', sa.Numeric(10, 2), nullable=True),
        sa.Column('discount_type', sa.String(), nullable=True),
        
        # Delivery Benefits
        sa.Column('free_delivery', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('delivery_discount_percent', sa.Numeric(5, 2), nullable=True),
        sa.Column('delivery_discount_fixed', sa.Numeric(10, 2), nullable=True),
        
        # Wallet Credit
        sa.Column('wallet_credit_amount', sa.Numeric(10, 2), nullable=True),
        
        # Product Discounts
        sa.Column('product_discount_percent', sa.Numeric(5, 2), nullable=True),
        sa.Column('product_discount_fixed', sa.Numeric(10, 2), nullable=True),
        
        # Specific Product Targeting
        sa.Column('specific_product_ids', JSON, nullable=True),
        sa.Column('specific_category_ids', JSON, nullable=True),
        
        # Restrictions
        sa.Column('min_order_amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('max_discount_amount', sa.Numeric(10, 2), nullable=True),
        
        # Usage Limits
        sa.Column('max_uses', sa.Integer(), nullable=True),
        sa.Column('max_uses_per_user', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('uses_count', sa.Integer(), nullable=True, server_default='0'),
        
        # User Restrictions
        sa.Column('user_type_restriction', sa.String(), nullable=True),
        sa.Column('first_order_only', sa.Boolean(), nullable=True, server_default='false'),
        
        # Validity
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=False),
        
        # Status
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('is_public', sa.Boolean(), nullable=True, server_default='true'),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        
        # Notes
        sa.Column('internal_notes', sa.String(), nullable=True),
        
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_coupons_code', 'coupons', ['code'], unique=True)
    op.create_index('ix_coupons_is_active', 'coupons', ['is_active'])
    op.create_index('ix_coupons_valid_dates', 'coupons', ['valid_from', 'valid_until'])


def downgrade():
    op.drop_index('ix_coupons_valid_dates', table_name='coupons')
    op.drop_index('ix_coupons_is_active', table_name='coupons')
    op.drop_index('ix_coupons_code', table_name='coupons')
    op.drop_table('coupons')
