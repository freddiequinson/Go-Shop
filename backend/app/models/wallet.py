"""
Wallet and payment models for GoShopGhana
Ghana market focused with Paystack integration
"""

import uuid
from sqlalchemy import Column, String, Numeric, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class TransactionType(str, enum.Enum):
    """Transaction types"""
    CREDIT = "credit"
    DEBIT = "debit"


class TransactionStatus(str, enum.Enum):
    """Transaction status"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    """Payment methods supported in Ghana"""
    CARD = "card"
    MOBILE_MONEY = "mobile_money"
    BANK_TRANSFER = "bank_transfer"
    WALLET = "wallet"
    FUND_TRANSFER = "fund_transfer"
    GIFTCARD = "giftcard"


class Wallet(Base):
    """User wallet model for Ghana market"""
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Balance in Ghana cedis (stored as integer to avoid float precision issues)
    balance_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    
    # Wallet status
    is_active = Column(Boolean, default=True, nullable=False)
    is_frozen = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships (commented out to avoid circular imports for now)
    # user = relationship("User", back_populates="wallet")
    # transactions = relationship("Transaction", back_populates="wallet")

    def __repr__(self):
        return f"<Wallet(id={self.id}, user_id={self.user_id}, balance={self.balance_cedis/100} GHS)>"

    @property
    def balance(self):
        """Get balance in GHS (converted from cedis)"""
        return float(self.balance_cedis) / 100

    def can_debit(self, amount_cedis: int) -> bool:
        """Check if wallet has sufficient balance for debit"""
        return self.balance_cedis >= amount_cedis and self.is_active and not self.is_frozen


class Transaction(Base):
    """Transaction model for wallet operations"""
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String, ForeignKey("wallets.id"), nullable=False)
    
    # Transaction details
    transaction_type = Column(Enum(TransactionType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    amount_cedis = Column(Numeric(12, 0), nullable=False)
    status = Column(Enum(TransactionStatus, values_callable=lambda x: [e.value for e in x]), default=TransactionStatus.PENDING, nullable=False)
    
    # Payment details
    payment_method = Column(Enum(PaymentMethod, values_callable=lambda x: [e.value for e in x]), nullable=True)
    payment_reference = Column(String(255), nullable=True)  # Paystack reference
    
    # Description and metadata
    description = Column(Text, nullable=True)
    meta_data = Column(Text, nullable=True)  # JSON string for additional data
    
    # Related order (if applicable)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships (commented out to avoid circular imports for now)
    # wallet = relationship("Wallet", back_populates="transactions")
    # order = relationship("Order")

    def __repr__(self):
        return f"<Transaction(id={self.id}, type={self.transaction_type}, amount={self.amount_cedis/100} GHS, status={self.status})>"

    @property
    def amount(self):
        """Get amount in GHS (converted from cedis)"""
        return float(self.amount_cedis) / 100


class PaymentSession(Base):
    """Payment session model for Paystack integration"""
    __tablename__ = "payment_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    
    # Paystack details
    paystack_reference = Column(String(255), unique=True, nullable=False)
    paystack_access_code = Column(String(255), nullable=True)
    paystack_authorization_url = Column(Text, nullable=True)
    
    # Payment details
    amount_cedis = Column(Numeric(12, 0), nullable=False)
    currency = Column(String(3), default="GHS", nullable=False)
    email = Column(String(255), nullable=False)
    
    # Status
    status = Column(Enum(TransactionStatus, values_callable=lambda x: [e.value for e in x]), default=TransactionStatus.PENDING, nullable=False)
    payment_method = Column(Enum(PaymentMethod, values_callable=lambda x: [e.value for e in x]), nullable=True)
    
    # Metadata
    meta_data = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships (commented out to avoid circular imports for now)
    # user = relationship("User")
    # order = relationship("Order")

    def __repr__(self):
        return f"<PaymentSession(id={self.id}, reference={self.paystack_reference}, amount={self.amount_cedis/100} GHS, status={self.status})>"

    @property
    def amount(self):
        """Get amount in GHS (converted from cedis)"""
        return float(self.amount_cedis) / 100

    @property
    def is_expired(self):
        """Check if payment session has expired"""
        if not self.expires_at:
            return False
        return func.now() > self.expires_at
