"""
Audit Log endpoints for GoShopGhana
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.db.database import get_db
from app.schemas.audit_log import AuditLogResponse, AuditLogStats
from app.crud.audit_log import (
    get_audit_logs,
    get_audit_log_by_id,
    get_user_activity,
    get_recent_logs,
    count_logs_by_action
)
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.audit_log import AuditAction

router = APIRouter()


@router.get("/", response_model=List[AuditLogResponse])
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    action: Optional[AuditAction] = None,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    days: Optional[int] = Query(None, ge=1, le=365),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get all audit logs (Admin only)
    
    Filters:
    - action: Filter by action type
    - user_id: Filter by user
    - resource_type: Filter by resource type (user, product, order, etc.)
    - status: Filter by status (success, failed, error)
    - search: Search in user email, name, description
    - days: Get logs from last N days
    """
    start_date = None
    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
    
    logs = get_audit_logs(
        db=db,
        skip=skip,
        limit=limit,
        action=action,
        user_id=user_id,
        resource_type=resource_type,
        status=status,
        start_date=start_date,
        search=search
    )
    
    return [AuditLogResponse.from_orm(log) for log in logs]


@router.get("/stats", response_model=AuditLogStats)
async def get_audit_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get audit log statistics (Admin only)
    """
    from sqlalchemy import func
    from app.models.audit_log import AuditLog
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)
    
    # Total logs
    total_logs = db.query(func.count(AuditLog.id)).scalar()
    
    # Logs today
    logs_today = db.query(func.count(AuditLog.id)).filter(
        AuditLog.created_at >= today_start
    ).scalar()
    
    # Logs this week
    logs_this_week = db.query(func.count(AuditLog.id)).filter(
        AuditLog.created_at >= week_start
    ).scalar()
    
    # Logs this month
    logs_this_month = db.query(func.count(AuditLog.id)).filter(
        AuditLog.created_at >= month_start
    ).scalar()
    
    # By action
    by_action = count_logs_by_action(db, start_date=month_start)
    
    # By status
    by_status_results = db.query(
        AuditLog.status, func.count(AuditLog.id)
    ).filter(
        AuditLog.created_at >= month_start
    ).group_by(AuditLog.status).all()
    
    by_status = {status: count for status, count in by_status_results}
    
    return AuditLogStats(
        total_logs=total_logs or 0,
        logs_today=logs_today or 0,
        logs_this_week=logs_this_week or 0,
        logs_this_month=logs_this_month or 0,
        by_action=by_action,
        by_status=by_status
    )


@router.get("/recent", response_model=List[AuditLogResponse])
async def get_recent_audit_logs(
    hours: int = Query(24, ge=1, le=168),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get recent audit logs from last N hours (Admin only)
    """
    logs = get_recent_logs(db, hours=hours, limit=limit)
    return [AuditLogResponse.from_orm(log) for log in logs]


@router.get("/user/{user_id}", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get audit logs for a specific user (Admin only)
    """
    logs = get_user_activity(db, user_id=user_id, limit=limit)
    return [AuditLogResponse.from_orm(log) for log in logs]


@router.get("/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(
    log_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get a specific audit log by ID (Admin only)
    """
    log = get_audit_log_by_id(db, log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    return AuditLogResponse.from_orm(log)
