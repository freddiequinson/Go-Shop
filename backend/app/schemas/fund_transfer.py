"""
Fund Transfer schemas for GoShopGhana bubble system
Pydantic models for fund transfer management
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer
from app.models.fund_transfer import TransferStatus, TransferType, ApprovalLevel

# Fund Transfer schemas
class FundTransferBase(BaseModel):
    recipient_id: str
    bubble_id: str
    amount: float  # Amount in GHS
    transfer_type: TransferType = TransferType.PEER_TO_PEER
    purpose: Optional[str] = None
    description: Optional[str] = None
    reference_note: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Transfer amount must be greater than 0')
        if v > 50000:  # Max 50,000 GHS
            raise ValueError('Transfer amount cannot exceed 50,000 GHS')
        return v

    @validator('purpose')
    def validate_purpose(cls, v):
        if v and len(v.strip()) < 3:
            raise ValueError('Purpose must be at least 3 characters')
        return v.strip() if v else None

class FundTransferCreate(FundTransferBase):
    pass

class FundTransferUpdate(BaseModel):
    purpose: Optional[str] = None
    description: Optional[str] = None
    reference_note: Optional[str] = None

class FundTransferResponse(BaseModel):
    id: str
    reference: str
    sender_id: str
    recipient_id: str
    bubble_id: str
    transfer_type: TransferType
    status: TransferStatus
    amount: float  # In GHS - uses amount_ghs property
    fee: float  # In GHS - uses fee_ghs property
    total_amount: float  # In GHS - uses total_amount_ghs property
    purpose: Optional[str] = None
    description: Optional[str] = None
    reference_note: Optional[str] = None
    approval_level: ApprovalLevel
    requires_recipient_approval: bool
    requires_admin_approval: bool
    recipient_approved: bool
    admin_approved: bool
    is_expired: bool  # Uses model property
    is_pending_approval: bool  # Uses model property
    can_be_processed: bool  # Uses model property
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None

    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle property mapping"""
        return cls(
            id=str(obj.id),
            reference=obj.reference,
            sender_id=str(obj.sender_id),
            recipient_id=str(obj.recipient_id),
            bubble_id=str(obj.bubble_id),
            transfer_type=obj.transfer_type,
            status=obj.status,
            amount=obj.amount_ghs,  # Use property
            fee=obj.fee_ghs,  # Use property
            total_amount=obj.total_amount_ghs,  # Use property
            purpose=obj.purpose,
            description=obj.description,
            reference_note=obj.reference_note,
            approval_level=obj.approval_level,
            requires_recipient_approval=obj.requires_recipient_approval,
            requires_admin_approval=obj.requires_admin_approval,
            recipient_approved=obj.recipient_approved,
            admin_approved=obj.admin_approved,
            is_expired=obj.is_expired,  # Use property
            is_pending_approval=obj.is_pending_approval,  # Use property
            can_be_processed=obj.can_be_processed,  # Use property
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            expires_at=obj.expires_at,
            processed_at=obj.processed_at,
            completed_at=obj.completed_at,
            failed_at=obj.failed_at,
            failure_reason=obj.failure_reason
        )

    @field_serializer('created_at', 'updated_at', 'expires_at', 'processed_at', 'completed_at', 'failed_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Transfer approval schemas
class TransferApprovalRequest(BaseModel):
    is_approved: bool
    comments: Optional[str] = None

class TransferApprovalResponse(BaseModel):
    id: str
    transfer_id: str
    approver_id: str
    approval_type: str
    is_approved: bool
    comments: Optional[str] = None
    created_at: datetime

    @field_serializer('created_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Transfer limit schemas
class TransferLimitResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    bubble_id: Optional[str] = None
    is_global: bool
    daily_limit: float  # In GHS
    monthly_limit: float  # In GHS
    single_transfer_limit: float  # In GHS
    daily_used: float  # In GHS
    monthly_used: float  # In GHS
    daily_remaining: float  # In GHS
    monthly_remaining: float  # In GHS
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @validator('daily_limit', 'monthly_limit', 'single_transfer_limit', 'daily_used', 'monthly_used', pre=True)
    def convert_cedis_to_ghs(cls, v):
        """Convert cedis to GHS if needed"""
        if isinstance(v, int):
            return float(v / 100)
        return float(v) if v else 0.0

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Transfer search and filtering
class TransferSearchRequest(BaseModel):
    status: Optional[TransferStatus] = None
    transfer_type: Optional[TransferType] = None
    sender_id: Optional[str] = None
    recipient_id: Optional[str] = None
    bubble_id: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    skip: int = 0
    limit: int = 20

# Transfer statistics
class TransferStats(BaseModel):
    total_transfers: int
    completed_transfers: int
    pending_transfers: int
    failed_transfers: int
    total_volume_ghs: float
    completed_volume_ghs: float
    average_transfer_amount_ghs: float
    transfers_by_type: Dict[str, int]
    transfers_by_status: Dict[str, int]
    daily_volume_ghs: float
    monthly_volume_ghs: float

# Bubble transfer summary
class BubbleTransferSummary(BaseModel):
    bubble_id: str
    bubble_name: str
    total_transfers: int
    total_volume_ghs: float
    active_members_with_transfers: int
    average_transfer_amount_ghs: float
    most_common_transfer_type: str

# User transfer summary
class UserTransferSummary(BaseModel):
    user_id: str
    sent_transfers: int
    received_transfers: int
    sent_volume_ghs: float
    received_volume_ghs: float
    pending_sent: int
    pending_received: int
    success_rate: float  # Percentage of successful transfers

# Transfer notification schemas
class TransferNotification(BaseModel):
    transfer_id: str
    notification_type: str  # 'created', 'approved', 'completed', 'failed', 'expired'
    message: str
    recipient_user_id: str
    created_at: datetime

# Ghana-specific transfer types
class GhanaTransferTypes(BaseModel):
    """Predefined transfer types for Ghana market"""
    peer_to_peer: str = "Direct member-to-member transfer"
    bulk_purchase: str = "Group buying for wholesale prices"
    loan: str = "Lending between trusted members"
    repayment: str = "Loan repayment to member"
    emergency: str = "Emergency financial assistance"
    trade_payment: str = "Payment for goods or services"
    contribution: str = "Group contribution or pooling"

# Transfer validation response
class TransferValidationResponse(BaseModel):
    is_valid: bool
    can_transfer: bool
    validation_errors: List[str]
    warnings: List[str]
    daily_limit_remaining: float
    monthly_limit_remaining: float
    estimated_fee: float
    estimated_total: float

# Bulk transfer (for future use)
class BulkTransferRequest(BaseModel):
    bubble_id: str
    transfer_type: TransferType
    purpose: str
    recipients: List[Dict[str, Any]]  # [{"user_id": "...", "amount": 100.0}]
    
    @validator('recipients')
    def validate_recipients(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one recipient is required')
        if len(v) > 50:
            raise ValueError('Cannot transfer to more than 50 recipients at once')
        
        total_amount = sum(recipient.get('amount', 0) for recipient in v)
        if total_amount > 100000:  # Max 100,000 GHS total
            raise ValueError('Total bulk transfer amount cannot exceed 100,000 GHS')
        
        return v
