"""
API endpoints for Supply Requests (Admin)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.supply_request import (
    SupplyRequestCreate, SupplyRequestUpdate, SupplyRequestResponse,
    SupplyRequestFilter, AcceptOfferRequest, RejectOfferRequest,
    SupplyOfferResponse, AdminProcurementStats, OpenSupplyRequestResponse,
    BroadcastRequestCreate
)
from app.crud import supply_request as crud


router = APIRouter()


@router.post("/", response_model=SupplyRequestResponse, status_code=status.HTTP_201_CREATED)
def create_supply_request(
    request: SupplyRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new supply request (Admin only)
    
    - **Direct request**: Set supplier_id to target specific supplier
    - **Open request**: Set is_open_request=True and target_categories for marketplace
    
    Auto-sends notifications to relevant suppliers via email and SMS
    """
    import logging
    from app.utils.procurement_notifications import notify_supplier_new_request, notify_suppliers_open_request
    
    logger = logging.getLogger(__name__)
    
    db_request = crud.create_supply_request(db, request, current_user.id)
    
    # Send notifications to suppliers
    try:
        if db_request.is_open_request:
            # Notify all relevant suppliers for open marketplace request
            notified = notify_suppliers_open_request(
                db, 
                db_request.id, 
                db_request.target_categories
            )
            logger.info(f"Notified {notified} suppliers about open request {db_request.request_number}")
        elif db_request.supplier_id:
            # Notify specific supplier for direct request
            notify_supplier_new_request(db, db_request.supplier_id, db_request.id)
            logger.info(f"Notified supplier about direct request {db_request.request_number}")
    except Exception as e:
        logger.error(f"Failed to send notifications: {e}")
        # Don't fail the request creation if notifications fail
    
    # Add related data
    response = SupplyRequestResponse.from_orm(db_request)
    if db_request.product:
        response.product_name = db_request.product.name
    if db_request.supplier:
        response.supplier_name = db_request.supplier.name
    if db_request.created_by:
        response.created_by_name = db_request.created_by.full_name
    response.offers_count = len(db_request.offers) if db_request.offers else 0
    
    return response


@router.get("/", response_model=List[SupplyRequestResponse])
def get_supply_requests(
    status: Optional[str] = None,
    is_open_request: Optional[bool] = None,
    product_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get all supply requests with optional filters (Admin only)
    """
    filters = SupplyRequestFilter(
        status=status,
        is_open_request=is_open_request,
        product_id=product_id,
        supplier_id=supplier_id
    )
    
    requests = crud.get_supply_requests(db, filters, skip, limit)
    
    # Add related data
    responses = []
    for req in requests:
        response = SupplyRequestResponse.from_orm(req)
        if req.product:
            response.product_name = req.product.name
        if req.supplier:
            response.supplier_name = req.supplier.name
        if req.created_by:
            response.created_by_name = req.created_by.full_name
        response.offers_count = len(req.offers) if req.offers else 0
        responses.append(response)
    
    return responses


@router.get("/open", response_model=List[OpenSupplyRequestResponse])
def get_open_supply_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get all open supply requests (marketplace) (Admin only)
    """
    requests = crud.get_open_supply_requests(db, skip=skip, limit=limit)
    
    # Add related data and calculate stats
    responses = []
    for req in requests:
        response = OpenSupplyRequestResponse.from_orm(req)
        if req.product:
            response.product_name = req.product.name
        if req.created_by:
            response.created_by_name = req.created_by.full_name
        
        # Calculate offer statistics
        if req.offers:
            response.offers_count = len(req.offers)
            offer_prices = [offer.total_price for offer in req.offers if offer.status == "pending"]
            if offer_prices:
                response.lowest_offer_price = min(offer_prices)
                response.highest_offer_price = max(offer_prices)
                response.average_offer_price = sum(offer_prices) / len(offer_prices)
        
        # Calculate deadline remaining
        if req.deadline:
            from datetime import datetime
            remaining = req.deadline - datetime.now()
            response.deadline_remaining_hours = int(remaining.total_seconds() / 3600)
        
        responses.append(response)
    
    return responses


@router.get("/stats", response_model=AdminProcurementStats)
def get_procurement_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get procurement statistics (Admin only)
    """
    from sqlalchemy import func
    from app.models.supply_request import SupplyRequest, SupplyOffer
    from decimal import Decimal
    
    # Total requests
    total_requests = db.query(func.count(SupplyRequest.id)).scalar()
    
    # Requests by status
    pending_requests = db.query(func.count(SupplyRequest.id)).filter(
        SupplyRequest.status.in_(["sent", "responded"])
    ).scalar()
    
    open_requests = db.query(func.count(SupplyRequest.id)).filter(
        SupplyRequest.is_open_request == True,
        SupplyRequest.status.in_(["sent", "responded"])
    ).scalar()
    
    completed_requests = db.query(func.count(SupplyRequest.id)).filter(
        SupplyRequest.status == "completed"
    ).scalar()
    
    # Total offers
    total_offers = db.query(func.count(SupplyOffer.id)).scalar()
    
    # Average offers per request
    avg_offers = total_offers / total_requests if total_requests > 0 else 0
    
    # Total procurement value (accepted offers)
    total_value = db.query(func.sum(SupplyOffer.total_price)).filter(
        SupplyOffer.status == "accepted"
    ).scalar() or Decimal("0")
    
    return AdminProcurementStats(
        total_requests=total_requests,
        pending_requests=pending_requests,
        open_requests=open_requests,
        completed_requests=completed_requests,
        total_offers_received=total_offers,
        average_offers_per_request=avg_offers,
        total_procurement_value=total_value
    )


@router.get("/{request_id}", response_model=SupplyRequestResponse)
def get_supply_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get supply request by ID (Admin only)
    """
    db_request = crud.get_supply_request(db, request_id)
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supply request not found"
        )
    
    # Add related data
    response = SupplyRequestResponse.from_orm(db_request)
    if db_request.product:
        response.product_name = db_request.product.name
    if db_request.supplier:
        response.supplier_name = db_request.supplier.name
    if db_request.created_by:
        response.created_by_name = db_request.created_by.full_name
    response.offers_count = len(db_request.offers) if db_request.offers else 0
    
    return response


