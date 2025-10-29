"""
Seed data for admin dashboard
Creates sample suppliers, riders, and images
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from decimal import Decimal

from app.models.supplier import Supplier, SupplierProduct, SupplierType, SupplierStatus
from app.models.rider import Rider, VehicleType, RiderStatus
from app.models.product import Product
from app.models.warehouse import WarehouseInventory
from app.models.user import User, UserType, VerificationStatus
from app.db.database import SessionLocal
from app.core.security import get_password_hash


def create_sample_suppliers(db: Session):
    """Create sample suppliers"""
    # Check if suppliers already exist
    existing_count = db.query(Supplier).count()
    if existing_count >= 5:
        print(f"⏭️  Skipping suppliers (already have {existing_count})")
        return []
    
    suppliers_data = [
        {
            "name": "Accra Fresh Farms",
            "supplier_type": SupplierType.FARMER,
            "contact_person": "Kwame Mensah",
            "phone": "+233244123456",
            "email": "kwame@accrafresh.com",
            "location": {"region": "Greater Accra", "city": "Accra", "address": "Achimota"},
            "verification_status": SupplierStatus.VERIFIED,
            "rating": Decimal("4.5"),
            "total_supplies": 150,
            "on_time_delivery_rate": Decimal("92.5"),
            "quality_rating": Decimal("4.3"),
            "payment_terms": "Net 30",
            "is_active": True
        },
        {
            "name": "Kumasi Vegetable Cooperative",
            "supplier_type": SupplierType.FARMER,
            "contact_person": "Ama Serwaa",
            "phone": "+233244234567",
            "email": "info@kumasiveg.com",
            "location": {"region": "Ashanti", "city": "Kumasi", "address": "Adum"},
            "verification_status": SupplierStatus.VERIFIED,
            "rating": Decimal("4.7"),
            "total_supplies": 200,
            "on_time_delivery_rate": Decimal("95.0"),
            "quality_rating": Decimal("4.6"),
            "payment_terms": "Net 15",
            "is_active": True
        },
        {
            "name": "Tema Wholesale Distributors",
            "supplier_type": SupplierType.WHOLESALER,
            "contact_person": "Kofi Asante",
            "phone": "+233244345678",
            "email": "kofi@temawholesale.com",
            "location": {"region": "Greater Accra", "city": "Tema", "address": "Community 1"},
            "verification_status": SupplierStatus.VERIFIED,
            "rating": Decimal("4.2"),
            "total_supplies": 300,
            "on_time_delivery_rate": Decimal("88.0"),
            "quality_rating": Decimal("4.0"),
            "payment_terms": "Net 45",
            "is_active": True
        },
        {
            "name": "Takoradi Fish Market",
            "supplier_type": SupplierType.DISTRIBUTOR,
            "contact_person": "Ekua Mensah",
            "phone": "+233244456789",
            "email": "ekua@takoradifish.com",
            "location": {"region": "Western", "city": "Takoradi", "address": "Market Circle"},
            "verification_status": SupplierStatus.PENDING,
            "rating": Decimal("4.0"),
            "total_supplies": 50,
            "on_time_delivery_rate": Decimal("85.0"),
            "quality_rating": Decimal("3.8"),
            "payment_terms": "Cash on delivery",
            "is_active": True
        },
        {
            "name": "Cape Coast Organic Produce",
            "supplier_type": SupplierType.MANUFACTURER,
            "contact_person": "Yaw Boateng",
            "phone": "+233244567890",
            "email": "yaw@capecoastorganic.com",
            "location": {"region": "Central", "city": "Cape Coast", "address": "University Road"},
            "verification_status": SupplierStatus.VERIFIED,
            "rating": Decimal("4.8"),
            "total_supplies": 120,
            "on_time_delivery_rate": Decimal("96.0"),
            "quality_rating": Decimal("4.9"),
            "payment_terms": "Net 30",
            "is_active": True
        }
    ]

    created_suppliers = []
    for supplier_data in suppliers_data:
        supplier = Supplier(
            id=str(uuid.uuid4()),
            supplier_code=f"SUP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            verified_at=datetime.utcnow() if supplier_data["verification_status"] == SupplierStatus.VERIFIED else None,
            last_supply_date=datetime.utcnow() - timedelta(days=7),
            **supplier_data
        )
        db.add(supplier)
        created_suppliers.append(supplier)
    
    db.commit()
    print(f"✅ Created {len(created_suppliers)} suppliers")
    return created_suppliers


def create_sample_riders(db: Session):
    """Create sample riders"""
    # Check if riders already exist
    existing_count = db.query(Rider).count()
    if existing_count >= 5:
        print(f"⏭️  Skipping riders (already have {existing_count})")
        return []
    
    riders_data = [
        {
            "phone": "+233244111222",
            "vehicle_type": VehicleType.MOTORCYCLE,
            "vehicle_number": "GR-1234-20",
            "current_status": RiderStatus.AVAILABLE,
            "rating": Decimal("4.6"),
            "total_deliveries": 250,
            "successful_deliveries": 240,
            "failed_deliveries": 5,
            "cancelled_deliveries": 5,
            "on_time_delivery_rate": Decimal("94.0"),
            "average_delivery_time_minutes": 35,
            "total_earnings": Decimal("2500.00"),
            "commission_rate": Decimal("15.0"),
            "coverage_areas": ["Accra", "Tema", "Madina"],
            "is_verified": True,
            "is_online": True,
            "is_active": True
        },
        {
            "phone": "+233244222333",
            "vehicle_type": VehicleType.VAN,
            "vehicle_number": "GR-5678-21",
            "current_status": RiderStatus.AVAILABLE,
            "rating": Decimal("4.8"),
            "total_deliveries": 180,
            "successful_deliveries": 175,
            "failed_deliveries": 3,
            "cancelled_deliveries": 2,
            "on_time_delivery_rate": Decimal("96.5"),
            "average_delivery_time_minutes": 40,
            "total_earnings": Decimal("3200.00"),
            "commission_rate": Decimal("18.0"),
            "coverage_areas": ["Kumasi", "Obuasi"],
            "is_verified": True,
            "is_online": True,
            "is_active": True
        },
        {
            "phone": "+233244333444",
            "vehicle_type": VehicleType.BICYCLE,
            "vehicle_number": "N/A",
            "current_status": RiderStatus.OFF_DUTY,
            "rating": Decimal("4.3"),
            "total_deliveries": 120,
            "successful_deliveries": 112,
            "failed_deliveries": 5,
            "cancelled_deliveries": 3,
            "on_time_delivery_rate": Decimal("90.0"),
            "average_delivery_time_minutes": 25,
            "total_earnings": Decimal("1200.00"),
            "commission_rate": Decimal("12.0"),
            "coverage_areas": ["Accra Central", "Osu"],
            "is_verified": True,
            "is_online": False,
            "is_active": True
        },
        {
            "phone": "+233244444555",
            "vehicle_type": VehicleType.MOTORCYCLE,
            "vehicle_number": "GR-9012-22",
            "current_status": RiderStatus.ON_DELIVERY,
            "rating": Decimal("4.5"),
            "total_deliveries": 200,
            "successful_deliveries": 190,
            "failed_deliveries": 7,
            "cancelled_deliveries": 3,
            "on_time_delivery_rate": Decimal("92.0"),
            "average_delivery_time_minutes": 32,
            "total_earnings": Decimal("2100.00"),
            "commission_rate": Decimal("15.0"),
            "coverage_areas": ["Takoradi", "Sekondi"],
            "is_verified": True,
            "is_online": True,
            "is_active": True
        },
        {
            "phone": "+233244555666",
            "vehicle_type": VehicleType.TRUCK,
            "vehicle_number": "GR-3456-19",
            "current_status": RiderStatus.AVAILABLE,
            "rating": Decimal("4.7"),
            "total_deliveries": 150,
            "successful_deliveries": 145,
            "failed_deliveries": 3,
            "cancelled_deliveries": 2,
            "on_time_delivery_rate": Decimal("95.0"),
            "average_delivery_time_minutes": 60,
            "total_earnings": Decimal("4500.00"),
            "commission_rate": Decimal("20.0"),
            "coverage_areas": ["Accra", "Kumasi", "Takoradi"],
            "is_verified": True,
            "is_online": True,
            "is_active": True
        }
    ]

    created_riders = []
    for i, rider_data in enumerate(riders_data):
        # Create a user for each rider
        user = User(
            id=str(uuid.uuid4()),
            email=f"rider{i+1}@goshopghana.com",
            username=f"rider{i+1}",
            full_name=f"Rider {i+1}",
            password_hash=get_password_hash("rider123"),
            user_type=UserType.SELLER,  # Riders are sellers
            is_active=True,
            verification_status=VerificationStatus.VERIFIED,
            location="Greater Accra, Ghana"
        )
        db.add(user)
        db.flush()  # Get the user ID
        
        rider = Rider(
            id=str(uuid.uuid4()),
            user_id=user.id,
            rider_code=f"RDR-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            verified_at=datetime.utcnow() if rider_data["is_verified"] else None,
            last_active_at=datetime.utcnow() if rider_data["is_online"] else datetime.utcnow() - timedelta(hours=2),
            **rider_data
        )
        db.add(rider)
        created_riders.append(rider)
    
    db.commit()
    print(f"✅ Created {len(created_riders)} riders")
    return created_riders


def update_inventory_for_products(db: Session):
    """Create warehouse inventory for existing products"""
    products = db.query(Product).limit(20).all()
    
    created_count = 0
    for product in products:
        # Check if inventory already exists
        existing = db.query(WarehouseInventory).filter(
            WarehouseInventory.product_id == product.id
        ).first()
        
        if not existing:
            # Get stock quantity, default to 100 if None
            stock_qty = float(product.stock_quantity) if product.stock_quantity else 100.0
            # Get price per unit, default to 10 if None
            price = float(product.price_per_unit) if product.price_per_unit else 10.0
            # Calculate cost price as 60% of selling price
            cost = price * 0.6
            
            inventory = WarehouseInventory(
                id=str(uuid.uuid4()),
                product_id=product.id,
                quantity_available=Decimal(str(stock_qty)),
                quantity_reserved=Decimal("0"),
                quantity_damaged=Decimal("0"),
                reorder_level=Decimal("20"),
                reorder_quantity=Decimal("50"),
                zone=f"Zone-{(created_count % 3) + 1}",
                cost_price=Decimal(str(cost)),
                total_value=Decimal(str(cost * stock_qty))
            )
            db.add(inventory)
            created_count += 1
    
    db.commit()
    print(f"✅ Created inventory for {created_count} products")


def seed_admin_data():
    """Main seed function"""
    db = SessionLocal()
    try:
        print("🌱 Seeding admin data...")
        
        # Create suppliers
        suppliers = create_sample_suppliers(db)
        
        # Create riders
        riders = create_sample_riders(db)
        
        # Create inventory
        update_inventory_for_products(db)
        
        print("✅ Admin data seeding complete!")
        print(f"   - {len(suppliers)} suppliers")
        print(f"   - {len(riders)} riders")
        print("   - Inventory updated for products")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin_data()
