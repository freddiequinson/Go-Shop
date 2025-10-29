"""
CRUD operations for review and rating system
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, case

from app.models.review import (
    Review, ReviewResponse, ReviewHelpfulnessVote, SellerRating, 
    ProductRating, ReviewReport, ReviewType, ReviewStatus
)
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.schemas.review import (
    ReviewCreate, ReviewUpdate, ReviewResponseCreate, 
    ReviewHelpfulnessVoteCreate, ReviewReportCreate
)


class ReviewCRUD:
    """CRUD operations for reviews"""
    
    def create_review(
        self, 
        db: Session, 
        review_data: ReviewCreate, 
        reviewer_id: str
    ) -> Optional[Review]:
        """Create a new review"""
        
        # Check if user can review this item
        if not self._can_user_review(db, reviewer_id, review_data):
            return None
        
        # Check for existing review
        existing_review = self._get_existing_review(db, reviewer_id, review_data)
        if existing_review:
            return None  # User already reviewed this item
        
        # Create review
        review = Review(
            review_type=review_data.review_type,
            product_id=review_data.product_id,
            seller_id=review_data.seller_id,
            order_id=review_data.order_id,
            reviewer_id=reviewer_id,
            reviewer_name=review_data.reviewer_name if not review_data.is_anonymous else "Anonymous",
            is_anonymous=review_data.is_anonymous,
            is_verified_purchase=self._is_verified_purchase(db, reviewer_id, review_data),
            title=review_data.title,
            content=review_data.content,
            rating=review_data.rating,
            quality_rating=review_data.quality_rating,
            value_rating=review_data.value_rating,
            delivery_rating=review_data.delivery_rating,
            service_rating=review_data.service_rating,
            freshness_rating=review_data.freshness_rating,
            packaging_rating=review_data.packaging_rating,
            authenticity_rating=review_data.authenticity_rating,
            language=review_data.language,
            market_context=review_data.market_context,
            local_terms_used=review_data.local_terms_used,
            cultural_context=review_data.cultural_context,
            images=review_data.images,
            videos=review_data.videos
        )
        
        db.add(review)
        db.commit()
        db.refresh(review)
        
        # Update aggregated ratings
        self._update_aggregated_ratings(db, review)
        
        return review
    
    def get_review(self, db: Session, review_id: str) -> Optional[Review]:
        """Get review by ID"""
        return db.query(Review).options(
            joinedload(Review.reviewer),
            joinedload(Review.product),
            joinedload(Review.seller),
            joinedload(Review.responses)
        ).filter(Review.id == review_id).first()
    
    def get_product_reviews(
        self, 
        db: Session, 
        product_id: str, 
        skip: int = 0, 
        limit: int = 20,
        status: ReviewStatus = ReviewStatus.APPROVED
    ) -> List[Review]:
        """Get reviews for a product"""
        
        return db.query(Review).filter(
            and_(
                Review.product_id == product_id,
                Review.status == status
            )
        ).options(
            joinedload(Review.reviewer),
            joinedload(Review.responses)
        ).order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
    
    def get_seller_reviews(
        self, 
        db: Session, 
        seller_id: str, 
        skip: int = 0, 
        limit: int = 20,
        status: ReviewStatus = ReviewStatus.APPROVED
    ) -> List[Review]:
        """Get reviews for a seller"""
        
        return db.query(Review).filter(
            and_(
                Review.seller_id == seller_id,
                Review.status == status
            )
        ).options(
            joinedload(Review.reviewer),
            joinedload(Review.product),
            joinedload(Review.responses)
        ).order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
    
    def get_user_reviews(
        self, 
        db: Session, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Review]:
        """Get reviews written by a user"""
        
        return db.query(Review).filter(
            Review.reviewer_id == user_id
        ).options(
            joinedload(Review.product),
            joinedload(Review.seller),
            joinedload(Review.responses)
        ).order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
    
    def update_review(
        self, 
        db: Session, 
        review_id: str, 
        reviewer_id: str, 
        update_data: ReviewUpdate
    ) -> Optional[Review]:
        """Update review (only by original reviewer)"""
        
        review = db.query(Review).filter(
            and_(
                Review.id == review_id,
                Review.reviewer_id == reviewer_id
            )
        ).first()
        
        if not review:
            return None
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(review, field, value)
        
        review.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(review)
        
        # Update aggregated ratings
        self._update_aggregated_ratings(db, review)
        
        return review
    
    def delete_review(self, db: Session, review_id: str, user_id: str) -> bool:
        """Soft delete review"""
        
        review = db.query(Review).filter(
            and_(
                Review.id == review_id,
                or_(
                    Review.reviewer_id == user_id,
                    # Admin can delete any review
                    db.query(User).filter(
                        and_(User.id == user_id, User.user_type == "admin")
                    ).exists()
                )
            )
        ).first()
        
        if not review:
            return False
        
        review.status = ReviewStatus.HIDDEN
        review.updated_at = datetime.utcnow()
        db.commit()
        
        # Update aggregated ratings
        self._update_aggregated_ratings(db, review)
        
        return True
    
    def vote_review_helpfulness(
        self, 
        db: Session, 
        review_id: str, 
        user_id: str, 
        vote_data: ReviewHelpfulnessVoteCreate
    ) -> bool:
        """Vote on review helpfulness"""
        
        # Check for existing vote
        existing_vote = db.query(ReviewHelpfulnessVote).filter(
            and_(
                ReviewHelpfulnessVote.review_id == review_id,
                ReviewHelpfulnessVote.user_id == user_id
            )
        ).first()
        
        if existing_vote:
            # Update existing vote
            existing_vote.vote_type = vote_data.vote_type
            existing_vote.created_at = datetime.utcnow()
        else:
            # Create new vote
            vote = ReviewHelpfulnessVote(
                review_id=review_id,
                user_id=user_id,
                vote_type=vote_data.vote_type
            )
            db.add(vote)
        
        # Update review helpfulness counts
        self._update_review_helpfulness(db, review_id)
        
        db.commit()
        return True
    
    def _can_user_review(self, db: Session, user_id: str, review_data: ReviewCreate) -> bool:
        """Check if user can review this item"""
        
        if review_data.review_type == ReviewType.PRODUCT and review_data.product_id:
            # Check if user purchased this product
            from app.models.order import OrderItem
            order_item_exists = db.query(OrderItem).join(Order).filter(
                and_(
                    Order.user_id == user_id,
                    OrderItem.product_id == review_data.product_id,
                    Order.status.in_(["delivered"])
                )
            ).first()
            return order_item_exists is not None
        
        elif review_data.review_type == ReviewType.SELLER and review_data.seller_id:
            # Check if user bought from this seller
            from app.models.order import OrderItem
            order_item_exists = db.query(OrderItem).join(Order).join(Product).filter(
                and_(
                    Order.user_id == user_id,
                    OrderItem.product_id == Product.id,
                    Product.seller_id == review_data.seller_id,
                    Order.status.in_(["delivered"])
                )
            ).first()
            return order_item_exists is not None
        
        # For testing purposes: Allow admin users to review any product
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.user_type == "admin":
            return True
            
        return True  # Allow other review types
    
    def _get_existing_review(self, db: Session, user_id: str, review_data: ReviewCreate) -> Optional[Review]:
        """Check for existing review by this user"""
        
        query = db.query(Review).filter(Review.reviewer_id == user_id)
        
        if review_data.product_id:
            query = query.filter(Review.product_id == review_data.product_id)
        if review_data.seller_id:
            query = query.filter(Review.seller_id == review_data.seller_id)
        if review_data.order_id:
            query = query.filter(Review.order_id == review_data.order_id)
        
        return query.first()
    
    def _is_verified_purchase(self, db: Session, user_id: str, review_data: ReviewCreate) -> bool:
        """Check if this is a verified purchase review"""
        
        if review_data.order_id:
            order = db.query(Order).filter(
                and_(
                    Order.id == review_data.order_id,
                    Order.user_id == user_id,
                    Order.status.in_(["delivered"])
                )
            ).first()
            return order is not None
        
        return False
    
    def _update_review_helpfulness(self, db: Session, review_id: str):
        """Update review helpfulness counts"""
        
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            return
        
        # Count votes
        helpful_count = db.query(ReviewHelpfulnessVote).filter(
            and_(
                ReviewHelpfulnessVote.review_id == review_id,
                ReviewHelpfulnessVote.vote_type == "helpful"
            )
        ).count()
        
        not_helpful_count = db.query(ReviewHelpfulnessVote).filter(
            and_(
                ReviewHelpfulnessVote.review_id == review_id,
                ReviewHelpfulnessVote.vote_type == "not_helpful"
            )
        ).count()
        
        total_votes = helpful_count + not_helpful_count
        helpfulness_score = helpful_count / total_votes if total_votes > 0 else 0
        
        # Update review
        review.helpful_count = helpful_count
        review.not_helpful_count = not_helpful_count
        review.total_votes = total_votes
        review.helpfulness_score = helpfulness_score
    
    def _update_aggregated_ratings(self, db: Session, review: Review):
        """Update aggregated ratings for products and sellers"""
        
        if review.product_id:
            self._update_product_rating(db, review.product_id)
        
        if review.seller_id:
            self._update_seller_rating(db, review.seller_id)
    
    def _update_product_rating(self, db: Session, product_id: str):
        """Update aggregated product rating"""
        
        # Get all approved reviews for this product
        reviews = db.query(Review).filter(
            and_(
                Review.product_id == product_id,
                Review.status == ReviewStatus.APPROVED
            )
        ).all()
        
        if not reviews:
            return
        
        # Calculate aggregated stats
        total_reviews = len(reviews)
        overall_rating = sum(r.rating for r in reviews) / total_reviews
        
        # Detailed ratings
        quality_ratings = [r.quality_rating for r in reviews if r.quality_rating]
        value_ratings = [r.value_rating for r in reviews if r.value_rating]
        freshness_ratings = [r.freshness_rating for r in reviews if r.freshness_rating]
        packaging_ratings = [r.packaging_rating for r in reviews if r.packaging_rating]
        authenticity_ratings = [r.authenticity_rating for r in reviews if r.authenticity_rating]
        
        # Rating distribution
        rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating_counts[int(review.rating)] += 1
        
        # Verified purchase percentage
        verified_count = sum(1 for r in reviews if r.is_verified_purchase)
        verified_percentage = (verified_count / total_reviews) * 100
        
        # Update or create product rating
        product_rating = db.query(ProductRating).filter(
            ProductRating.product_id == product_id
        ).first()
        
        if not product_rating:
            product_rating = ProductRating(product_id=product_id)
            db.add(product_rating)
        
        product_rating.overall_rating = overall_rating
        product_rating.total_reviews = total_reviews
        product_rating.quality_avg = sum(quality_ratings) / len(quality_ratings) if quality_ratings else 0
        product_rating.value_avg = sum(value_ratings) / len(value_ratings) if value_ratings else 0
        product_rating.freshness_avg = sum(freshness_ratings) / len(freshness_ratings) if freshness_ratings else 0
        product_rating.packaging_avg = sum(packaging_ratings) / len(packaging_ratings) if packaging_ratings else 0
        product_rating.authenticity_avg = sum(authenticity_ratings) / len(authenticity_ratings) if authenticity_ratings else 0
        product_rating.five_star_count = rating_counts[5]
        product_rating.four_star_count = rating_counts[4]
        product_rating.three_star_count = rating_counts[3]
        product_rating.two_star_count = rating_counts[2]
        product_rating.one_star_count = rating_counts[1]
        product_rating.verified_purchase_percentage = verified_percentage
        product_rating.last_calculated_at = datetime.utcnow()
        
        db.commit()
    
    def _update_seller_rating(self, db: Session, seller_id: str):
        """Update aggregated seller rating"""
        
        # Get all approved reviews for this seller
        reviews = db.query(Review).filter(
            and_(
                Review.seller_id == seller_id,
                Review.status == ReviewStatus.APPROVED
            )
        ).all()
        
        if not reviews:
            return
        
        # Calculate aggregated stats
        total_reviews = len(reviews)
        overall_rating = sum(r.rating for r in reviews) / total_reviews
        
        # Detailed ratings
        quality_ratings = [r.quality_rating for r in reviews if r.quality_rating]
        value_ratings = [r.value_rating for r in reviews if r.value_rating]
        delivery_ratings = [r.delivery_rating for r in reviews if r.delivery_rating]
        service_ratings = [r.service_rating for r in reviews if r.service_rating]
        freshness_ratings = [r.freshness_rating for r in reviews if r.freshness_rating]
        packaging_ratings = [r.packaging_rating for r in reviews if r.packaging_rating]
        authenticity_ratings = [r.authenticity_rating for r in reviews if r.authenticity_rating]
        
        # Rating distribution
        rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating_counts[int(review.rating)] += 1
        
        # Response rate
        responses_count = db.query(ReviewResponse).join(Review).filter(
            and_(
                Review.seller_id == seller_id,
                ReviewResponse.responder_id == seller_id
            )
        ).count()
        response_rate = (responses_count / total_reviews) * 100 if total_reviews > 0 else 0
        
        # Update or create seller rating
        seller_rating = db.query(SellerRating).filter(
            SellerRating.seller_id == seller_id
        ).first()
        
        if not seller_rating:
            seller_rating = SellerRating(seller_id=seller_id)
            db.add(seller_rating)
        
        seller_rating.overall_rating = overall_rating
        seller_rating.total_reviews = total_reviews
        seller_rating.quality_avg = sum(quality_ratings) / len(quality_ratings) if quality_ratings else 0
        seller_rating.value_avg = sum(value_ratings) / len(value_ratings) if value_ratings else 0
        seller_rating.delivery_avg = sum(delivery_ratings) / len(delivery_ratings) if delivery_ratings else 0
        seller_rating.service_avg = sum(service_ratings) / len(service_ratings) if service_ratings else 0
        seller_rating.freshness_avg = sum(freshness_ratings) / len(freshness_ratings) if freshness_ratings else 0
        seller_rating.packaging_avg = sum(packaging_ratings) / len(packaging_ratings) if packaging_ratings else 0
        seller_rating.authenticity_avg = sum(authenticity_ratings) / len(authenticity_ratings) if authenticity_ratings else 0
        seller_rating.five_star_count = rating_counts[5]
        seller_rating.four_star_count = rating_counts[4]
        seller_rating.three_star_count = rating_counts[3]
        seller_rating.two_star_count = rating_counts[2]
        seller_rating.one_star_count = rating_counts[1]
        seller_rating.response_rate = response_rate
        seller_rating.last_calculated_at = datetime.utcnow()
        
        db.commit()


class ReviewResponseCRUD:
    """CRUD operations for review responses"""
    
    def create_response(
        self, 
        db: Session, 
        review_id: str, 
        responder_id: str, 
        response_data: ReviewResponseCreate
    ) -> Optional[ReviewResponse]:
        """Create response to review"""
        
        # Check if review exists
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            return None
        
        # Check if responder can respond (seller, admin, or support)
        user = db.query(User).filter(User.id == responder_id).first()
        if not user:
            return None
        
        is_official = (
            user.user_type == "admin" or 
            (response_data.responder_type == "seller" and review.seller_id == responder_id)
        )
        
        response = ReviewResponse(
            review_id=review_id,
            responder_id=responder_id,
            content=response_data.content,
            responder_type=response_data.responder_type,
            is_official=is_official,
            language=response_data.language
        )
        
        db.add(response)
        db.commit()
        db.refresh(response)
        
        return response


# Create instances
review_crud = ReviewCRUD()
review_response_crud = ReviewResponseCRUD()
