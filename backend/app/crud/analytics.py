"""
CRUD operations for Analytics and Activity Logging
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, date
from decimal import Decimal
import uuid

from app.models.analytics import AdminActivityLog, ProductView, SalesAnalytics
from app.models.product import Product
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.user import User
from app.models.warehouse import WarehouseInventory
from app.models.rider import Rider, DeliveryAssignment


def log_admin_activity(
    db: Session,
    admin_id: str,
    action_type: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    changes: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_method: Optional[str] = None,
    request_path: Optional[str] = None
):
    """Log admin activity"""
    log = AdminActivityLog(
        id=str(uuid.uuid4()),
        admin_id=admin_id,
        action_type=action_type,
        resource_type=resource_type,
        resource_id=resource_id,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent,
        request_method=request_method,
        request_path=request_path
    )
    db.add(log)
    db.commit()


def get_admin_activity_logs(
    db: Session,
    admin_id: Optional[str] = None,
    action_type: Optional[str] = None,
    resource_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[AdminActivityLog], int]:
    """Get admin activity logs"""
    query = db.query(AdminActivityLog)
    
    if admin_id:
        query = query.filter(AdminActivityLog.admin_id == admin_id)
    
    if action_type:
        query = query.filter(AdminActivityLog.action_type == action_type)
    
    if resource_type:
        query = query.filter(AdminActivityLog.resource_type == resource_type)
    
    total = query.count()
    logs = query.order_by(AdminActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return logs, total


def track_product_view(
    db: Session,
    product_id: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    referrer: Optional[str] = None,
    device_type: Optional[str] = None
):
    """Track product view"""
    view = ProductView(
        id=str(uuid.uuid4()),
        product_id=product_id,
        user_id=user_id,
        session_id=session_id,
        referrer=referrer,
        device_type=device_type
    )
    db.add(view)
    db.commit()


def get_product_views(
    db: Session,
    product_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> int:
    """Get product view count"""
    query = db.query(ProductView)
    
    if product_id:
        query = query.filter(ProductView.product_id == product_id)
    
    if start_date:
        query = query.filter(ProductView.viewed_at >= start_date)
    
    if end_date:
        query = query.filter(ProductView.viewed_at <= end_date)
    
    return query.count()


def get_dashboard_stats(db: Session) -> dict:
    """Get dashboard statistics"""
    # Products
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()
    
    # Inventory
    low_stock = db.query(WarehouseInventory).filter(
        WarehouseInventory.quantity_available <= WarehouseInventory.reorder_level
    ).count()
    out_of_stock = db.query(WarehouseInventory).filter(
        WarehouseInventory.quantity_available == 0
    ).count()
    
    # Orders - check both uppercase and lowercase status values
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.PENDING, "PENDING", "pending", "pending_payment"])
    ).count()
    completed_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.DELIVERED, OrderStatus.DELIVERED_LOWER, "DELIVERED", "delivered"])
    ).count()
    cancelled_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.CANCELLED, OrderStatus.CANCELLED_LOWER, "CANCELLED", "cancelled"])
    ).count()
    
    # Users
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # New users today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = db.query(User).filter(User.created_at >= today_start).count()
    
    # Revenue - Include both delivered AND paid orders
    # This ensures we show revenue for paid orders even if not yet delivered
    # total_cedis is in pesewas, so divide by 100 to get cedis
    from sqlalchemy import or_
    delivered_statuses = [OrderStatus.DELIVERED, OrderStatus.DELIVERED_LOWER, "DELIVERED", "delivered"]
    paid_statuses = [PaymentStatus.COMPLETED, "completed"]
    
    total_revenue = db.query(func.sum(Order.total_cedis)).filter(
        or_(
            Order.status.in_(delivered_statuses),
            Order.payment_status.in_(paid_statuses)
        )
    ).scalar() or 0
    
    revenue_today = db.query(func.sum(Order.total_cedis)).filter(
        or_(
            Order.status.in_(delivered_statuses),
            Order.payment_status.in_(paid_statuses)
        ),
        Order.created_at >= today_start
    ).scalar() or 0
    
    week_start = datetime.utcnow() - timedelta(days=7)
    revenue_this_week = db.query(func.sum(Order.total_cedis)).filter(
        or_(
            Order.status.in_(delivered_statuses),
            Order.payment_status.in_(paid_statuses)
        ),
        Order.created_at >= week_start
    ).scalar() or 0
    
    month_start = datetime.utcnow() - timedelta(days=30)
    revenue_this_month = db.query(func.sum(Order.total_cedis)).filter(
        or_(
            Order.status.in_(delivered_statuses),
            Order.payment_status.in_(paid_statuses)
        ),
        Order.created_at >= month_start
    ).scalar() or 0
    
    # Deliveries
    total_deliveries = db.query(DeliveryAssignment).count()
    active_deliveries = db.query(DeliveryAssignment).filter(
        DeliveryAssignment.status.in_(['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'])
    ).count()
    
    # Riders
    total_riders = db.query(Rider).count()
    available_riders = db.query(Rider).filter(
        Rider.is_active == True,
        Rider.is_online == True,
        Rider.current_status == 'AVAILABLE'
    ).count()
    
    return {
        "total_products": total_products,
        "active_products": active_products,
        "low_stock_products": low_stock,
        "out_of_stock_products": out_of_stock,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "total_users": total_users,
        "active_users": active_users,
        "new_users_today": new_users_today,
        "total_revenue": float(total_revenue) / 100,  # Convert pesewas to cedis
        "revenue_today": float(revenue_today) / 100,
        "revenue_this_week": float(revenue_this_week) / 100,
        "revenue_this_month": float(revenue_this_month) / 100,
        "total_deliveries": total_deliveries,
        "active_deliveries": active_deliveries,
        "total_riders": total_riders,
        "available_riders": available_riders
    }


def get_sales_analytics(
    db: Session,
    start_date: date,
    end_date: date,
    product_id: Optional[str] = None,
    category_id: Optional[str] = None
) -> List[SalesAnalytics]:
    """Get sales analytics for date range"""
    query = db.query(SalesAnalytics).filter(
        SalesAnalytics.date >= start_date,
        SalesAnalytics.date <= end_date
    )
    
    if product_id:
        query = query.filter(SalesAnalytics.product_id == product_id)
    
    if category_id:
        query = query.filter(SalesAnalytics.category_id == category_id)
    
    return query.order_by(SalesAnalytics.date).all()


def get_top_selling_products(db: Session, limit: int = 10, days: int = 30) -> List[dict]:
    """Get top selling products"""
    since = datetime.utcnow() - timedelta(days=days)
    
    # This is a simplified version - in production you'd aggregate from orders
    results = db.query(
        Product.id,
        Product.name,
        func.count(Order.id).label('order_count')
    ).join(
        Order, Order.id == Product.id  # This join needs to be through order_items
    ).filter(
        Order.created_at >= since,
        Order.status == OrderStatus.DELIVERED
    ).group_by(Product.id, Product.name).order_by(
        func.count(Order.id).desc()
    ).limit(limit).all()
    
    return [
        {
            "product_id": r.id,
            "product_name": r.name,
            "total_orders": r.order_count
        }
        for r in results
    ]


def get_most_viewed_products(db: Session, limit: int = 10, days: int = 30) -> List[dict]:
    """Get most viewed products"""
    since = datetime.utcnow() - timedelta(days=days)
    
    results = db.query(
        ProductView.product_id,
        func.count(ProductView.id).label('view_count')
    ).filter(
        ProductView.viewed_at >= since
    ).group_by(ProductView.product_id).order_by(
        func.count(ProductView.id).desc()
    ).limit(limit).all()
    
    # Get product details
    product_views = []
    for r in results:
        product = db.query(Product).filter(Product.id == r.product_id).first()
        if product:
            product_views.append({
                "product_id": r.product_id,
                "product_name": product.name,
                "total_views": r.view_count
            })
    
    return product_views


def get_customer_analytics(db: Session) -> dict:
    """Get customer analytics"""
    total_customers = db.query(User).filter(User.user_type == 'BUYER').count()
    
    # New customers (last 30 days)
    month_ago = datetime.utcnow() - timedelta(days=30)
    new_customers = db.query(User).filter(
        User.user_type == 'BUYER',
        User.created_at >= month_ago
    ).count()
    
    # Active customers (made purchase in last 30 days)
    active_customers = db.query(func.count(func.distinct(Order.user_id))).filter(
        Order.created_at >= month_ago
    ).scalar() or 0
    
    # Inactive customers
    inactive_customers = total_customers - active_customers
    
    # Average order value - check both uppercase and lowercase
    delivered_statuses = [OrderStatus.DELIVERED, OrderStatus.DELIVERED_LOWER, "DELIVERED", "delivered"]
    
    avg_order_value = db.query(func.avg(Order.total_cedis)).filter(
        Order.status.in_(delivered_statuses)
    ).scalar() or 0
    
    # Average orders per customer
    total_orders = db.query(Order).filter(Order.status.in_(delivered_statuses)).count()
    avg_orders_per_customer = total_orders / total_customers if total_customers > 0 else 0
    
    # Customer retention rate (simplified)
    retention_rate = (active_customers / total_customers * 100) if total_customers > 0 else 0
    
    # Customer lifetime value (simplified)
    total_revenue = db.query(func.sum(Order.total_cedis)).filter(
        Order.status.in_(delivered_statuses)
    ).scalar() or 0
    clv = (total_revenue / total_customers) if total_customers > 0 else 0
    
    return {
        "total_customers": total_customers,
        "new_customers": new_customers,
        "active_customers": active_customers,
        "inactive_customers": inactive_customers,
        "average_order_value": float(avg_order_value) / 100,  # Convert pesewas to cedis
        "average_orders_per_customer": round(avg_orders_per_customer, 2),
        "customer_retention_rate": round(retention_rate, 2),
        "customer_lifetime_value": float(clv) / 100,  # Convert pesewas to cedis
        "top_spending_customers": []  # Would need more complex query
    }
