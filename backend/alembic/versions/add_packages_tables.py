"""add packages tables

Revision ID: add_packages_001
Revises: add_feedback_001
Create Date: 2026-02-10

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_packages_001'
down_revision = 'add_feedback_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create seasonal_events table
    op.execute("""
        CREATE TABLE IF NOT EXISTS seasonal_events (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color_code VARCHAR(7) NOT NULL DEFAULT '#FF0000',
            promo_image_url TEXT,
            lottie_animation VARCHAR(255),
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            show_popup BOOLEAN DEFAULT TRUE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    
    # Create packages table
    op.execute("""
        CREATE TABLE IF NOT EXISTS packages (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            event_id VARCHAR(36) NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url TEXT,
            package_price DECIMAL(10, 2) NOT NULL,
            original_value DECIMAL(10, 2),
            stock_quantity INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            is_featured BOOLEAN DEFAULT FALSE,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    # Create package_items table
    op.execute("""
        CREATE TABLE IF NOT EXISTS package_items (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            package_id VARCHAR(36) NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
            product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(package_id, product_id)
        )
    """)
    
    # Create indexes
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_seasonal_events_active 
        ON seasonal_events(is_active, start_date, end_date)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_packages_event_id 
        ON packages(event_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_package_items_package_id 
        ON package_items(package_id)
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS package_items CASCADE")
    op.execute("DROP TABLE IF EXISTS packages CASCADE")
    op.execute("DROP TABLE IF EXISTS seasonal_events CASCADE")
