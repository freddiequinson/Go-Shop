"""
Seed hierarchical categories for GoShopGhana
Creates parent categories and their subcategories
Run: python seed_categories_hierarchical.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.product import Category, Base
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    return db

def seed_categories():
    db = get_db()
    
    try:
        # Define the hierarchical category structure
        categories_structure = [
            {
                "name": "Groceries",
                "description": "Food and grocery items",
                "subcategories": [
                    {"name": "Vegetables", "description": "Fresh vegetables"},
                    {"name": "Fruits", "description": "Fresh fruits"},
                    {"name": "Tubers", "description": "Root vegetables and tubers"},
                    {"name": "Spices", "description": "Spices and seasonings"},
                    {"name": "Beverages", "description": "Drinks and beverage items"},
                    {"name": "Animal Protein", "description": "Meat, fish, and eggs"},
                    {"name": "Seeds & Nuts", "description": "Seeds and nuts"},
                    {"name": "Grains", "description": "Grains and cereals"},
                    {"name": "Water", "description": "Bottled and mineral water"},
                ]
            },
            {
                "name": "Men's Fashion",
                "description": "Men's clothing and accessories",
                "subcategories": []
            },
            {
                "name": "Women's Fashion",
                "description": "Women's clothing and accessories",
                "subcategories": []
            },
            {
                "name": "Baby",
                "description": "Baby products and essentials",
                "subcategories": []
            },
            {
                "name": "Boy's Fashion",
                "description": "Boys' clothing and accessories",
                "subcategories": []
            },
            {
                "name": "Girls Fashion",
                "description": "Girls' clothing and accessories",
                "subcategories": []
            },
            {
                "name": "Auto Parts",
                "description": "Automotive parts and accessories",
                "subcategories": []
            },
            {
                "name": "Electronics",
                "description": "Electronic devices and gadgets",
                "subcategories": []
            },
            {
                "name": "Toiletries",
                "description": "Personal care and hygiene products",
                "subcategories": []
            },
            {
                "name": "Arts & Craft",
                "description": "Art supplies and craft materials",
                "subcategories": []
            },
            {
                "name": "Toys and Games",
                "description": "Toys and games for children",
                "subcategories": []
            },
            {
                "name": "Pet's Supplies",
                "description": "Pet food and accessories",
                "subcategories": []
            },
            {
                "name": "Home & Kitchen",
                "description": "Home and kitchen essentials",
                "subcategories": []
            },
            {
                "name": "Health",
                "description": "Health and wellness products",
                "subcategories": []
            },
        ]
        
        created_count = 0
        
        print("🌱 Starting category seeding...\n")
        
        for cat_data in categories_structure:
            # Create main/parent category
            main_cat = Category(
                id=str(uuid.uuid4()),
                name=cat_data["name"],
                description=cat_data.get("description", ""),
                parent_id=None,
                is_active=True
            )
            db.add(main_cat)
            db.flush()
            created_count += 1
            print(f"✅ Created parent category: {main_cat.name}")
            
            # Create subcategories if any
            if cat_data.get("subcategories"):
                for sub_data in cat_data["subcategories"]:
                    sub_cat = Category(
                        id=str(uuid.uuid4()),
                        name=sub_data["name"],
                        description=sub_data.get("description", ""),
                        parent_id=main_cat.id,
                        is_active=True
                    )
                    db.add(sub_cat)
                    db.flush()
                    created_count += 1
                    print(f"  ├─ Created subcategory: {sub_cat.name}")
                print()  # Empty line after each parent with subs
        
        db.commit()
        print(f"\n🎉 Successfully created {created_count} categories!")
        print(f"   - Parent categories: {len(categories_structure)}")
        print(f"   - Subcategories: {created_count - len(categories_structure)}")
        print("\nCategories are now available in the system.")
        
    except Exception as e:
        print(f"❌ Error seeding categories: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("GoShopGhana - Hierarchical Category Seeder")
    print("=" * 60)
    seed_categories()
    print("=" * 60)
