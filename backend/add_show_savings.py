"""
Script to add show_savings column to packages table
Run this locally and on production
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_show_savings():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE packages 
                ADD COLUMN IF NOT EXISTS show_savings BOOLEAN DEFAULT TRUE NOT NULL
            """))
            print("✓ Added show_savings to packages")
        except Exception as e:
            print(f"  show_savings on packages: {e}")
        
        conn.commit()
        print("\n✅ show_savings column added successfully!")

if __name__ == "__main__":
    add_show_savings()
