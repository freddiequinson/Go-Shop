"""
API endpoints for review and rating system
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.review import ReviewType, ReviewStatus
from app.crud.review import review_crud, review_response_crud
from app.schemas.review import (
    ReviewCreate, ReviewResponse, ReviewUpdate, ReviewListResponse,
    ReviewResponseCreate, ReviewResponseResponse, ReviewHelpfulnessVoteCreate,
    ReviewReportCreate, SellerRatingResponse, ProductRatingResponse,
    GhanaMarketReview, ProduceReview, ReviewAnalytics
)

router = APIRouter()


# Review CRUD endpoints
@router.post("/reviews", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new review
    
    - **Product reviews**: Rate products with Ghana market context
    - **Seller reviews**: Rate seller performance and service
    - **Order reviews**: Overall order experience
    - **Verified purchases**: Only buyers who purchased can review
    """
    
    # Validate review target
    if not any([review_data.product_id, review_data.seller_id, review_data.order_id]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify product_id, seller_id, or order_id"
        )
    
    review = review_crud.create_review(
        db=db,
        review_data=review_data,
        reviewer_id=current_user.id
    )
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create review. You may have already reviewed this item or lack purchase history."
        )
    
    return review


@router.get("/reviews/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: str,
    db: Session = Depends(get_db)
):
    """Get review by ID"""
    
    review = review_crud.get_review(db=db, review_id=review_id)
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    return review


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: str,
    update_data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update review (only by original reviewer)"""
    
    review = review_crud.update_review(
        db=db,
        review_id=review_id,
        reviewer_id=current_user.id,
        update_data=update_data
    )
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied or review not found"
        )
    
    return review


@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete review (soft delete)"""
    
    success = review_crud.delete_review(
        db=db,
        review_id=review_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied or review not found"
        )
    
    return {"message": "Review deleted successfully"}


# Product reviews
@router.get("/products/{product_id}/reviews", response_model=ReviewListResponse)
def get_product_reviews(
    product_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: ReviewStatus = ReviewStatus.APPROVED,
    db: Session = Depends(get_db)
):
    """
    Get reviews for a product
    
    - Filter by review status
    - Ordered by creation date (newest first)
    - Includes reviewer info and responses
    """
    
    reviews = review_crud.get_product_reviews(
        db=db,
        product_id=product_id,
        skip=skip,
        limit=limit,
        status=status
    )
    
    # Calculate rating distribution
    rating_distribution = {}
    if reviews:
        for i in range(1, 6):
            rating_distribution[str(i)] = len([r for r in reviews if int(r.rating) == i])
    
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
    
    return ReviewListResponse(
        reviews=reviews,
        total=len(reviews),
        page=skip // limit + 1,
        per_page=limit,
        has_next=len(reviews) > skip + limit,
        has_prev=skip > 0,
        avg_rating=avg_rating,
        rating_distribution=rating_distribution
    )


# Seller reviews
@router.get("/sellers/{seller_id}/reviews", response_model=ReviewListResponse)
def get_seller_reviews(
    seller_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: ReviewStatus = ReviewStatus.APPROVED,
    db: Session = Depends(get_db)
):
    """
    Get reviews for a seller
    
    - Includes product context for each review
    - Shows seller's responses
    - Ghana market reputation metrics
    """
    
    reviews = review_crud.get_seller_reviews(
        db=db,
        seller_id=seller_id,
        skip=skip,
        limit=limit,
        status=status
    )
    
    # Calculate rating distribution
    rating_distribution = {}
    if reviews:
        for i in range(1, 6):
            rating_distribution[str(i)] = len([r for r in reviews if int(r.rating) == i])
    
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
    
    return ReviewListResponse(
        reviews=reviews,
        total=len(reviews),
        page=skip // limit + 1,
        per_page=limit,
        has_next=len(reviews) > skip + limit,
        has_prev=skip > 0,
        avg_rating=avg_rating,
        rating_distribution=rating_distribution
    )


# User reviews
@router.get("/users/me/reviews", response_model=ReviewListResponse)
def get_my_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get reviews written by current user"""
    
    reviews = review_crud.get_user_reviews(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
    
    return ReviewListResponse(
        reviews=reviews,
        total=len(reviews),
        page=skip // limit + 1,
        per_page=limit,
        has_next=len(reviews) > skip + limit,
        has_prev=skip > 0,
        avg_rating=avg_rating,
        rating_distribution={}
    )


# Review responses
@router.post("/reviews/{review_id}/responses", response_model=ReviewResponseResponse)
def create_review_response(
    review_id: str,
    response_data: ReviewResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Respond to a review
    
    - Sellers can respond to their product/service reviews
    - Admins can respond to any review
    - Support team responses
    """
    
    response = review_response_crud.create_response(
        db=db,
        review_id=review_id,
        responder_id=current_user.id,
        response_data=response_data
    )
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied or review not found"
        )
    
    return response


