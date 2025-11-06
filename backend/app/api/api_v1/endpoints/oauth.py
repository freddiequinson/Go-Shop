"""
OAuth2 authentication endpoints for GoShopGhana
Supports Google, Facebook, and Twitter OAuth
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
from typing import Optional
import uuid
import hashlib

from app.db.database import get_db
from app.schemas.user import Token, UserResponse, UserCreate
from app.crud.user import get_user_by_email, create_user
from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
from app.models.user import User, UserType
from pydantic import BaseModel

router = APIRouter()


class OAuthCallback(BaseModel):
    """OAuth callback data"""
    code: str
    state: Optional[str] = None


async def handle_oauth_user(
    db: Session,
    email: str,
    full_name: str,
    provider: str,
    provider_id: str
) -> User:
    """
    Create or get user from OAuth provider
    """
    # Check if user exists
    user = get_user_by_email(db, email)
    
    if user:
        return user
    
    # Create new user with OAuth data
    username = email.split('@')[0] + '_' + provider + '_' + str(uuid.uuid4())[:8]
    
    # Generate a secure random password using SHA256 hash (always 64 chars, safe for bcrypt)
    random_uuid = str(uuid.uuid4())
    random_password = hashlib.sha256(random_uuid.encode()).hexdigest()
    
    user_data = UserCreate(
        email=email,
        username=username,
        full_name=full_name,
        password=get_password_hash(random_password),  # Random password for OAuth users
        user_type=UserType.BUYER,
        phone=None
    )
    
    new_user = create_user(db, user_data)
    return new_user


# ============= GOOGLE OAUTH =============

@router.get("/google/login")
async def google_login():
    """
    Initiate Google OAuth login
    """
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        "response_type=code&"
        "scope=openid email profile&"
        "access_type=offline"
    )
    return {"auth_url": google_auth_url}


@router.post("/google/callback", response_model=Token)
async def google_callback(callback_data: OAuthCallback, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback
    """
    # Check if Google OAuth is configured
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Please contact the administrator."
        )
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": callback_data.code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code"
            )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )
        
        user_info = user_info_response.json()
    
    user = await handle_oauth_user(
        db=db,
        email=user_info.get("email"),
        full_name=user_info.get("name"),
        provider="google",
        provider_id=user_info.get("id")
    )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


# ============= FACEBOOK OAUTH =============

@router.get("/facebook/login")
async def facebook_login():
    """
    Initiate Facebook OAuth login
    """
    facebook_auth_url = (
        "https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={settings.FACEBOOK_CLIENT_ID}&"
        f"redirect_uri={settings.FACEBOOK_REDIRECT_URI}&"
        "scope=email,public_profile&"
        "response_type=code"
    )
    return {"auth_url": facebook_auth_url}


@router.post("/facebook/callback", response_model=Token)
async def facebook_callback(callback_data: OAuthCallback, db: Session = Depends(get_db)):
    """
    Handle Facebook OAuth callback
    """
    async with httpx.AsyncClient() as client:
        token_response = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": settings.FACEBOOK_CLIENT_ID,
                "client_secret": settings.FACEBOOK_CLIENT_SECRET,
                "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                "code": callback_data.code,
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code"
            )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        user_info_response = await client.get(
            "https://graph.facebook.com/me",
            params={
                "fields": "id,name,email,picture",
                "access_token": access_token
            }
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )
        
        user_info = user_info_response.json()
    
    user = await handle_oauth_user(
        db=db,
        email=user_info.get("email"),
        full_name=user_info.get("name"),
        provider="facebook",
        provider_id=user_info.get("id")
    )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }
