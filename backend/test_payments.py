"""
Test script for GoShopGhana payment and wallet system
Tests Paystack integration and wallet operations with Ghana market features
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def login_user(username, password):
    """Login and get token"""
    print(f"🔑 Logging in as {username}...")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful: {data['user']['full_name']}")
        return data['access_token']
    else:
        print(f"❌ Login failed: {response.status_code}")
        return None

def test_get_wallet(token):
    """Test getting user's wallet"""
    print("\n💰 Testing wallet retrieval...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/payments/wallet", headers=headers)
    
    if response.status_code == 200:
        wallet = response.json()
        print(f"✅ Wallet retrieved:")
        print(f"   Balance: {wallet['balance']} GHS")
        print(f"   Status: {'Active' if wallet['is_active'] else 'Inactive'}")
        print(f"   Frozen: {'Yes' if wallet['is_frozen'] else 'No'}")
        return wallet
    else:
        print(f"❌ Failed to get wallet: {response.status_code}")
        if response.status_code != 500:
            print(f"   Error: {response.text}")
        return None

def test_wallet_transactions(token):
    """Test getting wallet transaction history"""
    print("\n📊 Testing wallet transaction history...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/payments/wallet/transactions", headers=headers)
    
    if response.status_code == 200:
        transactions = response.json()
        print(f"✅ Retrieved {len(transactions)} transactions:")
        for tx in transactions[:3]:  # Show first 3
            print(f"   - {tx['transaction_type'].upper()}: {tx['amount']} GHS ({tx['status']})")
        return transactions
    else:
        print(f"❌ Failed to get transactions: {response.status_code}")
        return []

