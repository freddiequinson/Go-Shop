"""Check tomato product pricing"""

from app.db.database import SessionLocal
from app.models.product import Product

db = SessionLocal()

# Find tomato product
tomatoes = db.query(Product).filter(Product.name.ilike('%tomato%')).all()

for tomato in tomatoes:
    print(f"\n📦 Product: {tomato.name}")
    print(f"   ID: {tomato.id}")
    print(f"   Unit Type: {tomato.unit_type.value}")
    print(f"   Price Per Unit (weight): GH₵{float(tomato.price_per_unit)}")
    print(f"   Price Per Quantity (piece): GH₵{float(tomato.price_per_quantity) if tomato.price_per_quantity else 'NOT SET'}")
    print(f"   Minimum Quantity: {float(tomato.minimum_quantity)}")

db.close()
