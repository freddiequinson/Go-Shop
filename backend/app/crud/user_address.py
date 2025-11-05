"""
CRUD operations for user addresses
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.user_address import UserAddress
from app.schemas.user_address import UserAddressCreate, UserAddressUpdate


def create_address(db: Session, user_id: str, address: UserAddressCreate) -> UserAddress:
    """Create a new address for a user"""
    
    # If this is set as default, unset all other defaults for this user
    if address.is_default:
        db.query(UserAddress).filter(
            and_(
                UserAddress.user_id == user_id,
                UserAddress.is_default == True
            )
        ).update({"is_default": False})
    
    # If this is the user's first address, make it default
    existing_count = db.query(UserAddress).filter(UserAddress.user_id == user_id).count()
    if existing_count == 0:
        address.is_default = True
    
    db_address = UserAddress(
        user_id=user_id,
        **address.model_dump()
    )
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address


def get_user_addresses(db: Session, user_id: str) -> List[UserAddress]:
    """Get all addresses for a user"""
    return db.query(UserAddress).filter(
        UserAddress.user_id == user_id
    ).order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc()).all()


def get_address_by_id(db: Session, address_id: str, user_id: str) -> Optional[UserAddress]:
    """Get a specific address by ID (must belong to user)"""
    return db.query(UserAddress).filter(
        and_(
            UserAddress.id == address_id,
            UserAddress.user_id == user_id
        )
    ).first()


def get_default_address(db: Session, user_id: str) -> Optional[UserAddress]:
    """Get user's default address"""
    return db.query(UserAddress).filter(
        and_(
            UserAddress.user_id == user_id,
            UserAddress.is_default == True
        )
    ).first()


def update_address(
    db: Session, 
    address_id: str, 
    user_id: str, 
    address_update: UserAddressUpdate
) -> Optional[UserAddress]:
    """Update an address"""
    db_address = get_address_by_id(db, address_id, user_id)
    if not db_address:
        return None
    
    # If setting as default, unset other defaults
    if address_update.is_default:
        db.query(UserAddress).filter(
            and_(
                UserAddress.user_id == user_id,
                UserAddress.id != address_id,
                UserAddress.is_default == True
            )
        ).update({"is_default": False})
    
    # Update fields
    update_data = address_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_address, field, value)
    
    db.commit()
    db.refresh(db_address)
    return db_address


def set_default_address(db: Session, address_id: str, user_id: str) -> Optional[UserAddress]:
    """Set an address as default"""
    db_address = get_address_by_id(db, address_id, user_id)
    if not db_address:
        return None
    
    # Unset all other defaults
    db.query(UserAddress).filter(
        and_(
            UserAddress.user_id == user_id,
            UserAddress.id != address_id
        )
    ).update({"is_default": False})
    
    # Set this one as default
    db_address.is_default = True
    db.commit()
    db.refresh(db_address)
    return db_address


def delete_address(db: Session, address_id: str, user_id: str) -> bool:
    """Delete an address"""
    db_address = get_address_by_id(db, address_id, user_id)
    if not db_address:
        return False
    
    was_default = db_address.is_default
    db.delete(db_address)
    db.commit()
    
    # If we deleted the default, set another as default
    if was_default:
        remaining = get_user_addresses(db, user_id)
        if remaining:
            remaining[0].is_default = True
            db.commit()
    
    return True


def count_user_addresses(db: Session, user_id: str) -> int:
    """Count addresses for a user"""
    return db.query(UserAddress).filter(UserAddress.user_id == user_id).count()
