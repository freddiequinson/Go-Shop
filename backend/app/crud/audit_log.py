"""
Audit Log CRUD operations for GoShopGhana
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from datetime import datetime, timedelta

from app.models.audit_log import AuditLog, AuditAction


def create_audit_log(
    db: Session,
    action: AuditAction,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    action_description: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    status: str = "success",
    error_message: Optional[str] = None
) -> AuditLog:
    """
    Create a new audit log entry
    """
    audit_log = AuditLog(
        user_id=user_id,
        user_email=user_email,
        user_name=user_name,
        action=action,
        action_description=action_description,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
        error_message=error_message
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    action: Optional[AuditAction] = None,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None
) -> List[AuditLog]:
    """
    Get audit logs with optional filters
    """
    query = db.query(AuditLog)
    
    # Apply filters
    if action:
        query = query.filter(AuditLog.action == action)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    
    if status:
        query = query.filter(AuditLog.status == status)
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    if search:
        query = query.filter(
            or_(
                AuditLog.user_email.ilike(f"%{search}%"),
                AuditLog.user_name.ilike(f"%{search}%"),
                AuditLog.action_description.ilike(f"%{search}%"),
                AuditLog.resource_type.ilike(f"%{search}%")
            )
        )
    
    # Order by most recent first
    query = query.order_by(desc(AuditLog.created_at))
    
    return query.offset(skip).limit(limit).all()


def get_audit_log_by_id(db: Session, log_id: str) -> Optional[AuditLog]:
    """Get a specific audit log by ID"""
    return db.query(AuditLog).filter(AuditLog.id == log_id).first()


def get_user_activity(db: Session, user_id: str, limit: int = 50) -> List[AuditLog]:
    """Get recent activity for a specific user"""
    return db.query(AuditLog).filter(
        AuditLog.user_id == user_id
    ).order_by(desc(AuditLog.created_at)).limit(limit).all()


def get_recent_logs(db: Session, hours: int = 24, limit: int = 100) -> List[AuditLog]:
    """Get logs from the last N hours"""
    since = datetime.utcnow() - timedelta(hours=hours)
    return db.query(AuditLog).filter(
        AuditLog.created_at >= since
    ).order_by(desc(AuditLog.created_at)).limit(limit).all()


def count_logs_by_action(db: Session, start_date: Optional[datetime] = None) -> dict:
    """Get count of logs grouped by action"""
    from sqlalchemy import func
    query = db.query(AuditLog.action, func.count(AuditLog.id))
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    results = query.group_by(AuditLog.action).all()
    return {action.value: count for action, count in results}


def delete_old_logs(db: Session, days: int = 90) -> int:
    """Delete audit logs older than specified days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    deleted = db.query(AuditLog).filter(
        AuditLog.created_at < cutoff_date
    ).delete()
    db.commit()
    return deleted
