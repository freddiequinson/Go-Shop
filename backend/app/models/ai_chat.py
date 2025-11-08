"""
AI Chat History Model
Stores conversation history for users
"""

from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import uuid


class ChatHistory(Base):
    """Chat history for AI assistant conversations"""
    __tablename__ = "chat_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # Nullable for guest users
    session_id = Column(String(36), nullable=False, index=True)  # Group messages by session
    
    # Message content
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    message = Column(Text, nullable=False)
    
    # AI Response metadata
    tokens_used = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    
    # Shopping list if generated
    shopping_list = Column(JSON, nullable=True)  # Store shopping list JSON
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="chat_history")
    
    def __repr__(self):
        return f"<ChatHistory(id={self.id}, user_id={self.user_id}, role={self.role})>"


class ChatSession(Base):
    """Chat session metadata"""
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Session metadata
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    message_count = Column(Integer, default=0)
    
    # Session summary
    topic = Column(String(255), nullable=True)  # e.g., "Jollof Rice Recipe"
    total_tokens_used = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<ChatSession(id={self.id}, user_id={self.user_id}, topic={self.topic})>"
