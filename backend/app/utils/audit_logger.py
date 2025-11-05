"""
Utility functions for audit logging
Use these for specific important events
"""

from sqlalchemy.orm import Session
from app.crud.audit_log import create_audit_log
from app.models.audit_log import AuditAction
from typing import Optional, Dict, Any


def log_login_success(
    db: Session,
    user_id: str,
    user_email: str,
    user_name: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log successful login"""
    create_audit_log(
        db=db,
        action=AuditAction.USER_LOGIN,
        user_id=user_id,
        user_email=user_email,
        user_name=user_name,
        resource_type="user",
        resource_id=user_id,
        action_description=f"User {user_email} logged in successfully",
        ip_address=ip_address,
        user_agent=user_agent,
        status="success"
    )


def log_login_failed(
    db: Session,
    email: str,
    reason: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log failed login attempt"""
    create_audit_log(
        db=db,
        action=AuditAction.USER_LOGIN,
        user_email=email,
        resource_type="user",
        action_description=f"Failed login attempt for {email}",
        details={"reason": reason},
        ip_address=ip_address,
        user_agent=user_agent,
        status="failed",
        error_message=reason
    )


def log_payment_success(
    db: Session,
    user_id: str,
    user_email: str,
    order_id: str,
    amount: float,
    payment_reference: str,
    payment_method: str = "paystack"
):
    """Log successful payment"""
    create_audit_log(
        db=db,
        action=AuditAction.PAYMENT_SUCCESS,
        user_id=user_id,
        user_email=user_email,
        resource_type="payment",
        resource_id=payment_reference,
        action_description=f"Payment completed for order {order_id}",
        details={
            "order_id": order_id,
            "amount": amount,
            "payment_reference": payment_reference,
            "payment_method": payment_method
        },
        status="success"
    )


def log_payment_failed(
    db: Session,
    user_id: Optional[str],
    user_email: Optional[str],
    order_id: str,
    amount: float,
    error_message: str,
    payment_reference: Optional[str] = None
):
    """Log failed payment"""
    create_audit_log(
        db=db,
        action=AuditAction.PAYMENT_FAILED,
        user_id=user_id,
        user_email=user_email,
        resource_type="payment",
        resource_id=payment_reference or order_id,
        action_description=f"Payment failed for order {order_id}",
        details={
            "order_id": order_id,
            "amount": amount,
            "payment_reference": payment_reference,
            "error": error_message
        },
        status="failed",
        error_message=error_message
    )


def log_order_created(
    db: Session,
    user_id: str,
    user_email: str,
    order_id: str,
    total_amount: float,
    items_count: int
):
    """Log order creation"""
    create_audit_log(
        db=db,
        action=AuditAction.ORDER_CREATE,
        user_id=user_id,
        user_email=user_email,
        resource_type="order",
        resource_id=order_id,
        action_description=f"Order {order_id} created",
        details={
            "order_id": order_id,
            "total_amount": total_amount,
            "items_count": items_count
        },
        status="success"
    )


def log_order_status_change(
    db: Session,
    admin_id: str,
    admin_email: str,
    order_id: str,
    old_status: str,
    new_status: str
):
    """Log order status change"""
    create_audit_log(
        db=db,
        action=AuditAction.ORDER_UPDATE,
        user_id=admin_id,
        user_email=admin_email,
        resource_type="order",
        resource_id=order_id,
        action_description=f"Order {order_id} status changed from {old_status} to {new_status}",
        details={
            "order_id": order_id,
            "old_status": old_status,
            "new_status": new_status
        },
        status="success"
    )


def log_product_created(
    db: Session,
    user_id: str,
    user_email: str,
    product_id: str,
    product_name: str
):
    """Log product creation"""
    create_audit_log(
        db=db,
        action=AuditAction.PRODUCT_CREATE,
        user_id=user_id,
        user_email=user_email,
        resource_type="product",
        resource_id=product_id,
        action_description=f"Product '{product_name}' created",
        details={
            "product_id": product_id,
            "product_name": product_name
        },
        status="success"
    )


def log_product_updated(
    db: Session,
    user_id: str,
    user_email: str,
    product_id: str,
    product_name: str,
    changes: Dict[str, Any]
):
    """Log product update"""
    create_audit_log(
        db=db,
        action=AuditAction.PRODUCT_UPDATE,
        user_id=user_id,
        user_email=user_email,
        resource_type="product",
        resource_id=product_id,
        action_description=f"Product '{product_name}' updated",
        details={
            "product_id": product_id,
            "product_name": product_name,
            "changes": changes
        },
        status="success"
    )


def log_product_deleted(
    db: Session,
    user_id: str,
    user_email: str,
    product_id: str,
    product_name: str
):
    """Log product deletion"""
    create_audit_log(
        db=db,
        action=AuditAction.PRODUCT_DELETE,
        user_id=user_id,
        user_email=user_email,
        resource_type="product",
        resource_id=product_id,
        action_description=f"Product '{product_name}' deleted",
        details={
            "product_id": product_id,
            "product_name": product_name
        },
        status="success"
    )


def log_user_registered(
    db: Session,
    user_id: str,
    user_email: str,
    user_name: str,
    user_type: str,
    ip_address: Optional[str] = None
):
    """Log user registration"""
    create_audit_log(
        db=db,
        action=AuditAction.USER_REGISTER,
        user_id=user_id,
        user_email=user_email,
        user_name=user_name,
        resource_type="user",
        resource_id=user_id,
        action_description=f"New {user_type} registered: {user_email}",
        details={
            "user_type": user_type,
            "user_id": user_id
        },
        ip_address=ip_address,
        status="success"
    )


def log_user_updated(
    db: Session,
    admin_id: str,
    admin_email: str,
    target_user_id: str,
    target_user_email: str,
    changes: Dict[str, Any]
):
    """Log user profile update"""
    create_audit_log(
        db=db,
        action=AuditAction.USER_UPDATE,
        user_id=admin_id,
        user_email=admin_email,
        resource_type="user",
        resource_id=target_user_id,
        action_description=f"User {target_user_email} updated",
        details={
            "target_user_id": target_user_id,
            "target_user_email": target_user_email,
            "changes": changes
        },
        status="success"
    )


def log_user_deleted(
    db: Session,
    admin_id: str,
    admin_email: str,
    target_user_id: str,
    target_user_email: str,
    reason: Optional[str] = None
):
    """Log user deletion"""
    create_audit_log(
        db=db,
        action=AuditAction.USER_DELETE,
        user_id=admin_id,
        user_email=admin_email,
        resource_type="user",
        resource_id=target_user_id,
        action_description=f"User {target_user_email} deleted",
        details={
            "target_user_id": target_user_id,
            "target_user_email": target_user_email,
            "reason": reason
        },
        status="success"
    )


def log_api_error(
    db: Session,
    endpoint: str,
    method: str,
    error_message: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Log API error"""
    create_audit_log(
        db=db,
        action=AuditAction.API_CALL,
        user_id=user_id,
        user_email=user_email,
        action_description=f"API Error: {method} {endpoint}",
        details={
            "endpoint": endpoint,
            "method": method,
            **(details or {})
        },
        status="error",
        error_message=error_message
    )


def log_database_cleanup(
    db: Session,
    admin_id: str,
    admin_email: str,
    targets: list,
    deleted_counts: Dict[str, int]
):
    """Log database cleanup operation"""
    create_audit_log(
        db=db,
        action=AuditAction.SYSTEM_CONFIG,
        user_id=admin_id,
        user_email=admin_email,
        resource_type="system",
        action_description=f"Database cleanup executed",
        details={
            "targets": targets,
            "deleted_counts": deleted_counts
        },
        status="success"
    )


def log_inventory_update(
    db: Session,
    user_id: str,
    user_email: str,
    product_id: str,
    product_name: str,
    changes: Dict[str, Any]
):
    """Log inventory/stock update"""
    create_audit_log(
        db=db,
        action=AuditAction.PRODUCT_UPDATE,
        user_id=user_id,
        user_email=user_email,
        resource_type="inventory",
        resource_id=product_id,
        action_description=f"Inventory updated for '{product_name}'",
        details={
            "product_id": product_id,
            "product_name": product_name,
            "changes": changes
        },
        status="success"
    )


def log_stock_adjustment(
    db: Session,
    user_id: str,
    user_email: str,
    product_id: str,
    product_name: str,
    adjustment_type: str,
    quantity: float,
    reason: Optional[str] = None
):
    """Log stock adjustment"""
    create_audit_log(
        db=db,
        action=AuditAction.PRODUCT_UPDATE,
        user_id=user_id,
        user_email=user_email,
        resource_type="stock",
        resource_id=product_id,
        action_description=f"Stock {adjustment_type} for '{product_name}': {quantity}",
        details={
            "product_id": product_id,
            "product_name": product_name,
            "adjustment_type": adjustment_type,
            "quantity": quantity,
            "reason": reason
        },
        status="success"
    )
