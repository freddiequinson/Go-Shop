"""
Analytics models for GoShopGhana
Track views, activity logs, and sales analytics
"""

from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, JSON, Date, Integer
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class AdminActivityLog(Base):
    """Log all admin actions for audit trail"""
    __tablename__ = "admin_activity_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Action details
    action_type = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, VIEW, EXPORT
    resource_type = Column(String(50), nullable=False)  # product, order, user, etc.
    resource_id = Column(String, nullable=True)
    
    # Changes made
    changes = Column(JSON, nullable=True)  # {before: {...}, after: {...}}
    
    # Request details
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_method = Column(String(10), nullable=True)  # GET, POST, PUT, DELETE
    request_path = Column(String(255), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<AdminActivityLog(admin_id={self.admin_id}, action={self.action_type}, resource={self.resource_type})>"


class ProductView(Base):
    """Track product views for analytics"""
    __tablename__ = "product_views"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for anonymous
    
    # Session tracking
    session_id = Column(String(100), nullable=True)
    
    # View details
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    referrer = Column(String(500), nullable=True)
    device_type = Column(String(50), nullable=True)  # mobile, tablet, desktop
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<ProductView(product_id={self.product_id}, viewed_at={self.viewed_at})>"


class SalesAnalytics(Base):
    """Daily aggregated sales analytics"""
    __tablename__ = "sales_analytics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Date
    date = Column(Date, nullable=False, index=True)
    
    # Product/Category
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    
    # Sales metrics
    quantity_sold = Column(Numeric(10, 2), default=0, nullable=False)
    revenue_cedis = Column(Numeric(12, 0), default=0, nullable=False)  # In cedis (kobo)
    cost_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    profit_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    
    # Order metrics
    orders_count = Column(Integer, default=0, nullable=False)
    average_order_value_cedis = Column(Numeric(12, 0), default=0, nullable=False)
    
    # Customer metrics
    unique_customers = Column(Integer, default=0, nullable=False)
    new_customers = Column(Integer, default=0, nullable=False)
    returning_customers = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<SalesAnalytics(date={self.date}, revenue={self.revenue_cedis/100})>"
