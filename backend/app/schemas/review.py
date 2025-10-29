"""
Pydantic schemas for review and rating system
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

from app.models.review import ReviewType, ReviewStatus, ReviewHelpfulness


# Base schemas
class ReviewBase(BaseModel):
    """Base review schema"""
    review_type: ReviewType
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=10, max_length=5000)
    rating: float = Field(..., ge=1.0, le=5.0)
    is_anonymous: bool = False
    language: str = "en"


class ReviewCreate(ReviewBase):
    """Schema for creating a review"""
    product_id: Optional[str] = None
    seller_id: Optional[str] = None
    order_id: Optional[str] = None
    
    # Detailed ratings (optional)
    quality_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    value_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    delivery_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    service_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    
    # Ghana market specific ratings
    freshness_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    packaging_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    authenticity_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    
    # Market context
    market_context: Optional[Dict[str, Any]] = None
    local_terms_used: Optional[List[str]] = None
    cultural_context: Optional[Dict[str, Any]] = None
    
    # Media
    images: Optional[List[str]] = Field(None, max_items=10)
    videos: Optional[List[str]] = Field(None, max_items=3)
    
    @validator('images')
    def validate_images(cls, v):
        if v:
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError('Invalid image URL format')
        return v
    
    @validator('videos')
    def validate_videos(cls, v):
        if v:
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError('Invalid video URL format')
        return v


class ReviewUpdate(BaseModel):
    """Schema for updating a review"""
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, min_length=10, max_length=5000)
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    
    # Detailed ratings
    quality_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    value_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    delivery_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    service_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    freshness_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    packaging_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    authenticity_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    
    # Media
    images: Optional[List[str]] = Field(None, max_items=10)
    videos: Optional[List[str]] = Field(None, max_items=3)


class ReviewResponseCreate(BaseModel):
    """Schema for creating a review response"""
    content: str = Field(..., min_length=5, max_length=2000)
    responder_type: str = "seller"  # seller, admin, support
    is_official: bool = False
    language: str = "en"
    
    @validator('responder_type')
    def validate_responder_type(cls, v):
        if v not in ['seller', 'admin', 'support']:
            raise ValueError('Invalid responder type')
        return v


class ReviewHelpfulnessVoteCreate(BaseModel):
    """Schema for voting on review helpfulness"""
    vote_type: ReviewHelpfulness
    
    @validator('vote_type')
    def validate_vote_type(cls, v):
        if v not in [ReviewHelpfulness.HELPFUL, ReviewHelpfulness.NOT_HELPFUL, 
                     ReviewHelpfulness.SPAM, ReviewHelpfulness.INAPPROPRIATE]:
            raise ValueError('Invalid vote type')
        return v


class ReviewReportCreate(BaseModel):
    """Schema for reporting a review"""
    reason: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    
    @validator('reason')
    def validate_reason(cls, v):
        valid_reasons = ['spam', 'inappropriate', 'fake', 'offensive', 'irrelevant', 'other']
        if v not in valid_reasons:
            raise ValueError(f'Invalid reason. Must be one of: {valid_reasons}')
        return v


# Response schemas
class ProductSummary(BaseModel):
    """Summary product info for reviews"""
    id: str
    name: str
    image_url: Optional[str]
    price_per_unit_cedis: float
    unit_type: str
    
    class Config:
        from_attributes = True


class SellerSummary(BaseModel):
    """Summary seller info for reviews"""
    id: str
    username: str
    full_name: str
    location: Optional[str]
    
    class Config:
        from_attributes = True


class ReviewerSummary(BaseModel):
    """Summary reviewer info"""
    id: str
    username: str
    full_name: str
    is_verified: bool = False
    
    class Config:
        from_attributes = True


class ReviewResponseResponse(BaseModel):
    """Response schema for review response"""
    id: str
    content: str
    responder_type: str
    is_official: bool
    language: str
    created_at: datetime
    updated_at: datetime
    responder: ReviewerSummary
    
    class Config:
        from_attributes = True


class ReviewResponse(ReviewBase):
    """Response schema for review"""
    id: str
    product_id: Optional[str]
    seller_id: Optional[str]
    order_id: Optional[str]
    reviewer_id: str
    reviewer_name: Optional[str]
    is_verified_purchase: bool
    status: ReviewStatus
    
    # Detailed ratings
    quality_rating: Optional[float]
    value_rating: Optional[float]
    delivery_rating: Optional[float]
    service_rating: Optional[float]
    freshness_rating: Optional[float]
    packaging_rating: Optional[float]
    authenticity_rating: Optional[float]
    
    # Helpfulness
    helpful_count: int
    not_helpful_count: int
    total_votes: int
    helpfulness_score: float
    
    # Moderation
    is_featured: bool
    moderator_notes: Optional[str]
    moderated_at: Optional[datetime]
    
    # Market context
    market_context: Optional[Dict[str, Any]]
    local_terms_used: Optional[List[str]]
    cultural_context: Optional[Dict[str, Any]]
    
    # Media
    images: Optional[List[str]]
    videos: Optional[List[str]]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Related data
    product: Optional[ProductSummary]
    seller: Optional[SellerSummary]
    reviewer: ReviewerSummary
    responses: List[ReviewResponseResponse] = []
    
    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    """Response schema for review list"""
    reviews: List[ReviewResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool
    
    # Aggregated stats
    avg_rating: float
    rating_distribution: Dict[str, int]  # {"5": 10, "4": 5, ...}


class SellerRatingResponse(BaseModel):
    """Response schema for seller rating"""
    id: str
    seller_id: str
    overall_rating: float
    total_reviews: int
    
    # Detailed averages
    quality_avg: float
    value_avg: float
    delivery_avg: float
    service_avg: float
    freshness_avg: float
    packaging_avg: float
    authenticity_avg: float
    
    # Distribution
    five_star_count: int
    four_star_count: int
    three_star_count: int
    two_star_count: int
    one_star_count: int
    
    # Performance
    response_rate: float
    avg_response_time_hours: float
    
    # Ghana market reputation
    local_reputation_score: float
    community_trust_score: float
    market_experience_years: float
    
    last_calculated_at: datetime
    seller: SellerSummary
    
    class Config:
        from_attributes = True


class ProductRatingResponse(BaseModel):
    """Response schema for product rating"""
    id: str
    product_id: str
    overall_rating: float
    total_reviews: int
    
    # Detailed averages
    quality_avg: float
    value_avg: float
    freshness_avg: float
    packaging_avg: float
    authenticity_avg: float
    
    # Distribution
    five_star_count: int
    four_star_count: int
    three_star_count: int
    two_star_count: int
    one_star_count: int
    
    # Insights
    verified_purchase_percentage: float
    avg_review_length: float
    most_common_keywords: Optional[List[str]]
    
    last_calculated_at: datetime
    product: ProductSummary
    
    class Config:
        from_attributes = True


# Ghana market specific schemas
class GhanaMarketReview(ReviewCreate):
    """Ghana market specific review schema"""
    market_location: Optional[str] = None
    purchase_method: Optional[str] = None  # market, roadside, farm_gate, online
    seasonal_context: Optional[str] = None  # dry_season, rainy_season, harvest_time
    local_comparison: Optional[str] = None  # Compare with local alternatives
    
    @validator('purchase_method')
    def validate_purchase_method(cls, v):
        if v and v not in ['market', 'roadside', 'farm_gate', 'online', 'wholesale']:
            raise ValueError('Invalid purchase method')
        return v
    
    @validator('seasonal_context')
    def validate_seasonal_context(cls, v):
        if v and v not in ['dry_season', 'rainy_season', 'harvest_time', 'off_season']:
            raise ValueError('Invalid seasonal context')
        return v


class ProduceReview(ReviewCreate):
    """Specific schema for fresh produce reviews"""
    freshness_rating: float = Field(..., ge=1.0, le=5.0)
    packaging_rating: float = Field(..., ge=1.0, le=5.0)
    shelf_life_days: Optional[int] = Field(None, ge=1, le=30)
    ripeness_level: Optional[str] = None  # unripe, just_right, overripe
    
    @validator('ripeness_level')
    def validate_ripeness(cls, v):
        if v and v not in ['unripe', 'just_right', 'overripe']:
            raise ValueError('Invalid ripeness level')
        return v


# Statistics and analytics schemas
class ReviewAnalytics(BaseModel):
    """Review analytics for products/sellers"""
    total_reviews: int
    avg_rating: float
    rating_trend: str  # improving, stable, declining
    sentiment_score: float  # -1 to 1
    common_keywords: List[str]
    recent_reviews_count: int
    verified_purchase_rate: float


class ReviewModerationQueue(BaseModel):
    """Schema for review moderation queue"""
    pending_reviews: List[ReviewResponse]
    flagged_reviews: List[ReviewResponse]
    reported_reviews: List[ReviewResponse]
    total_pending: int
    avg_processing_time_hours: float


class ReviewInsights(BaseModel):
    """Review insights for business intelligence"""
    top_rated_products: List[ProductSummary]
    top_rated_sellers: List[SellerSummary]
    review_volume_trend: Dict[str, int]  # Date -> count
    common_complaints: List[str]
    common_praises: List[str]
    seasonal_patterns: Dict[str, Any]
