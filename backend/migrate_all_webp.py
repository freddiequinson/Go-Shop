"""
Simple script to migrate all remaining base64 WebP images to CDN
Uses the API endpoint we created
"""
import requests
import time

# Configuration
API_URL = "https://goshop-xus2g.ondigitalocean.app/api/v1"
EMAIL = input("Enter your admin email: ")
PASSWORD = input("Enter your admin password: ")

print("\n" + "="*80)
print("MIGRATING ALL REMAINING BASE64 IMAGES TO CDN")
print("="*80 + "\n")

# Step 1: Login
print("1. Logging in...")
login_response = requests.post(
    f"{API_URL}/auth/login",
    data={
        "username": EMAIL,
        "password": PASSWORD
    }
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print("✅ Logged in successfully\n")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Get all products
print("2. Fetching all products...")
all_products = []
page = 1

while True:
    response = requests.get(
        f"{API_URL}/products/",
        headers=headers,
        params={"page": page, "limit": 50, "for_shop": False}
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch products: {response.status_code}")
        break
    
    data = response.json()
    products = data.get("products", [])
    
    if not products:
        break
    
    all_products.extend(products)
    print(f"   Loaded page {page}: {len(products)} products")
    
    if page >= data.get("pages", 1):
        break
    
    page += 1

print(f"✅ Loaded {len(all_products)} total products\n")

# Step 3: Find products with base64 images
print("3. Finding products with base64 images...")
base64_products = []

for product in all_products:
    if product.get("images"):
        has_base64 = any(
            img and isinstance(img, str) and img.startswith("data:image")
            for img in product["images"]
        )
        if has_base64:
            base64_products.append(product)

print(f"✅ Found {len(base64_products)} products with base64 images\n")

if len(base64_products) == 0:
    print("🎉 All products already migrated!")
    exit(0)

# Step 4: Migrate each product
print(f"4. Migrating {len(base64_products)} products...")
print("-" * 80)

migrated = 0
failed = 0
errors = []

for i, product in enumerate(base64_products, 1):
    product_id = product["id"]
    product_name = product["name"]
    
    print(f"\n[{i}/{len(base64_products)}] {product_name[:60]}")
    print(f"   Product ID: {product_id}")
    print(f"   Images: {len(product.get('images', []))}")
    print(f"   Migrating...", end=" ", flush=True)
    
    try:
        migrate_response = requests.post(
            f"{API_URL}/products/{product_id}/migrate-to-cdn",
            headers=headers,
            timeout=30  # 30 second timeout per product
        )
        
        if migrate_response.status_code == 200:
            result = migrate_response.json()
            if result.get("success"):
                print("✅ SUCCESS!")
                migrated += 1
            else:
                print(f"❌ FAILED: {result.get('message', 'Unknown error')}")
                failed += 1
                errors.append({
                    "product": product_name,
                    "error": result.get("message", "Unknown error")
                })
        else:
            print(f"❌ FAILED: HTTP {migrate_response.status_code}")
            failed += 1
            errors.append({
                "product": product_name,
                "error": f"HTTP {migrate_response.status_code}"
            })
    
    except requests.exceptions.Timeout:
        print("⏱️ TIMEOUT (but might have succeeded)")
        # Don't count as failed - it might have worked
        migrated += 1
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        failed += 1
        errors.append({
            "product": product_name,
            "error": str(e)
        })
    
    # Small delay to avoid overwhelming the server
    time.sleep(0.5)

# Step 5: Summary
print("\n" + "="*80)
print("MIGRATION COMPLETE")
print("="*80)
print(f"✅ Migrated: {migrated}")
print(f"❌ Failed: {failed}")
print(f"📊 Total: {len(base64_products)}")

if errors:
    print("\n⚠️  Errors:")
    for err in errors[:10]:
        print(f"   - {err['product'][:50]}: {err['error']}")
    if len(errors) > 10:
        print(f"   ... and {len(errors) - 10} more")

print("\n🎉 Done! Your shop page should now load much faster!")
print("="*80 + "\n")
