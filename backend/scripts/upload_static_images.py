"""
Upload static frontend images to DigitalOcean Spaces CDN
Run this script once to migrate all landing page images to CDN
"""
import boto3
from botocore.client import Config
import os
import sys
from pathlib import Path
import mimetypes
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent / '.env')

# DigitalOcean Spaces configuration
SPACES_KEY = os.getenv('SPACES_ACCESS_KEY')
SPACES_SECRET = os.getenv('SPACES_SECRET_KEY')
SPACES_NAME = os.getenv('SPACES_NAME', 'goshop-images')
SPACES_REGION = os.getenv('SPACES_REGION', 'lon1')
CDN_ENDPOINT = f'https://{SPACES_NAME}.{SPACES_REGION}.cdn.digitaloceanspaces.com'

# Frontend images directory
FRONTEND_DIR = Path(__file__).parent.parent.parent / 'frontend' / 'public' / 'images'

def get_content_type(file_path: str) -> str:
    """Get MIME type for file"""
    content_type, _ = mimetypes.guess_type(file_path)
    return content_type or 'application/octet-stream'

def upload_file(client, file_path: Path, key: str) -> str:
    """Upload a single file to Spaces"""
    content_type = get_content_type(str(file_path))
    
    with open(file_path, 'rb') as f:
        client.put_object(
            Bucket=SPACES_NAME,
            Key=key,
            Body=f,
            ACL='public-read',
            ContentType=content_type,
            CacheControl='public, max-age=31536000'  # Cache for 1 year
        )
    
    return f'{CDN_ENDPOINT}/{key}'

def upload_directory(client, local_dir: Path, prefix: str = 'static'):
    """Recursively upload directory to Spaces"""
    uploaded = []
    
    for file_path in local_dir.rglob('*'):
        if file_path.is_file():
            # Create key preserving directory structure
            relative_path = file_path.relative_to(local_dir)
            key = f'{prefix}/{relative_path}'.replace('\\', '/')
            
            try:
                cdn_url = upload_file(client, file_path, key)
                print(f'✅ Uploaded: {relative_path} -> {cdn_url}')
                uploaded.append({
                    'local': str(relative_path),
                    'cdn': cdn_url,
                    'key': key
                })
            except Exception as e:
                print(f'❌ Failed: {relative_path} - {e}')
    
    return uploaded

def main():
    if not SPACES_KEY or not SPACES_SECRET:
        print('❌ Error: SPACES_ACCESS_KEY and SPACES_SECRET_KEY environment variables required')
        print('Set them in your .env file or export them before running this script')
        sys.exit(1)
    
    print(f'🚀 Uploading static images to DigitalOcean Spaces CDN')
    print(f'   Bucket: {SPACES_NAME}')
    print(f'   Region: {SPACES_REGION}')
    print(f'   CDN: {CDN_ENDPOINT}')
    print(f'   Source: {FRONTEND_DIR}')
    print()
    
    # Initialize S3 client for Spaces
    client = boto3.client(
        's3',
        region_name=SPACES_REGION,
        endpoint_url=f'https://{SPACES_REGION}.digitaloceanspaces.com',
        aws_access_key_id=SPACES_KEY,
        aws_secret_access_key=SPACES_SECRET,
        config=Config(signature_version='s3v4')
    )
    
    # Upload all images
    uploaded = upload_directory(client, FRONTEND_DIR, 'static/images')
    
    print()
    print(f'✅ Uploaded {len(uploaded)} files to CDN')
    print()
    print('📋 CDN URLs for landing page:')
    print('=' * 60)
    
    # Print mapping for updating frontend
    for item in uploaded:
        local_path = f"/images/{item['local']}".replace('\\', '/')
        print(f'{local_path}')
        print(f'  -> {item["cdn"]}')
        print()

if __name__ == '__main__':
    main()
