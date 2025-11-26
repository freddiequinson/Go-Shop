"""
Supplier management endpoints for GoShopGhana Admin
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
import math
import logging

from app.db.database import get_db
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierResponse, SupplierListResponse,
    SupplierProductCreate, SupplierProductUpdate, SupplierProductResponse,
    SupplierPerformance, SupplierFilter
)
from app.crud.supplier import (
    create_supplier, get_supplier_by_id, get_suppliers, update_supplier,
    delete_supplier, verify_supplier, create_supplier_product,
    get_supplier_products, get_product_suppliers, update_supplier_product,
    set_preferred_supplier, get_supplier_performance, search_suppliers,
    get_top_suppliers
)
from app.core.deps import get_current_admin
from app.models.user import User
from app.models.audit_log import AuditLog
import uuid
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

def log_audit(db: Session, user: User, action: str, description: str, resource_type: str, resource_id: str, details: dict = None):
    """Helper function to log audit events"""
    try:
        audit_log = AuditLog(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user.id) if user and user.id else None,
            user_email=user.email if user else None,
            user_name=user.full_name if user else None,
            action=action,
            action_description=description,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            status="success",
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log audit: {e}")


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_new_supplier(
    supplier: SupplierCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new supplier (Admin only)
    Auto-creates user account for supplier login
    """
    import secrets
    import string
    from app.crud.user import create_user, get_user_by_email
    from app.schemas.user import UserCreate
    from app.core.email import send_welcome_email
    from app.core.sms import send_welcome_sms
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Create supplier first
    db_supplier = create_supplier(db, supplier)
    
    # Log audit
    log_audit(
        db, current_user, "SUPPLIER_CREATE",
        f"Created supplier: {supplier.name}",
        "supplier", db_supplier.id,
        {"supplier_code": db_supplier.supplier_code, "type": supplier.supplier_type}
    )
    
    # Auto-create user account (requires either email or phone)
    logger.info(f"Checking if user account should be created for supplier {supplier.name}")
    logger.info(f"Supplier email: {supplier.email}, phone: {supplier.phone}")
    
    if supplier.email or supplier.phone:
        # Check if user already exists by email or phone
        existing_user = None
        if supplier.email:
            existing_user = get_user_by_email(db, supplier.email)
            logger.info(f"Checked for existing user with email {supplier.email}: {'Found' if existing_user else 'Not found'}")
        
        # Also check by phone if no user found by email
        if not existing_user and supplier.phone:
            from app.crud.user import get_user_by_phone
            existing_user = get_user_by_phone(db, supplier.phone)
            logger.info(f"Checked for existing user with phone {supplier.phone}: {'Found' if existing_user else 'Not found'}")
        
        if not existing_user:
            logger.info("Creating new user account for supplier...")
            
            # Create simple username from supplier name (remove spaces, lowercase)
            base_username = ''.join(c.lower() for c in supplier.name if c.isalnum())
            # Limit to 20 characters
            username = base_username[:20]
            
            # Check if username exists, add number if needed
            from app.crud.user import get_user_by_username
            counter = 1
            original_username = username
            while get_user_by_username(db, username):
                username = f"{original_username}{counter}"
                counter += 1
            
            # Generate simple password: FirstName + last 4 digits of phone
            phone_digits = ''.join(c for c in supplier.phone if c.isdigit())
            last_4_digits = phone_digits[-4:] if len(phone_digits) >= 4 else "1234"
            # Get first word of supplier name
            first_word = supplier.name.split()[0] if supplier.name else "Supplier"
            random_password = f"{first_word}{last_4_digits}"
            
            logger.info(f"Generated username: {username}, password: {random_password}")
            
            # Create user account
            user_data = UserCreate(
                email=supplier.email if supplier.email else f"{username}@goshop.local",
                username=username,
                full_name=supplier.name,
                password=random_password,
                phone_number=supplier.phone,
                user_type="supplier"
            )
            
            try:
                db_user = create_user(db, user_data)
                logger.info(f"User account created successfully with ID: {db_user.id}")
                
                # Note: Supplier model doesn't have user_id field, so we skip linking
                logger.info("User account created but not linked to supplier (no user_id field in Supplier model)")
                
                # Send credentials via email if email provided
                if supplier.email:
                    logger.info(f"Attempting to send credentials email to {supplier.email}")
                    try:
                        email_body = f"""
                        <h2>Welcome to Go-Shop Supplier Portal!</h2>
                        <p>Dear {supplier.name},</p>
                        <p>Your supplier account has been created successfully. You can now log in to the supplier portal.</p>
                        <h3>Login Credentials:</h3>
                        <p><strong>Portal URL:</strong> https://goshopghana.com/login</p>
                        <p><strong>Username:</strong> {username}</p>
                        <p><strong>Password:</strong> {random_password}</p>
                        <p><strong>Supplier Code:</strong> {db_supplier.supplier_code}</p>
                        <p style="color: red;"><strong>Important:</strong> Please change your password after first login for security.</p>
                        <p>Best regards,<br>Go-Shop Ghana Team<br>Contact: 0206221924</p>
                        """
                        email_sent = send_welcome_email(supplier.email, supplier.name, custom_body=email_body)
                        if email_sent:
                            logger.info(f"✅ Credentials email sent successfully to {supplier.email}")
                        else:
                            logger.error(f"❌ Failed to send credentials email to {supplier.email}")
                    except Exception as e:
                        logger.error(f"❌ Exception sending credentials email: {type(e).__name__}: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                else:
                    logger.info("No email provided, skipping email notification")
                
                # Send SMS with credentials if phone available
                if supplier.phone:
                    logger.info(f"Attempting to send credentials SMS to {supplier.phone}")
                    try:
                        from app.core.sms import send_sms
                        sms_message = f"Welcome to Go-Shop! Login: goshopghana.com/login | Username: {username} | Password: {random_password} | Code: {db_supplier.supplier_code}"
                        sms_sent = send_sms(supplier.phone, sms_message)
                        if sms_sent:
                            logger.info(f"✅ Credentials SMS sent successfully to {supplier.phone}")
                        else:
                            logger.error(f"❌ Failed to send credentials SMS to {supplier.phone}")
                    except Exception as e:
                        logger.error(f"❌ Exception sending credentials SMS: {type(e).__name__}: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                else:
                    logger.info("No phone provided, skipping SMS notification")
                        
            except Exception as e:
                logger.error(f"❌ Failed to create user account for supplier: {type(e).__name__}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                # Don't fail supplier creation if user creation fails
        else:
            logger.info(f"ℹ️ User account already exists for email {supplier.email}")
            logger.info("Sending supplier portal access notification to existing user...")
            
            # User exists, but they're now also a supplier - send them notification
            try:
                # Send email notification about supplier portal access
                if supplier.email:
                    logger.info(f"Attempting to send supplier portal notification email to {supplier.email}")
                    try:
                        email_body = f"""
                        <h2>Welcome to Go-Shop Supplier Portal!</h2>
                        <p>Dear {supplier.name},</p>
                        <p>Your supplier account has been created in our system. You can now access the supplier portal using your existing Go-Shop Ghana account credentials.</p>
                        <h3>Supplier Details:</h3>
                        <p><strong>Portal URL:</strong> https://goshopghana.com/login</p>
                        <p><strong>Supplier Code:</strong> {db_supplier.supplier_code}</p>
                        <p><strong>Email:</strong> {supplier.email}</p>
                        <p>Please log in with your existing Go-Shop Ghana account credentials to access the supplier portal.</p>
                        <p>Best regards,<br>Go-Shop Ghana Team<br>Contact: 0206221924</p>
                        """
                        email_sent = send_welcome_email(supplier.email, supplier.name, custom_body=email_body)
                        if email_sent:
                            logger.info(f"✅ Supplier portal notification email sent successfully to {supplier.email}")
                        else:
                            logger.error(f"❌ Failed to send supplier portal notification email to {supplier.email}")
                    except Exception as e:
                        logger.error(f"❌ Exception sending supplier portal notification email: {type(e).__name__}: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                
                # Send SMS notification if phone available
                if supplier.phone:
                    logger.info(f"Attempting to send supplier portal notification SMS to {supplier.phone}")
                    try:
                        from app.core.sms import send_sms
                        sms_message = f"Welcome to Go-Shop Supplier Portal! Your supplier account has been created. Supplier Code: {db_supplier.supplier_code}. Login with your existing account at goshopghana.com/login"
                        sms_sent = send_sms(supplier.phone, sms_message)
                        if sms_sent:
                            logger.info(f"✅ Supplier portal notification SMS sent successfully to {supplier.phone}")
                        else:
                            logger.error(f"❌ Failed to send supplier portal notification SMS to {supplier.phone}")
                    except Exception as e:
                        logger.error(f"❌ Exception sending supplier portal notification SMS: {type(e).__name__}: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                        
            except Exception as e:
                logger.error(f"❌ Failed to send notifications to existing user: {type(e).__name__}: {e}")
                import traceback
                logger.error(traceback.format_exc())
    else:
        logger.warning(f"⚠️ Supplier {supplier.name} created without email or phone - no user account created")
    
    return SupplierResponse.model_validate(db_supplier)


@router.get("/", response_model=SupplierListResponse)
async def list_suppliers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    supplier_type: str = Query(None),
    verification_status: str = Query(None),
    is_active: bool = Query(None),
    search: str = Query(None),
    min_rating: float = Query(None),
    location: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all suppliers with filtering (Admin only)
    """
    filters = SupplierFilter(
        supplier_type=supplier_type,
        verification_status=verification_status,
        is_active=is_active,
        search=search,
        min_rating=min_rating,
        location=location
    )
    
    skip = (page - 1) * per_page
    suppliers, total = get_suppliers(db, skip=skip, limit=per_page, filters=filters)
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return SupplierListResponse(
        suppliers=[SupplierResponse.model_validate(s) for s in suppliers],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/search")
async def search_suppliers_endpoint(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Search suppliers by name, code, or contact (Admin only)
    """
    suppliers = search_suppliers(db, q, limit)
    return [SupplierResponse.model_validate(s) for s in suppliers]


@router.get("/top")
async def get_top_suppliers_endpoint(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get top performing suppliers (Admin only)
    """
    suppliers = get_top_suppliers(db, limit)
    return [SupplierResponse.model_validate(s) for s in suppliers]


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get supplier by ID (Admin only)
    """
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return SupplierResponse.model_validate(supplier)


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier_endpoint(
    supplier_id: str,
    supplier_update: SupplierUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update supplier (Admin only)
    """
    supplier = update_supplier(db, supplier_id, supplier_update)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Log audit
    log_audit(
        db, current_user, "SUPPLIER_UPDATE",
        f"Updated supplier: {supplier.name}",
        "supplier", supplier_id,
        {"updated_fields": list(supplier_update.model_dump(exclude_unset=True).keys())}
    )
    
    return SupplierResponse.model_validate(supplier)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete supplier permanently (Admin only)
    """
    # Get supplier info before deletion for audit log
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    supplier_name = supplier.name
    supplier_code = supplier.supplier_code
    
    success = delete_supplier(db, supplier_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete supplier"
        )
    
    # Log audit
    log_audit(
        db, current_user, "SUPPLIER_DELETE",
        f"Deleted supplier: {supplier_name} ({supplier_code})",
        "supplier", supplier_id,
        {"supplier_name": supplier_name, "supplier_code": supplier_code}
    )
    
    return None


@router.post("/{supplier_id}/verify", response_model=SupplierResponse)
async def verify_supplier_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verify a supplier (Admin only)
    """
    supplier = verify_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Log audit
    log_audit(
        db, current_user, "SUPPLIER_VERIFY",
        f"Verified supplier: {supplier.name}",
        "supplier", supplier_id,
        {"supplier_name": supplier.name, "supplier_code": supplier.supplier_code}
    )
    
    return SupplierResponse.model_validate(supplier)


@router.get("/{supplier_id}/performance", response_model=SupplierPerformance)
async def get_supplier_performance_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get supplier performance metrics (Admin only)
    """
    performance = get_supplier_performance(db, supplier_id)
    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return performance


# Supplier Products endpoints
@router.post("/{supplier_id}/products", response_model=SupplierProductResponse, status_code=status.HTTP_201_CREATED)
async def link_product_to_supplier(
    supplier_id: str,
    supplier_product: SupplierProductCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Link a product to a supplier (Admin only)
    """
    # Verify supplier exists
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    db_supplier_product = create_supplier_product(db, supplier_id, supplier_product)
    return SupplierProductResponse.model_validate(db_supplier_product)


@router.get("/{supplier_id}/products", response_model=List[SupplierProductResponse])
async def get_supplier_products_endpoint(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all products from a supplier (Admin only)
    """
    supplier_products = get_supplier_products(db, supplier_id)
    return [SupplierProductResponse.model_validate(sp) for sp in supplier_products]


@router.put("/products/{supplier_product_id}", response_model=SupplierProductResponse)
async def update_supplier_product_endpoint(
    supplier_product_id: str,
    update_data: SupplierProductUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update supplier product link (Admin only)
    """
    supplier_product = update_supplier_product(db, supplier_product_id, update_data)
    if not supplier_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier product link not found"
        )
    return SupplierProductResponse.model_validate(supplier_product)


@router.post("/products/{product_id}/set-preferred/{supplier_id}")
async def set_preferred_supplier_endpoint(
    product_id: str,
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Set preferred supplier for a product (Admin only)
    """
    success = set_preferred_supplier(db, product_id, supplier_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to set preferred supplier"
        )
    return {"message": "Preferred supplier set successfully"}


@router.get("/products/{product_id}/suppliers", response_model=List[SupplierProductResponse])
async def get_product_suppliers_endpoint(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all suppliers for a product (Admin only)
    """
    suppliers = get_product_suppliers(db, product_id)
    return [SupplierProductResponse.model_validate(sp) for sp in suppliers]


@router.get("/by-category/{category_id}", response_model=List[SupplierResponse])
async def get_suppliers_by_category(
    category_id: str,
    include_parent: bool = Query(True, description="Include suppliers specializing in parent category"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all suppliers that specialize in a specific category (Admin only)
    Useful for finding suppliers when products in a category are out of stock
    
    - **category_id**: The category ID to search for
    - **include_parent**: If true, also includes suppliers specializing in the parent category
    """
    from app.models.supplier import Supplier
    from app.models.product import Category
    from sqlalchemy import or_, and_
    
    # Get the category
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Build list of category IDs to search
    category_ids = [category_id]
    
    # If this is a subcategory and include_parent is True, add parent
    if include_parent and category.parent_id:
        category_ids.append(category.parent_id)
    
    # If this is a parent category, add all subcategories
    if not category.parent_id:
        subcategories = db.query(Category).filter(Category.parent_id == category_id).all()
        category_ids.extend([sub.id for sub in subcategories])
    
    # Find suppliers whose specialization array contains any of these category IDs
    suppliers = db.query(Supplier).filter(
        and_(
            Supplier.is_active == True,
            or_(*[Supplier.specialization.contains([cat_id]) for cat_id in category_ids])
        )
    ).all()
    
    return [SupplierResponse.model_validate(s) for s in suppliers]


@router.get("/for-out-of-stock-product/{product_id}", response_model=List[SupplierResponse])
async def get_suppliers_for_out_of_stock_product(
    product_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get suppliers that can supply a product that is out of stock (Admin only)
    Finds suppliers based on the product's category specialization
    
    - **product_id**: The product ID that is out of stock
    """
    from app.models.product import Product
    from app.models.supplier import Supplier
    from app.models.product import Category
    from sqlalchemy import or_, and_
    
    # Get the product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.category_id:
        raise HTTPException(status_code=400, detail="Product has no category assigned")
    
    # Get the category
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Product category not found")
    
    # Build list of category IDs to search (category + parent if exists)
    category_ids = [product.category_id]
    if category.parent_id:
        category_ids.append(category.parent_id)
    
    # Find suppliers whose specialization array contains any of these category IDs
    suppliers = db.query(Supplier).filter(
        and_(
            Supplier.is_active == True,
            or_(*[Supplier.specialization.contains([cat_id]) for cat_id in category_ids])
        )
    ).order_by(Supplier.rating.desc()).all()
    
    return [SupplierResponse.model_validate(s) for s in suppliers]


# Supplier Product Catalog Endpoints
@router.get("/{supplier_id}/catalog")
async def get_supplier_catalog(
    supplier_id: str,
    in_warehouse: bool = Query(False, description="Filter by warehouse status"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get supplier's product catalog (products created by supplier)
    By default shows draft products (not in warehouse)
    """
    from app.models.product import Product
    from app.schemas.product import ProductResponse
    
    query = db.query(Product).filter(
        Product.supplier_id == supplier_id,
        Product.created_by_type == 'supplier',
        Product.in_warehouse == in_warehouse
    )
    
    products = query.all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/{supplier_id}/warehouse-products")
async def get_supplier_warehouse_products(
    supplier_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get supplier products that are in warehouse but not published to shop
    """
    from app.models.product import Product
    from app.schemas.product import ProductResponse
    
    products = db.query(Product).filter(
        Product.supplier_id == supplier_id,
        Product.created_by_type == 'supplier',
        Product.in_warehouse == True,
        Product.is_published == False
    ).all()
    
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/by-product/{product_name}")
async def find_suppliers_by_product(
    product_name: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Find all suppliers who have a product matching the search term in their catalog.
    Returns suppliers with their pricing and availability for that product.
    """
    from app.models.product import Product
    from app.models.supplier import Supplier
    from sqlalchemy import func
    
    # Search for products by name (case-insensitive, partial match)
    products = db.query(Product).filter(
        Product.created_by_type == 'supplier',
        func.lower(Product.name).contains(product_name.lower())
    ).all()
    
    # Group by supplier and collect product info
    supplier_products = {}
    for product in products:
        if product.supplier_id:
            if product.supplier_id not in supplier_products:
                supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
                if supplier:
                    supplier_products[product.supplier_id] = {
                        "supplier_id": supplier.id,
                        "supplier_name": supplier.name,
                        "supplier_code": supplier.supplier_code,
                        "supplier_type": supplier.supplier_type,
                        "rating": float(supplier.rating) if supplier.rating else 0.0,
                        "on_time_delivery_rate": float(supplier.on_time_delivery_rate) if supplier.on_time_delivery_rate else 0.0,
                        "quality_rating": float(supplier.quality_rating) if supplier.quality_rating else 0.0,
                        "verification_status": supplier.verification_status,
                        "products": []
                    }
            
            supplier_products[product.supplier_id]["products"].append({
                "product_id": product.id,
                "product_name": product.name,
                "price_per_unit": float(product.price_per_unit),
                "price_per_quantity": float(product.price_per_quantity) if product.price_per_quantity else None,
                "unit_type": product.unit_type,
                "stock_quantity": float(product.stock_quantity) if product.stock_quantity else 0,
                "minimum_quantity": float(product.minimum_quantity) if product.minimum_quantity else 1,
                "in_warehouse": product.in_warehouse,
                "is_published": product.is_published
            })
    
    # Convert to list and sort by rating
    result = list(supplier_products.values())
    result.sort(key=lambda x: x["rating"], reverse=True)
    
    return {
        "search_term": product_name,
        "total_suppliers": len(result),
        "total_products": len(products),
        "suppliers": result
    }
