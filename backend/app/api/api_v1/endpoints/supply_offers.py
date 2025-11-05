"""
API endpoints for Supply Offers (Supplier Portal)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserType
from app.models.supplier import Supplier
from app.schemas.supply_request import (
    SupplyOfferCreate, SupplyOfferUpdate, SupplyOfferResponse,
    SupplyRequestResponse, SupplierDashboardStats, DirectOfferCreate, DirectOfferResponse
)
from app.crud import supply_request as crud


router = APIRouter()


def get_current_supplier(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Supplier:
    """Get current supplier from authenticated user"""
    if current_user.user_type != UserType.SUPPLIER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only suppliers can access this endpoint"
        )
    
    # Get supplier linked to this user by email or phone
    from sqlalchemy import or_
    supplier = db.query(Supplier).filter(
        or_(
            Supplier.email == current_user.email,
            Supplier.phone == current_user.phone
        )
    ).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found for this user"
        )
    
    return supplier


@router.get("/profile")
def get_supplier_profile(
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Get current supplier's profile information
    """
    from app.schemas.supplier import SupplierResponse
    return SupplierResponse.from_orm(supplier)


@router.put("/profile")
def update_supplier_profile(
    updates: dict,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier),
    current_user: User = Depends(get_current_user)
):
    """
    Update current supplier's profile information
    """
    from app.crud import supplier as supplier_crud
    from app.models.user import User as UserModel
    
    # Update supplier fields
    updated_supplier = supplier_crud.update_supplier(db, supplier.id, updates)
    
    # Also update the associated user record if phone or email changed
    if 'phone' in updates or 'email' in updates:
        user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
        if user:
            if 'phone' in updates:
                user.phone = updates['phone']
            if 'email' in updates:
                user.email = updates['email']
            db.commit()
    
    from app.schemas.supplier import SupplierResponse
    return SupplierResponse.from_orm(updated_supplier)