@router.get("/{request_id}/offers", response_model=List[SupplyOfferResponse])
def get_request_offers(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get all offers for a supply request (Admin only)
    """
    from app.schemas.supply_request import SupplyOfferFilter
    
    filters = SupplyOfferFilter(supply_request_id=request_id)
    offers = crud.get_supply_offers(db, filters)
    
    # Add related data
    responses = []
    for offer in offers:
        response = SupplyOfferResponse.from_orm(offer)
        if offer.supplier:
            response.supplier_name = offer.supplier.name
            response.supplier_rating = offer.supplier.rating
            response.supplier_on_time_rate = offer.supplier.on_time_delivery_rate
        if offer.supply_request:
            response.request_number = offer.supply_request.request_number
            if offer.supply_request.product:
                response.product_name = offer.supply_request.product.name
        responses.append(response)
    
    return responses


@router.put("/{request_id}", response_model=SupplyRequestResponse)
def update_supply_request(
    request_id: str,
    request_update: SupplyRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update supply request (Admin only)
    """
    db_request = crud.update_supply_request(db, request_id, request_update)
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supply request not found"
        )
    
    # Add related data
    response = SupplyRequestResponse.from_orm(db_request)
    if db_request.product:
        response.product_name = db_request.product.name
    if db_request.supplier:
        response.supplier_name = db_request.supplier.name
    if db_request.created_by:
        response.created_by_name = db_request.created_by.full_name
    response.offers_count = len(db_request.offers) if db_request.offers else 0
    
    return response


