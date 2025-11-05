"""
User Address API endpoints
Handles delivery address management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.user_address import (
    UserAddressCreate,
    UserAddressUpdate,
    UserAddressResponse,
    UserAddressListResponse,
    SetDefaultAddressRequest
)
from app.crud import user_address as crud_address

router = APIRouter()


@router.post("/", response_model=UserAddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    address: UserAddressCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new delivery address for the current user
    """
    db_address = crud_address.create_address(db, current_user.id, address)
    return db_address


@router.get("/", response_model=UserAddressListResponse)
def list_addresses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all delivery addresses for the current user
    """
    addresses = crud_address.get_user_addresses(db, current_user.id)
    default_address = crud_address.get_default_address(db, current_user.id)
    
    return UserAddressListResponse(
        addresses=addresses,
        total=len(addresses),
        default_address_id=default_address.id if default_address else None
    )


@router.get("/default", response_model=UserAddressResponse)
def get_default_address(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the default delivery address for the current user
    """
    address = crud_address.get_default_address(db, current_user.id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default address found"
        )
    return address


@router.get("/{address_id}", response_model=UserAddressResponse)
def get_address(
    address_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific delivery address by ID
    """
    address = crud_address.get_address_by_id(db, address_id, current_user.id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    return address


@router.put("/{address_id}", response_model=UserAddressResponse)
def update_address(
    address_id: str,
    address_update: UserAddressUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a delivery address
    """
    address = crud_address.update_address(db, address_id, current_user.id, address_update)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    return address


@router.put("/{address_id}/set-default", response_model=UserAddressResponse)
def set_default_address(
    address_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Set an address as the default delivery address
    """
    address = crud_address.set_default_address(db, address_id, current_user.id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a delivery address
    """
    success = crud_address.delete_address(db, address_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
    return None
