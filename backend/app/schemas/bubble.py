"""
Bubble schemas for GoShopGhana social commerce
Pydantic models for bubble management and social features
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator, field_serializer, computed_field
from app.models.bubble import BubbleType, BubbleStatus, MemberRole, MemberStatus

# Bubble schemas
class BubbleBase(BaseModel):
    name: str
    description: Optional[str] = None
    bubble_type: BubbleType
    location: Optional[str] = None
    region: Optional[str] = None
    primary_products: Optional[List[str]] = None
    is_public: bool = True
    requires_approval: bool = False
    max_members: int = 1000
    fund_transfer_enabled: bool = False
    min_fund_transfer: float = 1.0  # In GHS
    max_fund_transfer: float = 1000.0  # In GHS

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Bubble name must be at least 3 characters')
        if len(v) > 100:
            raise ValueError('Bubble name cannot exceed 100 characters')
        return v.strip()

    @validator('max_members')
    def validate_max_members(cls, v):
        if v < 2:
            raise ValueError('Bubble must allow at least 2 members')
        if v > 10000:
            raise ValueError('Maximum members cannot exceed 10,000')
        return v

    @validator('min_fund_transfer', 'max_fund_transfer')
    def validate_fund_amounts(cls, v):
        if v < 0:
            raise ValueError('Fund transfer amounts must be positive')
        return v

class BubbleCreate(BubbleBase):
    pass

class BubbleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    region: Optional[str] = None
    primary_products: Optional[List[str]] = None
    is_public: Optional[bool] = None
    requires_approval: Optional[bool] = None
    max_members: Optional[int] = None
    fund_transfer_enabled: Optional[bool] = None
    min_fund_transfer: Optional[float] = None
    max_fund_transfer: Optional[float] = None

class BubbleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    bubble_type: BubbleType
    location: Optional[str] = None
    region: Optional[str] = None
    is_public: bool = True
    requires_approval: bool = False
    max_members: int = 1000
    fund_transfer_enabled: bool = False
    min_fund_transfer: float = 1.0
    max_fund_transfer: float = 1000.0
    status: BubbleStatus
    owner_id: str
    created_by_id: str
    member_count: int
    total_transactions: int
    created_at: datetime
    updated_at: datetime
    is_full: bool
    can_transfer_funds: bool
    primary_products: Optional[List[str]] = None

    @validator('primary_products', pre=True)
    def parse_primary_products(cls, v):
        """Parse primary_products from JSON string if needed"""
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v or []
    
    @validator('min_fund_transfer', 'max_fund_transfer', pre=True)
    def convert_fund_amounts(cls, v):
        """Convert cedis to float"""
        if isinstance(v, int):
            return float(v / 100)
        return float(v) if v else 0.0

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Member schemas
class BubbleMemberBase(BaseModel):
    role: MemberRole = MemberRole.MEMBER
    can_invite: bool = False
    can_post: bool = True
    can_transfer_funds: bool = False

class BubbleMemberInvite(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    message: Optional[str] = None
    role: MemberRole = MemberRole.MEMBER

    @validator('user_id', 'email')
    def validate_invitee(cls, v, values):
        if not v and not values.get('email') and not values.get('user_id'):
            raise ValueError('Either user_id or email must be provided')
        return v

class BubbleMemberUpdate(BaseModel):
    role: Optional[MemberRole] = None
    status: Optional[MemberStatus] = None
    can_invite: Optional[bool] = None
    can_post: Optional[bool] = None
    can_transfer_funds: Optional[bool] = None

class BubbleMemberResponse(BubbleMemberBase):
    id: str
    bubble_id: str
    user_id: str
    status: MemberStatus
    invited_by_id: Optional[str] = None
    joined_at: datetime
    approved_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None
    is_admin_or_owner: bool
    can_moderate: bool

    @field_serializer('joined_at', 'approved_at', 'last_active_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Invitation schemas
class BubbleInvitationResponse(BaseModel):
    id: str
    bubble_id: str
    inviter_id: str
    invitee_id: Optional[str] = None
    invitee_email: Optional[str] = None
    message: Optional[str] = None
    status: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    is_expired: bool

    @field_serializer('created_at', 'expires_at', 'responded_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Activity schemas
class BubbleActivityResponse(BaseModel):
    id: str
    bubble_id: str
    user_id: str
    activity_type: str
    description: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    @field_serializer('created_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# Bubble statistics
class BubbleStats(BaseModel):
    total_bubbles: int
    active_bubbles: int
    total_members: int
    bubbles_by_type: Dict[str, int]
    bubbles_by_region: Dict[str, int]
    fund_transfer_enabled_count: int

# Ghana-specific bubble types
class GhanaBubbleTypes(BaseModel):
    """Predefined bubble types for Ghana market"""
    product_based: List[str] = [
        "Yam Traders", "Plantain Sellers", "Cassava Farmers", 
        "Palm Oil Producers", "Cocoa Farmers", "Rice Growers",
        "Tomato Sellers", "Onion Traders", "Fish Sellers"
    ]
    location_based: List[str] = [
        "Kaneshie Market", "Kejetia Market", "Makola Market",
        "Tema Station", "Madina Market", "Okaishie Market",
        "Central Market Kumasi", "Tamale Central Market"
    ]
    farmer_coops: List[str] = [
        "Ashanti Farmers Cooperative", "Northern Region Farmers",
        "Volta Region Producers", "Eastern Region Growers",
        "Western Region Farmers", "Central Region Cooperative"
    ]

# Bubble search and filtering
class BubbleSearchRequest(BaseModel):
    query: Optional[str] = None
    bubble_type: Optional[BubbleType] = None
    location: Optional[str] = None
    region: Optional[str] = None
    is_public: Optional[bool] = None
    has_fund_transfer: Optional[bool] = None
    min_members: Optional[int] = None
    max_members: Optional[int] = None
    skip: int = 0
    limit: int = 20

class BubbleJoinRequest(BaseModel):
    message: Optional[str] = None

class BubbleLeaveRequest(BaseModel):
    reason: Optional[str] = None

# Fund transfer schemas (for future use)
class BubbleFundTransferRequest(BaseModel):
    recipient_user_id: str
    amount: float
    description: Optional[str] = None
    reference: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Transfer amount must be greater than 0')
        if v > 10000:  # Max 10,000 GHS
            raise ValueError('Transfer amount cannot exceed 10,000 GHS')
        return v

# Bubble recommendations
class BubbleRecommendation(BaseModel):
    bubble_id: str
    bubble_name: str
    reason: str
    score: float
    member_count: int
    bubble_type: BubbleType
