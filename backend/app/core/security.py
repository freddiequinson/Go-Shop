"""
Security utilities for GoShopGhana
Password hashing, JWT token creation and validation
"""

from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import hashlib

import logging

logger = logging.getLogger(__name__)

# Password hashing context
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Test if bcrypt works
    pwd_context.hash("test")
    BCRYPT_AVAILABLE = True
except Exception as _bcrypt_err:
    pwd_context = None
    BCRYPT_AVAILABLE = False
    logger.critical("bcrypt is not available - password hashing will fail. Fix bcrypt installation immediately.")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    Supports both bcrypt and SHA256 (for OAuth users and admin)
    """
    # Check if it's a SHA256 hash (64 characters, hexadecimal)
    if len(hashed_password) == 64 and all(c in '0123456789abcdef' for c in hashed_password.lower()):
        # SHA256 hash - simple comparison
        computed_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        return computed_hash.lower() == hashed_password.lower()
    
    # Try bcrypt verification
    if BCRYPT_AVAILABLE and pwd_context:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    
    return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Raises RuntimeError if bcrypt is unavailable.
    """
    if BCRYPT_AVAILABLE and pwd_context:
        try:
            return pwd_context.hash(password)
        except Exception as e:
            logger.error(f"bcrypt hashing failed: {type(e).__name__}")
            raise RuntimeError("Password hashing failed. Please contact support.") from e
    raise RuntimeError("Password hashing is unavailable. bcrypt is not installed correctly.")


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode JWT token
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
