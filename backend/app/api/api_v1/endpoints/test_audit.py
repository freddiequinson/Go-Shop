"""
Test endpoint to create sample audit logs
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud.audit_log import create_audit_log
from app.models.audit_log import AuditAction
from app.core.deps import get_current_admin
from app.models.user import User
from datetime import datetime, timedelta
import random

router = APIRouter()


@router.post("/create-sample-audit-logs")
async def create_sample_logs(
    count: int = 50,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create sample audit logs for testing
    """
    actions = [
        (AuditAction.USER_LOGIN, "user", "User logged in successfully"),
        (AuditAction.USER_REGISTER, "user", "New user registered"),
        (AuditAction.USER_UPDATE, "user", "User profile updated"),
        (AuditAction.PRODUCT_CREATE, "product", "New product created"),
        (AuditAction.PRODUCT_UPDATE, "product", "Product details updated"),
        (AuditAction.PRODUCT_DELETE, "product", "Product deleted"),
        (AuditAction.ORDER_CREATE, "order", "New order placed"),
        (AuditAction.PAYMENT_SUCCESS, "payment", "Payment completed successfully"),
    ]
    
    statuses = ["success", "success", "success", "failed", "error"]
    
    sample_users = [
        ("user1@example.com", "John Doe"),
        ("user2@example.com", "Jane Smith"),
        ("admin@example.com", "Admin User"),
        ("seller@example.com", "Seller Account"),
    ]
    
    sample_ips = [
        "192.168.1.100",
        "10.0.0.50",
        "172.16.0.25",
        "192.168.0.1"
    ]
    
    created_logs = []
    
    for i in range(count):
        action, resource_type, description = random.choice(actions)
        user_email, user_name = random.choice(sample_users)
        status = random.choice(statuses)
        ip = random.choice(sample_ips)
        
        # Create log with random timestamp in the past 30 days
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        
        log = create_audit_log(
            db=db,
            action=action,
            user_email=user_email,
            user_name=user_name,
            resource_type=resource_type,
            resource_id=f"res_{random.randint(1000, 9999)}",
            action_description=description,
            details={"sample": True, "index": i},
            ip_address=ip,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            status=status,
            error_message="Sample error message" if status == "error" else None
        )
        
        # Update created_at to be in the past
        log.created_at = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
        db.commit()
        
        created_logs.append(log.id)
    
    return {
        "message": f"Created {count} sample audit logs",
        "log_ids": created_logs[:10]  # Return first 10 IDs
    }
