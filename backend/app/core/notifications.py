"""
Notification service for GoShopGhana
Handles email and SMS notifications for orders
"""

import logging
from typing import Dict, Any, List
from app.core.email import send_email
from app.core.sms import send_sms, format_ghana_phone
from app.core.email_templates import (
    get_order_confirmation_email,
    get_order_status_update_email
)
from app.models.order import Order
from app.models.user import User

logger = logging.getLogger(__name__)


def send_order_confirmation(order: Order, user: User) -> bool:
    """
    Send order confirmation via email and SMS
    
    Args:
        order: Order object
        user: User object
        
    Returns:
        bool: True if at least one notification was sent successfully
    """
    success = False
    
    # Prepare order data
    order_items = []
    for item in order.items if hasattr(order, 'items') else []:
        order_items.append({
            'product_name': item.product_name,
            'quantity': float(item.quantity),
            'price_per_unit': float(item.price_per_unit_cedis) / 100,
            'line_total': float(item.line_total_cedis) / 100,
        })
    
    subtotal = float(order.subtotal_cedis) / 100
    delivery_fee = float(order.delivery_fee_cedis) / 100
    tax = float(order.tax_cedis) / 100
    total = float(order.total_cedis) / 100
    
    # Get payment method label
    payment_methods = {
        'wallet': 'Wallet Balance',
        'card': 'Debit/Credit Card',
        'mtn-momo': 'MTN Mobile Money',
        'telecel-cash': 'Telecel Cash',
        'at-money': 'AT Money',
    }
    payment_method = payment_methods.get('wallet', 'Wallet')  # Default for now
    
    # Send Email
    try:
        email_html = get_order_confirmation_email(
            user_name=user.full_name,
            order_id=order.id,
            order_items=order_items,
            delivery_address=order.delivery_address or {},
            delivery_date=order.estimated_delivery_time.isoformat() if order.estimated_delivery_time else '',
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            tax=tax,
            total=total,
            payment_method=payment_method,
        )
        
        send_email(
            to_email=user.email,
            subject=f"Order Confirmed #{order.id[:8]} - GoShop Ghana",
            html_content=email_html
        )
        
        logger.info(f"Order confirmation email sent to {user.email} for order {order.id}")
        success = True
    except Exception as e:
        logger.error(f"Failed to send order confirmation email: {e}")
    
    # Send SMS
    if user.phone:
        try:
            # Format delivery date
            delivery_date = "soon"
            if order.estimated_delivery_time:
                delivery_date = order.estimated_delivery_time.strftime('%b %d')
            
            sms_message = (
                f"Order Confirmed!\n"
                f"Order #{order.id[:8]}\n"
                f"Total: GHS {total:.2f}\n"
                f"Delivery: {delivery_date}\n"
                f"Track: www.goshopghana.com/orders/{order.id}\n"
                f"Thank you for shopping with GoShop Ghana!"
            )
            
            send_sms(user.phone, sms_message)
            logger.info(f"Order confirmation SMS sent to {user.phone} for order {order.id}")
            success = True
        except Exception as e:
            logger.error(f"Failed to send order confirmation SMS: {e}")
    
    return success


def send_order_status_update(
    order: Order,
    user: User,
    new_status: str,
    custom_message: str = None
) -> bool:
    """
    Send order status update via email and SMS
    
    Args:
        order: Order object
        user: User object
        new_status: New order status
        custom_message: Optional custom message
        
    Returns:
        bool: True if at least one notification was sent successfully
    """
    success = False
    
    # Status messages
    status_messages = {
        'confirmed': 'Your order has been confirmed and is being prepared.',
        'preparing': 'Your order is being prepared with fresh ingredients.',
        'dispatched': 'Your order is on its way! Our rider will deliver it soon.',
        'delivered': 'Your order has been delivered. Enjoy your fresh groceries!',
        'cancelled': 'Your order has been cancelled. If you have any questions, please contact us.',
    }
    
    message = custom_message or status_messages.get(new_status.lower(), 'Your order status has been updated.')
    
    # Send Email
    try:
        email_html = get_order_status_update_email(
            user_name=user.full_name,
            order_id=order.id,
            status=new_status,
            status_message=message,
            tracking_url=f"https://www.goshopghana.com/orders/{order.id}"
        )
        
        send_email(
            to_email=user.email,
            subject=f"Order {new_status.title()} #{order.id[:8]} - GoShop Ghana",
            html_content=email_html
        )
        
        logger.info(f"Order status update email sent to {user.email} for order {order.id}")
        success = True
    except Exception as e:
        logger.error(f"Failed to send order status update email: {e}")
    
    # Send SMS
    if user.phone:
        try:
            sms_message = (
                f"Order Update: {new_status.upper()}\n"
                f"Order #{order.id[:8]}\n"
                f"{message}\n"
                f"Track: www.goshopghana.com/orders/{order.id}"
            )
            
            send_sms(user.phone, sms_message)
            logger.info(f"Order status update SMS sent to {user.phone} for order {order.id}")
            success = True
        except Exception as e:
            logger.error(f"Failed to send order status update SMS: {e}")
    
    return success


def send_delivery_notification(order: Order, user: User, rider_info: Dict[str, Any] = None) -> bool:
    """
    Send delivery notification when order is dispatched
    
    Args:
        order: Order object
        user: User object
        rider_info: Optional rider information
        
    Returns:
        bool: True if at least one notification was sent successfully
    """
    success = False
    
    # Send SMS (more urgent for delivery)
    if user.phone:
        try:
            rider_text = ""
            if rider_info:
                rider_text = f"\nRider: {rider_info.get('name', 'N/A')}\nPhone: {rider_info.get('phone', 'N/A')}"
            
            sms_message = (
                f"🚚 Your order is on the way!\n"
                f"Order #{order.id[:8]}\n"
                f"Expected: {order.estimated_delivery_time.strftime('%I:%M %p') if order.estimated_delivery_time else 'Soon'}"
                f"{rider_text}\n"
                f"Track: www.goshopghana.com/orders/{order.id}"
            )
            
            send_sms(user.phone, sms_message)
            logger.info(f"Delivery notification SMS sent to {user.phone} for order {order.id}")
            success = True
        except Exception as e:
            logger.error(f"Failed to send delivery notification SMS: {e}")
    
    return success


def send_payment_receipt(
    user: User,
    transaction_type: str,
    amount: float,
    reference: str,
    description: str = None
) -> bool:
    """
    Send payment receipt via email
    
    Args:
        user: User object
        transaction_type: Type of transaction (credit/debit)
        amount: Transaction amount
        reference: Transaction reference
        description: Optional description
        
    Returns:
        bool: True if email was sent successfully
    """
    try:
        subject = f"Payment Receipt - GoShop Ghana"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Payment Receipt</h2>
            <p>Dear {user.full_name},</p>
            <p>This is to confirm your payment transaction:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Type:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{transaction_type.title()}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">GH₵{amount:.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Reference:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{reference}</td>
                </tr>
                {f'<tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Description:</strong></td><td style="padding: 10px; border: 1px solid #ddd;">{description}</td></tr>' if description else ''}
            </table>
            <p>Thank you for using GoShop Ghana!</p>
            <p style="color: #666; font-size: 12px;">If you have any questions, contact us at 0241293754</p>
        </body>
        </html>
        """
        
        send_email(
            to_email=user.email,
            subject=subject,
            html_content=html_content
        )
        
        logger.info(f"Payment receipt sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send payment receipt: {e}")
        return False
