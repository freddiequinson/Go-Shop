"""
Review and Rating models for GoShopGhana
Supports product reviews, seller ratings, and Ghana market context
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer, Float, JSON
from sqlalchemy.orm import relationship
import uuid

from app.db.database import Base


class ReviewType(str, Enum):
    """Types of reviews in the system"""
    PRODUCT = "product"    # Product review
    SELLER = "seller"      # Seller rating
    BUYER = "buyer"        # Buyer rating (for sellers to rate buyers)
    ORDER = "order"        # Overall order experience
    DELIVERY = "delivery"  # Delivery service rating


class ReviewStatus(str, Enum):
    """Review moderation status"""
    PENDING = "pending"      # Awaiting moderation
    APPROVED = "approved"    # Approved and visible
    REJECTED = "rejected"    # Rejected by moderators
    FLAGGED = "flagged"      # Flagged for review
    HIDDEN = "hidden"        # Hidden by user or admin


class ReviewHelpfulness(str, Enum):
    """Review helpfulness ratings"""
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"


class Review(Base):
    """
    Main review model for products, sellers, and orders
    Supports Ghana market context and verified purchases
    """
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Review target (what is being reviewed)
    review_type = Column(String(20), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    seller_id = Column(String, ForeignKey("users.id"), nullable=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=True)
    
    # Reviewer information
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    reviewer_name = Column(String(100))  # Display name (can be anonymous)
    is_anonymous = Column(Boolean, default=False)
    is_verified_purchase = Column(Boolean, default=False)
    
    # Review content
    title = Column(String(200))
    content = Column(Text, nullable=False)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    
    # Detailed ratings (for products)
    quality_rating = Column(Float, nullable=True)      # Product quality
    value_rating = Column(Float, nullable=True)        # Value for money
    delivery_rating = Column(Float, nullable=True)     # Delivery experience
    service_rating = Column(Float, nullable=True)      # Customer service
    
    # Ghana market specific ratings
    freshness_rating = Column(Float, nullable=True)    # For fresh produce
    packaging_rating = Column(Float, nullable=True)    # Packaging quality
    authenticity_rating = Column(Float, nullable=True) # Product authenticity
    
    # Review metadata
    status = Column(String(20), default=ReviewStatus.PENDING)
    language = Column(String(10), default="en")  # Review language
    
    # Helpfulness tracking
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    total_votes = Column(Integer, default=0)
    helpfulness_score = Column(Float, default=0.0)
    
    # Moderation
    is_featured = Column(Boolean, default=False)
    moderator_notes = Column(Text)
    moderated_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    
    # Ghana market context
    market_context = Column(JSON)  # Market location, purchase context
    local_terms_used = Column(JSON)  # Local terms and phrases
    cultural_context = Column(JSON)  # Cultural considerations
    
    # Media attachments
    images = Column(JSON)  # Review images
    videos = Column(JSON)  # Review videos
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="reviews")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="seller_reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    order = relationship("Order", back_populates="reviews")
    moderator = relationship("User", foreign_keys=[moderated_by_id])
    helpfulness_votes = relationship("ReviewHelpfulnessVote", back_populates="review")
    responses = relationship("ReviewResponse", back_populates="review")


class ReviewResponse(Base):
    """
    Responses to reviews (from sellers, admins, etc.)
    """
    __tablename__ = "review_responses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("reviews.id"), nullable=False)
    responder_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Response content
    content = Column(Text, nullable=False)
    responder_type = Column(String(20))  # seller, admin, support
    
    # Response metadata
    is_official = Column(Boolean, default=False)  # Official seller/admin response
    language = Column(String(10), default="en")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    review = relationship("Review", back_populates="responses")
    responder = relationship("User", back_populates="review_responses")


class ReviewHelpfulnessVote(Base):
    """
    User votes on review helpfulness
    """
    __tablename__ = "review_helpfulness_votes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("reviews.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Vote details
    vote_type = Column(String(20), nullable=False)  # helpful, not_helpful, spam, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    review = relationship("Review", back_populates="helpfulness_votes")
    user = relationship("User", back_populates="review_votes")


class SellerRating(Base):
    """
    Aggregated seller ratings and statistics
    Calculated from individual reviews
    """
    __tablename__ = "seller_ratings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Overall ratings
    overall_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Detailed rating averages
    quality_avg = Column(Float, default=0.0)
    value_avg = Column(Float, default=0.0)
    delivery_avg = Column(Float, default=0.0)
    service_avg = Column(Float, default=0.0)
    
    # Ghana market specific averages
    freshness_avg = Column(Float, default=0.0)
    packaging_avg = Column(Float, default=0.0)
    authenticity_avg = Column(Float, default=0.0)
    
    # Rating distribution
    five_star_count = Column(Integer, default=0)
    four_star_count = Column(Integer, default=0)
    three_star_count = Column(Integer, default=0)
    two_star_count = Column(Integer, default=0)
    one_star_count = Column(Integer, default=0)
    
    # Performance metrics
    response_rate = Column(Float, default=0.0)  # % of reviews responded to
    avg_response_time_hours = Column(Float, default=0.0)
    
    # Ghana market reputation
    local_reputation_score = Column(Float, default=0.0)
    community_trust_score = Column(Float, default=0.0)
    market_experience_years = Column(Float, default=0.0)
    
    # Timestamps
    last_calculated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = relationship("User", back_populates="seller_rating")


class ProductRating(Base):
    """
    Aggregated product ratings and statistics
    Calculated from individual product reviews
    """
    __tablename__ = "product_ratings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False, unique=True)
    
    # Overall ratings
    overall_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Detailed rating averages
    quality_avg = Column(Float, default=0.0)
    value_avg = Column(Float, default=0.0)
    
    # Ghana market specific averages
    freshness_avg = Column(Float, default=0.0)
    packaging_avg = Column(Float, default=0.0)
    authenticity_avg = Column(Float, default=0.0)
    
    # Rating distribution
    five_star_count = Column(Integer, default=0)
    four_star_count = Column(Integer, default=0)
    three_star_count = Column(Integer, default=0)
    two_star_count = Column(Integer, default=0)
    one_star_count = Column(Integer, default=0)
    
    # Review insights
    verified_purchase_percentage = Column(Float, default=0.0)
    avg_review_length = Column(Float, default=0.0)
    most_common_keywords = Column(JSON)  # Popular keywords in reviews
    
    # Timestamps
    last_calculated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="product_rating")


class ReviewReport(Base):
    """
    User reports on inappropriate reviews
    """
    __tablename__ = "review_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("reviews.id"), nullable=False)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Report details
    reason = Column(String(50), nullable=False)  # spam, inappropriate, fake, etc.
    description = Column(Text)
    
    # Report status
    status = Column(String(20), default="pending")  # pending, reviewed, resolved
    admin_notes = Column(Text)
    resolved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    review = relationship("Review")
    reporter = relationship("User", foreign_keys=[reporter_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
