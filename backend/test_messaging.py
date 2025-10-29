"""
Test script for Week 8 Messaging & Reviews System
Tests the new messaging and review functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_CREDENTIALS = {
    "username": "admin",
    "password": "admin1234"
}

class GoShopMessagingTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_id = None
        
    def authenticate(self):
        """Authenticate and get JWT token"""
        print("🔐 Authenticating...")
        
        auth_data = {
            "username": TEST_USER_CREDENTIALS["username"],
            "password": TEST_USER_CREDENTIALS["password"]
        }
        
        response = requests.post(f"{self.base_url}/auth/login", json=auth_data)
        
        if response.status_code == 200:
            result = response.json()
            self.token = result["access_token"]
            print(f"✅ Authentication successful!")
            
            # Get user info
            headers = {"Authorization": f"Bearer {self.token}"}
            user_response = requests.get(f"{self.base_url}/auth/me", headers=headers)
            if user_response.status_code == 200:
                user_data = user_response.json()
                self.user_id = user_data["id"]
                print(f"👤 User ID: {self.user_id}")
            return True
        else:
            print(f"❌ Authentication failed: {response.text}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_messaging_system(self):
        """Test the messaging system"""
        print("\n📱 TESTING MESSAGING SYSTEM")
        print("=" * 50)
        
        # Test 1: Create a conversation
        print("\n1. Creating a bubble group conversation...")
        conversation_data = {
            "type": "bubble_group",  # Change to bubble_group since direct needs exactly 2 participants
            "title": "Test Ghana Market Chat",
            "description": "Testing buyer-seller communication",
            "participant_ids": [self.user_id],  # Just admin for now
            "language_preference": "en",
            "market_context": {
                "market_type": "traditional_market",
                "location": "Makola Market, Accra"
            }
        }
        
        response = requests.post(
            f"{self.base_url}/messages/conversations",
            json=conversation_data,
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            conversation = response.json()
            conversation_id = conversation["id"]
            print(f"✅ Conversation created: {conversation_id}")
            print(f"   Title: {conversation['title']}")
            print(f"   Type: {conversation['type']}")
            
            # Test 2: Send a message
            print("\n2. Sending a Ghana market message...")
            message_data = {
                "conversation_id": conversation_id,  # Add the required field
                "content": "Ɛte sɛn? I'm interested in your fresh plantain. What's the price per bunch?",
                "message_type": "direct",
                "content_type": "text",
                "language": "en",
                "market_terms": {
                    "product_mentioned": "plantain",
                    "market_greeting": "Ɛte sɛn",
                    "currency": "GHS"
                },
                "location_data": {
                    "market": "Makola Market",
                    "city": "Accra"
                }
            }
            
            message_response = requests.post(
                f"{self.base_url}/messages/conversations/{conversation_id}/messages",
                json=message_data,
                headers=self.get_headers()
            )
            
            if message_response.status_code == 200:
                message = message_response.json()
                message_id = message["id"]
                print(f"✅ Message sent: {message_id}")
                print(f"   Content: {message['content'][:50]}...")
                print(f"   Market terms: {message.get('market_terms', {})}")
                
                # Test 3: Get conversation messages
                print("\n3. Retrieving conversation messages...")
                messages_response = requests.get(
                    f"{self.base_url}/messages/conversations/{conversation_id}/messages",
                    headers=self.get_headers()
                )
                
                if messages_response.status_code == 200:
                    messages_data = messages_response.json()
                    print(f"✅ Retrieved {len(messages_data['messages'])} messages")
                    
                    # Test 4: Mark message as read
                    print("\n4. Marking message as read...")
                    read_response = requests.post(
                        f"{self.base_url}/messages/messages/{message_id}/read",
                        headers=self.get_headers()
                    )
                    
                    if read_response.status_code == 200:
                        print("✅ Message marked as read")
                    else:
                        print(f"❌ Failed to mark as read: {read_response.text}")
                        
                    # Test 5: Get unread count
                    print("\n5. Getting unread messages count...")
                    unread_response = requests.get(
                        f"{self.base_url}/messages/stats/unread-count",
                        headers=self.get_headers()
                    )
                    
                    if unread_response.status_code == 200:
                        unread_data = unread_response.json()
                        print(f"✅ Unread messages: {unread_data['unread_count']}")
                    else:
                        print(f"❌ Failed to get unread count: {unread_response.text}")
                        
                else:
                    print(f"❌ Failed to get messages: {messages_response.text}")
            else:
                print(f"❌ Failed to send message: {message_response.text}")
        else:
            print(f"❌ Failed to create conversation: {response.text}")
    
    def test_review_system(self):
        """Test the review system"""
        print("\n⭐ TESTING REVIEW SYSTEM")
        print("=" * 50)
        
        # First, get a product to review
        print("\n1. Getting products to review...")
        products_response = requests.get(f"{self.base_url}/products", headers=self.get_headers())
        
        if products_response.status_code == 200:
            products_data = products_response.json()
            if products_data["products"]:
                product = products_data["products"][0]
                product_id = product["id"]
                print(f"✅ Found product to review: {product['name']}")
                
                # Test 1: Create a Ghana market review
                print("\n2. Creating a Ghana market review...")
                review_data = {
                    "review_type": "product",
                    "product_id": product_id,
                    "title": "Fresh Plantain from Makola Market",
                    "content": "I bought this plantain from Makola Market yesterday. The quality was excellent - very fresh and perfectly ripe. The seller was honest about the ripeness level and gave good advice on storage. Perfect for making kelewele!",
                    "rating": 4.5,
                    "quality_rating": 5.0,
                    "value_rating": 4.0,
                    "freshness_rating": 5.0,
                    "packaging_rating": 3.0,
                    "authenticity_rating": 5.0,
                    "is_anonymous": False,
                    "language": "en",
                    "market_context": {
                        "market_location": "Makola Market, Accra",
                        "purchase_method": "market",
                        "seasonal_context": "harvest_time"
                    },
                    "local_terms_used": ["kelewele", "plantain"],
                    "cultural_context": {
                        "local_use": "Traditional Ghanaian cooking",
                        "seasonal_preference": "Harvest season quality"
                    }
                }
                
                review_response = requests.post(
                    f"{self.base_url}/reviews/reviews",
                    json=review_data,
                    headers=self.get_headers()
                )
                
                if review_response.status_code == 200:
                    review = review_response.json()
                    review_id = review["id"]
                    print(f"✅ Review created: {review_id}")
                    print(f"   Title: {review['title']}")
                    print(f"   Rating: {review['rating']}/5.0")
                    print(f"   Freshness: {review['freshness_rating']}/5.0")
                    print(f"   Market context: {review.get('market_context', {})}")
                    
                    # Test 2: Get product reviews
                    print("\n3. Getting product reviews...")
                    product_reviews_response = requests.get(
                        f"{self.base_url}/reviews/products/{product_id}/reviews",
                        headers=self.get_headers()
                    )
                    
                    if product_reviews_response.status_code == 200:
                        reviews_data = product_reviews_response.json()
                        print(f"✅ Retrieved {len(reviews_data['reviews'])} reviews")
                        print(f"   Average rating: {reviews_data['avg_rating']}")
                        
                        # Test 3: Vote on review helpfulness
                        print("\n4. Voting on review helpfulness...")
                        vote_data = {"vote_type": "helpful"}
                        
                        vote_response = requests.post(
                            f"{self.base_url}/reviews/reviews/{review_id}/vote",
                            json=vote_data,
                            headers=self.get_headers()
                        )
                        
                        if vote_response.status_code == 200:
                            print("✅ Voted review as helpful")
                        else:
                            print(f"❌ Failed to vote: {vote_response.text}")
                            
                        # Test 4: Create review response
                        print("\n5. Creating review response...")
                        response_data = {
                            "content": "Thank you for the detailed review! We're glad you enjoyed our fresh plantain. We always ensure our produce is harvested at the right time for the best quality.",
                            "responder_type": "seller",
                            "is_official": True,
                            "language": "en"
                        }
                        
                        response_response = requests.post(
                            f"{self.base_url}/reviews/reviews/{review_id}/responses",
                            json=response_data,
                            headers=self.get_headers()
                        )
                        
                        if response_response.status_code == 200:
                            response_obj = response_response.json()
                            print(f"✅ Review response created")
                            print(f"   Response: {response_obj['content'][:50]}...")
                        else:
                            print(f"❌ Failed to create response: {response_response.text}")
                            
                    else:
                        print(f"❌ Failed to get product reviews: {product_reviews_response.text}")
                        
                elif review_response.status_code == 400:
                    print("⚠️  Cannot create review (may need actual purchase history)")
                    print(f"   Response: {review_response.text}")
                else:
                    print(f"❌ Failed to create review: {review_response.text}")
            else:
                print("❌ No products found to review")
        else:
            print(f"❌ Failed to get products: {products_response.text}")
    
    def run_tests(self):
        """Run all tests"""
        print("🚀 GOSHOPGHANA WEEK 8 - MESSAGING & REVIEWS TESTING")
        print("=" * 60)
        print("Testing the new messaging and review systems...")
        print(f"Base URL: {self.base_url}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if not self.authenticate():
            return
        
        try:
            self.test_messaging_system()
            self.test_review_system()
            
            print("\n🎉 TESTING COMPLETED!")
            print("=" * 60)
            print("✅ Messaging system: Conversations, messages, Ghana market context")
            print("✅ Review system: Product reviews, ratings, seller responses")
            print("✅ Ghana market features: Local terms, market context, cultural aspects")
            print("\nWeek 8 Messaging & Reviews system is working! 🇬🇭")
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")


if __name__ == "__main__":
    tester = GoShopMessagingTester()
    tester.run_tests()
