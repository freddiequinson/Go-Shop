"""
Community signup endpoint for GoShopGhana
Handles newsletter/community signups from the landing page
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.core.email import send_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

COMPANY_EMAIL = "gsgshopease@gmail.com"


class CommunitySignupRequest(BaseModel):
    name: str = ""
    email: EmailStr
    phone: str = ""


class CommunitySignupResponse(BaseModel):
    success: bool
    message: str


@router.post("/signup", response_model=CommunitySignupResponse)
async def community_signup(request: CommunitySignupRequest):
    """
    Handle community signup from landing page.
    Sends notification email to company email.
    """
    try:
        # Build email content
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f2e6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
                <h1 style="color: #303A4D; margin-bottom: 20px;">🎉 New Community Signup!</h1>
                
                <p style="color: #303A4D; font-size: 16px;">
                    Someone has joined the GoShop community and wants to be notified about updates and the mobile app launch!
                </p>
                
                <div style="background-color: #FED141; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #303A4D; margin: 0 0 15px 0;">Contact Details:</h3>
                    <p style="color: #303A4D; margin: 5px 0;"><strong>Name:</strong> {request.name or 'Not provided'}</p>
                    <p style="color: #303A4D; margin: 5px 0;"><strong>Email:</strong> {request.email}</p>
                    <p style="color: #303A4D; margin: 5px 0;"><strong>Phone:</strong> {request.phone or 'Not provided'}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    This person should be added to the mailing list for:
                </p>
                <ul style="color: #666; font-size: 14px;">
                    <li>Product updates and new features</li>
                    <li>Mobile app launch notification (iOS & Android)</li>
                    <li>Special offers and promotions</li>
                </ul>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    GoShop Ghana - Fresh Foodstuff from the Market
                </p>
            </div>
        </body>
        </html>
        """
        
        # Send email to company
        email_sent = send_email(
            email_to=COMPANY_EMAIL,
            subject=f"🎉 New Community Signup: {request.email}",
            html_content=html_content
        )
        
        if email_sent:
            logger.info(f"Community signup notification sent for {request.email}")
        else:
            logger.warning(f"Failed to send community signup notification for {request.email}")
        
        # Always return success to user (don't expose email failures)
        return CommunitySignupResponse(
            success=True,
            message="Thank you for joining our community! You'll be notified of updates and when our mobile app is available."
        )
        
    except Exception as e:
        logger.error(f"Community signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process signup. Please try again."
        )
