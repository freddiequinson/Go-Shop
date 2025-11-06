"""
Database Cleanup endpoints for GoShopGhana
Allows admins to selectively clear database records for testing/deployment
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.db.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User, UserType
from app.models.order import Order, OrderItem, PaymentAttempt
from app.models.product import Product, Category
from app.models.warehouse import WarehouseInventory, InventoryMovement
from datetime import datetime

router = APIRouter()


@router.post("/cleanup/preview")
async def preview_cleanup(
    targets: List[str],
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Preview what will be deleted without actually deleting
    Returns counts of records that would be affected
    """
    preview = {}
    
    if "orders" in targets:
        order_count = db.query(func.count(Order.id)).scalar()
        order_items_count = db.query(func.count(OrderItem.id)).scalar()
        payment_attempts_count = db.query(func.count(PaymentAttempt.id)).scalar()
        delivery_otps_count = db.execute(text("SELECT COUNT(*) FROM delivery_otps")).scalar()
        delivery_assignments_count = db.execute(text("SELECT COUNT(*) FROM delivery_assignments")).scalar()
        pick_lists_count = db.execute(text("SELECT COUNT(*) FROM pick_lists")).scalar()
        order_conversations_count = db.execute(text("SELECT COUNT(*) FROM conversations WHERE order_id IS NOT NULL")).scalar()
        
        preview["orders"] = {
            "orders": order_count,
            "order_items": order_items_count,
            "payment_attempts": payment_attempts_count,
            "delivery_otps": delivery_otps_count,
            "delivery_assignments": delivery_assignments_count,
            "pick_lists": pick_lists_count,
            "order_conversations": order_conversations_count,
            "total": order_count + order_items_count + payment_attempts_count + delivery_otps_count + delivery_assignments_count + pick_lists_count + order_conversations_count
        }
    
    if "products" in targets:
        product_count = db.query(func.count(Product.id)).scalar()
        preview["products"] = {
            "products": product_count,
            "total": product_count
        }
    
    if "categories" in targets:
        category_count = db.query(func.count(Category.id)).scalar()
        preview["categories"] = {
            "categories": category_count,
            "total": category_count
        }
    
    if "inventory" in targets:
        inventory_count = db.query(func.count(WarehouseInventory.id)).scalar()
        movements_count = db.query(func.count(InventoryMovement.id)).scalar()
        preview["inventory"] = {
            "inventory_records": inventory_count,
            "movements": movements_count,
            "total": inventory_count + movements_count
        }
    
    if "users" in targets:
        # Count non-admin users
        user_count = db.query(func.count(User.id)).filter(
            User.user_type != UserType.ADMIN.value
        ).scalar()
        preview["users"] = {
            "users": user_count,
            "note": "Admin accounts will be preserved",
            "total": user_count
        }
    
    # Calculate grand total
    grand_total = sum(item.get("total", 0) for item in preview.values())
    
    return {
        "preview": preview,
        "grand_total": grand_total,
        "warning": "This operation cannot be undone. Please review carefully before proceeding."
    }


