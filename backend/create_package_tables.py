"""
Script to create the seasonal_events, packages, and package_items tables
Run this locally to add the new package feature tables
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def create_tables():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Create seasonal_events table
        conn.execute(text("""
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
        """))
        print("✓ Created seasonal_events table")
        
        # Create packages table
        conn.execute(text("""
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
        """))
        print("✓ Created packages table")
        
        # Create package_items table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS package_items (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                package_id VARCHAR(36) NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
                product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(package_id, product_id)
            )
        """))
        print("✓ Created package_items table")
        
        # Create indexes for better query performance
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_seasonal_events_active 
            ON seasonal_events(is_active, start_date, end_date)
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_packages_event_id 
            ON packages(event_id)
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_package_items_package_id 
            ON package_items(package_id)
        """))
        print("✓ Created indexes")
        
        conn.commit()
        print("\n✅ All package tables created successfully!")

if __name__ == "__main__":
    create_tables()
