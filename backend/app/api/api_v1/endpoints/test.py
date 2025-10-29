"""
Test endpoints for email and SMS functionality
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging

from app.core.email import send_welcome_email
from app.core.sms import send_welcome_sms

logger = logging.getLogger(__name__)
router = APIRouter()


class EmailTestRequest(BaseModel):
    email: EmailStr
    name: str


class SMSTestRequest(BaseModel):
    phone: str
    name: str


@router.post("/send-email")
async def test_send_email(request: EmailTestRequest):
    """
    Test endpoint to send welcome email
    """
    try:
        logger.info(f"Test email request for {request.email}")
        success = send_welcome_email(request.email, request.name)
        
        if success:
            return {
                "success": True,
                "message": f"Welcome email sent successfully to {request.email}",
                "email": request.email,
                "name": request.name
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email. Check backend logs for details."
            )
    except Exception as e:
        logger.error(f"Test email error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error sending email: {str(e)}"
        )


@router.post("/send-sms")
async def test_send_sms(request: SMSTestRequest):
    """
    Test endpoint to send welcome SMS
    """
    try:
        logger.info(f"Test SMS request for {request.phone}")
        success = send_welcome_sms(request.phone, request.name)
        
        if success:
            return {
                "success": True,
                "message": f"Welcome SMS sent successfully to {request.phone}",
                "phone": request.phone,
                "name": request.name
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send SMS. Check backend logs for details."
            )
    except Exception as e:
        logger.error(f"Test SMS error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error sending SMS: {str(e)}"
        )
