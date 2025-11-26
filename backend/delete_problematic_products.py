"""
HARD DELETE the 25 products that are timing out during migration
Uses the API with hard_delete=true parameter
You can then re-upload them and they'll automatically use CDN
"""
import requests

API_URL = "https://goshop-xus2g.ondigitalocean.app/api/v1"
EMAIL = "admin"
PASSWORD = "admin1234"

# The 25 problematic product IDs
PRODUCT_IDS = [
    "c194cd6e-e496-43d8-8be5-1b4f3b551fcf",  # Bayleaf (200ml)
    "22ff33a4-d527-4a9e-8e8b-0a33ec839026",  # Bayleaf (650ml)
    "607dd349-8327-40ba-94c4-968c9b9e255c",  # Bayleaf (1000ml)
    "ff0d9abd-97e2-4d75-bd29-246d8ee2a2b7",  # Anissed Powder(200ml)
    "52cbf3d7-a60b-4345-b439-d2b90e20feed",  # Aniseed Powder(650ml)
    "a30ab71e-4a23-4129-9593-93dd25302ce1",  # Anissed Powder(1000ml)
    "45209b83-08e0-4821-b571-6cf0029ed904",  # Coriander Powder (200ML)
    "a34a8eee-b831-4120-88d2-6c314f347d40",  # Coriander Powder (650ML)
    "c700d85d-0e7a-47d2-8194-4c913298dcc4",  # Coriander Powder (1000ML)
    "59ffdd8c-5d41-4c0e-be0c-04b5d3beee38",  # Coriander Powder (4L)
    "d56fefea-bcdc-4fc0-9833-9fa47e4f453a",  # Coriander (200ML)
    "36e45336-d9f3-409f-8b8a-ce937ecee77d",  # Coriander (650ML)
    "e7449fde-329c-4e1b-b510-2c591e7b8fcc",  # Coriander (100ML)
    "3bd5897e-a4c6-42a3-aea1-84e33bedc843",  # Cummin (200ML)
    "9e825d03-e840-4b37-b75b-f13af3765aea",  # Cummin (650ML)
    "876a42e2-f5e7-4344-b006-84d56233d035",  # Cummin (1000ML)
    "9c89dd11-3558-4ae1-9814-215fe66098a7",  # Cummin (4L)
    "6ab94a8d-c050-4480-8329-b101023d0913",  # Cloves Powder (200ML)
    "bbbb023f-fb4f-4a01-b633-f1696fd69d97",  # Cloves Powder (650ML)
    "d3ddfaa1-8fd2-4c2a-80f7-a304bcc3e24f",  # Cloves Powder (1000ML)
    "271d4735-2999-414b-a204-1ff17897ff0d",  # Cloves Powder (4L)
    "31c7a27e-111a-43af-8611-9d457af06bc5",  # Cloves (200ML)
    "b5aec28a-08d7-46be-a47c-39155c466e5c",  # Cloves (650ML)
    "fb0c872d-952c-4c3b-bf45-f881c3bd2fb9",  # Cloves (1000ML)
    "a2eacac8-270f-42f5-b191-8fab38fd4c94",  # Cloves (4L)
]

print("="*80)
print("HARD DELETING 25 PROBLEMATIC PRODUCTS")
print("="*80 + "\n")

# Login
print("Logging in...")
login_response = requests.post(
    f"{API_URL}/auth/login",
    data={"username": EMAIL, "password": PASSWORD}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Logged in\n")

# Delete each product with hard_delete=true
deleted = 0
failed = 0

for i, product_id in enumerate(PRODUCT_IDS, 1):
    print(f"[{i}/25] Hard deleting {product_id}...", end=" ")
    
    try:
        response = requests.delete(
            f"{API_URL}/products/{product_id}?hard_delete=true",
            headers=headers
        )
        
        if response.status_code in [200, 204]:
            print("✅ DELETED")
            deleted += 1
        else:
            print(f"❌ FAILED: HTTP {response.status_code}")
            failed += 1
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        failed += 1

print("\n" + "="*80)
print(f"✅ Deleted: {deleted}")
print(f"❌ Failed: {failed}")
print("="*80 + "\n")

print("✅ Now you can re-upload these products and they'll automatically use CDN!")
