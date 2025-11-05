"""Check the actual column type in PostgreSQL"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# Create engine
engine = create_engine(settings.DATABASE_URL)

# Check column type
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'delivery_address'
    """))
    
    for row in result:
        print(f"Column: {row[0]}")
        print(f"Data Type: {row[1]}")
        print(f"UDT Name: {row[2]}")
