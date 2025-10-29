"""
User management endpoints for GoShopGhana
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserResponse, UserUpdate, UserCreate
from app.crud.user import update_user, deactivate_user, get_all_users, delete_user, create_user
from app.core.deps import get_current_active_user, get_current_admin
from app.models.user import User

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current user profile
    """
    return UserResponse.from_orm(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile
    """
    try:
        updated_user = update_user(db, current_user.id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return UserResponse.from_orm(updated_user)
    except Exception as e:
        # Log the error
        print(f"Error updating user profile: {str(e)}")
        
        # Return user-friendly error message
        error_msg = str(e)
        if "duplicate key" in error_msg.lower():
            if "phone" in error_msg.lower():
                detail = "This phone number is already in use by another account"
            elif "email" in error_msg.lower():
                detail = "This email is already in use by another account"
            else:
                detail = "A unique constraint was violated. Please check your input."
        else:
            detail = "Failed to update profile. Please try again."
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


@router.delete("/profile")
async def deactivate_user_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate current user account
    """
    deactivated_user = deactivate_user(db, current_user.id)
    if not deactivated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "Account deactivated successfully"}


# Admin endpoints
@router.get("/", response_model=List[UserResponse])
async def list_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get all users (Admin only)
    """
    users = get_all_users(db, skip=skip, limit=limit)
    return [UserResponse.from_orm(user) for user in users]


@router.post("/", response_model=UserResponse)
async def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Create a new user (Admin only)
    """
    # Check if user already exists
    from app.crud.user import get_user_by_email, get_user_by_username
    
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    db_user = create_user(db, user)
    return UserResponse.from_orm(db_user)


@router.delete("/{user_id}")
async def delete_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Delete a user permanently (Admin only)
    Deletes user and all related records (wallet, orders, cart, reviews)
    """
    # Prevent admin from deleting themselves
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    try:
        # Get user info before deletion for audit log
        from app.crud.user import get_user_by_id
        user_to_delete = get_user_by_id(db, user_id)
        if not user_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        deleted_email = user_to_delete.email
        deleted_name = user_to_delete.full_name if hasattr(user_to_delete, 'full_name') else user_to_delete.username
        
        # Delete the user
        success = delete_user(db, user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Log audit event
        from app.core.audit import log_user_delete
        log_user_delete(db, current_admin, user_id, deleted_email)
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        # Log the error
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
