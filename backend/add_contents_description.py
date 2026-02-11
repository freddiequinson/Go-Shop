"""
Script to add contents_description column to packages table
Run this locally and on production to enable description-only packages
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_contents_description():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE packages 
                ADD COLUMN IF NOT EXISTS contents_description TEXT
            """))
            print("✓ Added contents_description to packages")
        except Exception as e:
            print(f"  contents_description on packages: {e}")
        
        conn.commit()
        print("\n✅ contents_description column added successfully!")

if __name__ == "__main__":
    add_contents_description()