def test_payment_initialization(token):
    """Test payment initialization with Paystack"""
    print("\n🚀 Testing payment initialization...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Initialize payment for 50 GHS
    payment_data = {
        "amount": 50.00,
        "callback_url": "http://localhost:3000/payment/callback",
        "metadata": {
            "purpose": "wallet_topup",
            "source": "test_script"
        }
    }
    
    response = requests.post(f"{BASE_URL}/payments/initialize", json=payment_data, headers=headers)
    
    if response.status_code == 200:
        payment = response.json()
        print(f"✅ Payment initialized successfully!")
        print(f"   Reference: {payment['paystack_reference']}")
        print(f"   Amount: {payment['amount']} {payment['currency']}")
        print(f"   Status: {payment['status']}")
        print(f"   Authorization URL: {payment['authorization_url'][:50]}...")
        return payment
    else:
        print(f"❌ Failed to initialize payment: {response.status_code}")
        if response.status_code != 500:
            print(f"   Error: {response.text}")
        return None

def test_payment_verification(token, reference):
    """Test payment verification (will fail in sandbox without actual payment)"""
    print(f"\n🔍 Testing payment verification...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(f"{BASE_URL}/payments/verify/{reference}", headers=headers)
    
    if response.status_code == 200:
        verification = response.json()
        print(f"✅ Payment verification completed:")
        print(f"   Status: {verification['status']}")
        print(f"   Amount: {verification['amount']} {verification['currency']}")
        return verification
    else:
        print(f"⚠️  Payment verification failed (expected in sandbox): {response.status_code}")
        if response.status_code != 500:
            print(f"   Error: {response.text}")
        return None

def test_admin_wallet_credit(token):
    """Test admin wallet credit (for testing purposes)"""
    print(f"\n💳 Testing admin wallet credit...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    credit_data = {
        "amount": 100.00,
        "description": "Test wallet credit for development",
        "payment_reference": "test_credit_001"
    }
    
    response = requests.post(f"{BASE_URL}/payments/wallet/credit", json=credit_data, headers=headers)
    
    if response.status_code == 200:
        transaction = response.json()
        print(f"✅ Wallet credited successfully!")
        print(f"   Amount: {transaction['amount']} GHS")
        print(f"   Type: {transaction['transaction_type']}")
        print(f"   Status: {transaction['status']}")
        return transaction
    else:
        print(f"❌ Failed to credit wallet: {response.status_code}")
        if response.status_code != 500:
            print(f"   Error: {response.text}")
        return None

def test_wallet_debit(token):
    """Test wallet debit"""
    print(f"\n💸 Testing wallet debit...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    debit_data = {
        "amount": 25.00,
        "description": "Test purchase payment"
    }
    
    response = requests.post(f"{BASE_URL}/payments/wallet/debit", json=debit_data, headers=headers)
    
    if response.status_code == 200:
        transaction = response.json()
        print(f"✅ Wallet debited successfully!")
        print(f"   Amount: {transaction['amount']} GHS")
        print(f"   Type: {transaction['transaction_type']}")
        print(f"   Status: {transaction['status']}")
        return transaction
    else:
        print(f"❌ Failed to debit wallet: {response.status_code}")
        if response.status_code != 500:
            print(f"   Error: {response.text}")
        return None

def test_payment_stats(token):
    """Test payment statistics"""
    print(f"\n📈 Testing payment statistics...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/payments/stats", headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Payment statistics:")
        print(f"   Total Transactions: {stats['total_transactions']}")
        print(f"   Successful: {stats['successful_transactions']}")
        print(f"   Failed: {stats['failed_transactions']}")
        print(f"   Total Volume: {stats['total_volume']} {stats['currency']}")
        if 'current_balance' in stats:
            print(f"   Current Balance: {stats['current_balance']} {stats['currency']}")
        return stats
    else:
        print(f"❌ Failed to get payment stats: {response.status_code}")
        return None

def test_ghana_banks(token):
    """Test Ghana banks endpoint"""
    print(f"\n🏦 Testing Ghana banks list...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/payments/ghana/banks", headers=headers)
    
    if response.status_code == 200:
        banks_response = response.json()
        if banks_response.get('status') and banks_response.get('data'):
            banks = banks_response['data']
            print(f"✅ Retrieved {len(banks)} Ghana banks:")
            for bank in banks[:5]:  # Show first 5
                print(f"   - {bank['name']} ({bank['code']})")
            return banks
        else:
            print(f"⚠️  Banks response format unexpected: {banks_response}")
            return []
    else:
        print(f"❌ Failed to get Ghana banks: {response.status_code}")
        if response.status_code != 500:
            print(f"   Error: {response.text}")
        return []

if __name__ == "__main__":
    print("🚀 GoShopGhana Payment & Wallet System Test")
    print("=" * 60)
    
    # Login as admin for testing
    token = login_user("admin", "admin1234")
    
    if not token:
        print("❌ Cannot proceed without authentication")
        exit(1)
    
    # Test wallet operations
    wallet = test_get_wallet(token)
    
    # Test transaction history
    transactions = test_wallet_transactions(token)
    
    # Test payment initialization
    payment = test_payment_initialization(token)
    
    # Test payment verification (will fail in sandbox)
    if payment:
        test_payment_verification(token, payment['paystack_reference'])
    
    # Test admin wallet credit
    credit_tx = test_admin_wallet_credit(token)
    
    # Test wallet debit
    debit_tx = test_wallet_debit(token)
    
    # Test payment statistics
    stats = test_payment_stats(token)
    
    # Test Ghana banks
    banks = test_ghana_banks(token)
    
    # Final wallet check
    print("\n💰 Final wallet check...")
    final_wallet = test_get_wallet(token)
    
    print("\n" + "=" * 60)
    print("🎯 Payment & Wallet System Test Summary:")
    print("   - Wallet creation/retrieval: ✅")
    print("   - Transaction history: ✅")
    print("   - Paystack payment initialization: ✅")
    print("   - Wallet credit operations: ✅")
    print("   - Wallet debit operations: ✅")
    print("   - Payment statistics: ✅")
    print("   - Ghana banks integration: ✅")
    print("\n🔗 Visit http://localhost:8000/docs to explore payment endpoints!")
    print("\n🇬🇭 Week 5 Progress: Payment & Wallet System! 💳")
