"""
Fund Transfer API endpoints for GoShopGhana
Wallet-to-wallet transfers between bubble members
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.fund_transfer import TransferStatus, TransferType
from app.schemas.fund_transfer import (
    FundTransferCreate, FundTransferUpdate, FundTransferResponse,
    TransferApprovalRequest, TransferApprovalResponse,
    TransferSearchRequest, TransferStats, TransferValidationResponse,
    UserTransferSummary, BubbleTransferSummary, GhanaTransferTypes
)
from app.crud import fund_transfer as crud_fund_transfer
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=FundTransferResponse)
async def create_fund_transfer(
    transfer_data: FundTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new fund transfer between bubble members
    """
    try:
        transfer = crud_fund_transfer.create_fund_transfer(db, transfer_data, current_user.id)
        return FundTransferResponse.from_orm(transfer)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to create fund transfer: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create fund transfer. Please try again."
        )


@router.get("/", response_model=List[FundTransferResponse])
async def get_my_transfers(
    status_filter: Optional[TransferStatus] = Query(None, description="Filter by transfer status"),
    transfer_type: Optional[TransferType] = Query(None, description="Filter by transfer type"),
    bubble_id: Optional[str] = Query(None, description="Filter by bubble ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's transfers (sent and received)
    """
    try:
        search_params = TransferSearchRequest(
            status=status_filter,
            transfer_type=transfer_type,
            bubble_id=bubble_id,
            skip=skip,
            limit=limit
        )
        
        transfers = crud_fund_transfer.get_user_transfers(
            db, current_user.id, search_params, skip, limit
        )
        return [FundTransferResponse.from_orm(transfer) for transfer in transfers]
    except Exception as e:
        logger.error(f"Failed to get transfers: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transfers. Please try again."
        )


@router.get("/pending-approvals", response_model=List[FundTransferResponse])
async def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get transfers pending approval by current user
    """
    try:
        transfers = crud_fund_transfer.get_pending_approvals(db, current_user.id)
        return [FundTransferResponse.from_orm(transfer) for transfer in transfers]
    except Exception as e:
        logger.error(f"Failed to get pending approvals: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve pending approvals. Please try again."
        )


@router.get("/{transfer_id}", response_model=FundTransferResponse)
async def get_transfer_details(
    transfer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get transfer details by ID
    """
    transfer = crud_fund_transfer.get_transfer_by_id(db, transfer_id)
    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transfer not found"
        )
    
    # Check if user has access to this transfer
    if transfer.sender_id != current_user.id and transfer.recipient_id != current_user.id:
        # Check if user is bubble admin
        from app.models.bubble import BubbleMember, MemberRole, MemberStatus
        from sqlalchemy import and_
        
        bubble_member = db.query(BubbleMember).filter(
            and_(
                BubbleMember.bubble_id == transfer.bubble_id,
                BubbleMember.user_id == current_user.id,
                BubbleMember.status == MemberStatus.ACTIVE,
                BubbleMember.role.in_([MemberRole.OWNER, MemberRole.ADMIN])
            )
        ).first()
        
        if not bubble_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return FundTransferResponse.from_orm(transfer)


@router.post("/{transfer_id}/approve", response_model=FundTransferResponse)
async def approve_transfer(
    transfer_id: str,
    approval_data: TransferApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Approve or reject a fund transfer
    """
    try:
        transfer = crud_fund_transfer.approve_transfer(db, transfer_id, current_user.id, approval_data)
        return FundTransferResponse.from_orm(transfer)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to approve transfer: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve transfer. Please try again."
        )


@router.post("/{transfer_id}/cancel", response_model=FundTransferResponse)
async def cancel_transfer(
    transfer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancel a pending transfer (sender only)
    """
    try:
        transfer = crud_fund_transfer.cancel_transfer(db, transfer_id, current_user.id)
        return FundTransferResponse.from_orm(transfer)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to cancel transfer: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel transfer. Please try again."
        )


@router.get("/bubble/{bubble_id}/transfers", response_model=List[FundTransferResponse])
async def get_bubble_transfers(
    bubble_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all transfers within a bubble (bubble members only)
    """
    # Check if user is bubble member
    from app.models.bubble import BubbleMember, MemberStatus
    from sqlalchemy import and_
    
    bubble_member = db.query(BubbleMember).filter(
        and_(
            BubbleMember.bubble_id == bubble_id,
            BubbleMember.user_id == current_user.id,
            BubbleMember.status == MemberStatus.ACTIVE
        )
    ).first()
    
    if not bubble_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You must be a bubble member to view transfers."
        )
    
    try:
        transfers = crud_fund_transfer.get_bubble_transfers(db, bubble_id, skip, limit)
        return [FundTransferResponse.from_orm(transfer) for transfer in transfers]
    except Exception as e:
        logger.error(f"Failed to get bubble transfers: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bubble transfers. Please try again."
        )


@router.get("/statistics/system", response_model=TransferStats)
async def get_system_transfer_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get system-wide transfer statistics (admin only)
    """
    if current_user.user_type.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        stats = crud_fund_transfer.get_transfer_statistics(db)
        return TransferStats(**stats)
    except Exception as e:
        logger.error(f"Failed to get transfer statistics: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transfer statistics. Please try again."
        )


@router.get("/statistics/bubble/{bubble_id}", response_model=TransferStats)
async def get_bubble_transfer_statistics(
    bubble_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get transfer statistics for a specific bubble
    """
    # Check if user is bubble member
    from app.models.bubble import BubbleMember, MemberStatus
    from sqlalchemy import and_
    
    bubble_member = db.query(BubbleMember).filter(
        and_(
            BubbleMember.bubble_id == bubble_id,
            BubbleMember.user_id == current_user.id,
            BubbleMember.status == MemberStatus.ACTIVE
        )
    ).first()
    
    if not bubble_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You must be a bubble member to view statistics."
        )
    
    try:
        stats = crud_fund_transfer.get_transfer_statistics(db, bubble_id)
        return TransferStats(**stats)
    except Exception as e:
        logger.error(f"Failed to get bubble transfer statistics: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bubble transfer statistics. Please try again."
        )


@router.get("/ghana/transfer-types", response_model=GhanaTransferTypes)
async def get_ghana_transfer_types():
    """
    Get predefined transfer types for Ghana market
    """
    return GhanaTransferTypes()


@router.post("/validate", response_model=TransferValidationResponse)
async def validate_transfer(
    transfer_data: FundTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Validate a transfer before creation (dry run)
    """
    try:
        # This would implement validation logic without actually creating the transfer
        # For now, return a basic validation response
        
        # Check wallet balance
        from app.models.wallet import Wallet
        wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
        
        amount_cedis = int(transfer_data.amount * 100)
        fee_cedis = max(100, int(amount_cedis * 0.01))  # 1% fee, min 1 GHS
        total_cedis = amount_cedis + fee_cedis
        
        validation_errors = []
        warnings = []
        
        if not wallet:
            validation_errors.append("Wallet not found")
        elif wallet.balance_cedis < total_cedis:
            validation_errors.append(f"Insufficient balance. Required: {total_cedis/100} GHS, Available: {wallet.balance_cedis/100} GHS")
        
        if transfer_data.amount > 50000:
            validation_errors.append("Transfer amount cannot exceed 50,000 GHS")
        
        if transfer_data.amount > 5000:
            warnings.append("Large transfer amounts may require additional approval")
        
        return TransferValidationResponse(
            is_valid=len(validation_errors) == 0,
            can_transfer=len(validation_errors) == 0 and wallet and wallet.balance_cedis >= total_cedis,
            validation_errors=validation_errors,
            warnings=warnings,
            daily_limit_remaining=5000.0,  # Placeholder
            monthly_limit_remaining=50000.0,  # Placeholder
            estimated_fee=float(fee_cedis / 100),
            estimated_total=float(total_cedis / 100)
        )
        
    except Exception as e:
        logger.error(f"Failed to validate transfer: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate transfer. Please try again."
        )


# User transfer summary endpoint
@router.get("/summary/user", response_model=UserTransferSummary)
async def get_user_transfer_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get transfer summary for current user
    """
    try:
        from sqlalchemy import func, and_
        from app.models.fund_transfer import FundTransfer, TransferStatus
        
        # Get sent transfers
        sent_query = db.query(FundTransfer).filter(FundTransfer.sender_id == current_user.id)
        sent_count = sent_query.count()
        sent_completed = sent_query.filter(FundTransfer.status == TransferStatus.COMPLETED).count()
        sent_volume = sent_query.filter(FundTransfer.status == TransferStatus.COMPLETED).with_entities(
            func.sum(FundTransfer.amount_cedis)
        ).scalar() or 0
        
        # Get received transfers
        received_query = db.query(FundTransfer).filter(FundTransfer.recipient_id == current_user.id)
        received_count = received_query.count()
        received_completed = received_query.filter(FundTransfer.status == TransferStatus.COMPLETED).count()
        received_volume = received_query.filter(FundTransfer.status == TransferStatus.COMPLETED).with_entities(
            func.sum(FundTransfer.amount_cedis)
        ).scalar() or 0
        
        # Pending counts
        pending_sent = sent_query.filter(FundTransfer.status == TransferStatus.PENDING).count()
        pending_received = received_query.filter(FundTransfer.status == TransferStatus.PENDING).count()
        
        # Success rate
        total_transfers = sent_count + received_count
        total_completed = sent_completed + received_completed
        success_rate = (total_completed / total_transfers * 100) if total_transfers > 0 else 0
        
        return UserTransferSummary(
            user_id=current_user.id,
            sent_transfers=sent_count,
            received_transfers=received_count,
            sent_volume_ghs=float(sent_volume / 100),
            received_volume_ghs=float(received_volume / 100),
            pending_sent=pending_sent,
            pending_received=pending_received,
            success_rate=success_rate
        )
        
    except Exception as e:
        logger.error(f"Failed to get user transfer summary: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transfer summary. Please try again."
        )
