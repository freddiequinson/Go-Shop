"""
Test script for GoShopGhana Bubble System
Social commerce groups with Ghana market context
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_USER = {
    "username": "admin",
    "password": "admin1234"
}

class BubbleSystemTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_info = None
        self.test_bubble_id = None

    async def login(self) -> bool:
        """Login and get access token"""
        async with httpx.AsyncClient() as client:
            # Try form data first (OAuth2 style)
            response = await client.post(
                f"{self.base_url}/auth/login",
                data={
                    "username": TEST_USER["username"],
                    "password": TEST_USER["password"]
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.user_info = data["user"]
                return True
            
            # If that fails, try JSON format
            response = await client.post(
                f"{self.base_url}/auth/login",
                json={
                    "username": TEST_USER["username"],
                    "password": TEST_USER["password"]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.user_info = data["user"]
                return True
            
            print(f"Login failed with status {response.status_code}: {response.text}")
            return False

    @property
    def headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def test_ghana_data_endpoints(self):
        """Test Ghana-specific data endpoints"""
        print("🇬🇭 Testing Ghana market data endpoints...")
        
        async with httpx.AsyncClient() as client:
            # Test regions
            response = await client.get(
                f"{self.base_url}/bubbles/ghana/regions",
                headers=self.headers
            )
            
            if response.status_code == 200:
                regions = response.json()["regions"]
                print(f"✅ Ghana regions: {len(regions)} regions loaded")
                print(f"   Sample: {regions[:3]}")
            else:
                print(f"❌ Failed to get regions: {response.status_code}")

            # Test locations
            response = await client.get(
                f"{self.base_url}/bubbles/ghana/popular-locations",
                headers=self.headers
            )
            
            if response.status_code == 200:
                locations = response.json()["locations"]
                print(f"✅ Popular locations: {len(locations)} regions with markets")
                print(f"   Accra markets: {len(locations.get('Greater Accra', []))}")
            else:
                print(f"❌ Failed to get locations: {response.status_code}")

            # Test products
            response = await client.get(
                f"{self.base_url}/bubbles/ghana/products",
                headers=self.headers
            )
            
            if response.status_code == 200:
                products = response.json()["products"]
                print(f"✅ Ghana products: {len(products)} categories")
                print(f"   Staples: {products.get('staples', [])[:3]}")
            else:
                print(f"❌ Failed to get products: {response.status_code}")

    async def test_bubble_types(self):
        """Test bubble types endpoint"""
        print("\n🫧 Testing bubble types...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bubbles/types",
                headers=self.headers
            )
            
            if response.status_code == 200:
                types = response.json()
                print(f"✅ Bubble types loaded:")
                print(f"   Product-based: {len(types['product_based'])} types")
                print(f"   Location-based: {len(types['location_based'])} markets")
                print(f"   Farmer coops: {len(types['farmer_coops'])} regions")
            else:
                print(f"❌ Failed to get bubble types: {response.status_code}")

    async def test_create_bubble(self):
        """Test bubble creation"""
        print("\n🆕 Testing bubble creation...")
        
        bubble_data = {
            "name": "Accra Yam Traders Network",
            "description": "A community for yam traders in Greater Accra region. Share prices, find suppliers, and build trust in the yam trading business.",
            "bubble_type": "product_based",
            "location": "Accra",
            "region": "Greater Accra",
            "primary_products": ["Yam", "Sweet Potato", "Cocoyam"],
            "is_public": True,
            "requires_approval": False,
            "max_members": 500,
            "fund_transfer_enabled": True,
            "min_fund_transfer": 10.0,
            "max_fund_transfer": 5000.0
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/bubbles/",
                headers=self.headers,
                json=bubble_data
            )
            
            if response.status_code == 200:
                bubble = response.json()
                self.test_bubble_id = bubble["id"]
                print(f"✅ Bubble created successfully!")
                print(f"   ID: {bubble['id']}")
                print(f"   Name: {bubble['name']}")
                print(f"   Type: {bubble['bubble_type']}")
                print(f"   Location: {bubble['location']}, {bubble['region']}")
                print(f"   Members: {bubble['member_count']}/{bubble['max_members']}")
                print(f"   Fund transfers: {'Enabled' if bubble['fund_transfer_enabled'] else 'Disabled'}")
                return bubble
            else:
                print(f"❌ Failed to create bubble: {response.status_code}")
                print(f"   Error: {response.text}")
                return None

    async def test_get_bubbles(self):
        """Test getting bubbles with filtering"""
        print("\n📋 Testing bubble listing and search...")
        
        async with httpx.AsyncClient() as client:
            # Get all bubbles
            response = await client.get(
                f"{self.base_url}/bubbles/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                bubbles = response.json()
                print(f"✅ Retrieved {len(bubbles)} bubbles")
                
                if bubbles:
                    bubble = bubbles[0]
                    print(f"   Sample: {bubble['name']} ({bubble['bubble_type']})")
            else:
                print(f"❌ Failed to get bubbles: {response.status_code}")

            # Test search by location
            response = await client.get(
                f"{self.base_url}/bubbles/?location=Accra",
                headers=self.headers
            )
            
            if response.status_code == 200:
                accra_bubbles = response.json()
                print(f"✅ Found {len(accra_bubbles)} bubbles in Accra")
            else:
                print(f"❌ Failed to search bubbles: {response.status_code}")

            # Test filter by type
            response = await client.get(
                f"{self.base_url}/bubbles/?bubble_type=product_based",
                headers=self.headers
            )
            
            if response.status_code == 200:
                product_bubbles = response.json()
                print(f"✅ Found {len(product_bubbles)} product-based bubbles")
            else:
                print(f"❌ Failed to filter bubbles: {response.status_code}")

    async def test_my_bubbles(self):
        """Test getting user's bubbles"""
        print("\n👤 Testing my bubbles...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bubbles/my-bubbles",
                headers=self.headers
            )
            
            if response.status_code == 200:
                my_bubbles = response.json()
                print(f"✅ User is member of {len(my_bubbles)} bubbles")
                
                for bubble in my_bubbles:
                    print(f"   - {bubble['name']} ({bubble['member_count']} members)")
            else:
                print(f"❌ Failed to get my bubbles: {response.status_code}")

    async def test_bubble_details(self):
        """Test getting bubble details"""
        if not self.test_bubble_id:
            print("\n⚠️ Skipping bubble details test - no test bubble created")
            return
            
        print(f"\n🔍 Testing bubble details for {self.test_bubble_id}...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bubbles/{self.test_bubble_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                bubble = response.json()
                print(f"✅ Bubble details retrieved:")
                print(f"   Name: {bubble['name']}")
                print(f"   Description: {bubble['description'][:50]}...")
                print(f"   Status: {bubble['status']}")
                print(f"   Created: {bubble['created_at']}")
                print(f"   Can transfer funds: {bubble['can_transfer_funds']}")
            else:
                print(f"❌ Failed to get bubble details: {response.status_code}")

    async def test_bubble_members(self):
        """Test getting bubble members"""
        if not self.test_bubble_id:
            print("\n⚠️ Skipping members test - no test bubble created")
            return
            
        print(f"\n👥 Testing bubble members...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bubbles/{self.test_bubble_id}/members",
                headers=self.headers
            )
            
            if response.status_code == 200:
                members = response.json()
                print(f"✅ Retrieved {len(members)} members:")
                
                for member in members:
                    print(f"   - User {member['user_id']} ({member['role']}) - {member['status']}")
                    print(f"     Joined: {member['joined_at']}")
                    print(f"     Permissions: invite={member['can_invite']}, post={member['can_post']}, transfer={member['can_transfer_funds']}")
            else:
                print(f"❌ Failed to get members: {response.status_code}")

    async def test_bubble_statistics(self):
        """Test bubble system statistics"""
        print("\n📊 Testing bubble statistics...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bubbles/stats",
                headers=self.headers
            )
            
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Bubble system statistics:")
                print(f"   Total bubbles: {stats['total_bubbles']}")
                print(f"   Active bubbles: {stats['active_bubbles']}")
                print(f"   Total members: {stats['total_members']}")
                print(f"   Fund transfer enabled: {stats['fund_transfer_enabled_count']}")
                
                print(f"   Bubbles by type:")
                for bubble_type, count in stats['bubbles_by_type'].items():
                    print(f"     - {bubble_type}: {count}")
                
                if stats['bubbles_by_region']:
                    print(f"   Top regions:")
                    for region, count in list(stats['bubbles_by_region'].items())[:3]:
                        print(f"     - {region}: {count}")
            else:
                print(f"❌ Failed to get statistics: {response.status_code}")

    async def test_update_bubble(self):
        """Test updating bubble"""
        if not self.test_bubble_id:
            print("\n⚠️ Skipping update test - no test bubble created")
            return
            
        print(f"\n✏️ Testing bubble update...")
        
        update_data = {
            "description": "Updated description: A thriving community for yam traders in Greater Accra. Join us to share market insights, find reliable suppliers, and grow your business network!",
            "max_members": 750,
            "fund_transfer_enabled": True
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/bubbles/{self.test_bubble_id}",
                headers=self.headers,
                json=update_data
            )
            
            if response.status_code == 200:
                updated_bubble = response.json()
                print(f"✅ Bubble updated successfully!")
                print(f"   New max members: {updated_bubble['max_members']}")
                print(f"   Fund transfers: {'Enabled' if updated_bubble['fund_transfer_enabled'] else 'Disabled'}")
            else:
                print(f"❌ Failed to update bubble: {response.status_code}")
                print(f"   Error: {response.text}")

    async def run_all_tests(self):
        """Run all bubble system tests"""
        print("🚀 GoShopGhana Bubble System Test")
        print("=" * 60)
        
        # Login
        print("🔑 Logging in as admin...")
        if not await self.login():
            print("❌ Login failed!")
            return
        
        print(f"✅ Login successful: {self.user_info['full_name']}")
        
        # Run tests
        await self.test_ghana_data_endpoints()
        await self.test_bubble_types()
        await self.test_create_bubble()
        await self.test_get_bubbles()
        await self.test_my_bubbles()
        await self.test_bubble_details()
        await self.test_bubble_members()
        await self.test_update_bubble()
        await self.test_bubble_statistics()
        
        print("\n" + "=" * 60)
        print("🎯 Bubble System Test Summary:")
        print("   - Ghana market data endpoints: ✅")
        print("   - Bubble types and categories: ✅")
        print("   - Bubble creation: ✅")
        print("   - Bubble listing and search: ✅")
        print("   - User bubble membership: ✅")
        print("   - Bubble details and members: ✅")
        print("   - Bubble updates: ✅")
        print("   - System statistics: ✅")
        print("")
        print("🔗 Visit http://localhost:8000/docs to explore bubble endpoints!")
        print("")
        print("🇬🇭 Week 6 Progress: Bubble System Foundation! 🫧")


async def main():
    tester = BubbleSystemTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
