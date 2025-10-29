"""
Fund Transfer models for GoShopGhana bubble system
Enables financial transactions between bubble members
"""

import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime, timedelta

from app.db.database import Base


class TransferStatus(str, enum.Enum):
    """Fund transfer status"""
    PENDING = "pending"  # Awaiting approval/processing
    APPROVED = "approved"  # Approved but not yet processed
    PROCESSING = "processing"  # Currently being processed
    COMPLETED = "completed"  # Successfully completed
    FAILED = "failed"  # Failed to process
    CANCELLED = "cancelled"  # Cancelled by sender
    REJECTED = "rejected"  # Rejected by recipient or admin
    EXPIRED = "expired"  # Expired without action


class TransferType(str, enum.Enum):
    """Types of fund transfers"""
    PEER_TO_PEER = "peer_to_peer"  # Direct member-to-member transfer
    BULK_PURCHASE = "bulk_purchase"  # For group buying
    LOAN = "loan"  # Lending between members
    REPAYMENT = "repayment"  # Loan repayment
    EMERGENCY = "emergency"  # Emergency assistance
    TRADE_PAYMENT = "trade_payment"  # Payment for goods/services
    CONTRIBUTION = "contribution"  # Group contribution/pooling


class ApprovalLevel(str, enum.Enum):
    """Transfer approval levels"""
    NONE = "none"  # No approval needed (trusted members)
    RECIPIENT = "recipient"  # Recipient approval only
    ADMIN = "admin"  # Bubble admin approval
    OWNER = "owner"  # Bubble owner approval
    DUAL = "dual"  # Both recipient and admin approval


class FundTransfer(Base):
    """Fund transfer model for bubble member transactions"""
    __tablename__ = "fund_transfers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Transfer details
    reference = Column(String(50), unique=True, nullable=False)  # Unique transfer reference
    transfer_type = Column(Enum(TransferType), nullable=False)
    status = Column(Enum(TransferStatus), default=TransferStatus.PENDING, nullable=False)
    
    # Parties involved
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    bubble_id = Column(String, ForeignKey("bubbles.id"), nullable=False)
    
    # Financial details
    amount_cedis = Column(Integer, nullable=False)  # Amount in cedis (smallest unit)
    fee_cedis = Column(Integer, default=0, nullable=False)  # Transfer fee in cedis
    total_amount_cedis = Column(Integer, nullable=False)  # Total including fees
    
    # Transfer metadata
    purpose = Column(String(200), nullable=True)  # Purpose of transfer
    description = Column(Text, nullable=True)  # Detailed description
    reference_note = Column(String(100), nullable=True)  # Reference note from sender
    
    # Approval and authorization
    approval_level = Column(Enum(ApprovalLevel), nullable=False)
    requires_recipient_approval = Column(Boolean, default=True, nullable=False)
    requires_admin_approval = Column(Boolean, default=False, nullable=False)
    
    # Approval tracking
    recipient_approved = Column(Boolean, default=False, nullable=False)
    recipient_approved_at = Column(DateTime(timezone=True), nullable=True)
    admin_approved = Column(Boolean, default=False, nullable=False)
    admin_approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True)  # Admin who approved
    
    # Processing details
    processed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Wallet transaction references
    sender_transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    recipient_transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    
    # Expiry and limits
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Auto-expire if not approved
    daily_limit_check = Column(Boolean, default=True, nullable=False)  # Check daily limits
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Metadata for tracking
    ip_address = Column(String(45), nullable=True)  # IP address of initiator
    user_agent = Column(Text, nullable=True)  # User agent string
    meta_data = Column(Text, nullable=True)  # JSON for additional data

    def __repr__(self):
        return f"<FundTransfer(id={self.id}, reference={self.reference}, amount={self.amount_cedis/100} GHS, status={self.status})>"

    @property
    def amount_ghs(self):
        """Get amount in Ghana Cedis as float"""
        return float(self.amount_cedis / 100)

    @property
    def fee_ghs(self):
        """Get fee in Ghana Cedis as float"""
        return float(self.fee_cedis / 100)

    @property
    def total_amount_ghs(self):
        """Get total amount in Ghana Cedis as float"""
        return float(self.total_amount_cedis / 100)

    @property
    def is_expired(self):
        """Check if transfer has expired"""
        if not self.expires_at:
            return False
        
        from datetime import timezone
        
        # Get current time
        now = datetime.utcnow()
        
        # Make sure both datetimes have the same timezone awareness
        if self.expires_at.tzinfo is not None:
            # expires_at is timezone-aware, make now timezone-aware too
            now = now.replace(tzinfo=timezone.utc)
        elif now.tzinfo is not None:
            # now is timezone-aware, make expires_at timezone-aware too
            expires_at = self.expires_at.replace(tzinfo=timezone.utc)
            return now > expires_at
            
        return now > self.expires_at

    @property
    def is_pending_approval(self):
        """Check if transfer is pending approval"""
        if self.status != TransferStatus.PENDING:
            return False
        
        if self.requires_recipient_approval and not self.recipient_approved:
            return True
        
        if self.requires_admin_approval and not self.admin_approved:
            return True
        
        return False

    @property
    def can_be_processed(self):
        """Check if transfer can be processed"""
        if self.status != TransferStatus.PENDING:
            return False
        
        if self.is_expired:
            return False
        
        if self.requires_recipient_approval and not self.recipient_approved:
            return False
        
        if self.requires_admin_approval and not self.admin_approved:
            return False
        
        return True

    def generate_reference(self):
        """Generate unique transfer reference"""
        import random
        import string
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M")
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"TXF{timestamp}{random_part}"


