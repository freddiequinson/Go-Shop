"""
User CRUD operations for GoShopGhana
"""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()

def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    """Get user by phone number"""
    return db.query(User).filter(User.phone == phone).first()

def get_user_by_email_or_username(db: Session, identifier: str) -> Optional[User]:
    """Get user by email or username (for login)"""
    return db.query(User).filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user"""
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create user object
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        password_hash=hashed_password,
        user_type=user.user_type,
        location=user.location,
        latitude=user.latitude,
        longitude=user.longitude,
        bio=user.bio,
        phone=user.phone_number,
        profile_picture_url=user.profile_picture_url,
        referral_source=user.referral_source
    )
    
    # Add to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    """Authenticate user by email/username and password"""
    user = get_user_by_email_or_username(db, identifier)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def update_user(db: Session, user_id: str, user_update: UserUpdate) -> Optional[User]:
    """Update user information"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        # Convert empty strings to None for unique fields to avoid constraint violations
        if field in ['phone', 'email'] and value == '':
            value = None
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    """Get all users (admin only)"""
    return db.query(User).offset(skip).limit(limit).all()

def delete_user(db: Session, user_id: str) -> bool:
    """Delete user permanently (admin only)"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False
    
    try:
        # Delete related records first to avoid foreign key constraint violations
        
        # Delete user's cart items (through cart relationship)
        db.execute(text("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = :user_id)"), {"user_id": user_id})
        
        # Delete user's cart
        db.execute(text("DELETE FROM carts WHERE user_id = :user_id"), {"user_id": user_id})
        
        # Delete transactions before deleting wallet (transactions reference wallet)
        db.execute(text("DELETE FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = :user_id)"), {"user_id": user_id})
        
        # Delete user's wallet if exists
        db.execute(text("DELETE FROM wallets WHERE user_id = :user_id"), {"user_id": user_id})
        
        # Delete user's orders if exists
        db.execute(text("DELETE FROM orders WHERE user_id = :user_id"), {"user_id": user_id})
        
        # Delete user's reviews (uses reviewer_id, not user_id)
        db.execute(text("DELETE FROM reviews WHERE reviewer_id = :user_id"), {"user_id": user_id})
        
        # Delete reviews where user is the seller
        db.execute(text("DELETE FROM reviews WHERE seller_id = :user_id"), {"user_id": user_id})
        
        # Delete payment sessions
        db.execute(text("DELETE FROM payment_sessions WHERE user_id = :user_id"), {"user_id": user_id})
        
        # Now delete the user
        db.delete(db_user)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e

def deactivate_user(db: Session, user_id: str) -> Optional[User]:
    """Deactivate user account"""
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    return db_user
