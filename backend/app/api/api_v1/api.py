"""
API v1 router
"""

from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth, users, products, cart, orders, payments,
    bubbles, fund_transfers, messages, reviews, oauth, giftcards, suppliers, warehouse, riders, admin, test, audit_logs
)
from app.api.api_v1.endpoints import orders_fixed as orders

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["oauth2"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(cart.router, prefix="/cart", tags=["shopping-cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(giftcards.router, prefix="/giftcards", tags=["giftcards"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(warehouse.router, prefix="/warehouse", tags=["warehouse"])
api_router.include_router(riders.router, prefix="/riders", tags=["riders"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(bubbles.router, prefix="/bubbles", tags=["bubbles"])
api_router.include_router(fund_transfers.router, prefix="/fund-transfers", tags=["fund-transfers"])
api_router.include_router(messages.router, prefix="/messages", tags=["messaging"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(test.router, prefix="/test", tags=["testing"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
