"""
Audit Log Schemas for GoShopGhana
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.audit_log import AuditAction


class AuditLogBase(BaseModel):
    """Base audit log schema"""
    action: AuditAction
    action_description: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    """Schema for creating audit log"""
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "success"
    error_message: Optional[str] = None


class AuditLogResponse(AuditLogBase):
    """Schema for audit log response"""
    id: str
    user_id: Optional[str]
    user_email: Optional[str]
    user_name: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    status: str
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        """Convert ORM object to Pydantic model"""
        return cls(
            id=str(obj.id),
            user_id=str(obj.user_id) if obj.user_id else None,
            user_email=obj.user_email,
            user_name=obj.user_name,
            action=obj.action,
            action_description=obj.action_description,
            resource_type=obj.resource_type,
            resource_id=obj.resource_id,
            details=obj.details,
            ip_address=obj.ip_address,
            user_agent=obj.user_agent,
            status=obj.status,
            error_message=obj.error_message,
            created_at=obj.created_at
        )


class AuditLogStats(BaseModel):
    """Statistics about audit logs"""
    total_logs: int
    logs_today: int
    logs_this_week: int
    logs_this_month: int
    by_action: Dict[str, int]
    by_status: Dict[str, int]
