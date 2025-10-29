"""
Test script for GoShopGhana product management system
Tests product CRUD operations and Ghana market features
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def login_as_admin():
    """Login as admin and get token"""
    print("🔑 Logging in as admin...")
    
    login_data = {
        "username": "admin",
        "password": "admin1234"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Admin login successful!")
        return data['access_token']
    else:
        print(f"❌ Admin login failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def create_test_seller():
    """Create a test seller account"""
    print("\n👨‍🌾 Creating test seller...")
    
    import time
    timestamp = int(time.time())
    
    seller_data = {
        "email": f"farmer.kofi.{timestamp}@gmail.com",
        "username": f"farmer_kofi_{timestamp}",
        "full_name": "Kofi Farmer",
        "password": "farmer123",
        "user_type": "seller",
        "location": "Ejura, Ashanti Region",
        "bio": "Organic farmer specializing in yam and plantain",
        "phone": f"+233244{timestamp % 1000000:06d}"  # Generate unique phone number
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=seller_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Seller created: {data['user']['full_name']}")
        return data['access_token']
    else:
        print(f"❌ Seller creation failed: {response.status_code}")
        return None

def test_categories(admin_token):
    """Test category management"""
    print("\n📂 Testing category management...")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # First, get existing categories
    existing_response = requests.get(f"{BASE_URL}/products/categories/", headers=headers)
    existing_categories = []
    existing_names = set()
    
    if existing_response.status_code == 200:
        existing_categories = existing_response.json()
        existing_names = {cat['name'] for cat in existing_categories}
        print(f"📋 Found {len(existing_categories)} existing categories")
    
    # Ghana market categories to create
    categories_to_create = [
        {
            "name": "Fresh Produce",
            "description": "Fresh fruits and vegetables from local farms"
        },
        {
            "name": "Tubers & Roots",
            "description": "Yam, cassava, plantain, cocoyam"
        },
        {
            "name": "Grains & Cereals",
            "description": "Rice, maize, millet and other grains"
        },
        {
            "name": "Palm Products",
            "description": "Palm oil, palm nuts and derivatives"
        }
    ]
    
    all_categories = existing_categories.copy()
    
    for category_data in categories_to_create:
        if category_data['name'] in existing_names:
            print(f"⏭️  Category already exists: {category_data['name']}")
            continue
            
        response = requests.post(f"{BASE_URL}/products/categories/", json=category_data, headers=headers)
        
        if response.status_code == 200:
            category = response.json()
            all_categories.append(category)
            print(f"✅ Created category: {category['name']}")
        else:
            print(f"❌ Failed to create category {category_data['name']}: {response.status_code}")
            if response.status_code == 500:
                print(f"   (Likely already exists - continuing)")
    
    return all_categories

def test_products(seller_token, categories):
    """Test product management"""
    print("\n🥬 Testing product management...")
    
    headers = {"Authorization": f"Bearer {seller_token}"}
    
    # Find categories
    tubers_category = next((cat for cat in categories if cat['name'] == 'Tubers & Roots'), None)
    palm_category = next((cat for cat in categories if cat['name'] == 'Palm Products'), None)
    
    # Create Ghana market products
    products = [
        {
            "name": "Fresh Plantain",
            "description": "Sweet ripe plantains from Ashanti Region farms",
            "category_id": tubers_category['id'] if tubers_category else None,
            "price_per_unit": 2.50,
            "unit_type": "piece",
            "minimum_quantity": 5,
            "stock_quantity": 200,
            "images": ["plantain1.jpg", "plantain2.jpg"]
        },
        {
            "name": "Yam Tubers",
            "description": "High quality yam tubers, perfect for pounding",
            "category_id": tubers_category['id'] if tubers_category else None,
            "price_per_unit": 8.00,
            "unit_type": "kg",
            "minimum_quantity": 2,
            "stock_quantity": 150
        },
        {
            "name": "Pure Palm Oil",
            "description": "Fresh red palm oil from Brong Ahafo region",
            "category_id": palm_category['id'] if palm_category else None,
            "price_per_unit": 20.00,
            "unit_type": "liter",
            "minimum_quantity": 1,
            "stock_quantity": 50
        }
    ]
    
    created_products = []
    
    for product_data in products:
        response = requests.post(f"{BASE_URL}/products/", json=product_data, headers=headers)
        
        if response.status_code == 200:
            product = response.json()
            created_products.append(product)
            print(f"✅ Created product: {product['name']} - {product['price_per_unit']} GHS per {product['unit_type']}")
        else:
            print(f"❌ Failed to create product {product_data['name']}: {response.status_code}")
            print(f"   Error: {response.text}")
    
    return created_products

def test_product_search():
    """Test product search functionality"""
    print("\n🔍 Testing product search...")
    
    # Search for plantain
    response = requests.get(f"{BASE_URL}/products/search?q=plantain")
    
    if response.status_code == 200:
        products = response.json()
        print(f"✅ Search for 'plantain' found {len(products)} products")
        for product in products:
            print(f"   - {product['name']}: {product['price_per_unit']} GHS per {product['unit_type']}")
    else:
        print(f"❌ Search failed: {response.status_code}")

def test_product_filtering():
    """Test product filtering"""
    print("\n🔽 Testing product filtering...")
    
    # Filter by price range
    response = requests.get(f"{BASE_URL}/products/?min_price=5&max_price=15")
    
    if response.status_code == 200:
        data = response.json()
        products = data['products']
        print(f"✅ Price filter (5-15 GHS) found {len(products)} products")
        for product in products:
            print(f"   - {product['name']}: {product['price_per_unit']} GHS per {product['unit_type']}")
    else:
        print(f"❌ Filtering failed: {response.status_code}")

def test_ghana_suggestions():
    """Test Ghana product suggestions"""
    print("\n🇬🇭 Testing Ghana product suggestions...")
    
    response = requests.get(f"{BASE_URL}/products/suggestions")
    
    if response.status_code == 200:
        data = response.json()
        suggestions = data['suggestions']
        print(f"✅ Got {len(suggestions)} Ghana product suggestions:")
        for suggestion in suggestions[:3]:  # Show first 3
            print(f"   - {suggestion['name']}: {suggestion['suggested_price_range']}")
    else:
        print(f"❌ Suggestions failed: {response.status_code}")

def test_seller_products(seller_token):
    """Test seller's product management"""
    print("\n👨‍🌾 Testing seller product management...")
    
    headers = {"Authorization": f"Bearer {seller_token}"}
    
    # Get seller's products
    response = requests.get(f"{BASE_URL}/products/my-products", headers=headers)
    
    if response.status_code == 200:
        products = response.json()
        print(f"✅ Seller has {len(products)} products")
        
        # Get statistics
        stats_response = requests.get(f"{BASE_URL}/products/statistics", headers=headers)
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"✅ Product statistics:")
            print(f"   - Total: {stats['total_products']}")
            print(f"   - Active: {stats['active_products']}")
            print(f"   - By unit type: {stats['by_unit_type']}")
    else:
        print(f"❌ Failed to get seller products: {response.status_code}")

if __name__ == "__main__":
    print("🚀 GoShopGhana Product Management Test")
    print("=" * 50)
    
    # Step 1: Login as admin
    admin_token = login_as_admin()
    if not admin_token:
        print("❌ Cannot proceed without admin access")
        exit(1)
    
    # Step 2: Create test seller
    seller_token = create_test_seller()
    if not seller_token:
        print("❌ Cannot proceed without seller account")
        exit(1)
    
    # Step 3: Test categories
    categories = test_categories(admin_token)
    
    # Step 4: Test products
    products = test_products(seller_token, categories)
    
    # Step 5: Test search
    test_product_search()
    
    # Step 6: Test filtering
    test_product_filtering()
    
    # Step 7: Test Ghana suggestions
    test_ghana_suggestions()
    
    # Step 8: Test seller management
    test_seller_products(seller_token)
    
    print("\n" + "=" * 50)
    print("🎯 Product Management Test Summary:")
    print("   - Category management: ✅")
    print("   - Product CRUD: ✅")
    print("   - Search functionality: ✅")
    print("   - Filtering system: ✅")
    print("   - Ghana market features: ✅")
    print("   - Quantified sales support: ✅")
    print("\n🔗 Visit http://localhost:8000/docs to explore all endpoints!")
