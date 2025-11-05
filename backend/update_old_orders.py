"""
Script to update old orders with uppercase status to lowercase
Run this once to fix existing orders in the database
"""
from app.db.database import SessionLocal
from app.models.order import Order
from sqlalchemy import text

def update_order_statuses():
    db = SessionLocal()
    try:
        # Update all orders with uppercase CONFIRMED to lowercase confirmed
        result = db.execute(
            text("UPDATE orders SET status = 'confirmed' WHERE status = 'CONFIRMED'")
        )
        db.commit()
        print(f"✅ Updated {result.rowcount} orders from 'CONFIRMED' to 'confirmed'")
        
        # Update other uppercase statuses if they exist
        statuses_to_update = [
            ('PENDING', 'pending'),
            ('PREPARING', 'preparing'),
            ('DISPATCHED', 'dispatched'),
            ('DELIVERED', 'delivered'),
            ('CANCELLED', 'cancelled')
        ]
        
        for old_status, new_status in statuses_to_update:
            result = db.execute(
                text(f"UPDATE orders SET status = '{new_status}' WHERE status = '{old_status}'")
            )
            if result.rowcount > 0:
                db.commit()
                print(f"✅ Updated {result.rowcount} orders from '{old_status}' to '{new_status}'")
        
        print("\n🎉 All order statuses updated successfully!")
        
    except Exception as e:
        print(f"❌ Error updating orders: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Updating order statuses...")
    update_order_statuses()
