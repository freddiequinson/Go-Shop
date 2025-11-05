import sys
sys.path.insert(0, '.')

from app.db.database import SessionLocal
from sqlalchemy import inspect

db = SessionLocal()
inspector = inspect(db.bind)
tables = inspector.get_table_names()

print("Checking for delivery_settings table...")
print(f"delivery_settings exists: {'delivery_settings' in tables}")
print(f"\nAll tables with 'delivery' in name:")
for table in tables:
    if 'delivery' in table:
        print(f"  - {table}")

if 'delivery_settings' in tables:
    columns = inspector.get_columns('delivery_settings')
    print(f"\nColumns in delivery_settings:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
