"""
Email utility functions for sending emails
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
from pathlib import Path
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    email_to: str,
    subject: str,
    html_content: str,
    email_from: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP
    
    Args:
        email_to: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        email_from: Sender email (defaults to settings.EMAILS_FROM_EMAIL)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Check if email is configured
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("Email not configured. Skipping email send.")
            return False
        
        # Set sender email
        if not email_from:
            email_from = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{email_from}>"
        message["To"] = email_to
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        logger.info(f"Attempting to send email to {email_to} via {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            logger.info(f"TLS started, attempting login as {settings.SMTP_USER}")
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            logger.info("Login successful, sending message...")
            server.send_message(message)
        
        logger.info(f"Email sent successfully to {email_to}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def send_welcome_email(email_to: str, user_name: str, custom_body: Optional[str] = None) -> bool:
    """
    Send welcome email to new user
    
    Args:
        email_to: User's email address
        user_name: User's name
        custom_body: Optional custom HTML body (for supplier credentials, etc.)
    
    Returns:
        bool: True if email sent successfully
    """
    subject = "Welcome to GoShop Ghana! 🎉"
    
    # If custom body provided, use it directly
    if custom_body:
        return send_email(email_to, subject, custom_body)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #303A4D;
                margin: 0;
                padding: 0;
                background-color: #F4F2E6;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background-color: #FED141;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                color: #303A4D;
                font-size: 32px;
                font-weight: bold;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .content h2 {{
                color: #303A4D;
                font-size: 24px;
                margin-top: 0;
            }}
            .content p {{
                color: #303A4D;
                font-size: 16px;
                margin: 15px 0;
            }}
            .highlight-box {{
                background-color: #FED141;
                border-radius: 15px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }}
            .highlight-box h3 {{
                margin: 0 0 10px 0;
                color: #303A4D;
                font-size: 20px;
            }}
            .highlight-box p {{
                margin: 5px 0;
                color: #303A4D;
                font-size: 16px;
            }}
            .benefits {{
                background-color: #F4F2E6;
                border-radius: 15px;
                padding: 20px;
                margin: 25px 0;
            }}
            .benefits ul {{
                list-style: none;
                padding: 0;
                margin: 0;
            }}
            .benefits li {{
                padding: 10px 0;
                color: #303A4D;
                font-size: 16px;
            }}
            .benefits li:before {{
                content: "✓ ";
                color: #4698CA;
                font-weight: bold;
                font-size: 20px;
                margin-right: 10px;
            }}
            .contact-box {{
                background-color: #4698CA;
                color: white;
                border-radius: 15px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }}
            .contact-box h3 {{
                margin: 0 0 15px 0;
                color: white;
            }}
            .contact-box p {{
                margin: 5px 0;
                color: white;
                font-size: 18px;
                font-weight: bold;
            }}
            .footer {{
                background-color: #303A4D;
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .footer p {{
                margin: 5px 0;
                color: white;
                font-size: 14px;
            }}
            .button {{
                display: inline-block;
                background-color: #303A4D;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛒 GoShop Ghana</h1>
            </div>
            
            <div class="content">
                <h2>Welcome, {user_name}! 🎉</h2>
                
                <p>Thank you for signing up with GoShop Ghana! We're thrilled to have you join our community of smart shoppers.</p>
                
                <p>We hope you have a great time shopping with us. At GoShop Ghana, we bring you <strong>quality products at affordable prices</strong>, delivered right to your doorstep.</p>
                
                <div class="highlight-box">
                    <h3>🎁 Special Welcome Offer!</h3>
                    <p><strong>FREE DELIVERY</strong> on your first TWO orders!</p>
                    <p>Start shopping now and enjoy this exclusive benefit.</p>
                </div>
                
                <div class="benefits">
                    <h3 style="color: #303A4D; margin-top: 0;">Why Choose GoShop Ghana?</h3>
                    <ul>
                        <li>Quality products from trusted local vendors</li>
                        <li>Affordable prices that fit your budget</li>
                        <li>Fast and reliable delivery across Ghana</li>
                        <li>Fresh groceries from the market to your home</li>
                        <li>Support local farmers and businesses</li>
                    </ul>
                </div>
                
                <div class="contact-box">
                    <h3>📱 Mobile App Coming Soon!</h3>
                    <p>Stay tuned for our mobile app launch</p>
                    <p style="font-size: 14px; font-weight: normal; margin-top: 15px;">Download it for an even better shopping experience!</p>
                </div>
                
                <div class="contact-box" style="background-color: #93C90F;">
                    <h3>💬 We'd Love Your Feedback!</h3>
                    <p>Call us: 0206221924</p>
                    <p style="font-size: 14px; font-weight: normal; margin-top: 10px;">Your feedback helps us serve you better</p>
                </div>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="http://localhost:3000/shop" class="button">Start Shopping Now</a>
                </p>
                
                <p style="margin-top: 30px; color: #303A4D;">Happy shopping!</p>
                <p style="font-weight: bold; color: #303A4D;">The GoShop Ghana Team</p>
            </div>
            
            <div class="footer">
                <p><strong>GoShop Ghana</strong></p>
                <p>Fresh Groceries from the Market to Your Home</p>
                <p style="margin-top: 15px;">Accra, Ghana</p>
                <p>📞 0241293754 | 📧 info@go-shop.gh</p>
                <p style="margin-top: 15px; font-size: 12px;">© 2025 GoShop Ghana. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(email_to, subject, html_content)


def send_password_reset_email(email_to: str, user_name: str, reset_code: str) -> bool:
    """
    Send password reset email with 6-digit code
    
    Args:
        email_to: User's email address
        user_name: User's name
        reset_code: 6-digit reset code
    
    Returns:
        bool: True if email sent successfully
    """
    subject = "Reset Your GoShop Ghana Password"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #303A4D;
                margin: 0;
                padding: 0;
                background-color: #F4F2E6;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background-color: #FED141;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                color: #303A4D;
                font-size: 32px;
                font-weight: bold;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .content h2 {{
                color: #303A4D;
                font-size: 24px;
                margin-top: 0;
            }}
            .content p {{
                color: #303A4D;
                font-size: 16px;
                margin: 15px 0;
            }}
            .code-box {{
                background-color: #FED141;
                border-radius: 15px;
                padding: 30px;
                margin: 30px 0;
                text-align: center;
            }}
            .code {{
                font-size: 48px;
                font-weight: bold;
                color: #303A4D;
                letter-spacing: 8px;
                margin: 10px 0;
                font-family: 'Courier New', monospace;
            }}
            .warning-box {{
                background-color: #FFF3CD;
                border-left: 4px solid #FFC107;
                border-radius: 10px;
                padding: 20px;
                margin: 25px 0;
            }}
            .warning-box p {{
                margin: 5px 0;
                color: #856404;
                font-size: 14px;
            }}
            .footer {{
                background-color: #303A4D;
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .footer p {{
                margin: 5px 0;
                color: white;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset</h1>
            </div>
            
            <div class="content">
                <h2>Hello, {user_name}!</h2>
                
                <p>We received a request to reset your GoShop Ghana password. Use the code below to reset your password:</p>
                
                <div class="code-box">
                    <p style="margin: 0; font-size: 16px; color: #303A4D;">Your Reset Code</p>
                    <div class="code">{reset_code}</div>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #303A4D;">This code expires in 15 minutes</p>
                </div>
                
                <p><strong>How to reset your password:</strong></p>
                <ol style="color: #303A4D; font-size: 16px;">
                    <li>Enter this code on the password reset page</li>
                    <li>Create a new strong password</li>
                    <li>Log in with your new password</li>
                </ol>
                
                <div class="warning-box">
                    <p><strong>⚠️ Security Notice:</strong></p>
                    <p>• If you didn't request this password reset, please ignore this email.</p>
                    <p>• Never share this code with anyone.</p>
                    <p>• GoShop Ghana will never ask for your password or reset code.</p>
                </div>
                
                <p style="margin-top: 30px;">If you're having trouble resetting your password, contact our support team:</p>
                <p style="font-weight: bold;">📞 0206221924</p>
                
                <p style="margin-top: 30px; color: #303A4D;">Stay secure!</p>
                <p style="font-weight: bold; color: #303A4D;">The GoShop Ghana Team</p>
            </div>
            
            <div class="footer">
                <p><strong>GoShop Ghana</strong></p>
                <p>Fresh Groceries from the Market to Your Home</p>
                <p style="margin-top: 15px;">Accra, Ghana</p>
                <p>&#x1F4DE; 0206221924 | &#x2709; info.goshopghana@gmail.com</p>
                <p style="margin-top: 15px; font-size: 12px;">&copy; 2025 GoShop Ghana. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(email_to, subject, html_content)


def send_email_with_attachment(
    email_to: str,
    subject: str,
    html_content: str,
    attachment_data: bytes,
    attachment_filename: str,
    attachment_type: str = "application/pdf",
    email_from: Optional[str] = None
) -> bool:
    """
    Send an email with an attachment using SMTP
    
    Args:
        email_to: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        attachment_data: Binary data of the attachment
        attachment_filename: Name of the attachment file
        attachment_type: MIME type of the attachment
        email_from: Sender email (defaults to settings.EMAILS_FROM_EMAIL)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Check if email is configured
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("Email not configured. Skipping email send.")
            return False
        
        # Set sender email
        if not email_from:
            email_from = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
        
        # Create message
        message = MIMEMultipart("mixed")
        message["Subject"] = subject
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{email_from}>"
        message["To"] = email_to
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Attach file
        attachment = MIMEBase("application", "octet-stream")
        attachment.set_payload(attachment_data)
        encoders.encode_base64(attachment)
        attachment.add_header(
            "Content-Disposition",
            f"attachment; filename= {attachment_filename}",
        )
        message.attach(attachment)
        
        # Send email
        logger.info(f"Attempting to send email with attachment to {email_to} via {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            logger.info(f"TLS started, attempting login as {settings.SMTP_USER}")
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            logger.info("Login successful, sending message with attachment...")
            server.send_message(message)
        
        logger.info(f"Email with attachment sent successfully to {email_to}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email with attachment to {email_to}: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False
