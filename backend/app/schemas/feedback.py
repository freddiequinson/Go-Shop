from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.feedback import FeedbackType, FeedbackStatus


class FeedbackCreate(BaseModel):
    """Schema for creating feedback"""
    type: FeedbackType = FeedbackType.GENERAL
    rating: Optional[int] = Field(None, ge=1, le=5, description="Optional rating (1-5 stars)")
    subject: str = Field(
        ..., 
        min_length=3, 
        max_length=200,
        description="Please enter a subject (at least 3 characters)"
    )
    message: str = Field(
        ..., 
        min_length=10, 
        max_length=2000,
        description="Please enter your feedback (at least 10 characters)"
    )
    page_url: Optional[str] = None
    survey_responses: Optional[Dict[str, Any]] = None
    is_anonymous: bool = False
    user_email: Optional[EmailStr] = Field(None, description="Please enter a valid email address")
    user_name: Optional[str] = None


class FeedbackUpdate(BaseModel):
    """Schema for updating feedback (admin only)"""
    status: Optional[FeedbackStatus] = None
    admin_notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Schema for feedback response"""
    id: str
    user_id: Optional[str]
    user_email: Optional[str]
    user_name: Optional[str]
    type: FeedbackType
    rating: Optional[int]
    subject: str
    message: str
    page_url: Optional[str]
    survey_responses: Optional[str]
    status: FeedbackStatus
    admin_notes: Optional[str]
    is_anonymous: bool
    created_at: datetime
    updated_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]

    class Config:
        from_attributes = True


class FeedbackListResponse(BaseModel):
    """Schema for feedback list"""
    feedbacks: list[FeedbackResponse]
    total: int
    page: int
    per_page: int
