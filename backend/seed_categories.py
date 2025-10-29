"""
Seed initial categories for GoShopGhana
Run this script to populate the database with initial categories and subcategories
"""

import asyncio
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.product import Category, Base
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        pass

async def seed_categories():
    db = get_db()
    
    try:
        # Check if categories already exist
        existing = db.query(Category).first()
        if existing:
            print("Categories already exist. Skipping seed.")
            return
        
        categories_data = [
            # Main Categories
            {"name": "Groceries", "description": "Food and grocery items", "parent": None, "subs": [
                {"name": "Vegetables", "description": "Fresh vegetables", "items": [
                    "Lettuce", "Cabbage", "Spinach", "Red Beat", "Cucumber", "Carrot",
                    "Green Pepper", "Hot Pepper", "Onion", "Tomatoes", "Shallot",
                    "Kontomire", "Garden Egg", "Gboma", "Ademe", "Okro"
                ]},
                {"name": "Fruits", "description": "Fresh fruits", "items": [
                    "Pineapple", "Orange", "Banana", "Lemon", "Lime", "Pear", "Date",
                    "Apple", "Grapes", "Passion Fruit", "Tangerine", "Water Melon",
                    "Mango", "Coconut", "Kiwi", "Avocado"
                ]},
                {"name": "Tubers", "description": "Root vegetables and tubers", "items": [
                    "Yam", "Sweet Potatoes", "Cassava", "Plantain", "Irish Potato", "Cocoyam"
                ]},
                {"name": "Spices", "description": "Spices and seasonings", "items": [
                    "Ginger", "Garlic", "Hot/Chilli Pepper", "Black Pepper", "Curry",
                    "Rosemary", "Dawadawa", "Mormorni", "Shrimp Powder", "Herring Powder",
                    "Turmeric", "Bay Leaf", "Gloves", "Prekese", "Pepreh", "Cubes"
                ]},
                {"name": "Beverages", "description": "Drinks and beverage items", "items": [
                    "Milk", "Cocoa Powder", "Sugar", "Canned Fish", "Canned Meat",
                    "Cereal Mix", "Corn Flakes", "Granola", "Coffee", "Cappuccino",
                    "Soft Drinks", "Beers", "Wine", "Gins", "Bitters", "Cider & Perry",
                    "Spirits", "Whisky"
                ]},
                {"name": "Animal Protein", "description": "Meat, fish, and eggs", "items": [
                    "Beef (Cow)", "Mutton (Goat meat)", "Pork", "Lamb Meat", "Chicken",
                    "Turkey", "Guinea Fowl", "Tilapia", "Salmon Fish", "Kpanla Fish",
                    "Cat Fish", "Cassava Fish", "Red Fish", "Mud Fish", "Egg"
                ]},
                {"name": "Seeds & Nuts", "description": "Seeds and nuts", "items": [
                    "Almond", "Groundnut", "Pistachio", "Walnuts", "Cashew", "Hazelnut",
                    "Tiger Nut", "Pumpkin Seed", "Sunflower Seed", "Sesame Seed"
                ]},
                {"name": "Grains", "description": "Grains and cereals", "items": [
                    "Rice", "Maize", "Beans", "Garri (Cassava)", "Garri (Sweet Potato)",
                    "Bambara Beans", "Millet", "Soya Beans", "Sorghum", "Wheat"
                ]},
            ]},
            {"name": "Water", "description": "Bottled and mineral water", "parent": None, "subs": []},
            {"name": "Men's Fashion", "description": "Men's clothing and accessories", "parent": None, "subs": []},
            {"name": "Women's Fashion", "description": "Women's clothing and accessories", "parent": None, "subs": []},
            {"name": "Baby", "description": "Baby products and essentials", "parent": None, "subs": []},
            {"name": "Boy's Fashion", "description": "Boys' clothing and accessories", "parent": None, "subs": []},
            {"name": "Girls Fashion", "description": "Girls' clothing and accessories", "parent": None, "subs": []},
            {"name": "Auto Parts", "description": "Automotive parts and accessories", "parent": None, "subs": []},
            {"name": "Electronics", "description": "Electronic devices and gadgets", "parent": None, "subs": []},
            {"name": "Toiletries", "description": "Personal care and hygiene products", "parent": None, "subs": []},
            {"name": "Arts & Craft", "description": "Art supplies and craft materials", "parent": None, "subs": []},
            {"name": "Toys and Games", "description": "Toys and games for children", "parent": None, "subs": []},
            {"name": "Pet's Supplies", "description": "Pet food and accessories", "parent": None, "subs": []},
            {"name": "Home & Kitchen", "description": "Home and kitchen essentials", "parent": None, "subs": []},
            {"name": "Health", "description": "Health and wellness products", "parent": None, "subs": []},
        ]
        
        created_count = 0
        
        for cat_data in categories_data:
            # Create main category
            main_cat = Category(
                id=str(uuid.uuid4()),
                name=cat_data["name"],
                description=cat_data.get("description"),
                parent_id=None,
                is_active=True
            )
            db.add(main_cat)
            db.flush()
            created_count += 1
            print(f"Created main category: {main_cat.name}")
            
            # Create subcategories if any
            if "subs" in cat_data and cat_data["subs"]:
                for sub_data in cat_data["subs"]:
                    sub_cat = Category(
                        id=str(uuid.uuid4()),
                        name=sub_data["name"],
                        description=sub_data.get("description"),
                        parent_id=main_cat.id,
                        is_active=True
                    )
                    db.add(sub_cat)
                    db.flush()
                    created_count += 1
                    print(f"  Created subcategory: {sub_cat.name}")
        
        db.commit()
        print(f"\n✅ Successfully created {created_count} categories!")
        print("Categories are now available in the system.")
        
    except Exception as e:
        print(f"❌ Error seeding categories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding categories...")
    asyncio.run(seed_categories())
