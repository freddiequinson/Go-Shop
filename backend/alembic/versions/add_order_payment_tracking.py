"""add order payment tracking

Revision ID: add_order_payment_tracking
Revises: add_delivery_coupon_orders
Create Date: 2025-10-31 15:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_order_payment_tracking'
down_revision = 'add_delivery_coupon_orders'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new order statuses to enum
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'pending_payment'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'payment_failed'")
    
    # Create payment status enum if it doesn't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE paymentstatus AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Add payment fields to orders table using raw SQL to avoid enum recreation
    op.execute("""
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS payment_status paymentstatus DEFAULT 'pending' NOT NULL,
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR,
        ADD COLUMN IF NOT EXISTS payment_reference VARCHAR,
        ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE
    """)
    
    # Create payment_attempts table using raw SQL
    op.execute("""
        CREATE TABLE IF NOT EXISTS payment_attempts (
            id VARCHAR PRIMARY KEY,
            order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            amount_cedis NUMERIC(12, 0) NOT NULL,
            payment_reference VARCHAR,
            status paymentstatus NOT NULL,
            payment_method VARCHAR,
            error_message TEXT,
            paystack_response JSON,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
    """)
    
    # Create indexes for better query performance
    op.create_index('ix_payment_attempts_order_id', 'payment_attempts', ['order_id'])
    op.create_index('ix_payment_attempts_status', 'payment_attempts', ['status'])
    op.create_index('ix_orders_payment_status', 'orders', ['payment_status'])
    op.create_index('ix_orders_payment_reference', 'orders', ['payment_reference'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_orders_payment_reference', table_name='orders')
    op.drop_index('ix_orders_payment_status', table_name='orders')
    op.drop_index('ix_payment_attempts_status', table_name='payment_attempts')
    op.drop_index('ix_payment_attempts_order_id', table_name='payment_attempts')
    
    # Drop payment_attempts table
    op.drop_table('payment_attempts')
    
    # Remove payment fields from orders
    op.drop_column('orders', 'payment_completed_at')
    op.drop_column('orders', 'payment_reference')
    op.drop_column('orders', 'payment_method')
    op.drop_column('orders', 'payment_status')
    
    # Drop payment status enum
    op.execute('DROP TYPE IF EXISTS paymentstatus')
    
    # Note: Cannot remove values from orderstatus enum in PostgreSQL
    # The new values will remain but won't be used
