"""warehouse management system

Revision ID: warehouse_mgmt_001
Revises: eeb1fb7f5aa8
Create Date: 2025-11-01 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'warehouse_mgmt_001'
down_revision = 'eeb1fb7f5aa8'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create warehouse_locations table
    op.create_table(
        'warehouse_locations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('zone_type', sa.String(50), nullable=False),  # cold_room, freezer, dry_storage, ambient
        sa.Column('capacity', sa.Numeric(10, 2), nullable=True),
        sa.Column('current_utilization', sa.Numeric(10, 2), default=0, nullable=False),
        sa.Column('temperature_min', sa.Numeric(5, 2), nullable=True),  # Min temperature in Celsius
        sa.Column('temperature_max', sa.Numeric(5, 2), nullable=True),  # Max temperature in Celsius
        sa.Column('humidity_level', sa.String(50), nullable=True),  # e.g., "Low", "Medium", "High"
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_warehouse_locations_code', 'warehouse_locations', ['code'])
    op.create_index('ix_warehouse_locations_zone_type', 'warehouse_locations', ['zone_type'])

    # 2. Extend warehouse_inventory table
    op.add_column('warehouse_inventory', sa.Column('warehouse_location_id', sa.String(), nullable=True))
    op.add_column('warehouse_inventory', sa.Column('manufacturing_date', sa.DateTime(timezone=True), nullable=True))
    
    # Add is_perishable as nullable first, set default, then make NOT NULL
    op.add_column('warehouse_inventory', sa.Column('is_perishable', sa.Boolean(), nullable=True))
    op.execute("UPDATE warehouse_inventory SET is_perishable = false WHERE is_perishable IS NULL")
    op.alter_column('warehouse_inventory', 'is_perishable', nullable=False, server_default=sa.false())
    
    op.add_column('warehouse_inventory', sa.Column('storage_condition', sa.String(100), nullable=True))
    op.add_column('warehouse_inventory', sa.Column('unit_cost', sa.Numeric(10, 2), nullable=True))
    op.add_column('warehouse_inventory', sa.Column('total_cost', sa.Numeric(12, 2), nullable=True))
    
    # Dual quantity support (pieces and weight)
    op.add_column('warehouse_inventory', sa.Column('quantity_in_pieces', sa.Numeric(10, 2), nullable=True))
    op.add_column('warehouse_inventory', sa.Column('quantity_in_weight', sa.Numeric(10, 2), nullable=True))
    op.add_column('warehouse_inventory', sa.Column('weight_unit', sa.String(20), nullable=True))  # kg, g, lbs
    
    # Add foreign key
    op.create_foreign_key(
        'fk_warehouse_inventory_location',
        'warehouse_inventory', 'warehouse_locations',
        ['warehouse_location_id'], ['id'],
        ondelete='SET NULL'
    )

    # 3. Create goods_received_notes table
    op.create_table(
        'goods_received_notes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('grn_number', sa.String(50), nullable=False, unique=True),
        sa.Column('supplier_id', sa.String(), nullable=False),
        sa.Column('product_id', sa.String(), nullable=False),
        sa.Column('batch_number', sa.String(100), nullable=True),
        
        # Dual quantity support
        sa.Column('quantity_received_pieces', sa.Numeric(10, 2), nullable=True),
        sa.Column('quantity_received_weight', sa.Numeric(10, 2), nullable=True),
        sa.Column('weight_unit', sa.String(20), nullable=True),  # kg, g, lbs
        
        # Costing
        sa.Column('unit_cost', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_cost', sa.Numeric(12, 2), nullable=False),
        
        # Dates
        sa.Column('delivery_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('manufacturing_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True),
        
        # Location
        sa.Column('warehouse_location_id', sa.String(), nullable=False),
        
        # Quality check
        sa.Column('quality_check_status', sa.String(50), default='pending', nullable=False),  # pending, approved, rejected
        sa.Column('quality_check_by', sa.String(), nullable=True),
        sa.Column('quality_check_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('quality_notes', sa.Text(), nullable=True),
        
        # Images (JSON array of image URLs or base64)
        sa.Column('images', postgresql.JSONB(), nullable=True),
        
        # Additional info
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('received_by', sa.String(), nullable=False),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['warehouse_location_id'], ['warehouse_locations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['received_by'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['quality_check_by'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('ix_grn_number', 'goods_received_notes', ['grn_number'])
    op.create_index('ix_grn_supplier', 'goods_received_notes', ['supplier_id'])
    op.create_index('ix_grn_product', 'goods_received_notes', ['product_id'])
    op.create_index('ix_grn_status', 'goods_received_notes', ['quality_check_status'])

    # 4. Create wastage_records table
    op.create_table(
        'wastage_records',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('product_id', sa.String(), nullable=False),
        sa.Column('batch_number', sa.String(100), nullable=True),
        
        # Dual quantity support
        sa.Column('quantity_wasted_pieces', sa.Numeric(10, 2), nullable=True),
        sa.Column('quantity_wasted_weight', sa.Numeric(10, 2), nullable=True),
        sa.Column('weight_unit', sa.String(20), nullable=True),
        
        # Reason
        sa.Column('reason', sa.String(50), nullable=False),  # expired, damaged, returned, contaminated, other
        sa.Column('warehouse_location_id', sa.String(), nullable=True),
        
        # Cost
        sa.Column('cost_value', sa.Numeric(12, 2), nullable=True),
        
        # Images (for documentation)
        sa.Column('images', postgresql.JSONB(), nullable=True),
        
        # Details
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by', sa.String(), nullable=False),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['warehouse_location_id'], ['warehouse_locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ondelete='RESTRICT')
    )
    op.create_index('ix_wastage_product', 'wastage_records', ['product_id'])
    op.create_index('ix_wastage_reason', 'wastage_records', ['reason'])

    # 5. Create pick_lists table
    op.create_table(
        'pick_lists',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('pick_list_number', sa.String(50), nullable=False, unique=True),
        sa.Column('order_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(50), default='pending', nullable=False),  # pending, in_progress, completed, cancelled
        sa.Column('assigned_to', sa.String(), nullable=True),
        sa.Column('priority', sa.String(20), default='medium', nullable=False),  # low, medium, high, urgent
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ondelete='SET NULL')
    )
    op.create_index('ix_pick_list_number', 'pick_lists', ['pick_list_number'])
    op.create_index('ix_pick_list_status', 'pick_lists', ['status'])
    op.create_index('ix_pick_list_order', 'pick_lists', ['order_id'])

    # 6. Create pick_list_items table
    op.create_table(
        'pick_list_items',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('pick_list_id', sa.String(), nullable=False),
        sa.Column('product_id', sa.String(), nullable=False),
        sa.Column('batch_number', sa.String(100), nullable=True),
        sa.Column('warehouse_location_id', sa.String(), nullable=True),
        
        # Dual quantity support
        sa.Column('quantity_to_pick_pieces', sa.Numeric(10, 2), nullable=True),
        sa.Column('quantity_to_pick_weight', sa.Numeric(10, 2), nullable=True),
        sa.Column('quantity_picked_pieces', sa.Numeric(10, 2), default=0, nullable=True),
        sa.Column('quantity_picked_weight', sa.Numeric(10, 2), default=0, nullable=True),
        sa.Column('weight_unit', sa.String(20), nullable=True),
        
        sa.Column('picked', sa.Boolean(), default=False, nullable=False),
        sa.Column('picked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['pick_list_id'], ['pick_lists.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['warehouse_location_id'], ['warehouse_locations.id'], ondelete='SET NULL')
    )
    op.create_index('ix_pick_list_items_pick_list', 'pick_list_items', ['pick_list_id'])
    op.create_index('ix_pick_list_items_product', 'pick_list_items', ['product_id'])


def downgrade():
    # Drop tables in reverse order
    op.drop_table('pick_list_items')
    op.drop_table('pick_lists')
    op.drop_table('wastage_records')
    op.drop_table('goods_received_notes')
    
    # Remove columns from warehouse_inventory
    op.drop_constraint('fk_warehouse_inventory_location', 'warehouse_inventory', type_='foreignkey')
    op.drop_column('warehouse_inventory', 'warehouse_location_id')
    op.drop_column('warehouse_inventory', 'manufacturing_date')
    op.drop_column('warehouse_inventory', 'is_perishable')
    op.drop_column('warehouse_inventory', 'storage_condition')
    op.drop_column('warehouse_inventory', 'unit_cost')
    op.drop_column('warehouse_inventory', 'total_cost')
    op.drop_column('warehouse_inventory', 'quantity_in_pieces')
    op.drop_column('warehouse_inventory', 'quantity_in_weight')
    op.drop_column('warehouse_inventory', 'weight_unit')
    
    # Drop warehouse_locations
    op.drop_table('warehouse_locations')
