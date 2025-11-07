"""
Rider and Delivery management endpoints for GoShopGhana Admin
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import math

from app.db.database import get_db
from app.schemas.rider import (
    RiderCreate, RiderUpdate, RiderResponse, RiderListResponse,
    DeliveryAssignmentCreate, DeliveryAssignmentUpdate, DeliveryAssignmentResponse, DeliveryListResponse,
    RiderLocationCreate, RiderLocationResponse,
    RiderPerformance, RiderFilter, RiderStatusUpdate, DeliveryStatusUpdate
)
from app.crud.rider import (
    create_rider, get_rider_by_id, get_riders, update_rider,
    update_rider_status, delete_rider, verify_rider, get_available_riders,
    create_delivery_assignment, get_delivery_assignment, get_delivery_by_order,
    get_rider_deliveries, get_active_deliveries, update_delivery_assignment,
    create_rider_location, get_rider_current_location, get_rider_location_history,
    get_rider_performance, search_riders, get_top_riders
)
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.rider import RiderStatus, DeliveryStatus

router = APIRouter()


# Rider Endpoints
@router.post("/", response_model=RiderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_rider(
    rider: RiderCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Register a new rider (Admin only)
    Auto-creates user account and sends credentials via SMS/Email
    """
    import secrets
    import string
    import logging
    from app.crud.user import create_user, get_user_by_email, get_user_by_phone, get_user_by_username
    from app.schemas.user import UserCreate
    from app.core.email import send_welcome_email
    from app.core.sms import send_sms
    
    logger = logging.getLogger(__name__)
    
    # First, create user account if phone is provided
    user_id = None
    username = None
    random_password = None
    
    if rider.phone:
        # Check if user already exists
        existing_user = get_user_by_phone(db, rider.phone)
        
        if existing_user:
            logger.info(f"User already exists for phone {rider.phone}, using existing user")
            user_id = existing_user.id
        else:
            logger.info("Creating new user account for rider...")
            
            # Extract phone digits (needed for username and password)
            phone_digits = ''.join(c for c in rider.phone if c.isdigit())
            
            # Generate username from full name (clean and simple)
            if rider.full_name:
                # Remove spaces, special chars, keep only alphanumeric
                clean_name = ''.join(c.lower() for c in rider.full_name if c.isalnum())
                base_username = clean_name[:15]  # Limit to 15 chars
            else:
                # Fallback to phone if no name
                base_username = f"rider{phone_digits[-6:]}"
            
            # Ensure unique username
            username = base_username
            counter = 1
            while get_user_by_username(db, username):
                username = f"{base_username}{counter}"
                counter += 1
            
            # Generate password: Rider + last 4 digits of phone
            last_4_digits = phone_digits[-4:] if len(phone_digits) >= 4 else "1234"
            random_password = f"Rider{last_4_digits}"
            
            logger.info(f"Generated username: {username}, password: {random_password}")
            
            # Get rider name from form or use default
            full_name = rider.full_name if rider.full_name else f"Rider {phone_digits[-4:]}"
            
            # Get email from form or use dummy
            email = rider.email if rider.email else f"{username}@goshop.local"
            
            # Create user account
            user_data = UserCreate(
                email=email,
                username=username,
                full_name=full_name,
                password=random_password,
                phone_number=rider.phone,
                user_type="RIDER"
            )
            
            try:
                db_user = create_user(db, user_data)
                user_id = db_user.id
                logger.info(f"User account created successfully with ID: {user_id}")
                
                # Send credentials via SMS
                try:
                    sms_message = f"Welcome to Go-Shop Rider! Login: goshopghana.com/login | Username: {username} | Password: {random_password}"
                    sms_sent = send_sms(rider.phone, sms_message)
                    if sms_sent:
                        logger.info(f"✅ Credentials SMS sent successfully to {rider.phone}")
                    else:
                        logger.warning(f"⚠️ Failed to send credentials SMS to {rider.phone}")
                except Exception as e:
                    logger.error(f"❌ Error sending credentials SMS: {str(e)}")
                
                # Send credentials via email if real email provided
                if rider.email and not rider.email.endswith("@goshop.local"):
                    try:
                        email_body = f"""
                        <h2>Welcome to Go-Shop Rider Portal!</h2>
                        <p>Dear {full_name},</p>
                        <p>Your rider account has been created successfully. You can now log in to start accepting deliveries.</p>
                        <h3>Login Credentials:</h3>
                        <p><strong>Portal URL:</strong> https://goshopghana.com/login</p>
                        <p><strong>Username:</strong> {username}</p>
                        <p><strong>Password:</strong> {random_password}</p>
                        <p><strong>Rider Code:</strong> Will be assigned after account creation</p>
                        <br>
                        <p><strong>Important:</strong> Please change your password after first login for security.</p>
                        <p>If you have any questions, please contact our support team.</p>
                        <br>
                        <p>Best regards,<br>Go-Shop Ghana Team</p>
                        """
                        email_sent = send_welcome_email(rider.email, full_name, email_body)
                        if email_sent:
                            logger.info(f"✅ Credentials email sent successfully to {rider.email}")
                        else:
                            logger.warning(f"⚠️ Failed to send credentials email to {rider.email}")
                    except Exception as e:
                        logger.error(f"❌ Error sending credentials email: {str(e)}")
                
            except Exception as e:
                logger.error(f"Failed to create user account: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create user account: {str(e)}"
                )
    
    # Update rider data with user_id if created
    if user_id and not rider.user_id:
        rider.user_id = user_id
    
    # Create rider record (full_name and email are excluded in the CRUD function)
    db_rider = create_rider(db, rider)
    
    logger.info(f"Rider created successfully: {db_rider.rider_code}")
    
    return RiderResponse.model_validate(db_rider)


