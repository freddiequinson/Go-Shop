"""
Admin endpoints for Image Library and Analytics
Combined endpoint file for admin-specific features
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
import math

from app.db.database import get_db
from app.schemas.image_library import (
    ImageLibraryCreate, ImageLibraryUpdate, ImageLibraryResponse,
    ImageLibraryListResponse, ImageSearch, BulkImageUpload
)
from app.schemas.analytics import (
    DashboardStats, SalesReport, TopSellingProducts, MostViewedProducts,
    CustomerAnalytics, AdminActivityLogResponse, ActivityLogListResponse,
    AnalyticsDateRange
)
from app.crud.image_library import (
    create_image, get_image_by_id, get_images, update_image,
    delete_image, get_images_by_category, search_images_by_tags
)
from app.crud.analytics import (
    get_admin_activity_logs, get_dashboard_stats,
    get_top_selling_products, get_most_viewed_products,
    get_customer_analytics, track_product_view
)
from app.core.deps import get_current_admin
from app.models.user import User

router = APIRouter()


# ============= IMAGE LIBRARY ENDPOINTS =============

@router.post("/images", response_model=ImageLibraryResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    image: ImageLibraryCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Upload image to library (Admin only)
    """
    db_image = create_image(db, image, current_user.id)
    return ImageLibraryResponse.model_validate(db_image)


@router.post("/images/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_upload_images(
    bulk_upload: BulkImageUpload,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Bulk upload images to library (Admin only)
    """
    uploaded_images = []
    for image in bulk_upload.images:
        db_image = create_image(db, image, current_user.id)
        uploaded_images.append(ImageLibraryResponse.model_validate(db_image))
    
    return {
        "message": f"Successfully uploaded {len(uploaded_images)} images",
        "images": uploaded_images
    }


@router.get("/images", response_model=ImageLibraryListResponse)
async def list_images(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    category_id: str = Query(None),
    tags: List[str] = Query(None),
    is_active: bool = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all images from library (Admin only)
    """
    search_params = ImageSearch(
        search=search,
        category_id=category_id,
        tags=tags,
        is_active=is_active
    )
    
    skip = (page - 1) * per_page
    images, total = get_images(db, skip=skip, limit=per_page, search=search_params)
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return ImageLibraryListResponse(
        images=[ImageLibraryResponse.model_validate(img) for img in images],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/images/{image_id}", response_model=ImageLibraryResponse)
async def get_image(
    image_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get image by ID (Admin only)
    """
    image = get_image_by_id(db, image_id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    return ImageLibraryResponse.model_validate(image)


@router.put("/images/{image_id}", response_model=ImageLibraryResponse)
async def update_image_endpoint(
    image_id: str,
    update_data: ImageLibraryUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update image metadata (Admin only)
    """
    image = update_image(db, image_id, update_data)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    return ImageLibraryResponse.model_validate(image)


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image_endpoint(
    image_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete image from library (Admin only)
    """
    success = delete_image(db, image_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    return None


@router.get("/images/category/{category_id}", response_model=List[ImageLibraryResponse])
async def get_images_by_category_endpoint(
    category_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get images for a specific category (Admin only)
    """
    images = get_images_by_category(db, category_id, limit)
    return [ImageLibraryResponse.model_validate(img) for img in images]


@router.get("/images/search/tags", response_model=List[ImageLibraryResponse])
async def search_by_tags(
    tags: List[str] = Query(...),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Search images by tags (Admin only)
    """
    images = search_images_by_tags(db, tags, limit)
    return [ImageLibraryResponse.model_validate(img) for img in images]


# ============= ANALYTICS ENDPOINTS =============

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_statistics(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics (Admin only)
    """
    stats = get_dashboard_stats(db)
    return stats


@router.get("/analytics/top-selling", response_model=TopSellingProducts)
async def get_top_selling(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get top selling products (Admin only)
    """
    products = get_top_selling_products(db, limit, days)
    return TopSellingProducts(
        products=products,
        period=f"last_{days}_days"
    )


@router.get("/analytics/most-viewed", response_model=MostViewedProducts)
async def get_most_viewed(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get most viewed products (Admin only)
    """
    products = get_most_viewed_products(db, limit, days)
    return MostViewedProducts(
        products=products,
        period=f"last_{days}_days"
    )


@router.get("/analytics/customers", response_model=CustomerAnalytics)
async def get_customer_analytics_endpoint(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get customer analytics (Admin only)
    """
    analytics = get_customer_analytics(db)
    return analytics


@router.post("/analytics/track-view")
async def track_view(
    product_id: str = Query(...),
    user_id: str = Query(None),
    session_id: str = Query(None),
    referrer: str = Query(None),
    device_type: str = Query(None),
    db: Session = Depends(get_db)
):
    """
    Track product view (Public endpoint)
    """
    track_product_view(db, product_id, user_id, session_id, referrer, device_type)
    return {"message": "View tracked successfully"}


# ============= ACTIVITY LOG ENDPOINTS =============

@router.get("/logs", response_model=ActivityLogListResponse)
async def get_activity_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin_id: str = Query(None),
    action_type: str = Query(None),
    resource_type: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get admin activity logs (Admin only)
    """
    skip = (page - 1) * per_page
    logs, total = get_admin_activity_logs(
        db, admin_id, action_type, resource_type, skip, per_page
    )
    
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    return ActivityLogListResponse(
        logs=[AdminActivityLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/logs/export")
async def export_activity_logs(
    start_date: date = Query(None),
    end_date: date = Query(None),
    admin_id: str = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Export activity logs (Admin only)
    Returns CSV format
    """
    logs, _ = get_admin_activity_logs(db, admin_id, skip=0, limit=10000)
    
    # Filter by date if provided
    if start_date or end_date:
        filtered_logs = []
        for log in logs:
            log_date = log.created_at.date()
            if start_date and log_date < start_date:
                continue
            if end_date and log_date > end_date:
                continue
            filtered_logs.append(log)
        logs = filtered_logs
    
    # Convert to CSV format
    csv_data = "ID,Admin ID,Action,Resource Type,Resource ID,Created At\n"
    for log in logs:
        csv_data += f"{log.id},{log.admin_id},{log.action_type},{log.resource_type},{log.resource_id or ''},{log.created_at}\n"
    
    return {
        "format": "csv",
        "data": csv_data,
        "count": len(logs)
    }
