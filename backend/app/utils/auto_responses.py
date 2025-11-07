"""
Automated response system for customer messages
"""

from typing import Optional, Dict
import re


class AutoResponseEngine:
    """Engine for generating automated responses to common customer queries"""
    
    # Greeting patterns
    GREETINGS = [
        r'\b(hi|hello|hey|good morning|good afternoon|good evening|greetings)\b',
    ]
    
    # Help patterns
    HELP_PATTERNS = [
        r'\b(help|assist|support|problem|issue)\b',
    ]
    
    # Order patterns
    ORDER_PATTERNS = [
        r'\b(order|delivery|track|shipping|where is my)\b',
    ]
    
    # Product patterns
    PRODUCT_PATTERNS = [
        r'\b(product|item|stock|available|price)\b',
    ]
    
    # Payment patterns
    PAYMENT_PATTERNS = [
        r'\b(payment|pay|refund|money|charge)\b',
    ]
    
    # Account patterns
    ACCOUNT_PATTERNS = [
        r'\b(account|login|password|profile|register)\b',
    ]
    
    @staticmethod
    def get_auto_response(message_content: str) -> Optional[Dict[str, str]]:
        """
        Generate automated response based on message content
        
        Returns:
            Dict with 'content' and 'type' if auto-response is appropriate, None otherwise
        """
        if not message_content:
            return None
        
        content_lower = message_content.lower().strip()
        
        # Check for greetings
        if any(re.search(pattern, content_lower, re.IGNORECASE) for pattern in AutoResponseEngine.GREETINGS):
            return {
                "content": "Hello! 👋 Welcome to Go-Shop! I'm your automated assistant. How can I help you today? A customer support agent will be with you shortly if you need further assistance.",
                "type": "greeting"
            }
        
        # Check for help requests
        if any(re.search(pattern, content_lower, re.IGNORECASE) for pattern in AutoResponseEngine.HELP_PATTERNS):
            return {
                "content": "I'm here to help! 🤝 Please describe your issue in detail, and our support team will assist you as soon as possible. Common topics we can help with:\n\n• Orders & Delivery\n• Products & Pricing\n• Payments & Refunds\n• Account Issues\n\nWhat do you need help with?",
                "type": "help"
            }
        
        # Check for order inquiries
        if any(re.search(pattern, content_lower, re.IGNORECASE) for pattern in AutoResponseEngine.ORDER_PATTERNS):
            return {
                "content": "📦 For order-related inquiries:\n\n• You can track your order in the 'My Orders' section of your profile\n• Delivery times are typically 1-3 business days\n• You'll receive SMS/email updates on your order status\n\nIf you need specific help with an order, please share your order number and our team will assist you!",
                "type": "order_inquiry"
            }
        
        # Check for product inquiries
        if any(re.search(pattern, content_lower, re.IGNORECASE) for pattern in AutoResponseEngine.PRODUCT_PATTERNS):
            return {
                "content": "🛍️ Looking for product information?\n\n• Browse our catalog at go-shop.com\n• Check product availability and prices on product pages\n• Use the search feature to find specific items\n\nIf you have a specific product question, please share the product name or link, and our team will help you!",
                "type": "product_inquiry"
            }
        
        # Check for payment inquiries
        if any(re.search(pattern, content_lower, re.IGNORECASE) for pattern in AutoResponseEngine.PAYMENT_PATTERNS):
            return {
                "content": "💳 Payment & Refund Information:\n\n• We accept Mobile Money, Cards, and Cash on Delivery\n• Payments are secure and encrypted\n• Refunds are processed within 5-7 business days\n\nFor specific payment issues, please provide details and our support team will assist you promptly!",
                "type": "payment_inquiry"
            }
        
        # Check for account inquiries
        if any(re.search(pattern, content_lower, re.IGNORECASE) for pattern in AutoResponseEngine.ACCOUNT_PATTERNS):
            return {
                "content": "👤 Account Help:\n\n• Reset your password using the 'Forgot Password' link on the login page\n• Update your profile in the 'My Account' section\n• Contact us if you're having trouble accessing your account\n\nOur support team is here to help with any account-related issues!",
                "type": "account_inquiry"
            }
        
        # Default response for unrecognized messages
        if len(content_lower) < 100:  # Only for short messages
            return {
                "content": "Thank you for your message! 📨 A customer support representative will respond to you shortly. In the meantime, you can:\n\n• Check our FAQ section\n• Browse your order history\n• Explore our product catalog\n\nWe typically respond within 1-2 hours during business hours (8 AM - 8 PM GMT).",
                "type": "default"
            }
        
        return None
    
    @staticmethod
    def should_send_auto_response(conversation_message_count: int, last_auto_response_time: Optional[str] = None) -> bool:
        """
        Determine if an auto-response should be sent
        
        Args:
            conversation_message_count: Total messages in conversation (excluding the just-sent message)
            last_auto_response_time: Timestamp of last auto-response
        
        Returns:
            True if auto-response should be sent
        """
        # Send auto-response for first 10 messages in a conversation (for testing)
        # In production, you might want to reduce this to 2-3
        if conversation_message_count >= 10:
            return False
        
        # Don't send multiple auto-responses in quick succession
        if last_auto_response_time:
            # Could add time-based logic here
            pass
        
        return True
