"""
Hubtel SMS Service for GoShopGhana
Handles SMS notifications for orders, payments, and receipts
"""

import httpx
import base64
from typing import Optional
from app.core.config import settings


class HubtelSMSService:
    """Service for sending SMS via Hubtel API"""
    
    def __init__(self):
        self.base_url = settings.HUBTEL_BASE_URL
        self.client_id = settings.HUBTEL_CLIENT_ID
        self.client_secret = settings.HUBTEL_CLIENT_SECRET
        
        # Create basic auth header
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        self.auth_header = f"Basic {encoded_credentials}"
    
    async def send_sms(
        self,
        recipient: str,
        message: str,
        sender_id: str = "GoShopGH"
    ) -> dict:
        """
        Send SMS to a recipient
        
        Args:
            recipient: Phone number in format +233XXXXXXXXX
            message: SMS message content
            sender_id: Sender ID (max 11 characters)
        
        Returns:
            dict: Response from Hubtel API
        """
        if not self.client_id or not self.client_secret:
            raise ValueError("Hubtel credentials not configured")
        
        # Ensure phone number is in correct format
        if not recipient.startswith("+"):
            if recipient.startswith("0"):
                recipient = f"+233{recipient[1:]}"
            else:
                recipient = f"+233{recipient}"
        
        url = f"{self.base_url}/v1/messages/send"
        
        payload = {
            "From": sender_id,
            "To": recipient,
            "Content": message,
            "RegisteredDelivery": True
        }
        
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
    
    async def send_order_confirmation(
        self,
        phone: str,
        order_id: str,
        total_amount: float,
        customer_name: str
    ) -> dict:
        """Send order confirmation SMS"""
        message = (
            f"Hello {customer_name}! Your order #{order_id} has been confirmed. "
            f"Total: GH₵{total_amount:.2f}. "
            f"Track your order at goshopghana.com. Thank you!"
        )
        return await self.send_sms(phone, message)
    
    async def send_payment_receipt(
        self,
        phone: str,
        transaction_id: str,
        amount: float,
        payment_method: str,
        customer_name: str
    ) -> dict:
        """Send payment receipt SMS"""
        message = (
            f"Payment Receipt - GoShopGhana\n"
            f"Dear {customer_name},\n"
            f"Amount: GH₵{amount:.2f}\n"
            f"Method: {payment_method}\n"
            f"Ref: {transaction_id}\n"
            f"Thank you for your payment!"
        )
        return await self.send_sms(phone, message)
    
    async def send_delivery_notification(
        self,
        phone: str,
        order_id: str,
        delivery_date: str,
        customer_name: str
    ) -> dict:
        """Send delivery notification SMS"""
        message = (
            f"Hello {customer_name}! Your order #{order_id} is out for delivery. "
            f"Expected delivery: {delivery_date}. "
            f"Please ensure someone is available to receive it."
        )
        return await self.send_sms(phone, message)
    
    async def send_wallet_topup_notification(
        self,
        phone: str,
        amount: float,
        new_balance: float,
        customer_name: str
    ) -> dict:
        """Send wallet top-up notification SMS"""
        message = (
            f"Wallet Top-Up Successful!\n"
            f"Dear {customer_name},\n"
            f"Amount Added: GH₵{amount:.2f}\n"
            f"New Balance: GH₵{new_balance:.2f}\n"
            f"GoShopGhana"
        )
        return await self.send_sms(phone, message)
    
    async def send_otp(
        self,
        phone: str,
        otp_code: str
    ) -> dict:
        """Send OTP verification code"""
        message = (
            f"Your GoShopGhana verification code is: {otp_code}\n"
            f"This code expires in 10 minutes. Do not share with anyone."
        )
        return await self.send_sms(phone, message)


# Create singleton instance
hubtel_sms_service = HubtelSMSService()