@router.get("/", response_model=RiderListResponse)
async def list_riders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_status: RiderStatus = Query(None),
    vehicle_type: str = Query(None),
    is_active: bool = Query(None),
    is_verified: bool = Query(None),
    is_online: bool = Query(None),
    search: str = Query(None),
    min_rating: float = Query(None),
    coverage_area: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all riders with filtering (Admin only)
    """
    filters = RiderFilter(
        current_status=current_status,
        vehicle_type=vehicle_type,
        is_active=is_active,
        is_verified=is_verified,
        is_online=is_online,
        search=search,
        min_rating=min_rating,
        coverage_area=coverage_area
    )
    
    skip = (page - 1) * per_page
    riders, total = get_riders(db, skip=skip, limit=per_page, filters=filters)
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return RiderListResponse(
        riders=[RiderResponse.model_validate(r) for r in riders],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/search")
async def search_riders_endpoint(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Search riders by code or phone (Admin only)
    """
    riders = search_riders(db, q, limit)
    return [RiderResponse.model_validate(r) for r in riders]


@router.get("/available")
async def get_available_riders_endpoint(
    coverage_area: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get available riders (Admin only)
    """
    riders = get_available_riders(db, coverage_area)
    return [RiderResponse.model_validate(r) for r in riders]


@router.get("/top")
async def get_top_riders_endpoint(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get top performing riders (Admin only)
    """
    riders = get_top_riders(db, limit)
    return [RiderResponse.model_validate(r) for r in riders]


@router.get("/{rider_id}", response_model=RiderResponse)
async def get_rider(
    rider_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get rider by ID (Admin only)
    """
    rider = get_rider_by_id(db, rider_id)
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    return RiderResponse.model_validate(rider)


@router.put("/{rider_id}", response_model=RiderResponse)
async def update_rider_endpoint(
    rider_id: str,
    rider_update: RiderUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update rider (Admin only)
    """
    rider = update_rider(db, rider_id, rider_update)
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    return RiderResponse.model_validate(rider)


@router.delete("/{rider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rider_endpoint(
    rider_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete (deactivate) rider (Admin only)
    """
    success = delete_rider(db, rider_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    return None


@router.post("/{rider_id}/verify", response_model=RiderResponse)
async def verify_rider_endpoint(
    rider_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verify a rider (Admin only)
    """
    rider = verify_rider(db, rider_id)
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    return RiderResponse.model_validate(rider)


@router.put("/{rider_id}/status", response_model=RiderResponse)
async def update_rider_status_endpoint(
    rider_id: str,
    status_update: RiderStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update rider status (Admin only)
    """
    rider = update_rider_status(db, rider_id, status_update.current_status)
    if not rider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    return RiderResponse.model_validate(rider)


@router.get("/{rider_id}/performance", response_model=RiderPerformance)
async def get_rider_performance_endpoint(
    rider_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get rider performance metrics (Admin only)
    """
    performance = get_rider_performance(db, rider_id)
    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found"
        )
    return performance


@router.get("/{rider_id}/deliveries", response_model=List[DeliveryAssignmentResponse])
async def get_rider_deliveries_endpoint(
    rider_id: str,
    status_filter: DeliveryStatus = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get rider's delivery history (Admin only)
    """
    deliveries = get_rider_deliveries(db, rider_id, status_filter, skip, limit)
    return [DeliveryAssignmentResponse.model_validate(d) for d in deliveries]


# Delivery Assignment Endpoints
@router.post("/deliveries", response_model=DeliveryAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_delivery_assignment_endpoint(
    assignment: DeliveryAssignmentCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Assign an order to a rider (Admin only)
    """
    db_assignment = create_delivery_assignment(db, assignment, current_user.id)
    return DeliveryAssignmentResponse.model_validate(db_assignment)


@router.get("/deliveries", response_model=DeliveryListResponse)
async def list_deliveries(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: DeliveryStatus = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all deliveries (Admin only)
    """
    skip = (page - 1) * per_page
    
    if status_filter:
        deliveries = get_rider_deliveries(db, "", status_filter, skip, per_page)
        total = len(deliveries)
    else:
        deliveries = get_active_deliveries(db, skip, per_page)
        total = len(deliveries)
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return DeliveryListResponse(
        deliveries=[DeliveryAssignmentResponse.model_validate(d) for d in deliveries],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/deliveries/active", response_model=List[DeliveryAssignmentResponse])
async def get_active_deliveries_endpoint(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all active deliveries (Admin only)
    """
    deliveries = get_active_deliveries(db, skip=0, limit=limit)
    return [DeliveryAssignmentResponse.model_validate(d) for d in deliveries]


@router.get("/deliveries/{delivery_id}", response_model=DeliveryAssignmentResponse)
async def get_delivery(
    delivery_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get delivery by ID (Admin only)
    """
    delivery = get_delivery_assignment(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    return DeliveryAssignmentResponse.model_validate(delivery)


@router.get("/deliveries/order/{order_id}", response_model=DeliveryAssignmentResponse)
async def get_delivery_by_order_endpoint(
    order_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get delivery by order ID (Admin only)
    """
    delivery = get_delivery_by_order(db, order_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found for this order"
        )
    return DeliveryAssignmentResponse.model_validate(delivery)


@router.put("/deliveries/{delivery_id}", response_model=DeliveryAssignmentResponse)
async def update_delivery_endpoint(
    delivery_id: str,
    update_data: DeliveryAssignmentUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update delivery assignment (Admin only)
    """
    delivery = update_delivery_assignment(db, delivery_id, update_data)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    return DeliveryAssignmentResponse.model_validate(delivery)


@router.put("/deliveries/{delivery_id}/status", response_model=DeliveryAssignmentResponse)
async def update_delivery_status_endpoint(
    delivery_id: str,
    status_update: DeliveryStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update delivery status (Admin only)
    """
    update_data = DeliveryAssignmentUpdate(
        status=status_update.status,
        delivery_notes=status_update.notes
    )
    delivery = update_delivery_assignment(db, delivery_id, update_data)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    return DeliveryAssignmentResponse.model_validate(delivery)


# Location Tracking Endpoints
@router.post("/{rider_id}/location", response_model=RiderLocationResponse, status_code=status.HTTP_201_CREATED)
async def update_rider_location(
    rider_id: str,
    location: RiderLocationCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update rider location (Admin only)
    """
    db_location = create_rider_location(db, rider_id, location)
    return RiderLocationResponse.model_validate(db_location)


@router.get("/{rider_id}/location", response_model=RiderLocationResponse)
async def get_rider_location(
    rider_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get rider's current location (Admin only)
    """
    location = get_rider_current_location(db, rider_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data found for this rider"
        )
    return RiderLocationResponse.model_validate(location)


@router.get("/{rider_id}/location/history", response_model=List[RiderLocationResponse])
async def get_rider_location_history_endpoint(
    rider_id: str,
    hours: int = Query(24, ge=1, le=168),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get rider location history (Admin only)
    """
    locations = get_rider_location_history(db, rider_id, hours, limit)
    return [RiderLocationResponse.model_validate(loc) for loc in locations]
