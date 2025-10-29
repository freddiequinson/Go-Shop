"""
Fund Transfer System Test for GoShopGhana
Test wallet-to-wallet transfers between bubble members
"""

import asyncio
import httpx
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_USER = {
    "username": "admin",
    "password": "admin1234"
}

class FundTransferTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_info = None
        self.test_bubble_id = None
        self.test_recipient_id = None
        self.test_transfer_id = None

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

    async def test_ghana_transfer_types(self):
        """Test Ghana-specific transfer types"""
        print("\n💰 Testing Ghana transfer types...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/fund-transfers/ghana/transfer-types",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Ghana transfer types loaded:")
                print(f"   Peer-to-peer: {data['peer_to_peer']}")
                print(f"   Bulk purchase: {data['bulk_purchase']}")
                print(f"   Loan: {data['loan']}")
                print(f"   Emergency: {data['emergency']}")
                return True
            else:
                print(f"❌ Failed to get transfer types: {response.status_code}")
                return False

    async def setup_test_data(self):
        """Set up test data for transfers"""
        print("\n🔧 Setting up test data...")
        
        # Get existing bubbles
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bubbles/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                bubbles = response.json()
                if bubbles:
                    self.test_bubble_id = bubbles[0]["id"]
                    print(f"✅ Using test bubble: {bubbles[0]['name']} ({self.test_bubble_id})")
                    
                    # For testing, we'll use the same user as both sender and recipient
                    # In a real scenario, this would be different users
                    self.test_recipient_id = self.user_info["id"]
                    print(f"✅ Test recipient set: {self.test_recipient_id}")
                    return True
                else:
                    print("❌ No bubbles found. Please create a bubble first.")
                    return False
            else:
                print(f"❌ Failed to get bubbles: {response.status_code}")
                return False

    async def test_transfer_validation(self):
        """Test transfer validation before creation"""
        print("\n🔍 Testing transfer validation...")
        
        if not self.test_bubble_id or not self.test_recipient_id:
            print("❌ Test data not set up")
            return False
        
        transfer_data = {
            "recipient_id": self.test_recipient_id,
            "bubble_id": self.test_bubble_id,
            "amount": 100.0,  # 100 GHS
            "transfer_type": "peer_to_peer",
            "purpose": "Test transfer validation",
            "description": "Testing the validation system for fund transfers"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/fund-transfers/validate",
                json=transfer_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Transfer validation completed:")
                print(f"   Valid: {data['is_valid']}")
                print(f"   Can transfer: {data['can_transfer']}")
                print(f"   Estimated fee: {data['estimated_fee']} GHS")
                print(f"   Estimated total: {data['estimated_total']} GHS")
                
                if data['validation_errors']:
                    print(f"   Errors: {', '.join(data['validation_errors'])}")
                
                if data['warnings']:
                    print(f"   Warnings: {', '.join(data['warnings'])}")
                
                return data['can_transfer']
            else:
                print(f"❌ Validation failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False

    async def test_create_transfer(self):
        """Test creating a fund transfer"""
        print("\n💸 Testing fund transfer creation...")
        
        if not self.test_bubble_id or not self.test_recipient_id:
            print("❌ Test data not set up")
            return False
        
        # Note: In a real scenario, sender and recipient would be different users
        # For testing purposes, we're using the same user
        transfer_data = {
            "recipient_id": self.test_recipient_id,
            "bubble_id": self.test_bubble_id,
            "amount": 50.0,  # 50 GHS
            "transfer_type": "peer_to_peer",
            "purpose": "Test fund transfer",
            "description": "Testing the fund transfer system between bubble members",
            "reference_note": "TEST-TRANSFER-001"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/fund-transfers/",
                json=transfer_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_transfer_id = data["id"]
                print("✅ Fund transfer created successfully!")
                print(f"   ID: {data['id']}")
                print(f"   Reference: {data['reference']}")
                print(f"   Amount: {data['amount']} GHS")
                print(f"   Fee: {data['fee']} GHS")
                print(f"   Total: {data['total_amount']} GHS")
                print(f"   Status: {data['status']}")
                print(f"   Type: {data['transfer_type']}")
                print(f"   Requires approval: {data['requires_recipient_approval'] or data['requires_admin_approval']}")
                return True
            else:
                print(f"❌ Failed to create transfer: {response.status_code}")
                print(f"   Error: {response.text}")
                return False

    async def test_get_my_transfers(self):
        """Test getting user's transfers"""
        print("\n📋 Testing my transfers...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/fund-transfers/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                transfers = response.json()
                print(f"✅ Retrieved {len(transfers)} transfers")
                
                for transfer in transfers[:3]:  # Show first 3
                    print(f"   - {transfer['reference']}: {transfer['amount']} GHS ({transfer['status']})")
                    print(f"     Type: {transfer['transfer_type']}, Purpose: {transfer.get('purpose', 'N/A')}")
                
                return True
            else:
                print(f"❌ Failed to get transfers: {response.status_code}")
                return False

    async def test_transfer_details(self):
        """Test getting transfer details"""
        print(f"\n🔍 Testing transfer details for {self.test_transfer_id}...")
        
        if not self.test_transfer_id:
            print("❌ No test transfer ID available")
            return False
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/fund-transfers/{self.test_transfer_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Transfer details retrieved:")
                print(f"   Reference: {data['reference']}")
                print(f"   Amount: {data['amount']} GHS (Fee: {data['fee']} GHS)")
                print(f"   Status: {data['status']}")
                print(f"   Purpose: {data.get('purpose', 'N/A')}")
                print(f"   Created: {data['created_at']}")
                print(f"   Expires: {data.get('expires_at', 'N/A')}")
                print(f"   Can be processed: {data['can_be_processed']}")
                return True
            else:
                print(f"❌ Failed to get transfer details: {response.status_code}")
                return False

    async def test_pending_approvals(self):
        """Test getting pending approvals"""
        print("\n⏳ Testing pending approvals...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/fund-transfers/pending-approvals",
                headers=self.headers
            )
            
            if response.status_code == 200:
                approvals = response.json()
                print(f"✅ Retrieved {len(approvals)} pending approvals")
                
                for approval in approvals:
                    print(f"   - {approval['reference']}: {approval['amount']} GHS")
                    print(f"     From: {approval['sender_id'][:8]}... To: {approval['recipient_id'][:8]}...")
                    print(f"     Requires recipient: {approval['requires_recipient_approval']}")
                    print(f"     Requires admin: {approval['requires_admin_approval']}")
                
                return True
            else:
                print(f"❌ Failed to get pending approvals: {response.status_code}")
                return False

    async def test_approve_transfer(self):
        """Test approving a transfer"""
        print(f"\n✅ Testing transfer approval for {self.test_transfer_id}...")
        
        if not self.test_transfer_id:
            print("❌ No test transfer ID available")
            return False
        
        approval_data = {
            "is_approved": True,
            "comments": "Approved for testing purposes"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/fund-transfers/{self.test_transfer_id}/approve",
                json=approval_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Transfer approval processed!")
                print(f"   Status: {data['status']}")
                print(f"   Recipient approved: {data['recipient_approved']}")
                print(f"   Admin approved: {data['admin_approved']}")
                print(f"   Processed at: {data.get('processed_at', 'Not yet processed')}")
                print(f"   Completed at: {data.get('completed_at', 'Not yet completed')}")
                return True
            else:
                print(f"❌ Failed to approve transfer: {response.status_code}")
                print(f"   Error: {response.text}")
                return False

    async def test_user_transfer_summary(self):
        """Test user transfer summary"""
        print("\n📊 Testing user transfer summary...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/fund-transfers/summary/user",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ User transfer summary:")
                print(f"   Sent transfers: {data['sent_transfers']}")
                print(f"   Received transfers: {data['received_transfers']}")
                print(f"   Sent volume: {data['sent_volume_ghs']} GHS")
                print(f"   Received volume: {data['received_volume_ghs']} GHS")
                print(f"   Pending sent: {data['pending_sent']}")
                print(f"   Pending received: {data['pending_received']}")
                print(f"   Success rate: {data['success_rate']:.1f}%")
                return True
            else:
                print(f"❌ Failed to get user summary: {response.status_code}")
                return False

    async def test_bubble_transfers(self):
        """Test getting bubble transfers"""
        print(f"\n🫧 Testing bubble transfers for {self.test_bubble_id}...")
        
        if not self.test_bubble_id:
            print("❌ No test bubble ID available")
            return False
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/fund-transfers/bubble/{self.test_bubble_id}/transfers",
                headers=self.headers
            )
            
            if response.status_code == 200:
                transfers = response.json()
                print(f"✅ Retrieved {len(transfers)} bubble transfers")
                
                for transfer in transfers:
                    print(f"   - {transfer['reference']}: {transfer['amount']} GHS ({transfer['status']})")
                
                return True
            else:
                print(f"❌ Failed to get bubble transfers: {response.status_code}")
                return False

    async def test_transfer_statistics(self):
        """Test transfer statistics"""
        print(f"\n📈 Testing transfer statistics...")
        
        if not self.test_bubble_id:
            print("❌ No test bubble ID available")
            return False
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/fund-transfers/statistics/bubble/{self.test_bubble_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                stats = response.json()
                print("✅ Bubble transfer statistics:")
                print(f"   Total transfers: {stats['total_transfers']}")
                print(f"   Completed transfers: {stats['completed_transfers']}")
                print(f"   Pending transfers: {stats['pending_transfers']}")
                print(f"   Failed transfers: {stats['failed_transfers']}")
                print(f"   Total volume: {stats['total_volume_ghs']} GHS")
                print(f"   Average amount: {stats['average_transfer_amount_ghs']} GHS")
                print(f"   Daily volume: {stats['daily_volume_ghs']} GHS")
                print(f"   Monthly volume: {stats['monthly_volume_ghs']} GHS")
                
                print("   Transfers by type:")
                for transfer_type, count in stats['transfers_by_type'].items():
                    if count > 0:
                        print(f"     - {transfer_type}: {count}")
                
                print("   Transfers by status:")
                for status, count in stats['transfers_by_status'].items():
                    if count > 0:
                        print(f"     - {status}: {count}")
                
                return True
            else:
                print(f"❌ Failed to get transfer statistics: {response.status_code}")
                return False

    async def run_all_tests(self):
        """Run all fund transfer tests"""
        print("🚀 GoShopGhana Fund Transfer System Test")
        print("=" * 60)
        
        # Login
        print("🔑 Logging in as admin...")
        if not await self.login():
            print("❌ Login failed!")
            return
        
        print(f"✅ Login successful: {self.user_info['full_name']}")
        
        # Run tests
        tests = [
            ("Ghana transfer types", self.test_ghana_transfer_types),
            ("Setup test data", self.setup_test_data),
            ("Transfer validation", self.test_transfer_validation),
            ("Create fund transfer", self.test_create_transfer),
            ("Get my transfers", self.test_get_my_transfers),
            ("Transfer details", self.test_transfer_details),
            ("Pending approvals", self.test_pending_approvals),
            ("Approve transfer", self.test_approve_transfer),
            ("User transfer summary", self.test_user_transfer_summary),
            ("Bubble transfers", self.test_bubble_transfers),
            ("Transfer statistics", self.test_transfer_statistics),
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = await test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "=" * 60)
        print("🎯 Fund Transfer System Test Summary:")
        for test_name, result in results:
            status = "✅" if result else "❌"
            print(f"   - {test_name}: {status}")
        
        successful_tests = sum(1 for _, result in results if result)
        total_tests = len(results)
        
        print(f"\n🔗 Visit http://localhost:8000/docs to explore fund transfer endpoints!")
        print(f"\n🇬🇭 Week 7 Progress: Fund Transfer System! 💰")
        print(f"   Tests passed: {successful_tests}/{total_tests}")


async def main():
    tester = FundTransferTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
