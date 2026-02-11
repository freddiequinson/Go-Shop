"""
Cart CRUD operations for GoShopGhana
Shopping cart management with Ghana market support
"""

from typing import Optional, List
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate, AddToCartRequest

def get_or_create_cart(db: Session, user_id: str) -> Cart:
    """Get user's cart or create one if it doesn't exist"""
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    return cart

def get_cart_by_user_id(db: Session, user_id: str) -> Optional[Cart]:
    """Get user's cart"""
    return db.query(Cart).filter(Cart.user_id == user_id).first()

def get_cart_items(db: Session, cart_id: str) -> List[CartItem]:
    """Get all items in a cart"""
    return db.query(CartItem).filter(CartItem.cart_id == cart_id).all()

def get_cart_item(db: Session, cart_id: str, product_id: str) -> Optional[CartItem]:
    """Get specific cart item"""
    return db.query(CartItem).filter(
        and_(CartItem.cart_id == cart_id, CartItem.product_id == product_id)
    ).first()

def add_to_cart(db: Session, user_id: str, request: AddToCartRequest) -> CartItem:
    """Add item to cart or update quantity if already exists"""
    # Get or create cart
    cart = get_or_create_cart(db, user_id)
    
    # Get product details
    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise ValueError("Product not found")
    
    if not product.is_active:
        raise ValueError("Product is not available")
    
    # Validate minimum quantity
    if request.quantity < product.minimum_quantity:
        raise ValueError(f"Minimum quantity is {product.minimum_quantity} {product.unit_type.value}")
    
    # Check if item already exists in cart
    existing_item = get_cart_item(db, cart.id, request.product_id)
    
    if existing_item:
        # Update existing item quantity and price (in case price changed or was wrong)
        # Use price_per_quantity if available (for piece/pack pricing), otherwise use price_per_unit
        if product.price_per_quantity:
            # Use piece/pack price if available
            price_cents = product.price_per_quantity * 100  # Convert to cents
        else:
            # Fall back to weight-based price
            price_cents = product.price_per_unit * 100  # Convert to cents
        
        existing_item.price_per_unit_cedis = price_cents
        existing_item.quantity += request.quantity
        existing_item.calculate_line_total()
        db.commit()
        db.refresh(existing_item)
        return existing_item
    else:
        # Create new cart item
        # Use price_per_quantity if available (for piece/pack pricing), otherwise use price_per_unit
        if product.price_per_quantity:
            # Use piece/pack price if available
            price_cents = product.price_per_quantity * 100  # Convert to cents
        else:
            # Fall back to weight-based price
            price_cents = product.price_per_unit * 100  # Convert to cents
        
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=request.product_id,
            quantity=request.quantity,
            price_per_unit_cedis=price_cents
        )
        cart_item.calculate_line_total()
        
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
        return cart_item

def update_cart_item(db: Session, user_id: str, product_id: str, quantity: Decimal) -> Optional[CartItem]:
    """Update cart item quantity"""
    cart = get_cart_by_user_id(db, user_id)
    if not cart:
        return None
    
    cart_item = get_cart_item(db, cart.id, product_id)
    if not cart_item:
        return None
    
    # Get product to validate minimum quantity
    product = db.query(Product).filter(Product.id == product_id).first()
    if product and quantity < product.minimum_quantity:
        raise ValueError(f"Minimum quantity is {product.minimum_quantity} {product.unit_type.value}")
    
    cart_item.quantity = quantity
    cart_item.calculate_line_total()
    
    db.commit()
    db.refresh(cart_item)
    return cart_item

def remove_from_cart(db: Session, user_id: str, product_id: str) -> bool:
    """Remove item from cart"""
    cart = get_cart_by_user_id(db, user_id)
    if not cart:
        return False
    
    cart_item = get_cart_item(db, cart.id, product_id)
    if not cart_item:
        return False
    
    db.delete(cart_item)
    db.commit()
    return True

def clear_cart(db: Session, user_id: str) -> bool:
    """Clear all items from cart"""
    cart = get_cart_by_user_id(db, user_id)
    if not cart:
        return False
    
    # Delete all cart items
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    return True

