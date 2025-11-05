"""Check current cart items and their prices"""

from app.db.database import SessionLocal
from app.models.cart import CartItem
from app.models.product import Product

db = SessionLocal()

# Get all cart items
cart_items = db.query(CartItem).all()

print(f"\n📦 Found {len(cart_items)} cart items:\n")

for item in cart_items:
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if product:
        print(f"Product: {product.name}")
        print(f"  Quantity: {float(item.quantity)}")
        print(f"  Price per unit (stored in cart): {float(item.price_per_unit_cedis)} cedis")
        print(f"  Line total (stored in cart): {float(item.line_total_cedis)} cedis")
        print(f"  Product price_per_unit: {float(product.price_per_unit)} GHS")
        print(f"  Product price_per_quantity: {float(product.price_per_quantity) if product.price_per_quantity else 'None'} GHS")
        print(f"  Product unit_type: {product.unit_type.value}")
        
        # Calculate what it should be
        if product.price_per_quantity:
            should_be = float(product.price_per_quantity) * 100
        else:
            should_be = float(product.price_per_unit) * 100
        
        print(f"  ✓ Should be: {should_be} cedis")
        print(f"  {'✅ CORRECT' if item.price_per_unit_cedis == should_be else '❌ WRONG'}")
        print()

db.close()
