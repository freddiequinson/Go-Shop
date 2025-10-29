"""
User model for GoShopGhana
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base


class UserType(str, enum.Enum):
    """User types"""
    BUYER = "buyer"
    SELLER = "seller"
    ADMIN = "admin"


class VerificationStatus(str, enum.Enum):
    """Verification status"""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class PremiumTier(str, enum.Enum):
    """Premium tier levels"""
    BASIC = "basic"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # User classification
    user_type = Column(Enum(UserType), default=UserType.BUYER, nullable=False)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    premium_tier = Column(Enum(PremiumTier), default=PremiumTier.BASIC, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    account_status = Column(String(20), default="active", nullable=False)  # active, suspended, banned, deleted
    suspension_reason = Column(Text, nullable=True)
    
    # Profile information
    location = Column(String(255), nullable=True)
    latitude = Column(String(50), nullable=True)  # Geolocation latitude
    longitude = Column(String(50), nullable=True)  # Geolocation longitude
    bio = Column(Text, nullable=True)
    profile_picture_url = Column(Text, nullable=True)  # Base64 encoded image or URL
    referral_source = Column(String(100), nullable=True)  # How did you hear about us
    
    # Activity tracking
    last_activity_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships (using string references to avoid circular imports)
    # products = relationship("Product", back_populates="seller")
    # orders = relationship("Order", back_populates="user")
    
    # Messaging relationships
    conversation_participants = relationship("ConversationParticipant", back_populates="user")
    sent_messages = relationship("Message", back_populates="sender")
    message_reads = relationship("MessageRead", back_populates="user")
    message_notifications = relationship("MessageNotification", back_populates="user")
    
    # Review relationships
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    seller_reviews = relationship("Review", foreign_keys="Review.seller_id", back_populates="seller")
    review_responses = relationship("ReviewResponse", back_populates="responder")
    review_votes = relationship("ReviewHelpfulnessVote", back_populates="user")
    seller_rating = relationship("SellerRating", back_populates="seller", uselist=False)

    @property
    def phone_number(self):
        """Alias for phone field to match schema"""
        return self.phone
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"
