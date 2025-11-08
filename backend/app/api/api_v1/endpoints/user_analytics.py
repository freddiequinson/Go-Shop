"""
User Analytics Endpoints for Admin Dashboard
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, extract
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from app.db.database import get_db
from app.models.user import User, UserType, VerificationStatus
from app.models.order import Order
from app.core.deps import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/overview")
async def get_user_analytics_overview(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive user analytics overview
    """
    try:
        # Total users
        total_users = db.query(User).count()
        
        # Active users (logged in within last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = db.query(User).filter(
            User.last_login >= thirty_days_ago
        ).count()
        
        # New users this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = db.query(User).filter(
            User.created_at >= start_of_month
        ).count()
        
        # Users by type
        users_by_type = db.query(
            User.user_type,
            func.count(User.id).label('count')
        ).group_by(User.user_type).all()
        
        users_by_type_dict = {str(ut): count for ut, count in users_by_type}
        
        # Users by verification status
        users_by_verification = db.query(
            User.verification_status,
            func.count(User.id).label('count')
        ).group_by(User.verification_status).all()
        
        users_by_verification_dict = {str(vs): count for vs, count in users_by_verification}
        
        # Premium users
        premium_users = db.query(User).filter(
            User.premium_tier != 'basic'
        ).count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "new_users_this_month": new_users_this_month,
            "premium_users": premium_users,
            "users_by_type": users_by_type_dict,
            "users_by_verification": users_by_verification_dict,
            "activity_rate": round((active_users / total_users * 100) if total_users > 0 else 0, 2)
        }
    
    except Exception as e:
        logger.error(f"Error fetching user analytics overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user analytics"
        )


@router.get("/top-customers")
async def get_top_customers(
    limit: int = 10,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get top customers by total spending
    """
    try:
        # Query to get top customers with their total spending
        from app.models.order import OrderStatus
        delivered_statuses = [OrderStatus.DELIVERED, OrderStatus.DELIVERED_LOWER, "DELIVERED", "delivered", "completed", "COMPLETED"]
        
        top_customers = db.query(
            User.id,
            User.full_name,
            User.email,
            User.username,
            User.premium_tier,
            User.created_at,
            func.count(Order.id).label('total_orders'),
            func.sum(Order.total_cedis).label('total_spent')
        ).join(
            Order, User.id == Order.user_id
        ).filter(
            Order.status.in_(delivered_statuses)
        ).group_by(
            User.id, User.full_name, User.email, User.username, User.premium_tier, User.created_at
        ).order_by(
            desc('total_spent')
        ).limit(limit).all()
        
        result = []
        for customer in top_customers:
            result.append({
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
                "username": customer.username,
                "premium_tier": str(customer.premium_tier),
                "member_since": customer.created_at.isoformat() if customer.created_at else None,
                "total_orders": customer.total_orders,
                "total_spent": float(customer.total_spent) / 100 if customer.total_spent else 0.0  # Convert pesewas to cedis
            })
        
        return {
            "top_customers": result,
            "total_count": len(result)
        }
    
    except Exception as e:
        logger.error(f"Error fetching top customers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch top customers"
        )


@router.get("/signup-sources")
async def get_signup_sources(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get analytics on how users found the platform (referral sources)
    """
    try:
        # Get signup sources distribution
        signup_sources = db.query(
            User.referral_source,
            func.count(User.id).label('count')
        ).filter(
            User.referral_source.isnot(None)
        ).group_by(
            User.referral_source
        ).order_by(
            desc('count')
        ).all()
        
        # Users without referral source
        no_source_count = db.query(User).filter(
            User.referral_source.is_(None)
        ).count()
        
        sources_data = []
        for source, count in signup_sources:
            sources_data.append({
                "source": source,
                "count": count,
                "percentage": 0  # Will calculate after
            })
        
        if no_source_count > 0:
            sources_data.append({
                "source": "Not specified",
                "count": no_source_count,
                "percentage": 0
            })
        
        # Calculate percentages
        total = sum(item['count'] for item in sources_data)
        for item in sources_data:
            item['percentage'] = round((item['count'] / total * 100) if total > 0 else 0, 2)
        
        return {
            "signup_sources": sources_data,
            "total_users": total
        }
    
    except Exception as e:
        logger.error(f"Error fetching signup sources: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch signup sources"
        )


@router.get("/growth-trend")
async def get_user_growth_trend(
    days: int = 30,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get user growth trend over specified number of days
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get daily signups
        daily_signups = db.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('signups')
        ).filter(
            User.created_at >= start_date
        ).group_by(
            func.date(User.created_at)
        ).order_by(
            'date'
        ).all()
        
        # Format data
        trend_data = []
        for date, signups in daily_signups:
            trend_data.append({
                "date": date.isoformat() if date else None,
                "signups": signups
            })
        
        # Calculate growth rate
        if len(trend_data) >= 2:
            first_week = sum(item['signups'] for item in trend_data[:7])
            last_week = sum(item['signups'] for item in trend_data[-7:])
            growth_rate = ((last_week - first_week) / first_week * 100) if first_week > 0 else 0
        else:
            growth_rate = 0
        
        return {
            "trend_data": trend_data,
            "growth_rate": round(growth_rate, 2),
            "period_days": days
        }
    
    except Exception as e:
        logger.error(f"Error fetching user growth trend: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user growth trend"
        )


@router.get("/location-distribution")
async def get_user_location_distribution(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get distribution of users by location
    """
    try:
        # Get location distribution
        locations = db.query(
            User.location,
            func.count(User.id).label('count')
        ).filter(
            User.location.isnot(None)
        ).group_by(
            User.location
        ).order_by(
            desc('count')
        ).limit(20).all()
        
        location_data = []
        for location, count in locations:
            location_data.append({
                "location": location,
                "count": count
            })
        
        # Users without location
        no_location_count = db.query(User).filter(
            User.location.is_(None)
        ).count()
        
        return {
            "locations": location_data,
            "users_without_location": no_location_count
        }
    
    except Exception as e:
        logger.error(f"Error fetching location distribution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch location distribution"
        )


@router.get("/engagement-metrics")
async def get_user_engagement_metrics(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get user engagement metrics
    """
    try:
        from app.models.order import OrderStatus
        
        total_users = db.query(User).count()
        
        # Users who have placed at least one order (any status)
        users_with_orders = db.query(func.count(func.distinct(Order.user_id))).scalar() or 0
        
        # Users active in last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_last_7_days = db.query(User).filter(
            User.last_activity_at >= seven_days_ago
        ).count()
        
        # Users active in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_last_30_days = db.query(User).filter(
            User.last_activity_at >= thirty_days_ago
        ).count()
        
        # Conversion rate (users who made purchases)
        conversion_rate = (users_with_orders / total_users * 100) if total_users > 0 else 0
        
        return {
            "total_users": total_users,
            "users_with_orders": users_with_orders,
            "active_last_7_days": active_last_7_days,
            "active_last_30_days": active_last_30_days,
            "conversion_rate": round(conversion_rate, 2),
            "engagement_rate_7d": round((active_last_7_days / total_users * 100) if total_users > 0 else 0, 2),
            "engagement_rate_30d": round((active_last_30_days / total_users * 100) if total_users > 0 else 0, 2)
        }
    
    except Exception as e:
        logger.error(f"Error fetching engagement metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch engagement metrics"
        )
