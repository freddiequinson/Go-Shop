"""
Bubble API endpoints for GoShopGhana social commerce
Social groups for buyers and sellers with Ghana market context
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.bubble import BubbleType, MemberRole
from app.schemas.bubble import (
    BubbleCreate, BubbleUpdate, BubbleResponse, BubbleSearchRequest,
    BubbleMemberResponse, BubbleMemberInvite, BubbleMemberUpdate,
    BubbleStats, GhanaBubbleTypes, BubbleJoinRequest, BubbleLeaveRequest
)
from app.crud import bubble as crud_bubble

router = APIRouter()


@router.post("/", response_model=BubbleResponse)
async def create_bubble(
    bubble_data: BubbleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new bubble (social group)
    """
    try:
        bubble = crud_bubble.create_bubble(db, bubble_data, current_user.id)
        return bubble
    except Exception as e:
        import traceback
        print(f"Bubble creation error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bubble: {str(e)}"
        )


@router.get("/", response_model=List[BubbleResponse])
async def get_bubbles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None, description="Search query"),
    bubble_type: Optional[BubbleType] = Query(None, description="Filter by bubble type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    region: Optional[str] = Query(None, description="Filter by region"),
    is_public: Optional[bool] = Query(None, description="Filter by public/private"),
    has_fund_transfer: Optional[bool] = Query(None, description="Filter by fund transfer capability"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get bubbles with optional filtering and search
    """
    search_params = BubbleSearchRequest(
        query=query,
        bubble_type=bubble_type,
        location=location,
        region=region,
        is_public=is_public,
        has_fund_transfer=has_fund_transfer,
        skip=skip,
        limit=limit
    )
    
    try:
        bubbles = crud_bubble.get_bubbles(db, skip=skip, limit=limit, search=search_params)
        return bubbles
    except Exception as e:
        import traceback
        print(f"Get bubbles error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get bubbles: {str(e)}"
        )


@router.get("/my-bubbles", response_model=List[BubbleResponse])
async def get_my_bubbles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get bubbles where current user is a member
    """
    bubbles = crud_bubble.get_user_bubbles(db, current_user.id, skip=skip, limit=limit)
    return bubbles


@router.get("/types", response_model=GhanaBubbleTypes)
async def get_ghana_bubble_types():
    """
    Get predefined bubble types for Ghana market
    """
    return GhanaBubbleTypes()


@router.get("/stats", response_model=BubbleStats)
async def get_bubble_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get bubble system statistics
    """
    stats = crud_bubble.get_bubble_statistics(db)
    return stats


@router.get("/{bubble_id}", response_model=BubbleResponse)
async def get_bubble(
    bubble_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get bubble by ID
    """
    bubble = crud_bubble.get_bubble_by_id(db, bubble_id)
    if not bubble:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bubble not found"
        )
    
    # Check if bubble is public or user is a member
    if not bubble.is_public:
        member = crud_bubble.get_bubble_member(db, bubble_id, current_user.id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private bubble"
            )
    
    return bubble


@router.put("/{bubble_id}", response_model=BubbleResponse)
async def update_bubble(
    bubble_id: str,
    bubble_data: BubbleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update bubble (admin/owner only)
    """
    try:
        bubble = crud_bubble.update_bubble(db, bubble_id, bubble_data, current_user.id)
        if not bubble:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bubble not found"
            )
        return bubble
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update bubble: {str(e)}"
        )


@router.delete("/{bubble_id}")
async def delete_bubble(
    bubble_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete/archive bubble (owner only)
    """
    try:
        success = crud_bubble.delete_bubble(db, bubble_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bubble not found"
            )
        return {"message": "Bubble archived successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# Member management endpoints
@router.post("/{bubble_id}/join", response_model=BubbleMemberResponse)
async def join_bubble(
    bubble_id: str,
    join_request: BubbleJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Join a bubble
    """
    try:
        member = crud_bubble.join_bubble(db, bubble_id, current_user.id, join_request.message)
        return member
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{bubble_id}/leave")
async def leave_bubble(
    bubble_id: str,
    leave_request: BubbleLeaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Leave a bubble
    """
    try:
        success = crud_bubble.leave_bubble(db, bubble_id, current_user.id, leave_request.reason)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to leave bubble"
            )
        return {"message": "Left bubble successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{bubble_id}/members", response_model=List[BubbleMemberResponse])
async def get_bubble_members(
    bubble_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get bubble members (members only)
    """
    # Check if user is a member
    member = crud_bubble.get_bubble_member(db, bubble_id, current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only bubble members can view member list"
        )
    
    members = crud_bubble.get_bubble_members(db, bubble_id, skip=skip, limit=limit)
    return members


@router.put("/{bubble_id}/members/{user_id}/role")
async def update_member_role(
    bubble_id: str,
    user_id: str,
    new_role: MemberRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update member role (admin/owner only)
    """
    try:
        member = crud_bubble.update_member_role(db, bubble_id, user_id, new_role, current_user.id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        return {"message": f"Member role updated to {new_role.value}"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# Ghana-specific endpoints
@router.get("/ghana/regions")
async def get_ghana_regions():
    """
    Get Ghana regions for bubble creation
    """
    ghana_regions = [
        "Greater Accra", "Ashanti", "Northern", "Western", "Eastern",
        "Central", "Volta", "Upper East", "Upper West", "Brong-Ahafo",
        "Western North", "Ahafo", "Bono", "Bono East", "Oti", "Savannah"
    ]
    return {"regions": ghana_regions}


@router.get("/ghana/popular-locations")
async def get_popular_locations():
    """
    Get popular trading locations in Ghana
    """
    popular_locations = {
        "Greater Accra": [
            "Kaneshie Market", "Makola Market", "Madina Market", 
            "Okaishie Market", "Tema Station", "Agbogbloshie Market"
        ],
        "Ashanti": [
            "Kejetia Market", "Central Market Kumasi", "Bantama Market",
            "Asafo Market", "Suame Magazine"
        ],
        "Northern": [
            "Tamale Central Market", "Yendi Market", "Salaga Market"
        ],
        "Western": [
            "Takoradi Market Circle", "Sekondi Market"
        ],
        "Eastern": [
            "Koforidua Central Market", "Nkawkaw Market"
        ]
    }
    return {"locations": popular_locations}


@router.get("/ghana/products")
async def get_ghana_products():
    """
    Get common Ghana products for bubble categorization
    """
    ghana_products = {
        "staples": [
            "Yam", "Plantain", "Cassava", "Rice", "Maize", "Cocoyam"
        ],
        "vegetables": [
            "Tomatoes", "Onions", "Pepper", "Okra", "Garden Eggs", "Cabbage"
        ],
        "proteins": [
            "Fish", "Chicken", "Beef", "Goat", "Pork", "Eggs"
        ],
        "oils_spices": [
            "Palm Oil", "Groundnut Oil", "Ginger", "Garlic", "Nutmeg"
        ],
        "processed": [
            "Gari", "Kenkey", "Banku", "Fufu", "Palm Nut Soup"
        ],
        "cash_crops": [
            "Cocoa", "Coffee", "Cashew", "Shea", "Oil Palm"
        ]
    }
    return {"products": ghana_products}
