"""
Dependencies for GoShopGhana API
Authentication and database dependencies
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_token
from app.crud.user import get_user_by_id
from app.models.user import User

# HTTP Bearer token scheme
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    
    # Get user ID from token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (alias for get_current_user)
    """
    return current_user

async def get_current_seller(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify they are a seller
    """
    user_type = current_user.user_type.value if hasattr(current_user.user_type, 'value') else current_user.user_type
    if user_type not in ["SELLER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Seller access required."
        )
    return current_user

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify they are an admin
    """
    user_type = current_user.user_type.value if hasattr(current_user.user_type, 'value') else current_user.user_type
    if user_type != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user

async def get_current_rider(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user and verify they are a rider, return Rider model
    """
    from app.models.rider import Rider
    
    user_type = current_user.user_type.value if hasattr(current_user.user_type, 'value') else current_user.user_type
    user_type_upper = str(user_type).upper()
    
    if user_type_upper != "RIDER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Rider access required. Current user type: {user_type}"
        )
    
    # Get rider profile
    rider = db.query(Rider).filter(Rider.user_id == current_user.id).first()
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rider profile not found for user {current_user.email}"
        )
    
    return rider
