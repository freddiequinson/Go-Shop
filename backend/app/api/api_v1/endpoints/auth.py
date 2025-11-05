"""
Authentication endpoints for GoShopGhana
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
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
    
    # Determine redirect based on user type
    redirect_to = None
    supplier_id = None
    
    if db_user.user_type == "SUPPLIER":
        from app.models.supplier import Supplier
        from sqlalchemy import or_
        # Find supplier by email or phone
        supplier = db.query(Supplier).filter(
            or_(
                Supplier.email == db_user.email,
                Supplier.phone == db_user.phone
            )
        ).first()
        if supplier:
            supplier_id = supplier.id
        redirect_to = "/supplier/dashboard"
    elif db_user.user_type == "ADMIN":
        redirect_to = "/admin"
    elif db_user.user_type == "SELLER":
        redirect_to = "/seller/dashboard"
    elif db_user.user_type == "RIDER":
        redirect_to = "/rider"
    else:  # buyer
        redirect_to = "/shop"
    
    # Create access token with user_type
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    user_type_value = db_user.user_type.value if hasattr(db_user.user_type, 'value') else db_user.user_type
    token_data = {
        "sub": db_user.id,
        "user_type": user_type_value
    }
    if supplier_id:
        token_data["supplier_id"] = supplier_id
    
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(db_user),
        "supplier_id": supplier_id,
        "redirect_to": redirect_to
    }


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Login with username/email and password
    Accepts form data (OAuth2 compatible)
    """
    from app.utils.audit_logger import log_login_success, log_login_failed
    
    # Authenticate user (username can be email or username)
    user = authenticate_user(db, username, password)
    if not user:
        # Log failed login
        log_login_failed(
            db=db,
            email=username,
            reason="Incorrect username/email or password",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful login
    log_login_success(
        db=db,
        user_id=user.id,
        user_email=user.email,
        user_name=user.full_name,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    # Get supplier_id if user is a supplier
    supplier_id = None
    redirect_to = None
    
    if user.user_type == "SUPPLIER":
        from app.models.supplier import Supplier
        supplier = db.query(Supplier).filter(
            or_(
                Supplier.email == user.email,
                Supplier.phone == user.phone
            )
        ).first()
        if supplier:
            supplier_id = supplier.id
        redirect_to = "/supplier/dashboard"
    elif user.user_type == "ADMIN":
        redirect_to = "/admin"
    elif user.user_type == "SELLER":
        redirect_to = "/seller/dashboard"
    elif user.user_type == "RIDER":
        redirect_to = "/rider"
    else:  # buyer
        redirect_to = "/shop"
    
    # Create access token with user_type and supplier_id
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    user_type_value = user.user_type.value if hasattr(user.user_type, 'value') else user.user_type
    token_data = {
        "sub": user.id,
        "user_type": user_type_value
    }
    if supplier_id:
        token_data["supplier_id"] = supplier_id
    
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user),
        "supplier_id": supplier_id,
        "redirect_to": redirect_to
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
