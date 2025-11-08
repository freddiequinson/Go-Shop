"""
Notification utilities for procurement system
Sends email and SMS alerts for procurement events using Gmail and Hubtel
"""

from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from app.core.email import send_email
from app.core.sms import send_sms

logger = logging.getLogger(__name__)


def notify_supplier_new_request(
    db: Session,
    supplier_id: str,
    request_id: str
) -> bool:
    """
    Notify supplier about new supply request
    
    Sends both email and SMS
    """
    try:
        from app.models.supplier import Supplier
        from app.models.supply_request import SupplyRequest
        
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        request = db.query(SupplyRequest).filter(SupplyRequest.id == request_id).first()
        
        if not supplier or not request:
            return False
        
        # Send Email
        if supplier.email:
            subject = f"New Supply Request: {request.product_name}"
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #303A4D; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #FED141; padding: 20px; text-align: center; border-radius: 10px; }}
                    .content {{ background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-radius: 10px; margin-top: 20px; }}
                    .details {{ background-color: #F4F2E6; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                    .button {{ display: inline-block; background-color: #FED141; color: #303A4D; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; color: #303A4D;">🛒 GoShop Ghana</h1>
                        <p style="margin: 5px 0; color: #303A4D;">Supplier Portal</p>
                    </div>
                    
                    <div class="content">
                        <h2 style="color: #303A4D;">New Supply Request Available</h2>
                        <p>Dear {supplier.name},</p>
                        <p>A new supply request has been created that matches your categories. Please review and submit your offer.</p>
                        
                        <div class="details">
                            <h3 style="margin-top: 0; color: #303A4D;">Request Details:</h3>
                            <p><strong>Request Number:</strong> {request.request_number}</p>
                            <p><strong>Product:</strong> {request.product_name}</p>
                            <p><strong>Quantity:</strong> {request.quantity_needed} {request.unit_type}</p>
                            <p><strong>Required By:</strong> {request.required_by_date.strftime('%B %d, %Y')}</p>
                            {f'<p><strong>Max Budget:</strong> GH₵{request.max_budget}</p>' if request.max_budget else ''}
                            {f'<p><strong>Deadline:</strong> {request.deadline.strftime("%B %d, %Y %I:%M %p")}</p>' if request.deadline else ''}
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="https://goshopghana.com/supplier/requests" class="button">View Request & Submit Offer</a>
                        </p>
                        
                        <p style="margin-top: 30px;">Best regards,<br><strong>GoShop Ghana Procurement Team</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p>GoShop Ghana | Accra, Ghana</p>
                        <p>📞 0241293754 | 📧 procurement@go-shop.gh</p>
                    </div>
                </div>
            </body>
            </html>
            """
            send_email(supplier.email, subject, html_body)
            logger.info(f"Email sent to supplier {supplier.name} for request {request.request_number}")
        
        # Send SMS
        if supplier.phone:
            sms_message = (
                f"GoShop: New supply request for {request.product_name}. "
                f"Qty: {request.quantity_needed} {request.unit_type}. "
                f"Required by: {request.required_by_date.strftime('%d/%m/%Y')}. "
                f"Login to submit offer: goshopghana.com/supplier"
            )
            send_sms(supplier.phone, sms_message)
            logger.info(f"SMS sent to supplier {supplier.name}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to notify supplier: {e}")
        return False


def notify_suppliers_open_request(
    db: Session,
    request_id: str,
    category_filter: Optional[List[str]] = None
) -> int:
    """
    Notify all relevant suppliers about open marketplace request
    
    Returns: Number of suppliers notified
    """
    try:
        from app.models.supplier import Supplier
        from app.models.supply_request import SupplyRequest
        
        request = db.query(SupplyRequest).filter(SupplyRequest.id == request_id).first()
        if not request:
            return 0
        
        # Get active verified suppliers
        query = db.query(Supplier).filter(
            Supplier.is_active == True,
            Supplier.verification_status == "verified"
        )
        
        # Filter by categories if specified
        if category_filter:
            query = query.filter(Supplier.categories.overlap(category_filter))
        
        suppliers = query.all()
        
        notified_count = 0
        for supplier in suppliers:
            if notify_supplier_new_request(db, supplier.id, request_id):
                notified_count += 1
        
        logger.info(f"Notified {notified_count} suppliers about open request {request.request_number}")
        return notified_count
        
    except Exception as e:
        logger.error(f"Failed to notify suppliers: {e}")
        return 0


def notify_supplier_offer_accepted(
    db: Session,
    offer_id: str
) -> bool:
    """
    Notify supplier that their offer was accepted
    """
    try:
        from app.models.supply_request import SupplyOffer
        
        offer = db.query(SupplyOffer).filter(SupplyOffer.id == offer_id).first()
        if not offer or not offer.supplier:
            return False
        
        supplier = offer.supplier
        request = offer.supply_request
        
        # Send Email
        if supplier.email:
            subject = f"✅ Offer Accepted: {request.product_name}"
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #303A4D; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 10px; }}
                    .header h1 {{ margin: 0; color: white; }}
                    .content {{ background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-radius: 10px; margin-top: 20px; }}
                    .success-box {{ background-color: #E8F5E9; padding: 20px; border-left: 4px solid #4CAF50; border-radius: 5px; margin: 20px 0; }}
                    .details {{ background-color: #F4F2E6; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                    .highlight {{ background-color: #FED141; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                    .button {{ display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Congratulations!</h1>
                        <p style="margin: 5px 0; color: white;">Your Offer Has Been Accepted</p>
                    </div>
                    
                    <div class="content">
                        <div class="success-box">
                            <h2 style="margin: 0; color: #4CAF50;">✓ Offer Accepted</h2>
                            <p style="margin: 10px 0 0 0;">Your offer for <strong>{request.product_name}</strong> has been accepted!</p>
                        </div>
                        
                        <p>Dear {supplier.name},</p>
                        <p>Great news! Your offer has been accepted by GoShop Ghana. Please prepare for delivery as per the agreed terms.</p>
                        
                        <div class="details">
                            <h3 style="margin-top: 0; color: #303A4D;">Delivery Details:</h3>
                            <p><strong>Product:</strong> {request.product_name}</p>
                            <p><strong>Quantity:</strong> {offer.offered_quantity} {request.unit_type}</p>
                            <p><strong>Delivery Date:</strong> {offer.delivery_date.strftime('%B %d, %Y')}</p>
                            {f'<p><strong>Delivery Location:</strong> {request.delivery_location}</p>' if request.delivery_location else ''}
                        </div>
                        
                        <div class="highlight">
                            <h3 style="margin: 0; color: #303A4D;">Total Amount</h3>
                            <p style="font-size: 28px; font-weight: bold; margin: 10px 0; color: #303A4D;">GH₵{offer.total_price}</p>
                        </div>
                        
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Prepare the products according to specifications</li>
                            <li>Deliver on the agreed date</li>
                            <li>Ensure quality standards are met</li>
                            <li>Payment will be processed after delivery confirmation</li>
                        </ol>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="https://goshopghana.com/supplier/offers" class="button">View Offer Details</a>
                        </p>
                        
                        <p style="margin-top: 30px;">Thank you for your partnership!</p>
                        <p><strong>GoShop Ghana Procurement Team</strong></p>
                    </div>
                </div>
            </body>
            </html>
            """
            send_email(supplier.email, subject, html_body)
        
        # Send SMS
        if supplier.phone:
            sms_message = (
                f"Congratulations! Your offer for {request.product_name} "
                f"(GHS {offer.total_price}) has been ACCEPTED. "
                f"Deliver by {offer.delivery_date.strftime('%d/%m/%Y')}. "
                f"Details: goshopghana.com/supplier"
            )
            send_sms(supplier.phone, sms_message)
        
        logger.info(f"Notified supplier {supplier.name} about accepted offer")
        return True
        
    except Exception as e:
        logger.error(f"Failed to notify supplier about acceptance: {e}")
        return False


def notify_supplier_offer_rejected(
    db: Session,
    offer_id: str
) -> bool:
    """
    Notify supplier that their offer was rejected
    """
    try:
        from app.models.supply_request import SupplyOffer
        
        offer = db.query(SupplyOffer).filter(SupplyOffer.id == offer_id).first()
        if not offer or not offer.supplier:
            return False
        
        supplier = offer.supplier
        request = offer.supply_request
        
        # Send Email only (SMS for rejection might be too negative)
        if supplier.email:
            subject = f"Offer Update: {request.product_name}"
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #303A4D; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #FED141; padding: 20px; text-align: center; border-radius: 10px; }}
                    .content {{ background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-radius: 10px; margin-top: 20px; }}
                    .info-box {{ background-color: #FFF3CD; padding: 15px; border-left: 4px solid #FFC107; border-radius: 5px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; color: #303A4D;">GoShop Ghana</h1>
                    </div>
                    
                    <div class="content">
                        <h2 style="color: #303A4D;">Offer Status Update</h2>
                        <p>Dear {supplier.name},</p>
                        <p>Thank you for submitting your offer for <strong>{request.product_name}</strong>.</p>
                        
                        <div class="info-box">
                            <p style="margin: 0;">Unfortunately, we have selected another offer for this request.</p>
                        </div>
                        
                        {f'<p><strong>Reason:</strong> {offer.rejection_reason}</p>' if offer.rejection_reason else ''}
                        
                        <p>We appreciate your participation and encourage you to submit offers for future requests. Your competitive pricing and quality service are valued.</p>
                        
                        <p style="margin-top: 30px;">Best regards,<br><strong>GoShop Ghana Procurement Team</strong></p>
                    </div>
                </div>
            </body>
            </html>
            """
            send_email(supplier.email, subject, html_body)
        
        logger.info(f"Notified supplier {supplier.name} about rejected offer")
        return True
        
    except Exception as e:
        logger.error(f"Failed to notify supplier about rejection: {e}")
        return False


def notify_admin_new_offer(
    db: Session,
    offer_id: str,
    admin_emails: List[str]
) -> bool:
    """
    Notify admin team about new supplier offer
    """
    try:
        from app.models.supply_request import SupplyOffer
        
        offer = db.query(SupplyOffer).filter(SupplyOffer.id == offer_id).first()
        if not offer:
            return False
        
        supplier = offer.supplier
        request = offer.supply_request
        
        for admin_email in admin_emails:
            subject = f"New Offer Received: {request.product_name}"
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #303A4D; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4698CA; padding: 20px; text-align: center; border-radius: 10px; }}
                    .header h1 {{ margin: 0; color: white; }}
                    .content {{ background-color: #ffffff; padding: 30px; border: 1px solid #ddd; border-radius: 10px; margin-top: 20px; }}
                    .details {{ background-color: #F4F2E6; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                    .button {{ display: inline-block; background-color: #FED141; color: #303A4D; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📦 New Offer Received</h1>
                    </div>
                    
                    <div class="content">
                        <h2 style="color: #303A4D;">Supplier Offer Submitted</h2>
                        <p>A new offer has been submitted for review.</p>
                        
                        <div class="details">
                            <h3 style="margin-top: 0;">Request Details:</h3>
                            <p><strong>Request:</strong> {request.request_number}</p>
                            <p><strong>Product:</strong> {request.product_name}</p>
                            <p><strong>Quantity Needed:</strong> {request.quantity_needed} {request.unit_type}</p>
                        </div>
                        
                        <div class="details">
                            <h3 style="margin-top: 0;">Offer Details:</h3>
                            <p><strong>Supplier:</strong> {supplier.name}</p>
                            <p><strong>Quantity Offered:</strong> {offer.offered_quantity} {request.unit_type}</p>
                            <p><strong>Unit Price:</strong> GH₵{offer.unit_price}</p>
                            <p><strong>Total Price:</strong> GH₵{offer.total_price}</p>
                            <p><strong>Delivery Date:</strong> {offer.delivery_date.strftime('%B %d, %Y')}</p>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="https://goshopghana.com/admin/procurement/requests/{request.id}" class="button">Review Offer</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            send_email(admin_email, subject, html_body)
        
        logger.info(f"Notified admins about new offer from {supplier.name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to notify admins: {e}")
        return False


def send_delivery_reminder(
    db: Session,
    offer_id: str,
    days_before: int = 1
) -> bool:
    """
    Send delivery reminder to supplier
    
    Call this 1-2 days before delivery date
    """
    try:
        from app.models.supply_request import SupplyOffer
        
        offer = db.query(SupplyOffer).filter(
            SupplyOffer.id == offer_id,
            SupplyOffer.status == "accepted"
        ).first()
        
        if not offer or not offer.supplier:
            return False
        
        supplier = offer.supplier
        request = offer.supply_request
        
        # Send SMS reminder
        if supplier.phone:
            sms_message = (
                f"REMINDER: Delivery due in {days_before} day(s). "
                f"Product: {request.product_name}. "
                f"Qty: {offer.offered_quantity}. "
                f"Date: {offer.delivery_date.strftime('%d/%m/%Y')}. "
                f"Location: {request.delivery_location or 'Main Warehouse'}. "
                f"Contact: 0241293754"
            )
            send_sms(supplier.phone, sms_message)
            logger.info(f"Sent delivery reminder to {supplier.name}")
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Failed to send delivery reminder: {e}")
        return False
