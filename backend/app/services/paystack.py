"""
Paystack integration service for GoShopGhana
Ghana's leading payment gateway integration
"""

import os
import json
import uuid
from typing import Dict, Any, Optional
import httpx
from decimal import Decimal
from datetime import datetime, timedelta

from app.core.config import settings


class PaystackService:
    """Paystack payment service for Ghana market"""
    
    def __init__(self):
        self.secret_key = None
        self.public_key = None
        self.base_url = "https://api.paystack.co"
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of Paystack service"""
        if not self._initialized:
            # Try to get from settings first, then fallback to os.getenv
            try:
                self.secret_key = settings.PAYSTACK_SECRET_KEY
                self.public_key = settings.PAYSTACK_PUBLIC_KEY
                self.base_url = settings.PAYSTACK_BASE_URL
            except AttributeError:
                # Fallback to environment variables
                self.secret_key = os.getenv("PAYSTACK_SECRET_KEY")
                self.public_key = os.getenv("PAYSTACK_PUBLIC_KEY") 
                self.base_url = os.getenv("PAYSTACK_BASE_URL", "https://api.paystack.co")
            
            if not self.secret_key:
                raise ValueError("PAYSTACK_SECRET_KEY environment variable is required")
            
            self._initialized = True
    
    @property
    def headers(self) -> Dict[str, str]:
        """Get headers for Paystack API requests"""
        self._ensure_initialized()
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    async def initialize_payment(
        self,
        email: str,
        amount_cedis: int,  # Amount in cedis (kobo equivalent for Ghana)
        reference: Optional[str] = None,
        callback_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        channels: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Initialize payment with Paystack
        
        Args:
            email: Customer email
            amount_cedis: Amount in cedis (smallest currency unit)
            reference: Unique payment reference
            callback_url: URL to redirect after payment
            metadata: Additional payment metadata
            channels: Payment channels (card, mobile_money, etc.)
            
        Returns:
            Paystack initialization response
        """
        self._ensure_initialized()
        
        if not reference:
            reference = f"goshop_{uuid.uuid4().hex[:12]}"
        
        payload = {
            "email": email,
            "amount": int(amount_cedis),  # Paystack expects amount in kobo (cedis for Ghana)
            "currency": "GHS",
            "reference": reference,
        }
        
        if callback_url:
            payload["callback_url"] = callback_url
            
        if metadata:
            payload["metadata"] = metadata
        
        if channels:
            payload["channels"] = channels
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/transaction/initialize",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            
            response_data = response.json()
            
            if response.status_code != 200:
                raise Exception(f"Paystack initialization failed: {response.status_code} - {response.text}")
            
            return response_data
    
    async def charge_mobile_money(
        self,
        email: str,
        amount_cedis: int,
        phone: str,
        provider: str,
        reference: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Charge mobile money directly (for Ghana providers)
        
        Args:
            email: Customer email
            amount_cedis: Amount in cedis (kobo equivalent)
            phone: Mobile money phone number
            provider: Provider code (mtn, vod, tgo)
            reference: Unique payment reference
            metadata: Additional metadata
            
        Returns:
            Paystack charge response
        """
        self._ensure_initialized()
        
        if not reference:
            reference = f"goshop_{uuid.uuid4().hex[:12]}"
        
        payload = {
            "email": email,
            "amount": int(amount_cedis),
            "currency": "GHS",
            "reference": reference,
            "mobile_money": {
                "phone": phone,
                "provider": provider
            }
        }
        
        if metadata:
            payload["metadata"] = metadata
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/charge",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            
            response_data = response.json()
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Paystack charge failed: {response.status_code} - {response.text}")
            
            return response_data
    
    async def verify_payment(self, reference: str) -> Dict[str, Any]:
        """
        Verify payment with Paystack
        
        Args:
            reference: Payment reference to verify
            
        Returns:
            Paystack verification response
        """
        self._ensure_initialized()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/transaction/verify/{reference}",
                headers=self.headers,
                timeout=30.0
            )
            
            response_data = response.json()
            
            if response.status_code != 200:
                raise Exception(f"Paystack verification failed: {response.status_code} - {response.text}")
            
            return response_data
    
    async def list_banks(self, country: str = "ghana") -> Dict[str, Any]:
        """
        Get list of supported banks in Ghana
        
        Args:
            country: Country code (default: ghana)
            
        Returns:
            List of supported banks
        """
        self._ensure_initialized()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bank",
                headers=self.headers,
                params={"country": country},
                timeout=30.0
            )
            
            response_data = response.json()
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch banks: {response.status_code} - {response.text}")
            
            return response_data
    
    async def create_transfer_recipient(
        self,
        name: str,
        account_number: str,
        bank_code: str,
        currency: str = "GHS"
    ) -> Dict[str, Any]:
        """
        Create transfer recipient for payouts
        
        Args:
            name: Recipient name
            account_number: Bank account number
            bank_code: Bank code
            currency: Currency (default: GHS)
            
        Returns:
            Transfer recipient response
        """
        payload = {
            "type": "nuban",
            "name": name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": currency
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/transferrecipient",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code != 201:
                raise Exception(f"Failed to create transfer recipient: {response.text}")
            
            return response.json()
    
    async def initiate_transfer(
        self,
        amount_cedis: int,
        recipient_code: str,
        reason: str = "Payment from GoShopGhana"
    ) -> Dict[str, Any]:
        """
        Initiate transfer to recipient
        
        Args:
            amount_cedis: Amount in cedis
            recipient_code: Recipient code from create_transfer_recipient
            reason: Transfer reason
            
        Returns:
            Transfer response
        """
        payload = {
            "source": "balance",
            "amount": int(amount_cedis),
            "recipient": recipient_code,
            "reason": reason
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/transfer",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Transfer initiation failed: {response.text}")
            
            return response.json()
    
    def validate_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """
        Validate Paystack webhook signature
        
        Args:
            payload: Raw webhook payload
            signature: Webhook signature from headers
            
        Returns:
            True if signature is valid
        """
        self._ensure_initialized()
        import hmac
        import hashlib
        
        expected_signature = hmac.new(
            self.secret_key.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    
    @staticmethod
    def cedis_to_kobo(amount_ghs: Decimal) -> int:
        """Convert GHS amount to cedis (kobo equivalent)"""
        return int(amount_ghs * 100)
    
    @staticmethod
    def kobo_to_cedis(amount_kobo: int) -> Decimal:
        """Convert cedis (kobo equivalent) to GHS amount"""
        return Decimal(amount_kobo) / 100
    
    @staticmethod
    def generate_reference(prefix: str = "goshop") -> str:
        """Generate unique payment reference"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_suffix = uuid.uuid4().hex[:6]
        return f"{prefix}_{timestamp}_{random_suffix}"


# Singleton instance
paystack_service = PaystackService()