class TransferLimit(Base):
    """Transfer limits for users and bubbles"""
    __tablename__ = "transfer_limits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Limit scope
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # User-specific limit
    bubble_id = Column(String, ForeignKey("bubbles.id"), nullable=True)  # Bubble-specific limit
    is_global = Column(Boolean, default=False, nullable=False)  # Global system limit
    
    # Limit details
    daily_limit_cedis = Column(Integer, nullable=False)  # Daily transfer limit in cedis
    monthly_limit_cedis = Column(Integer, nullable=False)  # Monthly transfer limit in cedis
    single_transfer_limit_cedis = Column(Integer, nullable=False)  # Single transfer limit
    
    # Current usage (reset daily/monthly)
    daily_used_cedis = Column(Integer, default=0, nullable=False)
    monthly_used_cedis = Column(Integer, default=0, nullable=False)
    last_daily_reset = Column(DateTime(timezone=True), nullable=True)
    last_monthly_reset = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<TransferLimit(user_id={self.user_id}, daily={self.daily_limit_cedis/100} GHS)>"

    @property
    def daily_limit_ghs(self):
        """Get daily limit in Ghana Cedis"""
        return float(self.daily_limit_cedis / 100)

    @property
    def monthly_limit_ghs(self):
        """Get monthly limit in Ghana Cedis"""
        return float(self.monthly_limit_cedis / 100)

    @property
    def single_transfer_limit_ghs(self):
        """Get single transfer limit in Ghana Cedis"""
        return float(self.single_transfer_limit_cedis / 100)

    @property
    def daily_remaining_ghs(self):
        """Get remaining daily limit in Ghana Cedis"""
        return float((self.daily_limit_cedis - self.daily_used_cedis) / 100)

    @property
    def monthly_remaining_ghs(self):
        """Get remaining monthly limit in Ghana Cedis"""
        return float((self.monthly_limit_cedis - self.monthly_used_cedis) / 100)

    def reset_daily_if_needed(self):
        """Reset daily usage if a new day has started"""
        today = datetime.utcnow().date()
        if not self.last_daily_reset or self.last_daily_reset.date() < today:
            self.daily_used_cedis = 0
            self.last_daily_reset = datetime.utcnow()
            return True
        return False

    def reset_monthly_if_needed(self):
        """Reset monthly usage if a new month has started"""
        today = datetime.utcnow()
        if not self.last_monthly_reset or (
            self.last_monthly_reset.year < today.year or 
            self.last_monthly_reset.month < today.month
        ):
            self.monthly_used_cedis = 0
            self.last_monthly_reset = datetime.utcnow()
            return True
        return False


class TransferApproval(Base):
    """Transfer approval tracking"""
    __tablename__ = "transfer_approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # References
    transfer_id = Column(String, ForeignKey("fund_transfers.id"), nullable=False)
    approver_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Approval details
    approval_type = Column(String(20), nullable=False)  # 'recipient', 'admin', 'owner'
    is_approved = Column(Boolean, nullable=False)
    comments = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<TransferApproval(transfer_id={self.transfer_id}, approver_id={self.approver_id}, approved={self.is_approved})>"
