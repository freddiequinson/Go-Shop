"""
Quick script to fix cart item prices for all users
Run this once to correct any existing cart items with wrong prices
"""

from app.db.database import SessionLocal
from app.models.cart import CartItem
from app.models.product import Product

def fix_cart_prices():
    db = SessionLocal()
    try:
        # Get all cart items
        cart_items = db.query(CartItem).all()
        
        fixed_count = 0
        for item in cart_items:
            # Get product
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                continue
            
            # Calculate correct price
            # Use price_per_quantity if available, otherwise use price_per_unit
            if product.price_per_quantity:
                correct_price_cents = product.price_per_quantity * 100
            else:
                correct_price_cents = product.price_per_unit * 100
            
            # Update if price is wrong
            if item.price_per_unit_cedis != correct_price_cents:
                print(f"Fixing {product.name}: {item.price_per_unit_cedis} -> {correct_price_cents}")
                item.price_per_unit_cedis = correct_price_cents
                item.calculate_line_total()
                fixed_count += 1
        
        db.commit()
        print(f"\n✅ Fixed {fixed_count} cart items")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Fixing cart prices...")
    fix_cart_prices()
