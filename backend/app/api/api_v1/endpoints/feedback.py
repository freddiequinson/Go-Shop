from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import json
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.user import User
from app.models.feedback import Feedback, FeedbackStatus, FeedbackType
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackResponse,
    FeedbackListResponse
)
from app.core.deps import get_current_admin
from app.core.email import send_email
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except:
        return None


@router.post("/", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Submit feedback - can be anonymous or from logged-in user
    """
    try:
        # Create feedback
        feedback = Feedback(
            id=str(uuid.uuid4()),
            user_id=current_user.id if current_user and not feedback_data.is_anonymous else None,
            user_email=feedback_data.user_email or (current_user.email if current_user else None),
            user_name=feedback_data.user_name or (current_user.full_name if current_user else None),
            type=feedback_data.type.value if hasattr(feedback_data.type, 'value') else str(feedback_data.type).lower(),
            rating=feedback_data.rating,
            subject=feedback_data.subject,
            message=feedback_data.message,
            page_url=feedback_data.page_url,
            survey_responses=json.dumps(feedback_data.survey_responses) if feedback_data.survey_responses else None,
            is_anonymous=feedback_data.is_anonymous,
            status='new'
        )
        
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        
        # Send email notification to admin
        try:
            rating_stars = "⭐" * (feedback_data.rating or 0) if feedback_data.rating else "No rating"
            
            email_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #303A4D;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #303A4D; border-bottom: 3px solid #FED141; padding-bottom: 10px;">
                        🔔 New Feedback Received
                    </h2>
                    
                    <div style="background: #F4F2E6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <p><strong>Type:</strong> {feedback_data.type.value.upper()}</p>
                        <p><strong>Rating:</strong> {rating_stars}</p>
                        <p><strong>From:</strong> {feedback.user_name or 'Anonymous'} ({feedback.user_email or 'No email'})</p>
                        <p><strong>Page:</strong> {feedback_data.page_url or 'Not specified'}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #303A4D;">Subject:</h3>
                        <p style="font-size: 16px; font-weight: bold;">{feedback_data.subject}</p>
                        
                        <h3 style="color: #303A4D;">Message:</h3>
                        <p style="background: white; padding: 15px; border-left: 4px solid #FED141; border-radius: 5px;">
                            {feedback_data.message}
                        </p>
                    </div>
                    
                    {f'''
                    <div style="margin: 20px 0;">
                        <h3 style="color: #303A4D;">Survey Responses:</h3>
                        <div style="background: white; padding: 15px; border-radius: 5px;">
                            {json.dumps(feedback_data.survey_responses, indent=2)}
                        </div>
                    </div>
                    ''' if feedback_data.survey_responses else ''}
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
                        <p>Feedback ID: {feedback.id}</p>
                        <p>Submitted: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            send_email(
                email_to="agyarefredrick22@gmail.com",
                subject=f"🔔 New Feedback: {feedback_data.subject}",
                html_content=email_content
            )
        except Exception as e:
            print(f"Failed to send feedback email: {e}")
            # Don't fail the request if email fails
        
        return feedback
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")


@router.get("/", response_model=FeedbackListResponse)
async def list_feedback(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[FeedbackStatus] = None,
    type: Optional[FeedbackType] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    List all feedback (admin only)
    """
    query = db.query(Feedback)
    
    # Apply filters
    if status:
        query = query.filter(Feedback.status == status)
    if type:
        query = query.filter(Feedback.type == type)
    
    # Get total count
    total = query.count()
    
    # Paginate
    feedbacks = query.order_by(Feedback.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return FeedbackListResponse(
        feedbacks=feedbacks,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get single feedback (admin only)
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return feedback


@router.patch("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: str,
    feedback_update: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Update feedback status/notes (admin only)
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Update fields
    if feedback_update.status:
        feedback.status = feedback_update.status
        if feedback_update.status == FeedbackStatus.REVIEWED and not feedback.reviewed_at:
            feedback.reviewed_at = datetime.now(timezone.utc)
            feedback.reviewed_by = current_admin.id
    
    if feedback_update.admin_notes is not None:
        feedback.admin_notes = feedback_update.admin_notes
    
    db.commit()
    db.refresh(feedback)
    
    return feedback


@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Delete feedback (admin only)
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    db.delete(feedback)
    db.commit()
    
    return {"message": "Feedback deleted successfully"}


@router.get("/stats/summary")
async def get_feedback_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get feedback statistics (admin only)
    """
    total = db.query(Feedback).count()
    new = db.query(Feedback).filter(Feedback.status == FeedbackStatus.NEW).count()
    reviewed = db.query(Feedback).filter(Feedback.status == FeedbackStatus.REVIEWED).count()
    resolved = db.query(Feedback).filter(Feedback.status == FeedbackStatus.RESOLVED).count()
    
    # Average rating
    ratings = db.query(Feedback.rating).filter(Feedback.rating.isnot(None)).all()
    avg_rating = sum(r[0] for r in ratings) / len(ratings) if ratings else 0
    
    # By type
    by_type = {}
    for feedback_type in FeedbackType:
        count = db.query(Feedback).filter(Feedback.type == feedback_type).count()
        by_type[feedback_type.value] = count
    
    return {
        "total": total,
        "new": new,
        "reviewed": reviewed,
        "resolved": resolved,
        "average_rating": round(avg_rating, 2),
        "by_type": by_type
    }
