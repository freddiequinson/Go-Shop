"""
Test endpoints for email and SMS functionality
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import logging

from app.core.email import send_welcome_email
from app.core.sms import send_welcome_sms
from app.core.deps import get_current_admin
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class EmailTestRequest(BaseModel):
    email: EmailStr
    name: str


class SMSTestRequest(BaseModel):
    phone: str
    name: str


@router.post("/send-email")
async def test_send_email(request: EmailTestRequest, current_admin: User = Depends(get_current_admin)):
    """
    Test endpoint to send welcome email
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        logger.info(f"Test email request from admin")
        success = send_welcome_email(request.email, request.name)
        if success:
            return {"success": True, "message": "Test email sent successfully"}
        raise HTTPException(status_code=500, detail="Failed to send email.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Test email error: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Failed to send email.")


@router.post("/send-sms")
async def test_send_sms(request: SMSTestRequest, current_admin: User = Depends(get_current_admin)):
    """
    Test endpoint to send welcome SMS
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        logger.info(f"Test SMS request from admin")
        success = send_welcome_sms(request.phone, request.name)
        if success:
            return {"success": True, "message": "Test SMS sent successfully"}
        raise HTTPException(status_code=500, detail="Failed to send SMS.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Test SMS error: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Failed to send SMS.")
