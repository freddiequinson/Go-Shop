"""
Gift Card model for GoShopGhana
Allows admin to create redeemable gift cards that add funds to user wallets
"""

import uuid
import enum
from sqlalchemy import Column, String, Numeric, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.sql import func

from app.db.database import Base


class GiftCardStatus(str, enum.Enum):
    """Gift card status"""
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class GiftCard(Base):
    """Gift card model for wallet top-up"""
    __tablename__ = "gift_cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Gift card code (unique, e.g., GOSHOP-A3B7-K9M2-P5Q8)
    code = Column(String(50), unique=True, nullable=False, index=True)
    
    # Amount in cedis (stored as integer to avoid float precision issues)
    amount_cedis = Column(Numeric(12, 0), nullable=False)
    currency = Column(String(3), default="GHS", nullable=False)
    
    # Status
    status = Column(Enum(GiftCardStatus), default=GiftCardStatus.ACTIVE, nullable=False, index=True)
    
    # Creator (admin who created it)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Redemption details
    redeemed_by = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Optional message/note
    message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<GiftCard(code={self.code}, amount={self.amount_cedis/100} GHS, status={self.status})>"

    @property
    def amount(self):
        """Get amount in GHS (converted from cedis)"""
        return float(self.amount_cedis) / 100

    @property
    def is_valid(self):
        """Check if gift card is valid for redemption"""
        if self.status != GiftCardStatus.ACTIVE:
            return False
        if self.expires_at and func.now() > self.expires_at:
            return False
        return True

    def can_redeem(self) -> tuple[bool, str]:
        """
        Check if gift card can be redeemed
        Returns (can_redeem, error_message)
        """
        if self.status == GiftCardStatus.REDEEMED:
            return False, "This gift card has already been redeemed"
        if self.status == GiftCardStatus.CANCELLED:
            return False, "This gift card has been cancelled"
        if self.status == GiftCardStatus.EXPIRED:
            return False, "This gift card has expired"
        if self.expires_at and func.now() > self.expires_at:
            return False, "This gift card has expired"
        if self.status != GiftCardStatus.ACTIVE:
            return False, "This gift card is not active"
        return True, ""
