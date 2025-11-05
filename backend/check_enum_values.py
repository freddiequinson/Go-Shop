"""Check the actual enum values in PostgreSQL"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# Create engine
engine = create_engine(settings.DATABASE_URL)

# Check enum values
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT e.enumlabel
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'orderstatus'
        ORDER BY e.enumsortorder
    """))
    
    print("OrderStatus enum values in database:")
    for row in result:
        print(f"  - {row[0]}")
