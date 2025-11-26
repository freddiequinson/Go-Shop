"""
SMS utility functions for sending SMS via Hubtel (Ghana SMS Gateway)
"""

import requests
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_sms(phone_number: str, message: str) -> bool:
    """
    Send SMS using Hubtel SMS Gateway (Quick Send - GET method)
    
    Args:
        phone_number: Recipient phone number (Ghana format: 0241234567 or 233241234567)
        message: SMS message content
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    try:
        # Check if SMS is configured
        if not settings.HUBTEL_CLIENT_ID or not settings.HUBTEL_CLIENT_SECRET:
            logger.warning("Hubtel SMS not configured. Skipping SMS send.")
            return False
        
        # Format phone number for Ghana (ensure it starts with 233)
        formatted_phone = format_ghana_phone(phone_number)
        if not formatted_phone:
            logger.error(f"Invalid phone number format: {phone_number}")
            return False
        
        # Use approved sender ID or client ID as fallback
        sender_id = settings.HUBTEL_SENDER_ID if settings.HUBTEL_SENDER_ID else "Quinson"
        
        # Hubtel Quick Send API endpoint (GET method - no auth header needed)
        # Parameters are passed in URL
        params = {
            "clientid": settings.HUBTEL_CLIENT_ID,
            "clientsecret": settings.HUBTEL_CLIENT_SECRET,
            "from": sender_id,
            "to": formatted_phone,
            "content": message
        }
        
        url = f"{settings.HUBTEL_BASE_URL}/v1/messages/send"
        
        # Send SMS using GET request
        logger.info(f"Attempting to send SMS to {formatted_phone} via Hubtel")
        logger.info(f"Using Sender ID: {sender_id}")
        response = requests.get(url, params=params, timeout=10)
        
        # Check for success (200 or 201)
        if response.status_code in [200, 201]:
            response_data = response.json()
            # Check if status is 0 (success) in the response
            if response_data.get('status') == 0:
                logger.info(f"SMS sent successfully to {formatted_phone}. Response: {response_data}")
                return True
            else:
                logger.error(f"SMS failed. Status: {response_data.get('status')}, Description: {response_data.get('statusDescription')}")
                return False
        else:
            logger.error(f"Failed to send SMS. HTTP Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone_number}: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def format_ghana_phone(phone_number: str) -> Optional[str]:
    """
    Format phone number to Ghana international format (233XXXXXXXXX)
    
    Args:
        phone_number: Phone number in various formats
    
    Returns:
        str: Formatted phone number or None if invalid
    """
    if not phone_number:
        return None
    
    # Remove spaces, dashes, and parentheses
    cleaned = phone_number.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # Remove leading + if present
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
    
    # If starts with 0, replace with 233
    if cleaned.startswith("0"):
        cleaned = "233" + cleaned[1:]
    
    # If doesn't start with 233, add it
    if not cleaned.startswith("233"):
        cleaned = "233" + cleaned
    
    # Validate length (233 + 9 digits = 12 digits)
    if len(cleaned) != 12:
        return None
    
    # Validate it's all digits
    if not cleaned.isdigit():
        return None
    
    return cleaned


def send_welcome_sms(phone_number: str, user_name: str) -> bool:
    """
    Send welcome SMS to new user
    
    Args:
        phone_number: User's phone number
        user_name: User's name
    
    Returns:
        bool: True if SMS sent successfully
    """
    message = (
        f"Welcome to GoShop Ghana, {user_name}! "
        f"Thank you for signing up. Get quality products at affordable prices.\n\n"
        f"FREE delivery on your first 2 orders!\n\n"
        f"Shop now: www.goshopghana.com\n\n"
        f"Need help? Call 0206221924"
    )
    
    return send_sms(phone_number, message)


def send_phone_verification_sms(phone_number: str, user_name: str) -> bool:
    """
    Send SMS when user adds/verifies phone number
    
    Args:
        phone_number: User's phone number
        user_name: User's name
    
    Returns:
        bool: True if SMS sent successfully
    """
    message = (
        f"Hi {user_name}! 👋\n\n"
        f"Your phone number has been added to your GoShop Ghana account.\n\n"
        f"Enjoy FREE delivery on your first 2 orders!\n\n"
        f"Start shopping: www.goshopghana.com\n\n"
        f"Questions? Call 0206221924"
    )
    
    return send_sms(phone_number, message)
