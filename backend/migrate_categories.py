"""
Migrate flat categories into hierarchical parent→sub structure for GoShopGhana.
This script:
1. Creates new parent (mega) categories
2. Reassigns existing sub-categories under the correct parent
3. Products keep their existing category_id (sub-category), so no product data changes needed

Run on production: python migrate_categories.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.product import Category, Base
import uuid

# The mapping: parent_name -> list of existing sub-category names
CATEGORY_HIERARCHY = {
    "Protein & Canned Foods": {
        "description": "Meat, fish, and canned food products",
        "subcategories": [
            "Animal Protein",
            "Canned Beef",
            "Canned Fish",
            "Canned Tuna",
            "Canned Baked Beans",
        ]
    },
    "Grains, Pasta & Staples": {
        "description": "Grains, cereals, flour, pasta and noodles",
        "subcategories": [
            "Grains",
            "Cereals",
            "Flour",
            "Spaghetti",
            "Noodles",
        ]
    },
    "Nuts, Seeds & Spreads": {
        "description": "Nuts, seeds, butter, jams and spreads",
        "subcategories": [
            "Seeds & Nuts",
            "Groundnut (Peanut) Butter",
            "Jams",
            "Mayonaise",
            "Spread",
        ]
    },
    "Fresh Produce": {
        "description": "Fresh fruits, vegetables, and herbs",
        "subcategories": [
            "Fresh Fruits",
            "Fresh Vegetable",
            "Fresh Herb & Spices",
        ]
    },
    "Frozen Foods": {
        "description": "Frozen vegetables, chips and more",
        "subcategories": [
            "Frozen Vegetable",
            "Frozen Chips",
        ]
    },
    "Pantry Essentials": {
        "description": "Cooking oils, pastes, seasonings and extracts",
        "subcategories": [
            "Cooking Oil",
            "Tomato Paste",
            "Seasoning",
            "Extracts",
        ]
    },
    "Herbs, Spices & Dry Ingredients": {
        "description": "Dried herbs, spices, leaves and dry fruit",
        "subcategories": [
            "Dry Leaves",
            "Herbs & Spices",
            "Dry Fruit",
        ]
    },
    "Beverages": {
        "description": "Drinks, juices and beverages",
        "subcategories": [
            "Beverage",
            "Fruit Juice",
        ]
    },
    "Tubers & Root Crops": {
        "description": "Yams, cassava, sweet potatoes and more",
        "subcategories": [
            "Tubers",
        ]
    },
    "Snacks": {
        "description": "Chips, biscuits and snack items",
        "subcategories": [
            "Snacks",
        ]
    },
}


def migrate():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("GoShopGhana - Category Hierarchy Migration")
        print("=" * 60)
        
        # Get all existing categories
        existing = {c.name: c for c in db.query(Category).all()}
        print(f"\nFound {len(existing)} existing categories")
        
        created_parents = 0
        reassigned_subs = 0
        skipped = 0
        
        for parent_name, config in CATEGORY_HIERARCHY.items():
            print(f"\n📁 {parent_name}")
            
            # Check if parent already exists
            if parent_name in existing:
                parent = existing[parent_name]
                print(f"   (already exists, id={parent.id})")
            else:
                # Create parent category
                parent = Category(
                    id=str(uuid.uuid4()),
                    name=parent_name,
                    description=config["description"],
                    parent_id=None,
                    is_active=True
                )
                db.add(parent)
                db.flush()
                created_parents += 1
                print(f"   ✅ Created (id={parent.id})")
            
            # Reassign sub-categories
            for sub_name in config["subcategories"]:
                if sub_name in existing:
                    sub = existing[sub_name]
                    if sub.parent_id == parent.id:
                        print(f"   ├─ {sub_name} (already assigned)")
                        skipped += 1
                    else:
                        old_parent = sub.parent_id
                        sub.parent_id = parent.id
                        reassigned_subs += 1
                        print(f"   ├─ {sub_name} → reassigned (was parent_id={old_parent})")
                else:
                    # Sub-category doesn't exist yet, create it
                    new_sub = Category(
                        id=str(uuid.uuid4()),
                        name=sub_name,
                        description=f"{sub_name} products",
                        parent_id=parent.id,
                        is_active=True
                    )
                    db.add(new_sub)
                    db.flush()
                    reassigned_subs += 1
                    print(f"   ├─ {sub_name} → created new sub-category")
        
        db.commit()
        
        print(f"\n{'=' * 60}")
        print(f"✅ Migration complete!")
        print(f"   Parent categories created: {created_parents}")
        print(f"   Sub-categories reassigned/created: {reassigned_subs}")
        print(f"   Already correct (skipped): {skipped}")
        print(f"{'=' * 60}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
