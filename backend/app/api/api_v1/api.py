"""
API v1 router
"""

from fastapi import APIRouter
from datetime import datetime
from app.core.config import settings

from app.api.api_v1.endpoints import (
    auth, users, products, cart, orders, payments,
    bubbles, fund_transfers, messages, reviews, oauth, giftcards, suppliers, warehouse, riders, admin, audit_logs, user_addresses, guest_orders, delivery_dates, delivery_settings, coupons, order_payments, admin_orders, admin_cleanup, warehouse_locations, goods_received, perishables, pick_lists, supply_requests, supply_offers, price_comparison, supplier_products, order_delivery, rider_auth, rider_portal, smart_restock, ai_chat, user_analytics, feedback, images, community, packages
)
from app.api.api_v1.endpoints import orders_fixed as orders

api_router = APIRouter()

# Health check endpoint for deployment monitoring
@api_router.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    return {
        "status": "healthy",
        "service": "GoShopGhana API",
        "timestamp": datetime.now().isoformat()
    }

# Include all endpoint routers
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["oauth2"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(user_addresses.router, prefix="/user-addresses", tags=["user-addresses"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(cart.router, prefix="/cart", tags=["shopping-cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(order_payments.router, prefix="/orders", tags=["order-payments"])
api_router.include_router(guest_orders.router, prefix="/guest-orders", tags=["guest-orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(giftcards.router, prefix="/giftcards", tags=["giftcards"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(warehouse.router, prefix="/warehouse", tags=["warehouse"])
api_router.include_router(warehouse_locations.router, prefix="/warehouse/locations", tags=["warehouse"])
api_router.include_router(goods_received.router, prefix="/warehouse/grn", tags=["warehouse"])
api_router.include_router(perishables.router, prefix="/warehouse/perishables", tags=["warehouse"])
api_router.include_router(pick_lists.router, prefix="/warehouse/pick-lists", tags=["warehouse"])
api_router.include_router(riders.router, prefix="/admin/riders", tags=["riders"])
api_router.include_router(rider_portal.router, prefix="/riders", tags=["rider-portal"])
api_router.include_router(rider_auth.router, prefix="", tags=["rider-auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_orders.router, prefix="/admin", tags=["admin-orders"])
api_router.include_router(admin_cleanup.router, prefix="/admin", tags=["admin-cleanup"])
api_router.include_router(order_delivery.router, prefix="", tags=["order-delivery"])
api_router.include_router(bubbles.router, prefix="/bubbles", tags=["bubbles"])
api_router.include_router(fund_transfers.router, prefix="/fund-transfers", tags=["fund-transfers"])
api_router.include_router(messages.router, prefix="/messages", tags=["messaging"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(delivery_dates.router, prefix="/delivery-dates", tags=["delivery-dates"])
api_router.include_router(delivery_settings.router, prefix="/delivery-settings", tags=["delivery-settings"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])

# Supplier Portal & Procurement
api_router.include_router(supply_requests.router, prefix="/supply-requests", tags=["procurement"])
api_router.include_router(supply_offers.router, prefix="/supplier", tags=["supplier-portal"])
api_router.include_router(supply_offers.router, prefix="/supply-offers", tags=["procurement"])  # Also register under /supply-offers for admin
api_router.include_router(supplier_products.router, prefix="/supplier", tags=["supplier-portal"])
api_router.include_router(price_comparison.router, prefix="/price-comparison", tags=["procurement"])
api_router.include_router(smart_restock.router, prefix="/warehouse", tags=["smart-restock"])

# AI Assistant
api_router.include_router(ai_chat.router, prefix="/ai", tags=["ai-assistant"])

# User Analytics (Admin)
api_router.include_router(user_analytics.router, prefix="/admin/user-analytics", tags=["admin-analytics"])

# Feedback
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])

if settings.DEBUG:
    from app.api.api_v1.endpoints import migrate, migrate_async, test, test_audit

    api_router.include_router(test.router, prefix="/test", tags=["testing"])
    api_router.include_router(test_audit.router, prefix="/test-audit", tags=["testing"])
    api_router.include_router(migrate.router, prefix="/migrate", tags=["migration"])
    api_router.include_router(migrate_async.router, prefix="/migrate-async", tags=["migration"])

# Community signup
api_router.include_router(community.router, prefix="/community", tags=["community"])

# Packages (Seasonal Promotions)
api_router.include_router(packages.router, prefix="/packages", tags=["packages"])
