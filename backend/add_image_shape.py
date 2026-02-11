"""
Script to add image_shape column to packages table
Run this locally and on production
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_image_shape():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE packages 
                ADD COLUMN IF NOT EXISTS image_shape VARCHAR(50) DEFAULT 'heart' NOT NULL
            """))
            print("✓ Added image_shape to packages")
        except Exception as e:
            print(f"  image_shape on packages: {e}")
        
        conn.commit()
        print("\n✅ image_shape column added successfully!")

if __name__ == "__main__":
    add_image_shape()