@router.post("/{request_id}/accept-offer", response_model=SupplyOfferResponse)
def accept_offer(
    request_id: str,
    accept_request: AcceptOfferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Accept a supplier offer (Admin only)
    
    This will:
    - Mark the offer as accepted
    - Update request status to accepted
    - Reject all other pending offers for this request
    - Send notifications to suppliers (accepted/rejected)
    """
    import logging
    from app.utils.procurement_notifications import notify_supplier_offer_accepted, notify_supplier_offer_rejected
    from app.models.supply_request import SupplyOffer, SupplyOfferStatus
    
    logger = logging.getLogger(__name__)
    
    # Get all offers for this request before accepting
    all_offers = db.query(SupplyOffer).filter(
        SupplyOffer.supply_request_id == request_id,
        SupplyOffer.status == SupplyOfferStatus.PENDING
    ).all()
    
    db_offer = crud.accept_supply_offer(db, accept_request.offer_id, accept_request.admin_notes, current_user.id)
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found or already processed"
        )
    
    # Send notifications
    try:
        # Notify accepted supplier
        notify_supplier_offer_accepted(db, db_offer.id)
        logger.info(f"Sent acceptance notification for offer {db_offer.id}")
        
        # Notify rejected suppliers
        for offer in all_offers:
            if offer.id != db_offer.id:
                notify_supplier_offer_rejected(db, offer.id)
                logger.info(f"Sent rejection notification for offer {offer.id}")
    except Exception as e:
        logger.error(f"Failed to send offer notifications: {e}")
    
    # Add related data
    response = SupplyOfferResponse.from_orm(db_offer)
    if db_offer.supplier:
        response.supplier_name = db_offer.supplier.name
        response.supplier_rating = db_offer.supplier.rating
        response.supplier_on_time_rate = db_offer.supplier.on_time_delivery_rate
    if db_offer.supply_request:
        response.request_number = db_offer.supply_request.request_number
        if db_offer.supply_request.product:
            response.product_name = db_offer.supply_request.product.name
    
    return response


@router.post("/{request_id}/reject-offer", response_model=SupplyOfferResponse)
def reject_offer(
    request_id: str,
    reject_request: RejectOfferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Reject a supplier offer (Admin only)
    """
    db_offer = crud.reject_supply_offer(db, reject_request.offer_id, reject_request.rejection_reason)
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found or already processed"
        )
    
    # Add related data
    response = SupplyOfferResponse.from_orm(db_offer)
    if db_offer.supplier:
        response.supplier_name = db_offer.supplier.name
        response.supplier_rating = db_offer.supplier.rating
        response.supplier_on_time_rate = db_offer.supplier.on_time_delivery_rate
    if db_offer.supply_request:
        response.request_number = db_offer.supply_request.request_number
        if db_offer.supply_request.product:
            response.product_name = db_offer.supply_request.product.name
    
    return response


