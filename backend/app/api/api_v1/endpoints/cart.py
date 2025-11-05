"""
Shopping cart endpoints for GoShopGhana
Ghana market focused cart management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.cart import (
    CartResponse, CartItemResponse, CartSummary, 
    AddToCartRequest, UpdateCartItemRequest
)
from app.crud.cart import (
    get_cart_with_details, add_to_cart, update_cart_item, 
    remove_from_cart, clear_cart, get_cart_summary
)
from app.core.deps import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=CartResponse)
async def get_my_cart(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's shopping cart with all items and details
    """
    cart_data = get_cart_with_details(db, current_user.id)
    
    if not cart_data['cart']:
        # Return empty cart structure with current datetime
        from datetime import datetime
        now = datetime.utcnow()
        return CartResponse(
            id="",
            user_id=current_user.id,
            items=[],
            created_at=now,
            updated_at=now,
            total_items=0,
            total_amount_cents=0,
            total_amount=0.0
        )
    
    # Build cart response
    cart_response = CartResponse(
        id=cart_data['cart'].id,
        user_id=cart_data['cart'].user_id,
        created_at=cart_data['cart'].created_at,
        updated_at=cart_data['cart'].updated_at,
        items=[CartItemResponse(**item) for item in cart_data['items']],
        total_items=cart_data['total_items'],
        total_amount_cents=cart_data['total_amount_cents'],
        total_amount=cart_data['total_amount']
    )
    
    return cart_response


@router.get("/summary", response_model=CartSummary)
async def get_cart_summary_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get quick cart summary (total items and amount)
    """
    summary = get_cart_summary(db, current_user.id)
    return CartSummary(**summary)


@router.post("/items", response_model=CartItemResponse)
async def add_item_to_cart(
    request: AddToCartRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add item to cart or update quantity if already exists
    Supports Ghana market quantified sales
    """
    try:
        cart_item = add_to_cart(db, current_user.id, request)
        
        # Get updated cart details to return full item info
        cart_data = get_cart_with_details(db, current_user.id)
        
        # Find the added/updated item in the response
        for item in cart_data['items']:
            if item['product_id'] == request.product_id:
                return CartItemResponse(**item)
        
        # Fallback if not found in detailed response
        return CartItemResponse(
            id=cart_item.id,
            cart_id=cart_item.cart_id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            price_per_unit_cents=cart_item.price_per_unit_cents,
            line_total_cents=cart_item.line_total_cents,
            created_at=cart_item.created_at,
            updated_at=cart_item.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add item to cart"
        )


@router.put("/items/{product_id}", response_model=CartItemResponse)
async def update_cart_item_endpoint(
    product_id: str,
    request: UpdateCartItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update quantity of item in cart
    """
    try:
        cart_item = update_cart_item(db, current_user.id, product_id, request.quantity)
        
        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found"
            )
        
        # Get updated cart details
        cart_data = get_cart_with_details(db, current_user.id)
        
        # Find the updated item
        for item in cart_data['items']:
            if item['product_id'] == product_id:
                return CartItemResponse(**item)
        
        # Fallback
        return CartItemResponse(
            id=cart_item.id,
            cart_id=cart_item.cart_id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            price_per_unit_cents=cart_item.price_per_unit_cents,
            line_total_cents=cart_item.line_total_cents,
            created_at=cart_item.created_at,
            updated_at=cart_item.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/items/{product_id}")
async def remove_item_from_cart(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove item from cart
    """
    success = remove_from_cart(db, current_user.id, product_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    return {"message": "Item removed from cart successfully"}


@router.delete("/")
async def clear_cart_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Clear all items from cart
    """
    success = clear_cart(db, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    
    return {"message": "Cart cleared successfully"}
