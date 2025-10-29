"""
Payment and wallet schemas for GoShopGhana
Pydantic models for Paystack integration and wallet management
"""

from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer, EmailStr
from app.models.wallet import TransactionType, TransactionStatus, PaymentMethod

# Wallet schemas
class WalletBase(BaseModel):
    pass

class WalletResponse(WalletBase):
    id: str
    user_id: str
    balance_cedis: Decimal
    balance: float
    is_active: bool
    is_frozen: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    transaction_type: TransactionType
    amount_cedis: Decimal
    description: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None

    @validator('amount_cedis')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        if v > 10000000:  # Max 100,000 GHS
            raise ValueError('Amount cannot exceed 100,000 GHS')
        return v

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str
    wallet_id: str
    status: TransactionStatus
    payment_reference: Optional[str] = None
    meta_data: Optional[str] = None
    order_id: Optional[str] = None
    amount: float
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    @field_serializer('created_at', 'updated_at', 'completed_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Payment session schemas
class PaymentInitRequest(BaseModel):
    amount: Decimal  # Amount in GHS
    order_id: Optional[str] = None
    callback_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        if v > 100000:  # Max 100,000 GHS
            raise ValueError('Amount cannot exceed 100,000 GHS')
        return v

class PaymentInitResponse(BaseModel):
    payment_session_id: str
    paystack_reference: str
    authorization_url: str
    access_code: str
    amount: float
    currency: str = "GHS"
    status: str

class PaymentVerificationResponse(BaseModel):
    payment_session_id: str
    paystack_reference: str
    status: TransactionStatus
    amount: float
    currency: str
    payment_method: Optional[PaymentMethod] = None
    transaction_id: Optional[str] = None
    verified_at: Optional[datetime] = None

    @field_serializer('verified_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

# Wallet operations
class WalletCreditRequest(BaseModel):
    amount: Decimal
    description: Optional[str] = None
    payment_reference: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class WalletDebitRequest(BaseModel):
    amount: Decimal
    description: Optional[str] = None
    order_id: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

# Payment statistics
class PaymentStats(BaseModel):
    total_transactions: int
    successful_transactions: int
    failed_transactions: int
    total_volume: float
    currency: str = "GHS"

# Ghana-specific payment methods
class GhanaPaymentMethods(BaseModel):
    """Available payment methods in Ghana"""
    card: bool = True
    mobile_money: Dict[str, bool] = {
        "mtn": True,
        "vodafone": True,
        "airteltigo": True
    }
    bank_transfer: bool = True
    wallet: bool = True

# Paystack webhook payload
class PaystackWebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]

# Payment method validation for Ghana
class PaymentMethodValidator:
    """Validator for Ghana-specific payment methods"""
    
    GHANA_MOBILE_MONEY_PROVIDERS = ["mtn", "vodafone", "airteltigo"]
    GHANA_BANKS = [
        "access_bank", "cal_bank", "ecobank", "fidelity_bank", 
        "first_national_bank", "gcb_bank", "gtbank", "prudential_bank",
        "republic_bank", "societe_generale", "standard_chartered", 
        "uba", "universal_merchant_bank", "zenith_bank"
    ]
    
    @staticmethod
    def validate_mobile_money_provider(provider: str) -> bool:
        """Validate mobile money provider for Ghana"""
        return provider.lower() in PaymentMethodValidator.GHANA_MOBILE_MONEY_PROVIDERS
    
    @staticmethod
    def validate_bank_code(bank_code: str) -> bool:
        """Validate bank code for Ghana"""
        return bank_code.lower() in PaymentMethodValidator.GHANA_BANKS
    
    @staticmethod
    def validate_ghana_phone(phone: str) -> bool:
        """Validate Ghana phone number format"""
        # Ghana phone numbers: +233XXXXXXXXX or 0XXXXXXXXX
        if phone.startswith('+233') and len(phone) == 13:
            return phone[4:].isdigit()
        elif phone.startswith('0') and len(phone) == 10:
            return phone[1:].isdigit()
        return False
