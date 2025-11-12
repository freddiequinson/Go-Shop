from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class FeedbackType(str, enum.Enum):
    """Feedback types"""
    BUG = "bug"
    FEATURE = "feature"
    GENERAL = "general"
    COMPLAINT = "complaint"
    PRAISE = "praise"


class FeedbackStatus(str, enum.Enum):
    """Feedback status"""
    NEW = "new"
    REVIEWED = "reviewed"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, index=True)
    
    # User info (optional - can be anonymous)
    user_id = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    user_name = Column(String, nullable=True)
    
    # Feedback details
    type = Column(String, default='general')  # bug, feature, general, complaint, praise
    rating = Column(Integer, nullable=True)  # 1-5 stars
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    page_url = Column(String, nullable=True)  # Which page they were on
    
    # Survey responses (JSON stored as text)
    survey_responses = Column(Text, nullable=True)
    
    # Status tracking
    status = Column(String, default='new')  # new, reviewed, in_progress, resolved, closed
    admin_notes = Column(Text, nullable=True)
    
    # Metadata
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String, nullable=True)