@router.post("/{request_id}/cancel", response_model=SupplyRequestResponse)
def cancel_supply_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Cancel supply request (Admin only)
    """
    db_request = crud.cancel_supply_request(db, request_id)
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supply request not found"
        )
    
    # Add related data
    response = SupplyRequestResponse.from_orm(db_request)
    if db_request.product:
        response.product_name = db_request.product.name
    if db_request.supplier:
        response.supplier_name = db_request.supplier.name
    if db_request.created_by:
        response.created_by_name = db_request.created_by.full_name
    response.offers_count = len(db_request.offers) if db_request.offers else 0
    
    return response


@router.post("/broadcast", response_model=SupplyRequestResponse, status_code=status.HTTP_201_CREATED)
def broadcast_supply_request(
    request: BroadcastRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create broadcast/open supply request (Admin only)
    For products not in marketplace - sends to all suppliers
    """
    from app.models.supply_request import SupplyRequest, SupplyRequestStatus
    from app.models.supplier import Supplier
    import uuid
    from datetime import datetime
    
    # Generate request number
    request_count = db.query(SupplyRequest).count()
    request_number = f"RFS-{(request_count + 1):05d}"
    
    # Create supply request
    db_request = SupplyRequest(
        id=str(uuid.uuid4()),
        request_number=request_number,
        product_id=None,  # No product ID for broadcast
        product_name=request.product_name,  # Product name instead
        quantity_needed=request.quantity_needed,
        unit_type=request.unit_type,
        supplier_id=None,  # No specific supplier
        is_open_request=True,  # Open to all
        target_categories=[request.category_id] if request.category_id else None,
        required_by_date=request.required_by_date,
        delivery_location="Main Warehouse",
        max_budget=request.target_price * request.quantity_needed if request.target_price else None,
        estimated_unit_price=request.target_price,
        special_requirements=request.special_requirements,
        internal_notes=f"Broadcast request created from marketplace",
        status=SupplyRequestStatus.SENT,
        created_by_user_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Get all suppliers (or filter by category if provided)
    if request.category_id:
        # TODO: Filter suppliers by category specialization
        suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    else:
        suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    
    # TODO: Send notifications to all suppliers
    # for supplier in suppliers:
    #     send_notification(supplier.id, f"New supply request: {request.product_name}")
    
    # Prepare response
    response = SupplyRequestResponse.from_orm(db_request)
    response.product_name = request.product_name
    response.created_by_name = current_user.full_name if hasattr(current_user, 'full_name') else current_user.email
    response.offers_count = 0
    
    return response


@router.get("/analytics")
def get_procurement_analytics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get procurement analytics (Admin only)
    
    Returns comprehensive analytics including:
    - Total requests and offers
    - Active suppliers
    - Response times
    - Cost savings
    - Top suppliers
    - Request status distribution
    """
    from sqlalchemy import func, desc
    from app.models.supply_request import SupplyRequest, SupplyOffer
    from app.models.supplier import Supplier
    from datetime import datetime, timedelta
    from decimal import Decimal
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Total requests
    total_requests = db.query(SupplyRequest).filter(
        SupplyRequest.created_at >= start_date
    ).count()
    
    # Total offers
    total_offers = db.query(SupplyOffer).filter(
        SupplyOffer.created_at >= start_date
    ).count()
    
    # Active suppliers (suppliers who made offers)
    active_suppliers = db.query(func.count(func.distinct(SupplyOffer.supplier_id))).filter(
        SupplyOffer.created_at >= start_date
    ).scalar() or 0
    
    # Average response time (in hours)
    avg_response = db.query(
        func.avg(
            func.extract('epoch', SupplyOffer.created_at - SupplyRequest.created_at) / 3600
        )
    ).join(
        SupplyRequest, SupplyOffer.supply_request_id == SupplyRequest.id
    ).filter(
        SupplyOffer.created_at >= start_date
    ).scalar()
    
    average_response_time = float(avg_response) if avg_response else 0.0
    
    # Acceptance rate
    total_offers_count = db.query(SupplyOffer).filter(
        SupplyOffer.created_at >= start_date
    ).count()
    accepted_offers = db.query(SupplyOffer).filter(
        SupplyOffer.created_at >= start_date,
        SupplyOffer.status == "accepted"
    ).count()
    acceptance_rate = (accepted_offers / total_offers_count * 100) if total_offers_count > 0 else 0.0
    
    # Cost savings (difference between highest and accepted offers)
    cost_savings = Decimal("0.00")
    
    # Top suppliers by total value
    top_suppliers = db.query(
        Supplier.id,
        Supplier.name,
        func.count(SupplyOffer.id).label('total_orders'),
        func.sum(SupplyOffer.total_price).label('total_value'),
        Supplier.rating,
        Supplier.on_time_delivery_rate
    ).join(
        SupplyOffer, Supplier.id == SupplyOffer.supplier_id
    ).filter(
        SupplyOffer.created_at >= start_date,
        SupplyOffer.status == "accepted"
    ).group_by(
        Supplier.id
    ).order_by(
        desc('total_value')
    ).limit(5).all()
    
    top_suppliers_list = [
        {
            "id": str(s.id),
            "name": s.name,
            "totalOrders": s.total_orders,
            "totalValue": float(s.total_value or 0),
            "rating": float(s.rating or 0),
            "onTimeRate": float(s.on_time_delivery_rate or 0)
        }
        for s in top_suppliers
    ]
    
    # Request status distribution
    requests_by_status = {
        "pending": db.query(SupplyRequest).filter(
            SupplyRequest.created_at >= start_date,
            SupplyRequest.status == "pending"
        ).count(),
        "accepted": db.query(SupplyRequest).filter(
            SupplyRequest.created_at >= start_date,
            SupplyRequest.status == "awarded"
        ).count(),
        "rejected": db.query(SupplyRequest).filter(
            SupplyRequest.created_at >= start_date,
            SupplyRequest.status == "cancelled"
        ).count(),
        "completed": db.query(SupplyRequest).filter(
            SupplyRequest.created_at >= start_date,
            SupplyRequest.status == "completed"
        ).count()
    }
    
    # Monthly trends (last 5 months)
    monthly_trends = []
    for i in range(4, -1, -1):
        month_start = end_date - timedelta(days=30 * (i + 1))
        month_end = end_date - timedelta(days=30 * i)
        
        month_requests = db.query(SupplyRequest).filter(
            SupplyRequest.created_at >= month_start,
            SupplyRequest.created_at < month_end
        ).count()
        
        month_spending = db.query(func.sum(SupplyOffer.total_price)).filter(
            SupplyOffer.created_at >= month_start,
            SupplyOffer.created_at < month_end,
            SupplyOffer.status == "accepted"
        ).scalar() or 0
        
        monthly_trends.append({
            "month": month_start.strftime("%b"),
            "requests": month_requests,
            "spending": float(month_spending)
        })
    
    # Price comparison data (mock for now - can be enhanced)
    price_comparison = []
    
    return {
        "totalRequests": total_requests,
        "totalOffers": total_offers,
        "totalSuppliers": active_suppliers,
        "averageResponseTime": round(average_response_time, 1),
        "acceptanceRate": round(acceptance_rate, 1),
        "costSavings": float(cost_savings),
        "topSuppliers": top_suppliers_list,
        "priceComparison": price_comparison,
        "requestsByStatus": requests_by_status,
        "monthlyTrends": monthly_trends
    }