def get_cart_with_details(db: Session, user_id: str) -> dict:
    """Get cart with full product/package details and calculations"""
    from app.models.package import Package
    
    cart = get_cart_by_user_id(db, user_id)
    if not cart:
        return {
            'cart': None,
            'items': [],
            'total_items': 0,
            'total_amount_cents': 0,
            'total_amount': 0.0
        }
    
    # Get all cart items
    cart_items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    
    # Build response with product/package details
    items = []
    total_cents = Decimal('0')
    
    for cart_item in cart_items:
        # Check if it's a package or product
        item_type = getattr(cart_item, 'item_type', 'product') or 'product'
        
        if item_type == 'package' and cart_item.package_id:
            # It's a package
            package = db.query(Package).filter(Package.id == cart_item.package_id).first()
            if package:
                item_data = {
                    'id': cart_item.id,
                    'cart_id': cart_item.cart_id,
                    'product_id': None,
                    'package_id': cart_item.package_id,
                    'item_type': 'package',
                    'quantity': cart_item.quantity,
                    'price_per_unit_cedis': cart_item.price_per_unit_cedis,
                    'line_total_cedis': cart_item.line_total_cedis,
                    'price_per_unit': float(cart_item.price_per_unit_cedis) / 100,
                    'line_total': float(cart_item.line_total_cedis) / 100,
                    'subtotal': float(cart_item.line_total_cedis) / 100,
                    'created_at': cart_item.created_at,
                    'updated_at': cart_item.updated_at,
                    # Nested product object (for frontend compatibility)
                    'product': {
                        'id': cart_item.package_id,
                        'name': cart_item.item_name or package.name,
                        'price_per_unit_cedis': cart_item.price_per_unit_cedis,
                        'unit_type': 'package',
                        'image_url': package.image_url,
                        'primary_image_url': package.image_url
                    },
                    # Flat details
                    'product_name': cart_item.item_name or package.name,
                    'product_unit_type': 'package',
                    'product_minimum_quantity': 1,
                    'product_images': [package.image_url] if package.image_url else []
                }
                items.append(item_data)
                total_cents += cart_item.line_total_cedis
        elif cart_item.product_id:
            # It's a product
            product = db.query(Product).filter(Product.id == cart_item.product_id).first()
            if product:
                primary_image = product.images[0] if product.images else None
                
                item_data = {
                    'id': cart_item.id,
                    'cart_id': cart_item.cart_id,
                    'product_id': cart_item.product_id,
                    'package_id': None,
                    'item_type': 'product',
                    'quantity': cart_item.quantity,
                    'price_per_unit_cedis': cart_item.price_per_unit_cedis,
                    'line_total_cedis': cart_item.line_total_cedis,
                    'price_per_unit': cart_item.price_per_unit,
                    'line_total': cart_item.line_total,
                    'subtotal': cart_item.line_total,
                    'created_at': cart_item.created_at,
                    'updated_at': cart_item.updated_at,
                    # Nested product object (for frontend)
                    'product': {
                        'id': product.id,
                        'name': product.name,
                        'price_per_unit_cedis': cart_item.price_per_unit_cedis,
                        'unit_type': product.unit_type.value,
                        'image_url': primary_image,
                        'primary_image_url': primary_image
                    },
                    # Flat product details (for backward compatibility)
                    'product_name': product.name,
                    'product_unit_type': product.unit_type.value,
                    'product_minimum_quantity': product.minimum_quantity,
                    'product_images': product.images or []
                }
                items.append(item_data)
                total_cents += cart_item.line_total_cedis
    
    return {
        'cart': cart,
        'items': items,
        'total_items': len(items),
        'total_amount_cents': total_cents,
        'total_amount': float(total_cents) / 100
    }

def get_cart_summary(db: Session, user_id: str) -> dict:
    """Get quick cart summary"""
    cart_data = get_cart_with_details(db, user_id)
    return {
        'total_items': cart_data['total_items'],
        'total_amount': cart_data['total_amount'],
        'currency': 'GHS'
    }
