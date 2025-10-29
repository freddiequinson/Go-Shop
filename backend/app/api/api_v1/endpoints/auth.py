"""
Authentication endpoints for GoShopGhana
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.crud.user import create_user, authenticate_user, get_user_by_email, get_user_by_username
from app.core.security import create_access_token
from app.core.deps import get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.core.email import send_welcome_email
from app.core.sms import send_welcome_sms
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account
    """
    # Check if user already exists
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
    
    # Get user's full name or username for notifications
    user_name = db_user.full_name if hasattr(db_user, 'full_name') and db_user.full_name else db_user.username
    
    # Send welcome email (don't block registration if it fails)
    try:
        send_welcome_email(db_user.email, user_name)
        logger.info(f"Welcome email sent to {db_user.email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email to {db_user.email}: {str(e)}")
    
    # Send welcome SMS if phone number provided (don't block registration if it fails)
    if db_user.phone:
        try:
            send_welcome_sms(db_user.phone, user_name)
            logger.info(f"Welcome SMS sent to {db_user.phone}")
        except Exception as e:
            logger.error(f"Failed to send welcome SMS to {db_user.phone}: {str(e)}")
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(db_user)
    }


@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Login with username/email and password
    Accepts form data (OAuth2 compatible)
    """
    # Authenticate user (username can be email or username)
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.post("/logout")
async def logout():
    """
    Logout user (client-side token removal)
    """
    return {"message": "Successfully logged out. Please remove the token from client storage."}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user profile
    """
    return UserResponse.from_orm(current_user)
