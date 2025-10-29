"""
Order CRUD operations for GoShopGhana
Order management with Ghana market support
"""

from typing import Optional, List, Dict, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderUpdate, OrderCalculations
from app.crud.cart import get_cart_with_details, clear_cart

def create_order_from_cart(db: Session, user_id: str, order_data: OrderCreate) -> Order:
    """Create order from user's cart"""
    # Get cart with all items
    cart_data = get_cart_with_details(db, user_id)
    
    if not cart_data['cart'] or not cart_data['items']:
        raise ValueError("Cart is empty")
    
    # Calculate order totals
    totals = OrderCalculations.calculate_order_totals(
        cart_data['items'], 
        order_data.delivery_address
    )
    
    # Create order
    order = Order(
        user_id=user_id,
        status=OrderStatus.PENDING,
        subtotal_cedis=totals['subtotal_cedis'],
        delivery_fee_cedis=totals['delivery_fee_cedis'],
        tax_cedis=totals['tax_cedis'],
        total_cedis=totals['total_cedis'],
        delivery_address=order_data.delivery_address,
        delivery_notes=order_data.delivery_notes
    )
    
    db.add(order)
    db.flush()  # Get order ID
    
    # Create order items from cart items
    for cart_item in cart_data['items']:
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item['product_id'],
            product_name=cart_item['product_name'],
            product_image_url=cart_item.get('product_images', [None])[0] if cart_item.get('product_images') else None,
            price_per_unit_cedis=cart_item['price_per_unit_cedis'],
            unit_type=cart_item['product_unit_type'],
            quantity=cart_item['quantity'],
            line_total_cedis=cart_item['line_total_cedis']
        )
        db.add(order_item)
    
    # Clear the cart after creating order
    clear_cart(db, user_id)
    
    db.commit()
    db.refresh(order)
    return order

def get_order_by_id(db: Session, order_id: str, user_id: str = None) -> Optional[Order]:
    """Get order by ID, optionally filtered by user"""
    query = db.query(Order).filter(Order.id == order_id)
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    return query.first()

def get_user_orders(db: Session, user_id: str, skip: int = 0, limit: int = 20) -> List[Order]:
    """Get user's orders with pagination"""
    return db.query(Order).filter(
        Order.user_id == user_id
    ).order_by(desc(Order.created_at)).offset(skip).limit(limit).all()

def get_all_orders(db: Session, skip: int = 0, limit: int = 50, status: OrderStatus = None) -> List[Order]:
    """Get all orders (admin only) with optional status filter"""
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status)
    
    return query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()

def update_order_status(db: Session, order_id: str, status: OrderStatus, user_id: str = None) -> Optional[Order]:
    """Update order status"""
    query = db.query(Order).filter(Order.id == order_id)
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    order = query.first()
    if not order:
        return None
    
    order.status = status
    
    # Set delivered_at timestamp if status is delivered
    if status == OrderStatus.DELIVERED:
        from sqlalchemy.sql import func
        order.delivered_at = func.now()
    
    db.commit()
    db.refresh(order)
    return order

def update_order(db: Session, order_id: str, order_update: OrderUpdate, user_id: str = None) -> Optional[Order]:
    """Update order details"""
    query = db.query(Order).filter(Order.id == order_id)
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    order = query.first()
    if not order:
        return None
    
    # Update fields if provided
    if order_update.status is not None:
        order.status = order_update.status
        
        # Set delivered_at timestamp if status is delivered
        if order_update.status == OrderStatus.DELIVERED:
            from sqlalchemy.sql import func
            order.delivered_at = func.now()
    
    if order_update.delivery_address is not None:
        order.delivery_address = order_update.delivery_address
    
    if order_update.delivery_notes is not None:
        order.delivery_notes = order_update.delivery_notes
    
    db.commit()
    db.refresh(order)
    return order

def get_order_items(db: Session, order_id: str) -> List[OrderItem]:
    """Get all items for an order"""
    return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

def get_order_with_items(db: Session, order_id: str, user_id: str = None) -> Dict[str, Any]:
    """Get order with all items and details"""
    order = get_order_by_id(db, order_id, user_id)
    
    if not order:
        return {'order': None, 'items': []}
    
    # Get order items
    items = get_order_items(db, order_id)
    
    # Convert to dict format for response
    items_data = []
    for item in items:
        item_data = {
            'id': item.id,
            'order_id': item.order_id,
            'product_id': item.product_id,
            'product_name': item.product_name,
            'product_image_url': item.product_image_url,
            'price_per_unit_cedis': item.price_per_unit_cedis,
            'unit_type': item.unit_type,
            'quantity': item.quantity,
            'line_total_cedis': item.line_total_cedis,
            'price_per_unit': float(item.price_per_unit_cedis) / 100,
            'line_total': float(item.line_total_cedis) / 100
        }
        items_data.append(item_data)
    
    return {
        'order': order,
        'items': items_data
    }

def get_order_statistics(db: Session, user_id: str = None) -> Dict[str, Any]:
    """Get order statistics"""
    query = db.query(Order)
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    all_orders = query.all()
    
    total_orders = len(all_orders)
    pending_orders = len([o for o in all_orders if o.status == OrderStatus.PENDING])
    completed_orders = len([o for o in all_orders if o.status == OrderStatus.DELIVERED])
    
    # Calculate total revenue (in GHS)
    total_revenue_cedis = sum(order.total_cedis for order in all_orders if order.status == OrderStatus.DELIVERED)
    total_revenue = float(total_revenue_cedis) / 100
    
    return {
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'total_revenue': total_revenue,
        'currency': 'GHS'
    }

def cancel_order(db: Session, order_id: str, user_id: str = None) -> Optional[Order]:
    """Cancel an order (only if pending or confirmed)"""
    order = get_order_by_id(db, order_id, user_id)
    
    if not order:
        return None
    
    # Only allow cancellation of pending or confirmed orders
    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise ValueError(f"Cannot cancel order with status: {order.status}")
    
    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order
