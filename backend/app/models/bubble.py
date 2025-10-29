"""
Bubble models for GoShopGhana social commerce
Social groups for buyers and sellers with Ghana market context
"""

import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class BubbleType(str, enum.Enum):
    """Types of bubbles for Ghana market"""
    PRODUCT_BASED = "product_based"  # e.g., "Yam Sellers Accra"
    LOCATION_BASED = "location_based"  # e.g., "Kaneshie Market Traders"
    FARMER_COOP = "farmer_coop"  # e.g., "Ashanti Plantain Farmers"
    WHOLESALE = "wholesale"  # e.g., "Tema Wholesale Network"
    GENERAL = "general"  # General trading groups


class BubbleStatus(str, enum.Enum):
    """Bubble status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"


class MemberRole(str, enum.Enum):
    """Member roles in bubbles"""
    OWNER = "owner"  # Bubble creator
    ADMIN = "admin"  # Can manage members and settings
    MODERATOR = "moderator"  # Can moderate discussions
    MEMBER = "member"  # Regular member
    PENDING = "pending"  # Pending approval


class MemberStatus(str, enum.Enum):
    """Member status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    BANNED = "banned"
    LEFT = "left"


class Bubble(Base):
    """Bubble model for social commerce groups"""
    __tablename__ = "bubbles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic info
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    bubble_type = Column(Enum(BubbleType), nullable=False)
    status = Column(Enum(BubbleStatus), default=BubbleStatus.ACTIVE, nullable=False)
    
    # Ghana market specific
    location = Column(String(100), nullable=True)  # e.g., "Accra", "Kumasi", "Tamale"
    region = Column(String(50), nullable=True)  # e.g., "Greater Accra", "Ashanti"
    primary_products = Column(Text, nullable=True)  # JSON array of main products
    
    # Settings
    is_public = Column(Boolean, default=True, nullable=False)  # Public or private
    requires_approval = Column(Boolean, default=False, nullable=False)  # Auto-join or approval needed
    max_members = Column(Integer, default=1000, nullable=False)  # Member limit
    
    # Fund transfer settings
    fund_transfer_enabled = Column(Boolean, default=False, nullable=False)
    min_fund_transfer = Column(Integer, default=100, nullable=False)  # Minimum in cedis
    max_fund_transfer = Column(Integer, default=100000, nullable=False)  # Maximum in cedis
    
    # Owner and creation
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Statistics (updated periodically)
    member_count = Column(Integer, default=0, nullable=False)
    total_transactions = Column(Integer, default=0, nullable=False)
    
    # Relationships (commented out to avoid circular imports for now)
    # owner = relationship("User", foreign_keys=[owner_id])
    # created_by = relationship("User", foreign_keys=[created_by_id])
    # members = relationship("BubbleMember", back_populates="bubble")
    
    # Messaging relationships
    conversations = relationship("Conversation", back_populates="bubble")

    def __repr__(self):
        return f"<Bubble(id={self.id}, name={self.name}, type={self.bubble_type}, members={self.member_count})>"

    @property
    def is_full(self):
        """Check if bubble has reached member limit"""
        return self.member_count >= self.max_members

    @property
    def can_transfer_funds(self):
        """Check if fund transfers are enabled and bubble is active"""
        return self.fund_transfer_enabled and self.status == BubbleStatus.ACTIVE
    
    @property
    def primary_products_list(self):
        """Get primary products as a list"""
        if not self.primary_products:
            return []
        try:
            import json
            return json.loads(self.primary_products)
        except (json.JSONDecodeError, TypeError):
            return []


class BubbleMember(Base):
    """Bubble membership model"""
    __tablename__ = "bubble_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # References
    bubble_id = Column(String, ForeignKey("bubbles.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Membership details
    role = Column(Enum(MemberRole), default=MemberRole.MEMBER, nullable=False)
    status = Column(Enum(MemberStatus), default=MemberStatus.ACTIVE, nullable=False)
    
    # Permissions
    can_invite = Column(Boolean, default=False, nullable=False)
    can_post = Column(Boolean, default=True, nullable=False)
    can_transfer_funds = Column(Boolean, default=False, nullable=False)
    
    # Invitation details
    invited_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    invitation_message = Column(Text, nullable=True)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships (commented out to avoid circular imports for now)
    # bubble = relationship("Bubble", back_populates="members")
    # user = relationship("User")
    # invited_by = relationship("User", foreign_keys=[invited_by_id])

    def __repr__(self):
        return f"<BubbleMember(bubble_id={self.bubble_id}, user_id={self.user_id}, role={self.role})>"

    @property
    def is_admin_or_owner(self):
        """Check if member has admin privileges"""
        return self.role in [MemberRole.OWNER, MemberRole.ADMIN]

    @property
    def can_moderate(self):
        """Check if member can moderate"""
        return self.role in [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MODERATOR]


class BubbleInvitation(Base):
    """Bubble invitation model"""
    __tablename__ = "bubble_invitations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # References
    bubble_id = Column(String, ForeignKey("bubbles.id"), nullable=False)
    inviter_id = Column(String, ForeignKey("users.id"), nullable=False)
    invitee_id = Column(String, ForeignKey("users.id"), nullable=True)  # Can be null for email invites
    invitee_email = Column(String(255), nullable=True)  # For non-registered users
    
    # Invitation details
    message = Column(Text, nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, accepted, declined, expired
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships (commented out to avoid circular imports for now)
    # bubble = relationship("Bubble")
    # inviter = relationship("User", foreign_keys=[inviter_id])
    # invitee = relationship("User", foreign_keys=[invitee_id])

    def __repr__(self):
        return f"<BubbleInvitation(bubble_id={self.bubble_id}, invitee={self.invitee_email or self.invitee_id}, status={self.status})>"

    @property
    def is_expired(self):
        """Check if invitation has expired"""
        if not self.expires_at:
            return False
        return func.now() > self.expires_at


class BubbleActivity(Base):
    """Activity log for bubbles"""
    __tablename__ = "bubble_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # References
    bubble_id = Column(String, ForeignKey("bubbles.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Activity details
    activity_type = Column(String(50), nullable=False)  # joined, left, posted, transferred_funds, etc.
    description = Column(Text, nullable=True)
    meta_data = Column(Text, nullable=True)  # JSON for additional data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships (commented out to avoid circular imports for now)
    # bubble = relationship("Bubble")
    # user = relationship("User")

    def __repr__(self):
        return f"<BubbleActivity(bubble_id={self.bubble_id}, type={self.activity_type}, user_id={self.user_id})>"
