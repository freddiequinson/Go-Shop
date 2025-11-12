"""
PDF Receipt Generator for GoShopGhana
Generates professional PDF receipts for orders
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Any
import os


def generate_order_receipt_pdf(order_data: Dict[str, Any]) -> BytesIO:
    """
    Generate a PDF receipt for an order
    
    Args:
        order_data: Dictionary containing order information
        
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#303A4D'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#303A4D'),
        spaceAfter=12,
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#303A4D'),
    )
    
    # Add company header
    elements.append(Paragraph("GoShop Ghana", title_style))
    elements.append(Paragraph("Your Trusted Online Marketplace", normal_style))
    elements.append(Spacer(1, 20))
    
    # Add receipt title
    elements.append(Paragraph("ORDER RECEIPT", heading_style))
    elements.append(Spacer(1, 12))
    
    # Order information
    order_info_data = [
        ['Order Number:', f"#{order_data.get('id', '')[:8]}"],
        ['Order Date:', datetime.fromisoformat(order_data.get('created_at', '')).strftime('%B %d, %Y at %I:%M %p')],
        ['Payment Status:', order_data.get('payment_status', 'N/A').upper()],
        ['Payment Method:', order_data.get('payment_method', 'N/A').replace('_', ' ').title()],
        ['Payment Reference:', order_data.get('payment_reference', 'N/A')],
    ]
    
    if order_data.get('payment_completed_at'):
        order_info_data.append([
            'Payment Date:', 
            datetime.fromisoformat(order_data['payment_completed_at']).strftime('%B %d, %Y at %I:%M %p')
        ])
    
    order_info_table = Table(order_info_data, colWidths=[2*inch, 4*inch])
    order_info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F4F2E6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#303A4D')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
    ]))
    
    elements.append(order_info_table)
    elements.append(Spacer(1, 20))
    
    # Customer information
    elements.append(Paragraph("Customer Information", heading_style))
    
    customer_data = [
        ['Name:', order_data.get('user_name', 'N/A')],
        ['Email:', order_data.get('user_email', 'N/A')],
        ['Phone:', order_data.get('user_phone', 'N/A')],
    ]
    
    customer_table = Table(customer_data, colWidths=[2*inch, 4*inch])
    customer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F4F2E6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#303A4D')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
    ]))
    
    elements.append(customer_table)
    elements.append(Spacer(1, 20))
    
    # Delivery information
    if order_data.get('delivery_address'):
        elements.append(Paragraph("Delivery Information", heading_style))
        
        delivery_addr = order_data['delivery_address']
        delivery_data = [
            ['Address:', delivery_addr.get('address', 'N/A')],
            ['City:', delivery_addr.get('city', 'N/A')],
            ['Region:', delivery_addr.get('region', 'N/A')],
        ]
        
        if delivery_addr.get('delivery_notes'):
            delivery_data.append(['Notes:', delivery_addr['delivery_notes']])
        
        delivery_table = Table(delivery_data, colWidths=[2*inch, 4*inch])
        delivery_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F4F2E6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#303A4D')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
        ]))
        
        elements.append(delivery_table)
        elements.append(Spacer(1, 20))
    
    # Order items
    elements.append(Paragraph("Order Items", heading_style))
    
    # Table header
    items_data = [['Item', 'Quantity', 'Unit Price', 'Total']]
    
    # Add items
    for item in order_data.get('items', []):
        items_data.append([
            item.get('product_name', 'N/A'),
            f"{item.get('quantity', 0)} {item.get('unit_type', 'pcs')}",
            f"GH₵{float(item.get('price_per_unit_cedis', 0)):.2f}",
            f"GH₵{float(item.get('line_total_cedis', 0)):.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.2*inch, 1.2*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#303A4D')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # Order summary
    subtotal = float(order_data.get('subtotal', 0))
    delivery_fee = float(order_data.get('delivery_fee', 0))
    tax = float(order_data.get('tax', 0))
    total = float(order_data.get('total', 0))
    
    summary_data = [
        ['Subtotal:', f"GH₵{subtotal:.2f}"],
        ['Delivery Fee:', f"GH₵{delivery_fee:.2f}"],
        ['Tax:', f"GH₵{tax:.2f}"],
        ['', ''],  # Spacer row
        ['TOTAL:', f"GH₵{total:.2f}"],
    ]
    
    summary_table = Table(summary_data, colWidths=[4.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 3), 'Helvetica'),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 3), 10),
        ('FONTSIZE', (0, 4), (-1, 4), 14),
        ('TEXTCOLOR', (0, 0), (-1, 3), colors.HexColor('#303A4D')),
        ('TEXTCOLOR', (0, 4), (-1, 4), colors.HexColor('#303A4D')),
        ('LINEABOVE', (0, 4), (-1, 4), 2, colors.HexColor('#303A4D')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=1  # Center
    )
    
    elements.append(Paragraph("Thank you for shopping with GoShop Ghana!", footer_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("For support, contact us at support@goshopghana.com", footer_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
    
    # Build PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer
    buffer.seek(0)
    return buffer


def save_receipt_to_file(order_data: Dict[str, Any], file_path: str) -> str:
    """
    Generate and save PDF receipt to a file
    
    Args:
        order_data: Dictionary containing order information
        file_path: Path where to save the PDF
        
    Returns:
        str: Path to the saved file
    """
    pdf_buffer = generate_order_receipt_pdf(order_data)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Write to file
    with open(file_path, 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    return file_path
