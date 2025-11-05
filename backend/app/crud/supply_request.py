"""
CRUD operations for Supply Requests and Offers
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, cast, String
from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from app.models.supply_request import SupplyRequest, SupplyOffer, SupplyRequestStatus, SupplyOfferStatus
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.user import User
from app.schemas.supply_request import (
    SupplyRequestCreate, SupplyRequestUpdate, SupplyRequestFilter,
    SupplyOfferCreate, SupplyOfferUpdate, SupplyOfferFilter
)


# ============= Supply Request CRUD =============

def generate_request_number(db: Session) -> str:
    """Generate unique request number"""
    # Get count of requests today
    today = datetime.now().date()
    count = db.query(SupplyRequest).filter(
        func.date(SupplyRequest.created_at) == today
    ).count()
    
    return f"RFS-{datetime.now().strftime('%Y%m%d')}-{count + 1:04d}"


def create_supply_request(
    db: Session,
    request: SupplyRequestCreate,
    created_by_user_id: str
) -> SupplyRequest:
    """Create a new supply request"""
    
    db_request = SupplyRequest(
        id=str(uuid.uuid4()),
        request_number=generate_request_number(db),
        product_id=request.product_id,
        quantity_needed=request.quantity_needed,
        unit_type=request.unit_type,
        supplier_id=request.supplier_id,
        is_open_request=request.is_open_request,
        target_categories=request.target_categories,
        required_by_date=request.required_by_date,
        delivery_location=request.delivery_location,
        max_budget=request.max_budget,
        estimated_unit_price=request.estimated_unit_price,
        status=SupplyRequestStatus.DRAFT if not request.supplier_id and not request.is_open_request else SupplyRequestStatus.SENT,
        created_by_user_id=created_by_user_id,
        special_requirements=request.special_requirements,
        internal_notes=request.internal_notes,
        deadline=request.deadline
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request


def get_supply_request(db: Session, request_id: str) -> Optional[SupplyRequest]:
    """Get supply request by ID"""
    return db.query(SupplyRequest).options(
        joinedload(SupplyRequest.product),
        joinedload(SupplyRequest.supplier),
        joinedload(SupplyRequest.created_by),
        joinedload(SupplyRequest.offers)
    ).filter(SupplyRequest.id == request_id).first()


def get_supply_requests(
    db: Session,
    filters: Optional[SupplyRequestFilter] = None,
    skip: int = 0,
    limit: int = 100
) -> List[SupplyRequest]:
    """Get supply requests with filters"""
    query = db.query(SupplyRequest).options(
        joinedload(SupplyRequest.product),
        joinedload(SupplyRequest.supplier),
        joinedload(SupplyRequest.created_by)
    )
    
    if filters:
        if filters.status:
            query = query.filter(SupplyRequest.status == filters.status)
        if filters.is_open_request is not None:
            query = query.filter(SupplyRequest.is_open_request == filters.is_open_request)
        if filters.product_id:
            query = query.filter(SupplyRequest.product_id == filters.product_id)
        if filters.supplier_id:
            query = query.filter(SupplyRequest.supplier_id == filters.supplier_id)
        if filters.created_by_user_id:
            query = query.filter(SupplyRequest.created_by_user_id == filters.created_by_user_id)
        if filters.from_date:
            query = query.filter(SupplyRequest.created_at >= filters.from_date)
        if filters.to_date:
            query = query.filter(SupplyRequest.created_at <= filters.to_date)
    
    return query.order_by(desc(SupplyRequest.created_at)).offset(skip).limit(limit).all()


def update_supply_request(
    db: Session,
    request_id: str,
    request_update: SupplyRequestUpdate
) -> Optional[SupplyRequest]:
    """Update supply request"""
    db_request = get_supply_request(db, request_id)
    if not db_request:
        return None
    
    update_data = request_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_request, field, value)
    
    db.commit()
    db.refresh(db_request)
    
    return db_request


def cancel_supply_request(db: Session, request_id: str) -> Optional[SupplyRequest]:
    """Cancel supply request"""
    db_request = get_supply_request(db, request_id)
    if not db_request:
        return None
    
    db_request.status = SupplyRequestStatus.CANCELLED
    db.commit()
    db.refresh(db_request)
    
    return db_request


def get_open_supply_requests(
    db: Session,
    supplier_categories: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100
) -> List[SupplyRequest]:
    """Get open supply requests (marketplace)"""
    query = db.query(SupplyRequest).options(
        joinedload(SupplyRequest.product),
        joinedload(SupplyRequest.offers)
    ).filter(
        SupplyRequest.is_open_request == True,
        cast(SupplyRequest.status, String).in_(['sent', 'responded'])
    )
    
    # Filter by supplier categories if provided
    if supplier_categories:
        # PostgreSQL array overlap (&&) to match any supplier category
        query = query.filter(
            SupplyRequest.target_categories.op('&&')(supplier_categories)
        )
    
    # Only show requests that haven't passed deadline
    query = query.filter(
        or_(
            SupplyRequest.deadline == None,
            SupplyRequest.deadline > datetime.now()
        )
    )
    
    return query.order_by(desc(SupplyRequest.created_at)).offset(skip).limit(limit).all()


# ============= Supply Offer CRUD =============

def create_supply_offer(
    db: Session,
    offer: SupplyOfferCreate,
    supplier_id: str
) -> SupplyOffer:
    """Create a new supply offer"""
    
    # Calculate total price
    total_price = offer.offered_quantity * offer.unit_price + offer.delivery_fee
    
    db_offer = SupplyOffer(
        id=str(uuid.uuid4()),
        supply_request_id=offer.supply_request_id,
        supplier_id=supplier_id,
        offered_quantity=offer.offered_quantity,
        unit_price=offer.unit_price,
        total_price=total_price,
        delivery_date=offer.delivery_date,
        delivery_time_hours=offer.delivery_time_hours,
        delivery_fee=offer.delivery_fee,
        quality_guarantee=offer.quality_guarantee,
        sample_available=offer.sample_available,
        certifications=offer.certifications,
        status=SupplyOfferStatus.PENDING,
        notes=offer.notes
    )
    
    db.add(db_offer)
    
    # Update request status to RESPONDED if it was SENT
    request = db.query(SupplyRequest).filter(SupplyRequest.id == offer.supply_request_id).first()
    if request and request.status == SupplyRequestStatus.SENT:
        request.status = SupplyRequestStatus.RESPONDED
    
    db.commit()
    db.refresh(db_offer)
    
    return db_offer


def get_supply_offer(db: Session, offer_id: str) -> Optional[SupplyOffer]:
    """Get supply offer by ID"""
    return db.query(SupplyOffer).options(
        joinedload(SupplyOffer.supplier),
        joinedload(SupplyOffer.supply_request).joinedload(SupplyRequest.product)
    ).filter(SupplyOffer.id == offer_id).first()


def get_supply_offers(
    db: Session,
    filters: Optional[SupplyOfferFilter] = None,
    skip: int = 0,
    limit: int = 100
) -> List[SupplyOffer]:
    """Get supply offers with filters"""
    query = db.query(SupplyOffer).options(
        joinedload(SupplyOffer.supplier),
        joinedload(SupplyOffer.supply_request).joinedload(SupplyRequest.product)
    )
    
    if filters:
        if filters.supply_request_id:
            query = query.filter(SupplyOffer.supply_request_id == filters.supply_request_id)
        if filters.supplier_id:
            query = query.filter(SupplyOffer.supplier_id == filters.supplier_id)
        if filters.status:
            query = query.filter(SupplyOffer.status == filters.status)
        if filters.from_date:
            query = query.filter(SupplyOffer.created_at >= filters.from_date)
        if filters.to_date:
            query = query.filter(SupplyOffer.created_at <= filters.to_date)
    
    return query.order_by(desc(SupplyOffer.created_at)).offset(skip).limit(limit).all()


def update_supply_offer(
    db: Session,
    offer_id: str,
    offer_update: SupplyOfferUpdate
) -> Optional[SupplyOffer]:
    """Update supply offer (only if pending)"""
    db_offer = get_supply_offer(db, offer_id)
    if not db_offer or db_offer.status != SupplyOfferStatus.PENDING:
        return None
    
    update_data = offer_update.dict(exclude_unset=True)
    
    # Recalculate total price if quantity or unit price changed
    if 'offered_quantity' in update_data or 'unit_price' in update_data or 'delivery_fee' in update_data:
        quantity = update_data.get('offered_quantity', db_offer.offered_quantity)
        unit_price = update_data.get('unit_price', db_offer.unit_price)
        delivery_fee = update_data.get('delivery_fee', db_offer.delivery_fee)
        update_data['total_price'] = quantity * unit_price + delivery_fee
    
    for field, value in update_data.items():
        setattr(db_offer, field, value)
    
    db.commit()
    db.refresh(db_offer)
    
    return db_offer


def accept_supply_offer(
    db: Session,
    offer_id: str,
    admin_notes: Optional[str] = None,
    admin_user_id: Optional[str] = None
) -> Optional[SupplyOffer]:
    """
    Accept a supply offer
    
    Auto-creates GRN for warehouse tracking
    """
    import logging
    logger = logging.getLogger(__name__)
    
    db_offer = get_supply_offer(db, offer_id)
    if not db_offer or db_offer.status != SupplyOfferStatus.PENDING:
        return None
    
    # Update offer status
    db_offer.status = SupplyOfferStatus.ACCEPTED
    db_offer.responded_at = datetime.now()
    if admin_notes:
        db_offer.admin_notes = admin_notes
    
    # Update request
    request = db_offer.supply_request
    request.status = SupplyRequestStatus.ACCEPTED
    request.accepted_offer_id = offer_id
    
    # Reject all other pending offers for this request
    db.query(SupplyOffer).filter(
        SupplyOffer.supply_request_id == request.id,
        SupplyOffer.id != offer_id,
        SupplyOffer.status == SupplyOfferStatus.PENDING
    ).update({
        "status": SupplyOfferStatus.REJECTED,
        "rejection_reason": "Another offer was accepted",
        "responded_at": datetime.now()
    })
    
    db.commit()
    db.refresh(db_offer)
    
    # Auto-create GRN for warehouse tracking
    if admin_user_id:
        try:
            from app.utils.procurement_integration import create_grn_from_accepted_offer
            grn_id = create_grn_from_accepted_offer(db, offer_id, admin_user_id)
            if grn_id:
                logger.info(f"Auto-created GRN {grn_id} for accepted offer {offer_id}")
            else:
                logger.warning(f"Failed to auto-create GRN for offer {offer_id}")
        except Exception as e:
            logger.error(f"Error creating GRN: {e}")
            # Don't fail the acceptance if GRN creation fails
    
    return db_offer


def reject_supply_offer(
    db: Session,
    offer_id: str,
    rejection_reason: str
) -> Optional[SupplyOffer]:
    """Reject a supply offer"""
    db_offer = get_supply_offer(db, offer_id)
    if not db_offer or db_offer.status != SupplyOfferStatus.PENDING:
        return None
    
    db_offer.status = SupplyOfferStatus.REJECTED
    db_offer.rejection_reason = rejection_reason
    db_offer.responded_at = datetime.now()
    
    db.commit()
    db.refresh(db_offer)
    
    return db_offer


def withdraw_supply_offer(db: Session, offer_id: str, supplier_id: str) -> Optional[SupplyOffer]:
    """Withdraw a supply offer (supplier only)"""
    db_offer = get_supply_offer(db, offer_id)
    if not db_offer or db_offer.supplier_id != supplier_id or db_offer.status != SupplyOfferStatus.PENDING:
        return None
    
    db_offer.status = SupplyOfferStatus.WITHDRAWN
    db_offer.withdrawn_at = datetime.now()
    
    db.commit()
    db.refresh(db_offer)
    
    return db_offer


def get_supplier_requests(
    db: Session,
    supplier_id: str,
    include_open: bool = True,
    skip: int = 0,
    limit: int = 100
) -> List[SupplyRequest]:
    """Get supply requests for a specific supplier"""
    # Get supplier categories
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return []
    
    query = db.query(SupplyRequest).options(
        joinedload(SupplyRequest.product),
        joinedload(SupplyRequest.offers)
    )
    
    conditions = []
    
    # Direct requests to this supplier
    conditions.append(SupplyRequest.supplier_id == supplier_id)
    
    # Open requests matching supplier specialization
    # Use PostgreSQL array overlap operator (&&) to check if arrays have common elements
    if include_open and supplier.specialization:
        from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
        conditions.append(
            and_(
                SupplyRequest.is_open_request == True,
                SupplyRequest.target_categories.op('&&')(supplier.specialization)
            )
        )
    
    query = query.filter(or_(*conditions))
    
    # Only show active requests - filter out completed/cancelled (cast enum to string)
    query = query.filter(
        ~cast(SupplyRequest.status, String).in_(['completed', 'cancelled', 'rejected'])
    )
    
    return query.order_by(desc(SupplyRequest.created_at)).offset(skip).limit(limit).all()