# Review helpfulness voting
@router.post("/reviews/{review_id}/vote")
def vote_review_helpfulness(
    review_id: str,
    vote_data: ReviewHelpfulnessVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vote on review helpfulness
    
    - Mark reviews as helpful/not helpful
    - Report spam or inappropriate content
    - Community moderation
    """
    
    success = review_crud.vote_review_helpfulness(
        db=db,
        review_id=review_id,
        user_id=current_user.id,
        vote_data=vote_data
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    return {"message": "Vote recorded successfully"}


# Ghana market specific endpoints
@router.post("/reviews/ghana-market", response_model=ReviewResponse)
def create_ghana_market_review(
    review_data: GhanaMarketReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create Ghana market specific review
    
    - Include market location and purchase method
    - Seasonal context (harvest time, dry season, etc.)
    - Local market comparisons
    """
    
    # Convert to standard review format with Ghana context
    standard_review = ReviewCreate(
        review_type=review_data.review_type,
        product_id=review_data.product_id,
        seller_id=review_data.seller_id,
        order_id=review_data.order_id,
        title=review_data.title,
        content=review_data.content,
        rating=review_data.rating,
        quality_rating=review_data.quality_rating,
        value_rating=review_data.value_rating,
        freshness_rating=review_data.freshness_rating,
        packaging_rating=review_data.packaging_rating,
        authenticity_rating=review_data.authenticity_rating,
        is_anonymous=review_data.is_anonymous,
        language=review_data.language,
        market_context={
            "market_location": review_data.market_location,
            "purchase_method": review_data.purchase_method,
            "seasonal_context": review_data.seasonal_context,
            "local_comparison": review_data.local_comparison
        },
        local_terms_used=review_data.local_terms_used,
        cultural_context=review_data.cultural_context,
        images=review_data.images,
        videos=review_data.videos
    )
    
    review = review_crud.create_review(
        db=db,
        review_data=standard_review,
        reviewer_id=current_user.id
    )
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create review. You may have already reviewed this item or lack purchase history."
        )
    
    return review


@router.post("/reviews/produce", response_model=ReviewResponse)
def create_produce_review(
    review_data: ProduceReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create review for fresh produce
    
    - Mandatory freshness and packaging ratings
    - Shelf life information
    - Ripeness level assessment
    """
    
    # Convert to standard review format
    standard_review = ReviewCreate(
        review_type=review_data.review_type,
        product_id=review_data.product_id,
        seller_id=review_data.seller_id,
        order_id=review_data.order_id,
        title=review_data.title,
        content=review_data.content,
        rating=review_data.rating,
        freshness_rating=review_data.freshness_rating,
        packaging_rating=review_data.packaging_rating,
        is_anonymous=review_data.is_anonymous,
        language=review_data.language,
        market_context={
            "shelf_life_days": review_data.shelf_life_days,
            "ripeness_level": review_data.ripeness_level,
            "produce_type": "fresh"
        },
        images=review_data.images,
        videos=review_data.videos
    )
    
    review = review_crud.create_review(
        db=db,
        review_data=standard_review,
        reviewer_id=current_user.id
    )
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create review. You may have already reviewed this item or lack purchase history."
        )
    
    return review


# Rating aggregations
@router.get("/sellers/{seller_id}/rating", response_model=SellerRatingResponse)
def get_seller_rating(
    seller_id: str,
    db: Session = Depends(get_db)
):
    """
    Get aggregated seller rating
    
    - Overall rating and review count
    - Detailed rating breakdowns
    - Ghana market reputation metrics
    - Response rate and time
    """
    
    from app.models.review import SellerRating
    
    seller_rating = db.query(SellerRating).filter(
        SellerRating.seller_id == seller_id
    ).first()
    
    if not seller_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller rating not found"
        )
    
    return seller_rating


@router.get("/products/{product_id}/rating", response_model=ProductRatingResponse)
def get_product_rating(
    product_id: str,
    db: Session = Depends(get_db)
):
    """
    Get aggregated product rating
    
    - Overall rating and review count
    - Detailed rating breakdowns
    - Verified purchase percentage
    - Common keywords and insights
    """
    
    from app.models.review import ProductRating
    
    product_rating = db.query(ProductRating).filter(
        ProductRating.product_id == product_id
    ).first()
    
    if not product_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product rating not found"
        )
    
    return product_rating


# Analytics endpoints
@router.get("/reviews/analytics", response_model=ReviewAnalytics)
def get_review_analytics(
    product_id: Optional[str] = None,
    seller_id: Optional[str] = None,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get review analytics
    
    - Review trends and patterns
    - Sentiment analysis
    - Common keywords
    - Performance metrics
    """
    
    # Basic analytics implementation
    # In production, this would include more sophisticated analysis
    
    return ReviewAnalytics(
        total_reviews=0,
        avg_rating=0.0,
        rating_trend="stable",
        sentiment_score=0.0,
        common_keywords=[],
        recent_reviews_count=0,
        verified_purchase_rate=0.0
    )


# Moderation endpoints (Admin only)
@router.get("/admin/reviews/pending")
def get_pending_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending reviews for moderation (Admin only)"""
    
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Implementation for admin moderation queue
    return {"message": "Moderation queue endpoint - to be implemented"}


@router.post("/admin/reviews/{review_id}/approve")
def approve_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve review (Admin only)"""
    
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Implementation for review approval
    return {"message": "Review approved"}


@router.post("/admin/reviews/{review_id}/reject")
def reject_review(
    review_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject review (Admin only)"""
    
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Implementation for review rejection
    return {"message": f"Review rejected: {reason}"}
