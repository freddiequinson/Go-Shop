from app.utils.spaces_client import get_spaces_client

print("Testing Spaces connection...")
print("-" * 50)

try:
    spaces = get_spaces_client()
    print("✓ SUCCESS! Spaces client connected")
    print(f"  Region: {spaces.spaces_region}")
    print(f"  Bucket: {spaces.spaces_name}")
    print(f"  CDN URL: {spaces.cdn_endpoint}")
    print("-" * 50)
    print("You're ready to migrate images!")
except Exception as e:
    print(f"✗ ERROR: {e}")
    print("-" * 50)
    print("Check your .env file and try again")