@router.post("/cleanup/execute")
async def execute_cleanup(
    targets: List[str],
    confirmation_code: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Execute database cleanup
    Requires confirmation code to prevent accidental deletion
    """
    # Verify confirmation code
    expected_code = f"DELETE-{current_admin.id[:8]}"
    if confirmation_code != expected_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid confirmation code. Expected: {expected_code}"
        )
    
    results = {
        "deleted": {},
        "errors": [],
        "timestamp": datetime.now().isoformat(),
        "admin": current_admin.email
    }
    
    try:
        # Delete in correct order to respect foreign key constraints
        
        # 1. Delete Orders (includes order items via cascade)
        if "orders" in targets:
            try:
                # Delete all tables that reference orders (in correct order to respect FK constraints)
                # Delete delivery-related tables
                delivery_otps_deleted = db.execute(text("DELETE FROM delivery_otps")).rowcount
                rider_locations_deleted = db.execute(text("DELETE FROM rider_locations WHERE order_id IS NOT NULL")).rowcount
                delivery_assignments_deleted = db.execute(text("DELETE FROM delivery_assignments")).rowcount
                pick_lists_deleted = db.execute(text("DELETE FROM pick_lists")).rowcount
                
                # Delete conversation-related tables
                conversation_participants_deleted = db.execute(text("DELETE FROM conversation_participants WHERE conversation_id IN (SELECT id FROM conversations WHERE order_id IS NOT NULL)")).rowcount
                messages_deleted = db.execute(text("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE order_id IS NOT NULL)")).rowcount
                conversations_deleted = db.execute(text("DELETE FROM conversations WHERE order_id IS NOT NULL")).rowcount
                
                # Delete payment attempts
                payment_attempts_deleted = db.query(PaymentAttempt).delete()
                
                # Delete order items
                order_items_deleted = db.query(OrderItem).delete()
                
                # Finally delete orders
                orders_deleted = db.query(Order).delete()
                
                results["deleted"]["orders"] = {
                    "orders": orders_deleted,
                    "order_items": order_items_deleted,
                    "payment_attempts": payment_attempts_deleted,
                    "delivery_otps": delivery_otps_deleted,
                    "delivery_assignments": delivery_assignments_deleted,
                    "pick_lists": pick_lists_deleted,
                    "conversations": conversations_deleted
                }
            except Exception as e:
                results["errors"].append(f"Orders deletion error: {str(e)}")
        
        # 2. Delete Inventory
        if "inventory" in targets:
            try:
                # Delete movements first
                movements_deleted = db.query(InventoryMovement).delete()
                
                # Delete inventory records
                inventory_deleted = db.query(WarehouseInventory).delete()
                
                results["deleted"]["inventory"] = {
                    "inventory_records": inventory_deleted,
                    "movements": movements_deleted
                }
            except Exception as e:
                results["errors"].append(f"Inventory deletion error: {str(e)}")
        
        # 3. Delete Products
        if "products" in targets:
            try:
                products_deleted = db.query(Product).delete()
                results["deleted"]["products"] = {
                    "products": products_deleted
                }
            except Exception as e:
                results["errors"].append(f"Products deletion error: {str(e)}")
        
        # 4. Delete Categories
        if "categories" in targets:
            try:
                categories_deleted = db.query(Category).delete()
                results["deleted"]["categories"] = {
                    "categories": categories_deleted
                }
            except Exception as e:
                results["errors"].append(f"Categories deletion error: {str(e)}")
        
        # 5. Delete Users (except admins)
        if "users" in targets:
            try:
                users_deleted = db.query(User).filter(
                    User.user_type != UserType.ADMIN.value
                ).delete()
                results["deleted"]["users"] = {
                    "users": users_deleted,
                    "note": "Admin accounts preserved"
                }
            except Exception as e:
                results["errors"].append(f"Users deletion error: {str(e)}")
        
        # Commit all changes
        db.commit()
        
        results["success"] = len(results["errors"]) == 0
        results["message"] = "Cleanup completed successfully" if results["success"] else "Cleanup completed with errors"
        
        return results
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup failed: {str(e)}"
        )


@router.get("/cleanup/stats")
async def get_database_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get current database statistics
    Shows record counts for all major tables
    """
    stats = {
        "orders": {
            "total": db.query(func.count(Order.id)).scalar(),
            "pending": db.query(func.count(Order.id)).filter(Order.status == "PENDING").scalar(),
            "completed": db.query(func.count(Order.id)).filter(Order.status == "DELIVERED").scalar(),
        },
        "order_items": db.query(func.count(OrderItem.id)).scalar(),
        "payment_attempts": db.query(func.count(PaymentAttempt.id)).scalar(),
        "products": db.query(func.count(Product.id)).scalar(),
        "categories": db.query(func.count(Category.id)).scalar(),
        "inventory_records": db.query(func.count(WarehouseInventory.id)).scalar(),
        "inventory_movements": db.query(func.count(InventoryMovement.id)).scalar(),
        "users": {
            "total": db.query(func.count(User.id)).scalar(),
            "admins": db.query(func.count(User.id)).filter(User.user_type == UserType.ADMIN.value).scalar(),
            "buyers": db.query(func.count(User.id)).filter(User.user_type == UserType.BUYER.value).scalar(),
            "sellers": db.query(func.count(User.id)).filter(User.user_type == UserType.SELLER.value).scalar(),
        }
    }
    
    return stats
