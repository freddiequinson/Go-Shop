"""
Pydantic schemas for messaging system
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

from app.models.message import MessageType, MessageStatus, ConversationType


# Base schemas
class ConversationBase(BaseModel):
    """Base conversation schema"""
    type: ConversationType = ConversationType.DIRECT
    title: Optional[str] = None
    description: Optional[str] = None
    bubble_id: Optional[str] = None
    order_id: Optional[str] = None
    product_id: Optional[str] = None
    language_preference: str = "en"
    market_context: Optional[Dict[str, Any]] = None


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation"""
    participant_ids: List[str] = Field(..., min_items=1, max_items=50)
    
    @validator('participant_ids')
    def validate_participants(cls, v):
        if len(set(v)) != len(v):
            raise ValueError('Duplicate participant IDs not allowed')
        return v


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation"""
    title: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None
    allow_new_members: Optional[bool] = None
    language_preference: Optional[str] = None


class ConversationParticipantBase(BaseModel):
    """Base participant schema"""
    user_id: str
    role: str = "member"
    can_send_messages: bool = True
    can_add_members: bool = False
    can_remove_members: bool = False


class ConversationParticipantCreate(ConversationParticipantBase):
    """Schema for adding a participant"""
    pass


class ConversationParticipantUpdate(BaseModel):
    """Schema for updating participant permissions"""
    role: Optional[str] = None
    can_send_messages: Optional[bool] = None
    can_add_members: Optional[bool] = None
    can_remove_members: Optional[bool] = None
    is_muted: Optional[bool] = None
    muted_until: Optional[datetime] = None


class MessageBase(BaseModel):
    """Base message schema"""
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: MessageType = MessageType.DIRECT
    content_type: str = "text"
    reply_to_id: Optional[str] = None
    language: str = "en"
    market_terms: Optional[Dict[str, Any]] = None
    location_data: Optional[Dict[str, Any]] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class MessageCreate(MessageBase):
    """Schema for creating a message"""
    conversation_id: str


class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    is_deleted: Optional[bool] = None


class MessageRead(BaseModel):
    """Schema for marking message as read"""
    message_id: str
    read_at: Optional[datetime] = None


# Response schemas
class UserSummary(BaseModel):
    """Summary user info for messaging"""
    id: str
    username: str
    full_name: str
    user_type: str
    
    class Config:
        from_attributes = True


class ConversationParticipantResponse(ConversationParticipantBase):
    """Response schema for conversation participant"""
    id: str
    conversation_id: str
    is_active: bool
    is_muted: bool
    muted_until: Optional[datetime]
    last_read_at: datetime
    unread_count: int
    joined_at: datetime
    left_at: Optional[datetime]
    user: UserSummary
    
    class Config:
        from_attributes = True


class MessageResponse(MessageBase):
    """Response schema for message"""
    id: str
    conversation_id: str
    sender_id: str
    status: MessageStatus
    is_edited: bool
    is_deleted: bool
    is_system_message: bool
    delivered_at: Optional[datetime]
    read_count: int
    created_at: datetime
    updated_at: datetime
    sender: UserSummary
    
    class Config:
        from_attributes = True


class ConversationResponse(ConversationBase):
    """Response schema for conversation"""
    id: str
    is_active: bool
    is_archived: bool
    allow_new_members: bool
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime]
    participants: List[ConversationParticipantResponse] = []
    last_message: Optional[MessageResponse] = None
    unread_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """Response schema for conversation list"""
    conversations: List[ConversationResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class MessageListResponse(BaseModel):
    """Response schema for message list"""
    messages: List[MessageResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


# Ghana market specific schemas
class GhanaMarketMessage(MessageBase):
    """Ghana market specific message schema"""
    market_location: Optional[str] = None
    product_mentioned: Optional[str] = None
    price_mentioned: Optional[float] = None
    currency: str = "GHS"
    local_language: Optional[str] = None  # tw, ga, ewe, etc.
    
    @validator('local_language')
    def validate_language(cls, v):
        if v and v not in ['tw', 'ga', 'ewe', 'hausa', 'dagbani', 'fante']:
            raise ValueError('Unsupported local language')
        return v


class BubbleGroupMessage(MessageBase):
    """Bubble group message schema"""
    bubble_id: str
    mentions: Optional[List[str]] = None  # User IDs mentioned
    is_announcement: bool = False
    priority: str = "normal"  # low, normal, high, urgent
    
    @validator('priority')
    def validate_priority(cls, v):
        if v not in ['low', 'normal', 'high', 'urgent']:
            raise ValueError('Invalid priority level')
        return v


class OrderChatMessage(MessageBase):
    """Order-specific chat message schema"""
    order_id: str
    message_category: str = "general"  # general, delivery, payment, issue
    is_status_update: bool = False
    
    @validator('message_category')
    def validate_category(cls, v):
        if v not in ['general', 'delivery', 'payment', 'issue', 'review']:
            raise ValueError('Invalid message category')
        return v


# Notification schemas
class MessageNotificationCreate(BaseModel):
    """Schema for creating message notification"""
    user_id: str
    message_id: str
    conversation_id: str
    notification_type: str = "message"
    title: str
    body: str


class MessageNotificationResponse(BaseModel):
    """Response schema for message notification"""
    id: str
    user_id: str
    message_id: str
    conversation_id: str
    notification_type: str
    title: str
    body: str
    is_sent: bool
    is_read: bool
    sent_at: Optional[datetime]
    read_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Statistics schemas
class ConversationStats(BaseModel):
    """Conversation statistics"""
    total_messages: int
    total_participants: int
    active_participants: int
    messages_today: int
    messages_this_week: int
    most_active_user: Optional[UserSummary] = None
    avg_response_time_minutes: Optional[float] = None


class UserMessagingStats(BaseModel):
    """User messaging statistics"""
    total_conversations: int
    active_conversations: int
    total_messages_sent: int
    total_messages_received: int
    unread_messages: int
    avg_response_time_minutes: Optional[float] = None
    most_contacted_users: List[UserSummary] = []
