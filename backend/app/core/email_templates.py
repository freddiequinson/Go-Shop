"""
Email templates for GoShopGhana
HTML email templates for order notifications
"""

from typing import List, Dict, Any
from datetime import datetime


def get_order_confirmation_email(
    user_name: str,
    order_id: str,
    order_items: List[Dict[str, Any]],
    delivery_address: Dict[str, Any],
    delivery_date: str,
    subtotal: float,
    delivery_fee: float,
    tax: float,
    total: float,
    payment_method: str,
) -> str:
    """Generate order confirmation email HTML"""
    
    # Format items
    items_html = ""
    for item in order_items:
        items_html += f"""
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #F4F2E6;">
                <strong>{item['product_name']}</strong><br>
                <span style="color: #666; font-size: 14px;">
                    {item['quantity']} × GH₵{item['price_per_unit']:.2f}
                </span>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #F4F2E6; text-align: right;">
                <strong>GH₵{item['line_total']:.2f}</strong>
            </td>
        </tr>
        """
    
    # Format delivery address
    address_html = f"""
    {delivery_address.get('street', '')}<br>
    {delivery_address.get('area', '')}, {delivery_address.get('city', '')}<br>
    {delivery_address.get('region', '')}<br>
    Phone: {delivery_address.get('phone', '')}
    """
    
    # Format delivery date
    try:
        delivery_dt = datetime.fromisoformat(delivery_date.replace('Z', '+00:00'))
        formatted_date = delivery_dt.strftime('%A, %B %d, %Y at %I:%M %p')
    except:
        formatted_date = delivery_date
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - GoShop Ghana</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F4F2E6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F2E6; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #FED141; padding: 30px; text-align: center;">
                                <h1 style="margin: 0; color: #303A4D; font-size: 32px;">GoShop Ghana</h1>
                                <p style="margin: 10px 0 0 0; color: #303A4D; font-size: 16px;">Fresh from Farm to Your Door</p>
                            </td>
                        </tr>
                        
                        <!-- Success Message -->
                        <tr>
                            <td style="padding: 40px 30px; text-align: center;">
                                <div style="width: 80px; height: 80px; background-color: #93C90F; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 48px;">✓</span>
                                </div>
                                <h2 style="margin: 0 0 10px 0; color: #303A4D; font-size: 28px;">Order Confirmed!</h2>
                                <p style="margin: 0; color: #666; font-size: 16px;">Thank you for your order, {user_name}!</p>
                                <p style="margin: 10px 0 0 0; color: #303A4D; font-size: 14px;">
                                    Order #<strong>{order_id[:8]}</strong>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Order Items -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px;">
                                <h3 style="margin: 0 0 20px 0; color: #303A4D; font-size: 20px;">Order Details</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #F4F2E6; border-radius: 10px; overflow: hidden;">
                                    {items_html}
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Price Summary -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 10px 0; color: #666;">Subtotal</td>
                                        <td style="padding: 10px 0; text-align: right; color: #303A4D;"><strong>GH₵{subtotal:.2f}</strong></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #666;">Delivery Fee</td>
                                        <td style="padding: 10px 0; text-align: right; color: #93C90F;"><strong>FREE</strong></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #666;">Tax</td>
                                        <td style="padding: 10px 0; text-align: right; color: #303A4D;"><strong>GH₵{tax:.2f}</strong></td>
                                    </tr>
                                    <tr style="border-top: 2px solid #F4F2E6;">
                                        <td style="padding: 15px 0 0 0; color: #303A4D; font-size: 18px;"><strong>Total</strong></td>
                                        <td style="padding: 15px 0 0 0; text-align: right; color: #303A4D; font-size: 24px;"><strong>GH₵{total:.2f}</strong></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Delivery Info -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px;">
                                <div style="background-color: #FED141; padding: 20px; border-radius: 10px;">
                                    <h3 style="margin: 0 0 15px 0; color: #303A4D; font-size: 18px;">📍 Delivery Information</h3>
                                    <p style="margin: 0 0 10px 0; color: #303A4D; line-height: 1.6;">
                                        {address_html}
                                    </p>
                                    <p style="margin: 10px 0 0 0; color: #303A4D;">
                                        <strong>Expected Delivery:</strong> {formatted_date}
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Payment Method -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px;">
                                <p style="margin: 0; color: #666; font-size: 14px;">
                                    <strong>Payment Method:</strong> {payment_method}
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Track Order Button -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px; text-align: center;">
                                <a href="https://www.goshopghana.com/orders/{order_id}" style="display: inline-block; background-color: #303A4D; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
                                    Track Your Order
                                </a>
                            </td>
                        </tr>
                        
                        <!-- Support -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px; text-align: center; border-top: 2px solid #F4F2E6;">
                                <p style="margin: 20px 0 10px 0; color: #666; font-size: 14px;">
                                    Need help? Contact us:
                                </p>
                                <p style="margin: 0; color: #303A4D; font-size: 14px;">
                                    📞 <strong>0206221924</strong><br>
                                    📧 <strong>info.goshopghana@gmail.com</strong>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #303A4D; padding: 20px; text-align: center;">
                                <p style="margin: 0; color: white; font-size: 12px;">
                                    © 2025 GoShop Ghana. All rights reserved.<br>
                                    Fresh Groceries from Farm to Your Door
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_order_status_update_email(
    user_name: str,
    order_id: str,
    status: str,
    status_message: str,
    tracking_url: str,
) -> str:
    """Generate order status update email HTML"""
    
    status_colors = {
        'confirmed': '#93C90F',
        'preparing': '#FED141',
        'dispatched': '#0086BF',
        'delivered': '#93C90F',
        'cancelled': '#C24628',
    }
    
    status_icons = {
        'confirmed': '✓',
        'preparing': '📦',
        'dispatched': '🚚',
        'delivered': '✓',
        'cancelled': '✗',
    }
    
    color = status_colors.get(status.lower(), '#303A4D')
    icon = status_icons.get(status.lower(), '•')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update - GoShop Ghana</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F4F2E6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F2E6; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #FED141; padding: 30px; text-align: center;">
                                <h1 style="margin: 0; color: #303A4D; font-size: 32px;">GoShop Ghana</h1>
                            </td>
                        </tr>
                        
                        <!-- Status Update -->
                        <tr>
                            <td style="padding: 40px 30px; text-align: center;">
                                <div style="width: 80px; height: 80px; background-color: {color}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 48px;">{icon}</span>
                                </div>
                                <h2 style="margin: 0 0 10px 0; color: #303A4D; font-size: 28px;">Order {status.title()}</h2>
                                <p style="margin: 0; color: #666; font-size: 16px;">Hi {user_name},</p>
                                <p style="margin: 10px 0 0 0; color: #303A4D; font-size: 16px; line-height: 1.6;">
                                    {status_message}
                                </p>
                                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                                    Order #<strong>{order_id[:8]}</strong>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Track Order Button -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px; text-align: center;">
                                <a href="{tracking_url}" style="display: inline-block; background-color: #303A4D; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
                                    Track Your Order
                                </a>
                            </td>
                        </tr>
                        
                        <!-- Support -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px; text-align: center; border-top: 2px solid #F4F2E6;">
                                <p style="margin: 20px 0 10px 0; color: #666; font-size: 14px;">
                                    Questions? Contact us:
                                </p>
                                <p style="margin: 0; color: #303A4D; font-size: 14px;">
                                    📞 <strong>0206221924</strong>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #303A4D; padding: 20px; text-align: center;">
                                <p style="margin: 0; color: white; font-size: 12px;">
                                    © 2025 GoShop Ghana. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