@router.put("/credentials")
def update_credentials(
    username: Optional[str] = None,
    password: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Update supplier's login credentials (username and/or password)
    """
    from app.crud import user as user_crud
    from app.core.security import get_password_hash
    
    updates = {}
    
    if username:
        # Check if username is already taken
        existing_user = user_crud.get_user_by_username(db, username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        updates["username"] = username
    
    if password:
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )
        updates["hashed_password"] = get_password_hash(password)
    
    if updates:
        user_crud.update_user(db, current_user.id, updates)
    
    return {"message": "Credentials updated successfully"}


@router.get("/dashboard", response_model=SupplierDashboardStats)
def get_supplier_dashboard(
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Get supplier dashboard statistics
    """
    from sqlalchemy import func
    from app.models.supply_request import SupplyOffer, SupplyRequest
    from decimal import Decimal
    
    # Pending requests (sent to this supplier or open requests matching categories)
    pending_requests = len(crud.get_supplier_requests(db, supplier.id, include_open=True, limit=1000))
    
    # Active offers (pending)
    active_offers = db.query(func.count(SupplyOffer.id)).filter(
        SupplyOffer.supplier_id == supplier.id,
        SupplyOffer.status == "pending"
    ).scalar()
    
    # Accepted offers
    accepted_offers = db.query(func.count(SupplyOffer.id)).filter(
        SupplyOffer.supplier_id == supplier.id,
        SupplyOffer.status == "accepted"
    ).scalar()
    
    # Completed deliveries (from supplier model)
    completed_deliveries = supplier.total_supplies
    
    # Total revenue (sum of accepted and received offers)
    total_revenue = db.query(func.sum(SupplyOffer.total_price)).filter(
        SupplyOffer.supplier_id == supplier.id,
        SupplyOffer.status.in_(["accepted", "received"])
    ).scalar() or Decimal("0")
    
    # Calculate average rating from supplier's rating field (updated by admin/system)
    # If rating is 0, try to use the stored value or default to 0.0
    average_rating = float(supplier.rating) if supplier.rating else 0.0
    
    # Recent requests (last 5)
    recent_requests_raw = crud.get_supplier_requests(db, supplier.id, include_open=True, limit=5)
    recent_requests = []
    for req in recent_requests_raw:
        response = SupplyRequestResponse.from_orm(req)
        if req.product:
            response.product_name = req.product.name
        if req.created_by:
            response.created_by_name = req.created_by.full_name
        response.offers_count = len(req.offers) if req.offers else 0
        recent_requests.append(response)
    
    # Recent offers (last 5)
    from app.schemas.supply_request import SupplyOfferFilter
    recent_offers_raw = crud.get_supply_offers(
        db, 
        SupplyOfferFilter(supplier_id=supplier.id),
        limit=5
    )
    recent_offers = []
    for offer in recent_offers_raw:
        response = SupplyOfferResponse.from_orm(offer)
        if offer.supplier:
            response.supplier_name = offer.supplier.name
        if offer.supply_request:
            response.request_number = offer.supply_request.request_number
            if offer.supply_request.product:
                response.product_name = offer.supply_request.product.name
        recent_offers.append(response)
    
    return SupplierDashboardStats(
        supplier_name=supplier.name,
        pending_requests=pending_requests,
        active_offers=active_offers,
        accepted_offers=accepted_offers,
        completed_deliveries=completed_deliveries,
        total_revenue=total_revenue,
        average_rating=average_rating,
        on_time_delivery_rate=supplier.on_time_delivery_rate,
        recent_requests=recent_requests,
        recent_offers=recent_offers
    )


@router.get("/requests", response_model=List[SupplyRequestResponse])
def get_supplier_requests(
    include_open: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Get supply requests for current supplier
    
    Includes:
    - Direct requests sent to this supplier
    - Open marketplace requests matching supplier categories (if include_open=True)
    """
    requests = crud.get_supplier_requests(db, supplier.id, include_open, skip, limit)
    
    # Add related data
    responses = []
    for req in requests:
        response = SupplyRequestResponse.from_orm(req)
        if req.product:
            response.product_name = req.product.name
        if req.created_by:
            response.created_by_name = req.created_by.full_name
        response.offers_count = len(req.offers) if req.offers else 0
        responses.append(response)
    
    return responses


@router.post("/requests/{request_id}/offer", response_model=SupplyOfferResponse, status_code=status.HTTP_201_CREATED)
def submit_offer(
    request_id: str,
    offer: SupplyOfferCreate,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Submit an offer for a supply request
    """
    # Verify request exists and is open for offers
    request = crud.get_supply_request(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supply request not found"
        )
    
    if request.status not in ["sent", "responded"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request is no longer accepting offers"
        )
    
    # Verify supplier can respond to this request
    if request.supplier_id and request.supplier_id != supplier.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request is for a different supplier"
        )
    
    # Check if supplier already submitted an offer
    from app.models.supply_request import SupplyOffer
    existing_offer = db.query(SupplyOffer).filter(
        SupplyOffer.supply_request_id == request_id,
        SupplyOffer.supplier_id == supplier.id,
        SupplyOffer.status == "pending"
    ).first()
    
    if existing_offer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted an offer for this request"
        )
    
    # Verify offer data matches request
    if offer.supply_request_id != request_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offer request_id does not match URL parameter"
        )
    
    # Create offer
    db_offer = crud.create_supply_offer(db, offer, supplier.id)
    
    # Send notification to admin
    try:
        import logging
        from app.utils.procurement_notifications import notify_admin_new_offer
        from app.core.config import settings
        
        logger = logging.getLogger(__name__)
        
        # Get admin emails from settings or use default
        admin_emails = ["procurement@go-shop.gh"]  # Can be configured in settings
        notify_admin_new_offer(db, db_offer.id, admin_emails)
        logger.info(f"Notified admins about new offer from {supplier.name}")
    except Exception as e:
        logger.error(f"Failed to notify admins: {e}")
    
    # Add related data
    response = SupplyOfferResponse.from_orm(db_offer)
    response.supplier_name = supplier.name
    response.supplier_rating = supplier.rating
    response.supplier_on_time_rate = supplier.on_time_delivery_rate
    if db_offer.supply_request:
        response.request_number = db_offer.supply_request.request_number
        if db_offer.supply_request.product:
            response.product_name = db_offer.supply_request.product.name
    
    return response


