"""
Check OrderStatus enum values in database
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Check enum values in database
    result = conn.execute(text("""
        SELECT e.enumlabel 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'orderstatus'
        ORDER BY e.enumsortorder;
    """))
    
    print("OrderStatus enum values in database:")
    for row in result:
        print(f"  - {row[0]}")
