"""
Pick Lists API endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.deps import get_current_admin, get_current_active_user
from app.models.user import User
from app.schemas.warehouse_management import (
    PickListCreate,
    PickListUpdate,
    PickListResponse,
    PickListListResponse,
    PickListAssign,
    PickListItemUpdate,
    PickListItemResponse
)
from app.crud import pick_lists as crud

router = APIRouter()


@router.post("/", response_model=PickListResponse, status_code=status.HTTP_201_CREATED)
async def create_pick_list(
    pick_list: PickListCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Create a new pick list (Admin only)
    """
    return crud.create_pick_list(db, pick_list)


@router.post("/generate/{order_id}", response_model=PickListResponse, status_code=status.HTTP_201_CREATED)
async def generate_pick_list_from_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Auto-generate pick list from order (Admin only)
    
    Creates pick list items based on order items
    """
    pick_list = crud.generate_pick_list_from_order(db, order_id)
    if not pick_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return pick_list


@router.get("/", response_model=PickListListResponse)
async def list_pick_lists(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None, description="Filter by status"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all pick lists with filters
    """
    pick_lists = crud.get_pick_lists(
        db,
        skip=skip,
        limit=limit,
        status=status,
        assigned_to=assigned_to,
        priority=priority
    )
    
    total = len(pick_lists)  # Simple count for now
    
    return PickListListResponse(
        items=pick_lists,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/stats")
async def get_pick_list_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get pick list statistics (Admin only)
    """
    return crud.get_pick_list_stats(db)


@router.get("/{pick_list_id}", response_model=PickListResponse)
async def get_pick_list(
    pick_list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get pick list by ID
    """
    pick_list = crud.get_pick_list(db, pick_list_id)
    if not pick_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pick list not found"
        )
    return pick_list


@router.put("/{pick_list_id}", response_model=PickListResponse)
async def update_pick_list(
    pick_list_id: str,
    pick_list_update: PickListUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Update pick list (Admin only)
    """
    pick_list = crud.update_pick_list(db, pick_list_id, pick_list_update)
    if not pick_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pick list not found"
        )
    return pick_list


@router.post("/{pick_list_id}/assign", response_model=PickListResponse)
async def assign_pick_list(
    pick_list_id: str,
    assignment: PickListAssign,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Assign pick list to a user (Admin only)
    
    Automatically sets status to in_progress if pending
    """
    pick_list = crud.assign_pick_list(db, pick_list_id, assignment.assigned_to)
    if not pick_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pick list not found"
        )
    return pick_list


@router.put("/{pick_list_id}/items/{item_id}", response_model=PickListItemResponse)
async def update_pick_list_item(
    pick_list_id: str,
    item_id: str,
    item_update: PickListItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update pick list item (mark as picked, update quantities)
    
    Auto-completes pick list when all items are picked
    """
    item = crud.update_pick_list_item(db, item_id, item_update)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pick list item not found"
        )
    return item


@router.post("/{pick_list_id}/complete", response_model=PickListResponse)
async def complete_pick_list(
    pick_list_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Mark pick list as completed (Admin only)
    """
    pick_list = crud.complete_pick_list(db, pick_list_id)
    if not pick_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pick list not found"
        )
    return pick_list


@router.get("/{pick_list_id}/print")
async def print_pick_list(
    pick_list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get pick list in printable format
    """
    pick_list = crud.get_pick_list(db, pick_list_id)
    if not pick_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pick list not found"
        )
    
    # Format for printing
    items_data = []
    for item in pick_list.items:
        items_data.append({
            "product_id": item.product_id,
            "batch_number": item.batch_number,
            "warehouse_location": item.warehouse_location_id,
            "quantity_pieces": float(item.quantity_to_pick_pieces) if item.quantity_to_pick_pieces else None,
            "quantity_weight": float(item.quantity_to_pick_weight) if item.quantity_to_pick_weight else None,
            "weight_unit": item.weight_unit,
            "picked": item.picked,
            "notes": item.notes
        })
    
    return {
        "pick_list_number": pick_list.pick_list_number,
        "order_id": pick_list.order_id,
        "status": pick_list.status,
        "priority": pick_list.priority,
        "assigned_to": pick_list.assigned_to,
        "created_at": pick_list.created_at,
        "items": items_data,
        "total_items": len(items_data),
        "items_picked": sum(1 for item in pick_list.items if item.picked),
        "completion_percentage": pick_list.completion_percentage
    }