@router.get("/offers", response_model=List[SupplyOfferResponse])
def get_supplier_offers(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Get all offers submitted by current supplier
    """
    from app.schemas.supply_request import SupplyOfferFilter
    
    filters = SupplyOfferFilter(
        supplier_id=supplier.id,
        status=status
    )
    
    offers = crud.get_supply_offers(db, filters, skip, limit)
    
    # Add related data
    responses = []
    for offer in offers:
        response = SupplyOfferResponse.from_orm(offer)
        response.supplier_name = supplier.name
        response.supplier_rating = supplier.rating
        response.supplier_on_time_rate = supplier.on_time_delivery_rate
        
        # Get product name and image from supply_request or direct product link
        if offer.supply_request:
            response.request_number = offer.supply_request.request_number
            if offer.supply_request.product:
                response.product_name = offer.supply_request.product.name
                # Get first image if available
                if offer.supply_request.product.images:
                    response.product_image = offer.supply_request.product.images[0]
        elif offer.product:
            # Direct order - get product name and image from product relationship
            response.product_name = offer.product.name
            if offer.product.images:
                response.product_image = offer.product.images[0]
        
        responses.append(response)
    
    return responses


@router.get("/offers/{offer_id}", response_model=SupplyOfferResponse)
def get_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Get specific offer by ID
    """
    db_offer = crud.get_supply_offer(db, offer_id)
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    # Verify this offer belongs to current supplier
    if db_offer.supplier_id != supplier.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This offer belongs to another supplier"
        )
    
    # Add related data
    response = SupplyOfferResponse.from_orm(db_offer)
    response.supplier_name = supplier.name
    response.supplier_rating = supplier.rating
    response.supplier_on_time_rate = supplier.on_time_delivery_rate
    
    # Get product name and image from supply_request or direct product link
    if db_offer.supply_request:
        response.request_number = db_offer.supply_request.request_number
        if db_offer.supply_request.product:
            response.product_name = db_offer.supply_request.product.name
            if db_offer.supply_request.product.images:
                response.product_image = db_offer.supply_request.product.images[0]
    elif db_offer.product:
        # Direct order - get product name and image from product relationship
        response.product_name = db_offer.product.name
        if db_offer.product.images:
            response.product_image = db_offer.product.images[0]
    
    return response


