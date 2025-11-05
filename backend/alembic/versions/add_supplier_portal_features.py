"""add supplier portal features

Revision ID: supplier_portal_001
Revises: product_publish_001
Create Date: 2025-11-01 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'supplier_portal_001'
down_revision = 'product_publish_001'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add SUPPLIER to UserType enum
    op.execute("ALTER TYPE usertype ADD VALUE IF NOT EXISTS 'supplier'")
    
    # 2. Add new columns to suppliers table
    op.add_column('suppliers', sa.Column('user_id', sa.String(), nullable=True))
    op.add_column('suppliers', sa.Column('categories', postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column('suppliers', sa.Column('delivery_radius_km', sa.Integer(), nullable=True))
    op.add_column('suppliers', sa.Column('delivery_fee', sa.Numeric(10, 2), nullable=True))
    op.add_column('suppliers', sa.Column('min_order_value', sa.Numeric(10, 2), nullable=True))
    
    # Add foreign key constraint for user_id
    op.create_foreign_key(
        'fk_suppliers_user_id',
        'suppliers', 'users',
        ['user_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Add unique constraint for user_id
    op.create_unique_constraint('uq_suppliers_user_id', 'suppliers', ['user_id'])
    
    # 3. Create supply_requests table
    op.create_table(
        'supply_requests',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('request_number', sa.String(50), nullable=False),
        sa.Column('product_id', sa.String(), nullable=False),
        sa.Column('quantity_needed', sa.Numeric(10, 2), nullable=False),
        sa.Column('unit_type', sa.String(20), nullable=False),
        sa.Column('supplier_id', sa.String(), nullable=True),
        sa.Column('is_open_request', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('target_categories', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('required_by_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('delivery_location', sa.String(255), nullable=True),
        sa.Column('max_budget', sa.Numeric(10, 2), nullable=True),
        sa.Column('estimated_unit_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('status', sa.Enum(
            'draft', 'sent', 'responded', 'accepted', 'rejected', 'completed', 'cancelled',
            name='supplyrequestatus'
        ), nullable=False, server_default='draft'),
        sa.Column('created_by_user_id', sa.String(), nullable=False),
        sa.Column('accepted_offer_id', sa.String(), nullable=True),
        sa.Column('special_requirements', sa.Text(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for supply_requests
    op.create_index('ix_supply_requests_request_number', 'supply_requests', ['request_number'], unique=True)
    op.create_index('ix_supply_requests_status', 'supply_requests', ['status'])
    op.create_index('ix_supply_requests_is_open', 'supply_requests', ['is_open_request'])
    op.create_index('ix_supply_requests_created_at', 'supply_requests', ['created_at'])
    
    # 4. Create supply_offers table
    op.create_table(
        'supply_offers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('supply_request_id', sa.String(), nullable=False),
        sa.Column('supplier_id', sa.String(), nullable=False),
        sa.Column('offered_quantity', sa.Numeric(10, 2), nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('delivery_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('delivery_time_hours', sa.Integer(), nullable=True),
        sa.Column('delivery_fee', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('quality_guarantee', sa.Text(), nullable=True),
        sa.Column('sample_available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('certifications', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('status', sa.Enum(
            'pending', 'accepted', 'rejected', 'withdrawn',
            name='supplyofferstatus'
        ), nullable=False, server_default='pending'),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('withdrawn_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['supply_request_id'], ['supply_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for supply_offers
    op.create_index('ix_supply_offers_request_id', 'supply_offers', ['supply_request_id'])
    op.create_index('ix_supply_offers_supplier_id', 'supply_offers', ['supplier_id'])
    op.create_index('ix_supply_offers_status', 'supply_offers', ['status'])
    op.create_index('ix_supply_offers_created_at', 'supply_offers', ['created_at'])
    
    # 5. Add foreign key for accepted_offer_id in supply_requests (after supply_offers table exists)
    op.create_foreign_key(
        'fk_supply_requests_accepted_offer',
        'supply_requests', 'supply_offers',
        ['accepted_offer_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    # Drop foreign keys first
    op.drop_constraint('fk_supply_requests_accepted_offer', 'supply_requests', type_='foreignkey')
    
    # Drop indexes
    op.drop_index('ix_supply_offers_created_at', 'supply_offers')
    op.drop_index('ix_supply_offers_status', 'supply_offers')
    op.drop_index('ix_supply_offers_supplier_id', 'supply_offers')
    op.drop_index('ix_supply_offers_request_id', 'supply_offers')
    
    op.drop_index('ix_supply_requests_created_at', 'supply_requests')
    op.drop_index('ix_supply_requests_is_open', 'supply_requests')
    op.drop_index('ix_supply_requests_status', 'supply_requests')
    op.drop_index('ix_supply_requests_request_number', 'supply_requests')
    
    # Drop tables
    op.drop_table('supply_offers')
    op.drop_table('supply_requests')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS supplyofferstatus')
    op.execute('DROP TYPE IF EXISTS supplyrequestatus')
    
    # Drop constraints and columns from suppliers
    op.drop_constraint('uq_suppliers_user_id', 'suppliers', type_='unique')
    op.drop_constraint('fk_suppliers_user_id', 'suppliers', type_='foreignkey')
    
    op.drop_column('suppliers', 'min_order_value')
    op.drop_column('suppliers', 'delivery_fee')
    op.drop_column('suppliers', 'delivery_radius_km')
    op.drop_column('suppliers', 'categories')
    op.drop_column('suppliers', 'user_id')
    
    # Note: Cannot remove 'supplier' from UserType enum easily in PostgreSQL
    # Would require recreating the enum type
