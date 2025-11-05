"""
Integration utilities for procurement system
Links supply offers to GRN and warehouse operations
"""

from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def create_grn_from_accepted_offer(
    db: Session,
    offer_id: str,
    admin_user_id: str
) -> Optional[str]:
    """
    Create a GRN (Goods Received Note) from an accepted supply offer
    
    This links the procurement system to warehouse management
    
    Returns: GRN ID if successful, None otherwise
    """
    try:
        from app.models.supply_request import SupplyOffer, SupplyRequest
        from app.models.warehouse import GoodsReceivedNote
        from app.crud.warehouse import generate_grn_number
        import uuid
        
        # Get the accepted offer
        offer = db.query(SupplyOffer).filter(
            SupplyOffer.id == offer_id,
            SupplyOffer.status == "accepted"
        ).first()
        
        if not offer:
            logger.warning(f"Offer {offer_id} not found or not accepted")
            return None
        
        # Get the supply request
        request = db.query(SupplyRequest).filter(
            SupplyRequest.id == offer.supply_request_id
        ).first()
        
        if not request:
            logger.warning(f"Supply request not found for offer {offer_id}")
            return None
        
        # Check if GRN already exists for this offer
        existing_grn = db.query(GoodsReceivedNote).filter(
            GoodsReceivedNote.reference_number == f"OFFER-{offer_id[:8]}"
        ).first()
        
        if existing_grn:
            logger.info(f"GRN already exists for offer {offer_id}")
            return existing_grn.id
        
        # Create GRN
        grn = GoodsReceivedNote(
            id=str(uuid.uuid4()),
            grn_number=generate_grn_number(db),
            supplier_id=offer.supplier_id,
            product_id=request.product_id,
            expected_quantity=float(offer.offered_quantity),
            received_quantity=0,  # Will be updated when goods arrive
            unit_type=request.unit_type,
            expected_delivery_date=offer.delivery_date,
            received_date=None,  # Will be set when goods arrive
            reference_number=f"OFFER-{offer_id[:8]}",
            notes=f"Auto-created from supply offer. Request: {request.request_number}",
            status="pending",
            quality_check_status="pending",
            created_by_user_id=admin_user_id
        )
        
        db.add(grn)
        db.commit()
        db.refresh(grn)
        
        logger.info(f"Created GRN {grn.grn_number} from offer {offer_id}")
        return grn.id
        
    except Exception as e:
        logger.error(f"Failed to create GRN from offer: {e}")
        db.rollback()
        return None


def link_supply_request_to_restock_order(
    db: Session,
    request_id: str
) -> Optional[str]:
    """
    Create a restock order from a supply request
    
    This can be used for inventory planning
    
    Returns: Restock order ID if successful
    """
    try:
        from app.models.supply_request import SupplyRequest
        from app.models.warehouse import RestockOrder
        import uuid
        
        request = db.query(SupplyRequest).filter(
            SupplyRequest.id == request_id
        ).first()
        
        if not request:
            return None
        
        # Check if restock order already exists
        existing_order = db.query(RestockOrder).filter(
            RestockOrder.notes.like(f"%{request.request_number}%")
        ).first()
        
        if existing_order:
            return existing_order.id
        
        # Create restock order
        restock_order = RestockOrder(
            id=str(uuid.uuid4()),
            product_id=request.product_id,
            supplier_id=request.supplier_id,
            quantity_ordered=float(request.quantity_needed),
            unit_type=request.unit_type,
            expected_delivery_date=request.required_by_date,
            status="pending",
            notes=f"From supply request: {request.request_number}"
        )
        
        db.add(restock_order)
        db.commit()
        db.refresh(restock_order)
        
        logger.info(f"Created restock order from request {request_id}")
        return restock_order.id
        
    except Exception as e:
        logger.error(f"Failed to create restock order: {e}")
        db.rollback()
        return None


def update_request_status_on_delivery(
    db: Session,
    grn_id: str
) -> bool:
    """
    Update supply request status when goods are delivered
    
    Called when GRN is approved
    """
    try:
        from app.models.warehouse import GoodsReceivedNote
        from app.models.supply_request import SupplyRequest
        
        # Get GRN
        grn = db.query(GoodsReceivedNote).filter(
            GoodsReceivedNote.id == grn_id
        ).first()
        
        if not grn or not grn.reference_number:
            return False
        
        # Extract offer ID from reference
        if grn.reference_number.startswith("OFFER-"):
            offer_ref = grn.reference_number.replace("OFFER-", "")
            
            # Find the supply request through the offer
            from app.models.supply_request import SupplyOffer
            offer = db.query(SupplyOffer).filter(
                SupplyOffer.id.like(f"{offer_ref}%")
            ).first()
            
            if offer:
                request = db.query(SupplyRequest).filter(
                    SupplyRequest.id == offer.supply_request_id
                ).first()
                
                if request and request.status == "accepted":
                    request.status = "completed"
                    request.completed_at = datetime.now()
                    db.commit()
                    logger.info(f"Marked supply request {request.id} as completed")
                    return True
        
        return False
        
    except Exception as e:
        logger.error(f"Failed to update request status: {e}")
        db.rollback()
        return False


def get_procurement_analytics(db: Session) -> dict:
    """
    Get analytics for procurement system
    
    Returns statistics about supply requests, offers, and performance
    """
    try:
        from app.models.supply_request import SupplyRequest, SupplyOffer
        from sqlalchemy import func
        from decimal import Decimal
        
        # Total requests
        total_requests = db.query(func.count(SupplyRequest.id)).scalar()
        
        # Completed requests
        completed_requests = db.query(func.count(SupplyRequest.id)).filter(
            SupplyRequest.status == "completed"
        ).scalar()
        
        # Total offers
        total_offers = db.query(func.count(SupplyOffer.id)).scalar()
        
        # Accepted offers
        accepted_offers = db.query(func.count(SupplyOffer.id)).filter(
            SupplyOffer.status == "accepted"
        ).scalar()
        
        # Total procurement value
        total_value = db.query(func.sum(SupplyOffer.total_price)).filter(
            SupplyOffer.status == "accepted"
        ).scalar() or Decimal("0")
        
        # Average response time (time from request creation to first offer)
        # This would require more complex query
        
        return {
            "total_requests": total_requests,
            "completed_requests": completed_requests,
            "completion_rate": (completed_requests / total_requests * 100) if total_requests > 0 else 0,
            "total_offers": total_offers,
            "accepted_offers": accepted_offers,
            "acceptance_rate": (accepted_offers / total_offers * 100) if total_offers > 0 else 0,
            "total_procurement_value": float(total_value),
            "average_offers_per_request": (total_offers / total_requests) if total_requests > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Failed to get procurement analytics: {e}")
        return {}
