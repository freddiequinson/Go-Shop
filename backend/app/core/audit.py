"""
Audit logging utility for GoShopGhana
Helper functions to easily log audit events
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import Request

from app.crud.audit_log import create_audit_log
from app.models.audit_log import AuditAction
from app.models.user import User


def log_audit(
    db: Session,
    action: AuditAction,
    user: Optional[User] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    description: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    status: str = "success",
    error_message: Optional[str] = None
):
    """
    Log an audit event
    
    Args:
        db: Database session
        action: Action type (from AuditAction enum)
        user: User who performed the action (optional for system actions)
        resource_type: Type of resource affected (e.g., "user", "product")
        resource_id: ID of the resource
        description: Human-readable description
        details: Additional details as dictionary
        request: FastAPI request object (for IP and user agent)
        status: Status of the action (success, failed, error)
        error_message: Error message if status is failed/error
    """
    user_id = str(user.id) if user else None
    user_email = user.email if user else None
    user_name = user.full_name if user and hasattr(user, 'full_name') else (user.username if user else None)
    
    ip_address = None
    user_agent = None
    
    if request:
        # Get IP address
        ip_address = request.client.host if request.client else None
        # Get user agent
        user_agent = request.headers.get("user-agent")
    
    return create_audit_log(
        db=db,
        action=action,
        user_id=user_id,
        user_email=user_email,
        user_name=user_name,
        resource_type=resource_type,
        resource_id=resource_id,
        action_description=description,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
        error_message=error_message
    )


# Convenience functions for common actions

def log_user_login(db: Session, user: User, request: Optional[Request] = None):
    """Log user login"""
    return log_audit(
        db=db,
        action=AuditAction.USER_LOGIN,
        user=user,
        description=f"User {user.email} logged in",
        request=request
    )


def log_user_register(db: Session, user: User, request: Optional[Request] = None):
    """Log user registration"""
    return log_audit(
        db=db,
        action=AuditAction.USER_REGISTER,
        user=user,
        description=f"New user registered: {user.email}",
        request=request
    )


def log_user_delete(db: Session, admin: User, deleted_user_id: str, deleted_user_email: str, request: Optional[Request] = None):
    """Log user deletion"""
    return log_audit(
        db=db,
        action=AuditAction.USER_DELETE,
        user=admin,
        resource_type="user",
        resource_id=deleted_user_id,
        description=f"Admin {admin.email} deleted user {deleted_user_email}",
        details={"deleted_user_email": deleted_user_email},
        request=request
    )


def log_product_create(db: Session, user: User, product_id: str, product_name: str, request: Optional[Request] = None):
    """Log product creation"""
    return log_audit(
        db=db,
        action=AuditAction.PRODUCT_CREATE,
        user=user,
        resource_type="product",
        resource_id=product_id,
        description=f"Created product: {product_name}",
        details={"product_name": product_name},
        request=request
    )


def log_product_update(db: Session, user: User, product_id: str, product_name: str, changes: Dict[str, Any], request: Optional[Request] = None):
    """Log product update"""
    return log_audit(
        db=db,
        action=AuditAction.PRODUCT_UPDATE,
        user=user,
        resource_type="product",
        resource_id=product_id,
        description=f"Updated product: {product_name}",
        details={"product_name": product_name, "changes": changes},
        request=request
    )


def log_product_delete(db: Session, user: User, product_id: str, product_name: str, request: Optional[Request] = None):
    """Log product deletion"""
    return log_audit(
        db=db,
        action=AuditAction.PRODUCT_DELETE,
        user=user,
        resource_type="product",
        resource_id=product_id,
        description=f"Deleted product: {product_name}",
        details={"product_name": product_name},
        request=request
    )


def log_order_create(db: Session, user: User, order_id: str, total_amount: float, request: Optional[Request] = None):
    """Log order creation"""
    return log_audit(
        db=db,
        action=AuditAction.ORDER_CREATE,
        user=user,
        resource_type="order",
        resource_id=order_id,
        description=f"Created order #{order_id}",
        details={"total_amount": total_amount},
        request=request
    )


def log_payment_success(db: Session, user: User, order_id: str, amount: float, payment_method: str, request: Optional[Request] = None):
    """Log successful payment"""
    return log_audit(
        db=db,
        action=AuditAction.PAYMENT_SUCCESS,
        user=user,
        resource_type="order",
        resource_id=order_id,
        description=f"Payment successful for order #{order_id}",
        details={"amount": amount, "payment_method": payment_method},
        request=request
    )


def log_error(db: Session, error_type: str, error_message: str, user: Optional[User] = None, details: Optional[Dict[str, Any]] = None, request: Optional[Request] = None):
    """Log system error"""
    return log_audit(
        db=db,
        action=AuditAction.SYSTEM_ERROR,
        user=user,
        description=f"System error: {error_type}",
        details=details,
        status="error",
        error_message=error_message,
        request=request
    )
