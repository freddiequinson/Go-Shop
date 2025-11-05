"""
Utility functions for updating supplier performance metrics
"""

from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from app.models.supplier import Supplier
from app.models.warehouse import GoodsReceivedNote
import logging

logger = logging.getLogger(__name__)


def update_supplier_performance_from_grn(db: Session, grn_id: str) -> bool:
    """
    Update supplier performance metrics based on GRN
    
    Updates:
    - Total supplies count
    - On-time delivery rate
    - Last supply date
    - Quality rating (if provided)
    """
    try:
        # Get GRN
        grn = db.query(GoodsReceivedNote).filter(GoodsReceivedNote.id == grn_id).first()
        if not grn or not grn.supplier_id:
            logger.warning(f"GRN {grn_id} not found or has no supplier")
            return False
        
        # Get supplier
        supplier = db.query(Supplier).filter(Supplier.id == grn.supplier_id).first()
        if not supplier:
            logger.warning(f"Supplier {grn.supplier_id} not found")
            return False
        
        # Update total supplies
        supplier.total_supplies = (supplier.total_supplies or 0) + 1
        
        # Update last supply date
        supplier.last_supply_date = datetime.now()
        
        # Calculate on-time delivery rate
        if grn.expected_delivery_date and grn.received_date:
            is_on_time = grn.received_date <= grn.expected_delivery_date
            
            # Recalculate on-time rate
            total_deliveries = supplier.total_supplies
            current_on_time_count = int((supplier.on_time_delivery_rate / 100) * (total_deliveries - 1))
            
            if is_on_time:
                current_on_time_count += 1
            
            supplier.on_time_delivery_rate = Decimal((current_on_time_count / total_deliveries) * 100)
        
        # Update quality rating if provided in GRN
        if hasattr(grn, 'quality_rating') and grn.quality_rating:
            # Calculate new average quality rating
            total_deliveries = supplier.total_supplies
            current_total = supplier.quality_rating * (total_deliveries - 1)
            new_average = (current_total + grn.quality_rating) / total_deliveries
            supplier.quality_rating = Decimal(new_average)
        
        # Update overall rating (weighted average of quality and on-time)
        quality_weight = 0.6
        on_time_weight = 0.4
        
        quality_score = float(supplier.quality_rating)
        on_time_score = float(supplier.on_time_delivery_rate) / 20  # Convert 0-100 to 0-5
        
        supplier.rating = Decimal(
            (quality_score * quality_weight) + (on_time_score * on_time_weight)
        )
        
        db.commit()
        logger.info(f"Updated performance for supplier {supplier.id}: {supplier.name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to update supplier performance: {e}")
        db.rollback()
        return False


def update_supplier_performance_from_offer(
    db: Session,
    supplier_id: str,
    offer_accepted: bool
) -> bool:
    """
    Update supplier metrics when offer is accepted/rejected
    
    This can track acceptance rate if needed
    """
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return False
        
        # Could add acceptance_rate field to track this
        # For now, just log the event
        logger.info(f"Offer {'accepted' if offer_accepted else 'rejected'} for supplier {supplier.name}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to update supplier offer metrics: {e}")
        return False


def calculate_supplier_value_score(supplier: Supplier) -> float:
    """
    Calculate comprehensive value score for supplier
    
    Factors:
    - Rating (30%)
    - On-time delivery (30%)
    - Quality rating (20%)
    - Total supplies/experience (10%)
    - Price competitiveness (10% - if available)
    """
    try:
        # Normalize rating (0-5 to 0-1)
        rating_score = float(supplier.rating) / 5.0
        
        # Normalize on-time rate (0-100 to 0-1)
        on_time_score = float(supplier.on_time_delivery_rate) / 100.0
        
        # Normalize quality rating (0-5 to 0-1)
        quality_score = float(supplier.quality_rating) / 5.0
        
        # Experience score (logarithmic scale, max at 100 supplies)
        import math
        experience_score = min(math.log(supplier.total_supplies + 1) / math.log(101), 1.0)
        
        # Weighted average
        value_score = (
            rating_score * 0.3 +
            on_time_score * 0.3 +
            quality_score * 0.2 +
            experience_score * 0.1 +
            0.1  # Reserve 10% for price competitiveness
        )
        
        return round(value_score, 3)
        
    except Exception as e:
        logger.error(f"Failed to calculate value score: {e}")
        return 0.0
