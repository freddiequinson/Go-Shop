"""
Simple Paystack API test to debug the integration
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_paystack_api():
    """Test Paystack API directly"""
    
    secret_key = os.getenv("PAYSTACK_SECRET_KEY")
    base_url = "https://api.paystack.co"
    
    print(f"🔑 Testing with secret key: {secret_key[:10]}...")
    
    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }
    
    # Test 1: List banks
    print("\n🏦 Testing banks list...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/bank",
                headers=headers,
                params={"country": "ghana"},
                timeout=30.0
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') and data.get('data'):
                    banks = data['data']
                    print(f"✅ Found {len(banks)} banks")
                    for bank in banks[:3]:
                        print(f"   - {bank['name']} ({bank['code']})")
                else:
                    print(f"❌ Unexpected response format: {data}")
            else:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Test 2: Initialize payment
    print("\n💳 Testing payment initialization...")
    try:
        payload = {
            "email": "test@example.com",
            "amount": 5000,  # 50 GHS in kobo
            "currency": "GHS",
            "reference": "test_ref_123456"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/transaction/initialize",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status'):
                    print(f"✅ Payment initialized successfully")
                    print(f"   Reference: {data['data']['reference']}")
                    print(f"   Authorization URL: {data['data']['authorization_url'][:50]}...")
                else:
                    print(f"❌ Payment failed: {data.get('message', 'Unknown error')}")
            else:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_paystack_api())