@router.put("/offers/{offer_id}", response_model=SupplyOfferResponse)
def update_offer(
    offer_id: str,
    offer_update: SupplyOfferUpdate,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Update pending offer (only if status is still pending)
    """
    # Verify offer belongs to supplier
    db_offer = crud.get_supply_offer(db, offer_id)
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    if db_offer.supplier_id != supplier.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This offer belongs to another supplier"
        )
    
    if db_offer.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update offer that has been processed"
        )
    
    # Update offer
    updated_offer = crud.update_supply_offer(db, offer_id, offer_update)
    if not updated_offer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update offer"
        )
    
    # Add related data
    response = SupplyOfferResponse.from_orm(updated_offer)
    response.supplier_name = supplier.name
    response.supplier_rating = supplier.rating
    response.supplier_on_time_rate = supplier.on_time_delivery_rate
    if updated_offer.supply_request:
        response.request_number = updated_offer.supply_request.request_number
        if updated_offer.supply_request.product:
            response.product_name = updated_offer.supply_request.product.name
    
    return response


@router.delete("/offers/{offer_id}", response_model=SupplyOfferResponse)
def withdraw_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    """
    Withdraw pending offer
    """
    db_offer = crud.withdraw_supply_offer(db, offer_id, supplier.id)
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found or cannot be withdrawn"
        )
    
    # Add related data
    response = SupplyOfferResponse.from_orm(db_offer)
    response.supplier_name = supplier.name
    response.supplier_rating = supplier.rating
    response.supplier_on_time_rate = supplier.on_time_delivery_rate
    if db_offer.supply_request:
        response.request_number = db_offer.supply_request.request_number
        if db_offer.supply_request.product:
            response.product_name = db_offer.supply_request.product.name
    
    return response


# ============= Direct Order Endpoints (Admin) =============

@router.post("/direct-order", response_model=DirectOfferResponse)
async def create_direct_order(
    offer_data: DirectOfferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create direct offer from marketplace (Admin only)
    No SupplyRequest needed - direct order to supplier
    """
    from app.core.deps import get_current_admin
    from app.models.supply_request import SupplyOffer, SupplyOfferStatus
    from app.models.product import Product
    import uuid
    from datetime import datetime
    
    # Verify admin
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create direct orders"
        )
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == offer_data.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify supplier exists
    supplier = db.query(Supplier).filter(Supplier.id == offer_data.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Calculate total price
    total_price = offer_data.quantity * offer_data.unit_price
    
    # Create direct offer
    new_offer = SupplyOffer(
        id=str(uuid.uuid4()),
        supply_request_id=None,  # No request for direct orders
        supplier_id=offer_data.supplier_id,
        product_id=offer_data.product_id,
        offered_quantity=offer_data.quantity,
        unit_price=offer_data.unit_price,
        total_price=total_price,
        delivery_date=offer_data.delivery_date,
        delivery_fee=0,
        is_direct_order=True,
        order_source='marketplace',
        status=SupplyOfferStatus.PENDING,
        notes=offer_data.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    
    # TODO: Send notification to supplier
    # send_notification(supplier.id, f"New direct order for {product.name}")
    
    # Prepare response
    response = DirectOfferResponse(
        id=new_offer.id,
        product_id=new_offer.product_id,
        supplier_id=new_offer.supplier_id,
        offered_quantity=new_offer.offered_quantity,
        unit_price=new_offer.unit_price,
        total_price=new_offer.total_price,
        delivery_date=new_offer.delivery_date,
        status=new_offer.status.value,
        is_direct_order=new_offer.is_direct_order,
        order_source=new_offer.order_source,
        notes=new_offer.notes,
        created_at=new_offer.created_at,
        updated_at=new_offer.updated_at,
        product_name=product.name,
        supplier_name=supplier.name
    )
    
    return response


@router.put("/{offer_id}/confirm")
async def confirm_direct_order(
    offer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supplier confirms direct order and sends to admin
    """
    from app.models.supply_request import SupplyOffer, SupplyOfferStatus
    from datetime import datetime
    
    # Get supplier
    supplier = get_current_supplier(current_user, db)
    
    # Get offer
    offer = db.query(SupplyOffer).filter(
        SupplyOffer.id == offer_id,
        SupplyOffer.supplier_id == supplier.id
    ).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    if not offer.is_direct_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only direct orders can be confirmed with this endpoint"
        )
    
    if offer.status != SupplyOfferStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm offer with status: {offer.status}"
        )
    
    # Update status to accepted (confirmed by supplier)
    offer.status = SupplyOfferStatus.ACCEPTED
    offer.responded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(offer)
    
    return {
        "message": "Order confirmed and sent to admin",
        "offer_id": offer.id,
        "status": offer.status.value
    }


@router.post("/{offer_id}/receive")
async def receive_direct_order(
    offer_id: str,
    rating_data: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin marks direct order as received, auto-creates GRN, and optionally rates supplier
    """
    from app.models.supply_request import SupplyOffer, SupplyOfferStatus
    from app.models.warehouse import GoodsReceivedNote, QualityCheckStatus, WarehouseInventory
    from app.models.product import Product
    import uuid
    from datetime import datetime
    from decimal import Decimal
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Verify admin
        if current_user.user_type != UserType.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can receive orders"
            )
        
        # Get offer
        offer = db.query(SupplyOffer).filter(SupplyOffer.id == offer_id).first()
        
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        if not offer.is_direct_order:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only direct orders can use this endpoint"
            )
        
        # Check if already received
        if offer.status == SupplyOfferStatus.RECEIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This order has already been received"
            )
        
        if offer.status != SupplyOfferStatus.ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order must be confirmed by supplier first"
            )
        
        # Get product
        product = db.query(Product).filter(Product.id == offer.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Initialize stock if None
        if product.stock_quantity is None:
            product.stock_quantity = Decimal('0')
        
        # Generate GRN number
        grn_count = db.query(GoodsReceivedNote).count()
        grn_number = f"GRN-{(grn_count + 1):05d}"
        
        # Get or create default warehouse location
        from app.models.warehouse import WarehouseLocation
        warehouse_location = db.query(WarehouseLocation).first()
        if not warehouse_location:
            # Create default location if none exists
            from app.models.warehouse import ZoneType
            warehouse_location = WarehouseLocation(
                id=str(uuid.uuid4()),
                name="Main Warehouse",
                code="WH-001",
                zone_type=ZoneType.DRY_STORAGE,
                is_active=True
            )
            db.add(warehouse_location)
            db.flush()
        
        # Create GRN with correct field names and optional rating
        grn = GoodsReceivedNote(
            id=str(uuid.uuid4()),
            grn_number=grn_number,
            supplier_id=offer.supplier_id,
            product_id=offer.product_id,
            warehouse_location_id=warehouse_location.id,
            received_by=current_user.id,
            delivery_date=datetime.utcnow(),
            quality_check_status=QualityCheckStatus.APPROVED,
            quality_check_by=current_user.id,
            quality_check_date=datetime.utcnow(),
            quantity_received_pieces=Decimal(str(offer.offered_quantity)),
            unit_cost=Decimal(str(offer.unit_price)),
            total_cost=Decimal(str(offer.total_price)),
            notes=f"Auto-created from direct order {offer.id}"
        )
        
        # Add rating if provided
        if rating_data:
            grn.supplier_rating = Decimal(str(rating_data.get('rating', 0)))
            grn.supplier_feedback = rating_data.get('feedback')
            grn.rated_at = datetime.utcnow()
            grn.rated_by = current_user.id
            # Update warehouse location if provided in rating
            if rating_data.get('warehouse_location_id'):
                grn.warehouse_location_id = rating_data['warehouse_location_id']
        
        db.add(grn)
        db.flush()  # Get GRN ID and make it available for queries
        
        # Update warehouse inventory
        from app.models.warehouse import WarehouseInventory
        inventory = db.query(WarehouseInventory).filter(
            WarehouseInventory.product_id == offer.product_id
        ).first()
        
        if inventory:
            # Update existing inventory
            inventory.quantity_available += Decimal(str(offer.offered_quantity))
            inventory.last_restocked = datetime.utcnow()
        else:
            # Create new inventory record
            inventory = WarehouseInventory(
                id=str(uuid.uuid4()),
                product_id=offer.product_id,
                quantity_available=Decimal(str(offer.offered_quantity)),
                quantity_reserved=Decimal('0'),
                reorder_point=Decimal('10'),  # Default
                reorder_quantity=Decimal('50'),  # Default
                last_restocked=datetime.utcnow()
            )
            db.add(inventory)
        
        # Deduct from supplier's product stock
        product = db.query(Product).filter(Product.id == offer.product_id).first()
        if product and product.stock_quantity:
            product.stock_quantity = max(Decimal('0'), product.stock_quantity - Decimal(str(offer.offered_quantity)))
        
        # Mark product as in warehouse (CRITICAL FIX)
        product.in_warehouse = True
        
        # Mark offer as received
        offer.status = SupplyOfferStatus.RECEIVED
        offer.received_at = datetime.utcnow()
        
        # Update supplier statistics
        supplier = db.query(Supplier).filter(Supplier.id == offer.supplier_id).first()
        if supplier:
            supplier.total_supplies += 1
            supplier.last_supply_date = datetime.utcnow()
            
            # Calculate on-time delivery rate
            # Check if delivered on or before expected delivery date
            expected_date = offer.delivery_date
            actual_date = datetime.utcnow()
            
            # Get all completed supplies for this supplier
            from app.models.supply_request import SupplyOffer
            completed_offers = db.query(SupplyOffer).filter(
                SupplyOffer.supplier_id == supplier.id,
                SupplyOffer.status == SupplyOfferStatus.RECEIVED
            ).all()
            
            # Calculate on-time deliveries
            on_time_count = 0
            for completed_offer in completed_offers:
                if completed_offer.responded_at and completed_offer.delivery_date:
                    if completed_offer.responded_at <= completed_offer.delivery_date:
                        on_time_count += 1
            
            # Update on-time delivery rate
            total_completed = len(completed_offers)
            if total_completed > 0:
                supplier.on_time_delivery_rate = Decimal(str((on_time_count / total_completed) * 100))
            
            # Calculate and update average ratings if rating was provided
            if rating_data and rating_data.get('rating'):
                # Flush to make current GRN available for query
                db.flush()
                
                # Get all GRNs with ratings for this supplier (including the one just added)
                rated_grns = db.query(GoodsReceivedNote).filter(
                    GoodsReceivedNote.supplier_id == supplier.id,
                    GoodsReceivedNote.supplier_rating.isnot(None)
                ).all()
                
                if rated_grns:
                    # Calculate average rating
                    total_rating = sum(float(grn.supplier_rating) for grn in rated_grns)
                    avg_rating = total_rating / len(rated_grns)
                    
                    # Update supplier ratings
                    supplier.rating = Decimal(str(round(avg_rating, 2)))
                    supplier.quality_rating = Decimal(str(round(avg_rating, 2)))
        
        # Commit all changes
        db.commit()
        db.refresh(grn)
        
        return {
            "message": "Order received successfully",
            "grn_number": grn.grn_number,
            "grn_id": grn.id,
            "warehouse_quantity": float(inventory.quantity_available),
            "supplier_remaining_stock": float(product.stock_quantity),
            "success": True
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        db.rollback()
        raise
    except Exception as e:
        # Rollback on any error
        db.rollback()
        logger.error(f"Error receiving order {offer_id}: {str(e)}", exc_info=True)
        
        # Return user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to receive order: {str(e)}"
        )


@router.get("/admin/all-offers", response_model=List[SupplyOfferResponse])
def get_all_offers_admin(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all offers (Admin only) - for direct orders page
    """
    from app.models.user import UserType
    from app.schemas.supply_request import SupplyOfferFilter
    
    # Check if user is admin
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    filters = SupplyOfferFilter(status=status)
    offers = crud.get_supply_offers(db, filters, skip, limit)
    
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
        if offer.product:
            response.product_name = offer.product.name
        responses.append(response)
    
    return responses
