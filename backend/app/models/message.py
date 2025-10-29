"""
Message models for GoShopGhana messaging system
Supports buyer-seller communication and bubble group messaging
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class MessageType(str, Enum):
    """Types of messages in the system"""
    DIRECT = "direct"  # Direct message between two users
    GROUP = "group"    # Group message in a bubble
    ORDER = "order"    # Order-related message
    SYSTEM = "system"  # System notification message


class MessageStatus(str, Enum):
    """Message delivery status"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class ConversationType(str, Enum):
    """Types of conversations"""
    DIRECT = "direct"      # One-on-one conversation
    BUBBLE_GROUP = "bubble_group"  # Bubble group conversation
    ORDER_CHAT = "order_chat"      # Order-specific conversation
    SUPPORT = "support"    # Customer support conversation


class Conversation(Base):
    """
    Conversation model for organizing messages
    Supports direct chats, bubble groups, and order-specific conversations
    """
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(20), nullable=False, default=ConversationType.DIRECT)
    title = Column(String(200))  # Optional title for group conversations
    description = Column(Text)   # Optional description
    
    # References
    bubble_id = Column(String, ForeignKey("bubbles.id"), nullable=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    
    # Conversation settings
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    allow_new_members = Column(Boolean, default=True)  # For group conversations
    
    # Ghana market context
    market_context = Column(JSON)  # Store market-specific context
    language_preference = Column(String(10), default="en")  # en, tw, ga, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = Column(DateTime)
    
    # Relationships
    bubble = relationship("Bubble", back_populates="conversations")
    order = relationship("Order", back_populates="conversation")
    product = relationship("Product", back_populates="conversations")
    participants = relationship("ConversationParticipant", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation")


class ConversationParticipant(Base):
    """
    Participants in a conversation
    Tracks user participation and permissions
    """
    __tablename__ = "conversation_participants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Participant role and permissions
    role = Column(String(20), default="member")  # member, admin, moderator
    can_send_messages = Column(Boolean, default=True)
    can_add_members = Column(Boolean, default=False)
    can_remove_members = Column(Boolean, default=False)
    
    # Participation status
    is_active = Column(Boolean, default=True)
    is_muted = Column(Boolean, default=False)
    muted_until = Column(DateTime, nullable=True)
    
    # Read status tracking
    last_read_at = Column(DateTime, default=datetime.utcnow)
    unread_count = Column(Integer, default=0)
    
    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User", back_populates="conversation_participants")


class Message(Base):
    """
    Message model for all types of messages
    Supports text, images, and Ghana market-specific content
    """
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Message content
    message_type = Column(String(20), nullable=False, default=MessageType.DIRECT)
    content = Column(Text, nullable=False)
    content_type = Column(String(20), default="text")  # text, image, file, location, etc.
    
    # Message metadata
    reply_to_id = Column(String, ForeignKey("messages.id"), nullable=True)
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    is_system_message = Column(Boolean, default=False)
    
    # Delivery tracking
    status = Column(String(20), default=MessageStatus.SENT)
    delivered_at = Column(DateTime, nullable=True)
    read_count = Column(Integer, default=0)
    
    # Ghana market features
    language = Column(String(10), default="en")  # Message language
    market_terms = Column(JSON)  # Store market-specific terms used
    location_data = Column(JSON)  # GPS coordinates, market location, etc.
    
    # Attachments and media
    attachments = Column(JSON)  # Store file URLs, image URLs, etc.
    media_metadata = Column(JSON)  # Image dimensions, file sizes, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")
    reply_to = relationship("Message", remote_side=[id])
    message_reads = relationship("MessageRead", back_populates="message")


class MessageRead(Base):
    """
    Track message read status for each user
    Important for unread message counts and notifications
    """
    __tablename__ = "message_reads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Read tracking
    read_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=True)
    
    # Relationships
    message = relationship("Message", back_populates="message_reads")
    user = relationship("User", back_populates="message_reads")


class MessageNotification(Base):
    """
    Notification system for messages
    Supports push notifications and email alerts
    """
    __tablename__ = "message_notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    
    # Notification details
    notification_type = Column(String(20), default="message")  # message, mention, reply
    title = Column(String(200))
    body = Column(Text)
    
    # Delivery status
    is_sent = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Delivery channels
    push_sent = Column(Boolean, default=False)
    email_sent = Column(Boolean, default=False)
    sms_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="message_notifications")
    message = relationship("Message")
    conversation = relationship("Conversation")
