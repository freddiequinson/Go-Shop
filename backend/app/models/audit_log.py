"""
Audit Log Model for GoShopGhana
Tracks all important actions in the system
"""

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import enum

from app.db.database import Base


class AuditAction(str, enum.Enum):
    """Audit action types"""
    # User actions
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTER = "user_register"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_CREATE = "user_create"
    
    # Product actions
    PRODUCT_CREATE = "product_create"
    PRODUCT_UPDATE = "product_update"
    PRODUCT_DELETE = "product_delete"
    PRODUCT_VIEW = "product_view"
    
    # Order actions
    ORDER_CREATE = "order_create"
    ORDER_UPDATE = "order_update"
    ORDER_CANCEL = "order_cancel"
    ORDER_COMPLETE = "order_complete"
    
    # Category actions
    CATEGORY_CREATE = "category_create"
    CATEGORY_UPDATE = "category_update"
    CATEGORY_DELETE = "category_delete"
    
    # Cart actions
    CART_ADD = "cart_add"
    CART_UPDATE = "cart_update"
    CART_REMOVE = "cart_remove"
    CART_CLEAR = "cart_clear"
    
    # Payment actions
    PAYMENT_INITIATE = "payment_initiate"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    
    # Wallet actions
    WALLET_CREDIT = "wallet_credit"
    WALLET_DEBIT = "wallet_debit"
    
    # Admin actions
    ADMIN_ACCESS = "admin_access"
    SETTINGS_UPDATE = "settings_update"
    
    # Warehouse actions
    WAREHOUSE_INVENTORY_CREATE = "warehouse_inventory_create"
    WAREHOUSE_INVENTORY_UPDATE = "warehouse_inventory_update"
    WAREHOUSE_MOVEMENT_CREATE = "warehouse_movement_create"
    WAREHOUSE_STOCK_ADJUSTMENT = "warehouse_stock_adjustment"
    
    # Supplier actions
    SUPPLIER_CREATE = "supplier_create"
    SUPPLIER_UPDATE = "supplier_update"
    SUPPLIER_DELETE = "supplier_delete"
    SUPPLIER_VERIFY = "supplier_verify"
    
    # GRN (Goods Received Note) actions
    GRN_CREATE = "grn_create"
    GRN_APPROVE = "grn_approve"
    GRN_REJECT = "grn_reject"
    GRN_UPDATE = "grn_update"
    
    # Pick List actions
    PICK_LIST_CREATE = "pick_list_create"
    PICK_LIST_START = "pick_list_start"
    PICK_LIST_COMPLETE = "pick_list_complete"
    PICK_LIST_CANCEL = "pick_list_cancel"
    
    # Wastage actions
    WASTAGE_RECORD = "wastage_record"
    
    # Location actions
    LOCATION_CREATE = "location_create"
    LOCATION_UPDATE = "location_update"
    LOCATION_DELETE = "location_delete"
    
    # Product publish actions
    PRODUCT_PUBLISH = "product_publish"
    PRODUCT_UNPUBLISH = "product_unpublish"
    
    # System actions
    SYSTEM_ERROR = "system_error"
    SYSTEM_WARNING = "system_warning"
    SYSTEM_CONFIG = "system_config"
    API_CALL = "api_call"


class AuditLog(Base):
    """
    Audit log model to track all system activities
    """
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Who performed the action
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Nullable for system actions
    user_email = Column(String(255), nullable=True)
    user_name = Column(String(255), nullable=True)
    
    # What action was performed
    action = Column(SQLEnum(AuditAction), nullable=False, index=True)
    action_description = Column(Text, nullable=True)
    
    # What resource was affected
    resource_type = Column(String(100), nullable=True, index=True)  # e.g., "user", "product", "order"
    resource_id = Column(String(255), nullable=True, index=True)
    
    # Additional details
    details = Column(JSONB, nullable=True)  # Store additional context as JSON
    
    # Request information
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(Text, nullable=True)
    
    # Status
    status = Column(String(50), default="success")  # success, failed, error
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_email} at {self.created_at}>"
