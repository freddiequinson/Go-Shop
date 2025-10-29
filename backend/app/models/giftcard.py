"""
Gift Card models for GoShopGhana
Secure gift card system with blockchain-style verification
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
import hashlib
import secrets

from app.db.database import Base


class GiftCardStatus(str, enum.Enum):
    """Gift card status"""
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class GiftCardType(str, enum.Enum):
    """Gift card type"""
    EXPIRY = "expiry"  # Has expiration date
    NON_EXPIRY = "non_expiry"  # No expiration


class GiftCard(Base):
    """
    Gift Card model with blockchain-style verification
    """
    __tablename__ = "giftcards"
    
    id = Column(String(36), primary_key=True, index=True)
    code = Column(String(16), unique=True, nullable=False, index=True)  # e.g., GOSH-XXXX-XXXX-XXXX
    pin = Column(String(6), nullable=False)  # 6-digit PIN
    
    # Amount
    amount_cedis = Column(Integer, nullable=False)  # Amount in cedis (kobo equivalent)
    original_amount_cedis = Column(Integer, nullable=False)  # Original amount for tracking
    
    # Type and Status
    card_type = Column(SQLEnum(GiftCardType), nullable=False, default=GiftCardType.EXPIRY)
    status = Column(SQLEnum(GiftCardStatus), nullable=False, default=GiftCardStatus.ACTIVE)
    
    # Expiry
    expires_at = Column(DateTime, nullable=True)  # None for non-expiry cards
    
    # Generation info
    generated_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    generated_by = relationship("User", foreign_keys=[generated_by_id])
    
    # Redemption info
    redeemed_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    redeemed_by = relationship("User", foreign_keys=[redeemed_by_id])
    redeemed_at = Column(DateTime, nullable=True)
    
    # Blockchain-style verification
    hash_chain = Column(Text, nullable=False)  # SHA-256 hash chain for verification
    previous_hash = Column(Text, nullable=True)  # Link to previous card in chain
    nonce = Column(String(64), nullable=False)  # Random nonce for uniqueness
    
    # Metadata
    description = Column(Text, nullable=True)
    meta_data = Column(Text, nullable=True)  # JSON metadata
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def generate_code(self) -> str:
        """Generate unique gift card code"""
        # Format: GOSH-XXXX-XXXX-XXXX
        part1 = secrets.token_hex(2).upper()
        part2 = secrets.token_hex(2).upper()
        part3 = secrets.token_hex(2).upper()
        return f"GOSH-{part1}-{part2}-{part3}"
    
    def generate_pin(self) -> str:
        """Generate 6-digit PIN"""
        return f"{secrets.randbelow(1000000):06d}"
    
    def calculate_hash(self) -> str:
        """
        Calculate blockchain-style hash for verification
        Hash includes: code, pin, amount, nonce, previous_hash
        """
        data = f"{self.code}{self.pin}{self.amount_cedis}{self.nonce}{self.previous_hash or ''}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def verify_hash(self) -> bool:
        """Verify the hash chain integrity"""
        calculated_hash = self.calculate_hash()
        return calculated_hash == self.hash_chain
    
    def is_valid(self) -> bool:
        """Check if gift card is valid for redemption"""
        if self.status != GiftCardStatus.ACTIVE:
            return False
        
        if self.card_type == GiftCardType.EXPIRY and self.expires_at:
            if datetime.utcnow() > self.expires_at:
                return False
        
        if self.amount_cedis <= 0:
            return False
        
        return self.verify_hash()
    
    @property
    def amount(self) -> float:
        """Get amount in cedis (decimal)"""
        return self.amount_cedis / 100
    
    @property
    def original_amount(self) -> float:
        """Get original amount in cedis (decimal)"""
        return self.original_amount_cedis / 100


class GiftCardTransaction(Base):
    """
    Gift card transaction history for audit trail
    """
    __tablename__ = "giftcard_transactions"
    
    id = Column(String(36), primary_key=True, index=True)
    giftcard_id = Column(String(36), ForeignKey("giftcards.id"), nullable=False)
    giftcard = relationship("GiftCard", backref="transactions")
    
    # Transaction details
    transaction_type = Column(String(20), nullable=False)  # generated, redeemed, cancelled
    amount_cedis = Column(Integer, nullable=False)
    
    # User involved
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user = relationship("User")
    
    # Verification
    transaction_hash = Column(Text, nullable=False)  # Hash of this transaction
    
    # Metadata
    description = Column(Text, nullable=True)
    meta_data = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def calculate_transaction_hash(self) -> str:
        """Calculate hash for this transaction"""
        data = f"{self.giftcard_id}{self.transaction_type}{self.amount_cedis}{self.user_id}{self.created_at}"
        return hashlib.sha256(data.encode()).hexdigest()
