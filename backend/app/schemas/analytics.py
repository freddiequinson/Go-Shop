"""
Analytics schemas for GoShopGhana
Pydantic models for analytics and reporting
"""

from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime, date
from pydantic import BaseModel, field_serializer


# Dashboard Stats
class DashboardStats(BaseModel):
    total_products: int
    active_products: int
    low_stock_products: int
    out_of_stock_products: int
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_users: int
    active_users: int
    new_users_today: int
    total_revenue: Decimal
    revenue_today: Decimal
    revenue_this_week: Decimal
    revenue_this_month: Decimal
    total_deliveries: int
    active_deliveries: int
    total_riders: int
    available_riders: int


# Sales Analytics
class SalesAnalyticsResponse(BaseModel):
    date: date
    product_id: Optional[str] = None
    category_id: Optional[str] = None
    quantity_sold: Decimal
    revenue: Decimal  # In GHS
    cost: Decimal
    profit: Decimal
    orders_count: int
    average_order_value: Decimal
    unique_customers: int
    new_customers: int
    returning_customers: int

    @field_serializer('date')
    def serialize_date(self, value: date) -> str:
        return value.isoformat()

    class Config:
        from_attributes = True


class SalesReport(BaseModel):
    start_date: date
    end_date: date
    total_revenue: Decimal
    total_cost: Decimal
    total_profit: Decimal
    profit_margin: float
    total_orders: int
    total_quantity_sold: Decimal
    average_order_value: Decimal
    daily_breakdown: List[SalesAnalyticsResponse]


# Product Analytics
class ProductAnalytics(BaseModel):
    product_id: str
    product_name: str
    category_name: Optional[str] = None
    total_views: int
    total_sales: Decimal
    total_revenue: Decimal
    total_orders: int
    average_rating: Optional[Decimal] = None
    stock_level: Decimal
    last_sold_date: Optional[datetime] = None

    @field_serializer('last_sold_date')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None


class TopSellingProducts(BaseModel):
    products: List[ProductAnalytics]
    period: str  # today, week, month, year


class MostViewedProducts(BaseModel):
    products: List[ProductAnalytics]
    period: str


# Category Analytics
class CategoryAnalytics(BaseModel):
    category_id: str
    category_name: str
    total_products: int
    total_sales: Decimal
    total_revenue: Decimal
    total_orders: int
    average_product_rating: Optional[Decimal] = None


# Customer Analytics
class CustomerAnalytics(BaseModel):
    total_customers: int
    new_customers: int
    active_customers: int
    inactive_customers: int
    average_order_value: Decimal
    average_orders_per_customer: float
    customer_retention_rate: float
    customer_lifetime_value: Decimal
    top_spending_customers: List[Dict[str, Any]]


# Admin Activity Log
class AdminActivityLogResponse(BaseModel):
    id: str
    admin_id: str
    action_type: str
    resource_type: str
    resource_id: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_method: Optional[str] = None
    request_path: Optional[str] = None
    created_at: datetime

    @field_serializer('created_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    class Config:
        from_attributes = True


class ActivityLogListResponse(BaseModel):
    logs: List[AdminActivityLogResponse]
    total: int
    page: int
    per_page: int
    pages: int


# Product View
class ProductViewResponse(BaseModel):
    id: str
    product_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    viewed_at: datetime
    referrer: Optional[str] = None
    device_type: Optional[str] = None

    @field_serializer('viewed_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat()

    class Config:
        from_attributes = True


# Analytics Filters
class AnalyticsDateRange(BaseModel):
    start_date: date
    end_date: date


class AnalyticsFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    product_id: Optional[str] = None
    category_id: Optional[str] = None
    user_id: Optional[str] = None


# Export Request
class ExportRequest(BaseModel):
    export_type: str  # sales, products, customers, orders
    format: str = "csv"  # csv, excel, pdf
    date_range: Optional[AnalyticsDateRange] = None
    filters: Optional[Dict[str, Any]] = None
