"""
Fund Transfer CRUD operations for GoShopGhana
Wallet-to-wallet transfers between bubble members
"""

from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func
from datetime import datetime, timedelta
from decimal import Decimal

from app.models.fund_transfer import (
    FundTransfer, TransferLimit, TransferApproval,
    TransferStatus, TransferType, ApprovalLevel
)
from app.models.bubble import Bubble, BubbleMember, MemberRole, MemberStatus
from app.models.wallet import Wallet, Transaction
from app.schemas.fund_transfer import (
    FundTransferCreate, TransferSearchRequest, TransferApprovalRequest
)


# Transfer creation and management
def create_fund_transfer(
    db: Session, 
    transfer_data: FundTransferCreate, 
    sender_id: str
) -> FundTransfer:
    """Create a new fund transfer between bubble members"""
    
    # Validate bubble membership
    bubble = db.query(Bubble).filter(Bubble.id == transfer_data.bubble_id).first()
    if not bubble:
        raise ValueError("Bubble not found")
    
    if not bubble.fund_transfer_enabled:
        raise ValueError("Fund transfers are not enabled for this bubble")
    
    # Check if both sender and recipient are bubble members
    sender_member = db.query(BubbleMember).filter(
        and_(
            BubbleMember.bubble_id == transfer_data.bubble_id,
            BubbleMember.user_id == sender_id,
            BubbleMember.status == MemberStatus.ACTIVE
        )
    ).first()
    
    if not sender_member:
        raise ValueError("Sender is not an active member of this bubble")
    
    if not sender_member.can_transfer_funds:
        raise ValueError("Sender does not have fund transfer permissions")
    
    recipient_member = db.query(BubbleMember).filter(
        and_(
            BubbleMember.bubble_id == transfer_data.bubble_id,
            BubbleMember.user_id == transfer_data.recipient_id,
            BubbleMember.status == MemberStatus.ACTIVE
        )
    ).first()
    
    if not recipient_member:
        raise ValueError("Recipient is not an active member of this bubble")
    
    # Check sender wallet balance
    sender_wallet = db.query(Wallet).filter(Wallet.user_id == sender_id).first()
    if not sender_wallet:
        raise ValueError("Sender wallet not found")
    
    amount_cedis = int(transfer_data.amount * 100)  # Convert to cedis
    
    # Calculate fee (simple 1% fee, minimum 1 GHS)
    fee_cedis = max(100, int(amount_cedis * 0.01))  # 1% fee, min 1 GHS
    total_amount_cedis = amount_cedis + fee_cedis
    
    if sender_wallet.balance_cedis < total_amount_cedis:
        raise ValueError(f"Insufficient balance. Required: {total_amount_cedis/100} GHS, Available: {sender_wallet.balance_cedis/100} GHS")
    
    # Check transfer limits
    _check_transfer_limits(db, sender_id, transfer_data.bubble_id, amount_cedis)
    
    # Determine approval requirements
    approval_level, requires_recipient, requires_admin = _determine_approval_requirements(
        db, transfer_data, sender_member, recipient_member, amount_cedis
    )
    
    # Generate unique reference
    reference = _generate_transfer_reference()
    
    # Set expiry (24 hours for approval)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Create transfer record
    transfer = FundTransfer(
        reference=reference,
        transfer_type=transfer_data.transfer_type,
        sender_id=sender_id,
        recipient_id=transfer_data.recipient_id,
        bubble_id=transfer_data.bubble_id,
        amount_cedis=amount_cedis,
        fee_cedis=fee_cedis,
        total_amount_cedis=total_amount_cedis,
        purpose=transfer_data.purpose,
        description=transfer_data.description,
        reference_note=transfer_data.reference_note,
        approval_level=approval_level,
        requires_recipient_approval=requires_recipient,
        requires_admin_approval=requires_admin,
        expires_at=expires_at
    )
    
    db.add(transfer)
    db.flush()  # Get the transfer ID
    
    # If no approval needed, process immediately
    if not requires_recipient and not requires_admin:
        _process_transfer(db, transfer)
    
    db.commit()
    db.refresh(transfer)
    
    return transfer


def approve_transfer(
    db: Session, 
    transfer_id: str, 
    approver_id: str, 
    approval_data: TransferApprovalRequest
) -> FundTransfer:
    """Approve or reject a fund transfer"""
    
    transfer = db.query(FundTransfer).filter(FundTransfer.id == transfer_id).first()
    if not transfer:
        raise ValueError("Transfer not found")
    
    if transfer.status != TransferStatus.PENDING:
        raise ValueError("Transfer is not pending approval")
    
    if transfer.is_expired:
        transfer.status = TransferStatus.EXPIRED
        db.commit()
        raise ValueError("Transfer has expired")
    
    # Determine approval type
    approval_type = None
    if approver_id == transfer.recipient_id:
        approval_type = "recipient"
        if not transfer.requires_recipient_approval:
            raise ValueError("Recipient approval not required for this transfer")
        
        transfer.recipient_approved = approval_data.is_approved
        transfer.recipient_approved_at = datetime.utcnow()
        
    else:
        # Check if approver is bubble admin/owner
        bubble_member = db.query(BubbleMember).filter(
            and_(
                BubbleMember.bubble_id == transfer.bubble_id,
                BubbleMember.user_id == approver_id,
                BubbleMember.status == MemberStatus.ACTIVE
            )
        ).first()
        
        if not bubble_member or not bubble_member.is_admin_or_owner:
            raise ValueError("Only bubble admins can approve transfers")
        
        approval_type = "admin"
        if not transfer.requires_admin_approval:
            raise ValueError("Admin approval not required for this transfer")
        
        transfer.admin_approved = approval_data.is_approved
        transfer.admin_approved_at = datetime.utcnow()
        transfer.approved_by_id = approver_id
    
    # Record approval
    approval_record = TransferApproval(
        transfer_id=transfer_id,
        approver_id=approver_id,
        approval_type=approval_type,
        is_approved=approval_data.is_approved,
        comments=approval_data.comments
    )
    db.add(approval_record)
    
    # If rejected, mark as rejected
    if not approval_data.is_approved:
        transfer.status = TransferStatus.REJECTED
        db.commit()
        return transfer
    
    # Check if all required approvals are complete
    if transfer.can_be_processed:
        _process_transfer(db, transfer)
    
    db.commit()
    db.refresh(transfer)
    
    return transfer


def cancel_transfer(db: Session, transfer_id: str, user_id: str) -> FundTransfer:
    """Cancel a pending transfer (sender only)"""
    
    transfer = db.query(FundTransfer).filter(FundTransfer.id == transfer_id).first()
    if not transfer:
        raise ValueError("Transfer not found")
    
    if transfer.sender_id != user_id:
        raise ValueError("Only the sender can cancel a transfer")
    
    if transfer.status != TransferStatus.PENDING:
        raise ValueError("Only pending transfers can be cancelled")
    
    transfer.status = TransferStatus.CANCELLED
    db.commit()
    db.refresh(transfer)
    
    return transfer


def get_transfer_by_id(db: Session, transfer_id: str) -> Optional[FundTransfer]:
    """Get transfer by ID"""
    return db.query(FundTransfer).filter(FundTransfer.id == transfer_id).first()


def get_user_transfers(
    db: Session, 
    user_id: str, 
    search: Optional[TransferSearchRequest] = None,
    skip: int = 0, 
    limit: int = 20
) -> List[FundTransfer]:
    """Get transfers for a user (sent or received)"""
    
    query = db.query(FundTransfer).filter(
        or_(
            FundTransfer.sender_id == user_id,
            FundTransfer.recipient_id == user_id
        )
    )
    
    if search:
        if search.status:
            query = query.filter(FundTransfer.status == search.status)
        
        if search.transfer_type:
            query = query.filter(FundTransfer.transfer_type == search.transfer_type)
        
        if search.bubble_id:
            query = query.filter(FundTransfer.bubble_id == search.bubble_id)
        
        if search.min_amount:
            min_cedis = int(search.min_amount * 100)
            query = query.filter(FundTransfer.amount_cedis >= min_cedis)
        
        if search.max_amount:
            max_cedis = int(search.max_amount * 100)
            query = query.filter(FundTransfer.amount_cedis <= max_cedis)
        
        if search.date_from:
            query = query.filter(FundTransfer.created_at >= search.date_from)
        
        if search.date_to:
            query = query.filter(FundTransfer.created_at <= search.date_to)
    
    return query.order_by(desc(FundTransfer.created_at)).offset(skip).limit(limit).all()


def get_bubble_transfers(
    db: Session, 
    bubble_id: str, 
    skip: int = 0, 
    limit: int = 20
) -> List[FundTransfer]:
    """Get all transfers within a bubble"""
    
    return db.query(FundTransfer).filter(
        FundTransfer.bubble_id == bubble_id
    ).order_by(desc(FundTransfer.created_at)).offset(skip).limit(limit).all()


def get_pending_approvals(db: Session, user_id: str) -> List[FundTransfer]:
    """Get transfers pending approval by user"""
    
    # Get transfers where user is recipient and recipient approval needed
    recipient_approvals = db.query(FundTransfer).filter(
        and_(
            FundTransfer.recipient_id == user_id,
            FundTransfer.status == TransferStatus.PENDING,
            FundTransfer.requires_recipient_approval == True,
            FundTransfer.recipient_approved == False
        )
    ).all()
    
    # Get transfers where user is bubble admin and admin approval needed
    admin_bubble_ids = db.query(BubbleMember.bubble_id).filter(
        and_(
            BubbleMember.user_id == user_id,
            BubbleMember.status == MemberStatus.ACTIVE,
            BubbleMember.role.in_([MemberRole.OWNER, MemberRole.ADMIN])
        )
    ).subquery()
    
    admin_approvals = db.query(FundTransfer).filter(
        and_(
            FundTransfer.bubble_id.in_(admin_bubble_ids),
            FundTransfer.status == TransferStatus.PENDING,
            FundTransfer.requires_admin_approval == True,
            FundTransfer.admin_approved == False
        )
    ).all()
    
    # Combine and deduplicate
    all_approvals = recipient_approvals + admin_approvals
    unique_approvals = {t.id: t for t in all_approvals}.values()
    
    return sorted(unique_approvals, key=lambda x: x.created_at, reverse=True)


# Helper functions
def _check_transfer_limits(db: Session, user_id: str, bubble_id: str, amount_cedis: int):
    """Check if transfer amount is within limits"""
    
    # Get user limits
    user_limit = db.query(TransferLimit).filter(
        and_(
            TransferLimit.user_id == user_id,
            TransferLimit.is_active == True
        )
    ).first()
    
    # Get bubble limits
    bubble_limit = db.query(TransferLimit).filter(
        and_(
            TransferLimit.bubble_id == bubble_id,
            TransferLimit.is_active == True
        )
    ).first()
    
    # Get global limits
    global_limit = db.query(TransferLimit).filter(
        and_(
            TransferLimit.is_global == True,
            TransferLimit.is_active == True
        )
    ).first()
    
    # Use the most restrictive limit
    effective_limit = global_limit
    if bubble_limit:
        effective_limit = bubble_limit
    if user_limit:
        effective_limit = user_limit
    
    if not effective_limit:
        # Create default limits if none exist
        effective_limit = TransferLimit(
            user_id=user_id,
            daily_limit_cedis=500000,  # 5,000 GHS daily
            monthly_limit_cedis=5000000,  # 50,000 GHS monthly
            single_transfer_limit_cedis=100000,  # 1,000 GHS per transfer
            is_active=True
        )
        db.add(effective_limit)
        db.flush()
    
    # Reset limits if needed
    effective_limit.reset_daily_if_needed()
    effective_limit.reset_monthly_if_needed()
    
    # Check single transfer limit
    if amount_cedis > effective_limit.single_transfer_limit_cedis:
        raise ValueError(f"Transfer amount exceeds single transfer limit of {effective_limit.single_transfer_limit_cedis/100} GHS")
    
    # Check daily limit
    if (effective_limit.daily_used_cedis + amount_cedis) > effective_limit.daily_limit_cedis:
        remaining = effective_limit.daily_limit_cedis - effective_limit.daily_used_cedis
        raise ValueError(f"Transfer would exceed daily limit. Remaining: {remaining/100} GHS")
    
    # Check monthly limit
    if (effective_limit.monthly_used_cedis + amount_cedis) > effective_limit.monthly_limit_cedis:
        remaining = effective_limit.monthly_limit_cedis - effective_limit.monthly_used_cedis
        raise ValueError(f"Transfer would exceed monthly limit. Remaining: {remaining/100} GHS")


def _determine_approval_requirements(
    db: Session, 
    transfer_data: FundTransferCreate, 
    sender_member: BubbleMember, 
    recipient_member: BubbleMember, 
    amount_cedis: int
) -> Tuple[ApprovalLevel, bool, bool]:
    """Determine what approvals are required for a transfer"""
    
    # High-value transfers always need admin approval
    if amount_cedis > 500000:  # > 5,000 GHS
        return ApprovalLevel.DUAL, True, True
    
    # Emergency transfers need admin approval
    if transfer_data.transfer_type == TransferType.EMERGENCY:
        return ApprovalLevel.ADMIN, False, True
    
    # Loans need recipient approval
    if transfer_data.transfer_type in [TransferType.LOAN, TransferType.REPAYMENT]:
        return ApprovalLevel.RECIPIENT, True, False
    
    # Trusted members (admins/owners) can transfer without approval for small amounts
    if (sender_member.is_admin_or_owner and amount_cedis <= 100000):  # <= 1,000 GHS
        return ApprovalLevel.NONE, False, False
    
    # Default: recipient approval for regular transfers
    return ApprovalLevel.RECIPIENT, True, False


def _process_transfer(db: Session, transfer: FundTransfer):
    """Process an approved transfer"""
    
    transfer.status = TransferStatus.PROCESSING
    transfer.processed_at = datetime.utcnow()
    
    try:
        # Get wallets
        sender_wallet = db.query(Wallet).filter(Wallet.user_id == transfer.sender_id).first()
        recipient_wallet = db.query(Wallet).filter(Wallet.user_id == transfer.recipient_id).first()
        
        if not sender_wallet or not recipient_wallet:
            raise Exception("Wallet not found")
        
        # Check sender balance again
        if sender_wallet.balance_cedis < transfer.total_amount_cedis:
            raise Exception("Insufficient sender balance")
        
        # Create transactions using WALLET as payment method (temporary fix)
        sender_transaction = Transaction(
            wallet_id=sender_wallet.id,
            transaction_type="DEBIT",
            amount_cedis=transfer.total_amount_cedis,
            status="SUCCESS",
            payment_method="WALLET",  # Use existing enum value
            payment_reference=transfer.reference,
            description=f"Fund transfer to {transfer.recipient_id}: {transfer.purpose or 'No purpose specified'}",
            order_id=None
        )
        
        recipient_transaction = Transaction(
            wallet_id=recipient_wallet.id,
            transaction_type="CREDIT",
            amount_cedis=transfer.amount_cedis,  # Recipient gets amount without fee
            status="SUCCESS",
            payment_method="WALLET",  # Use existing enum value
            payment_reference=transfer.reference,
            description=f"Fund transfer from {transfer.sender_id}: {transfer.purpose or 'No purpose specified'}",
            order_id=None
        )
        
        # Update wallet balances
        sender_wallet.balance_cedis -= transfer.total_amount_cedis
        recipient_wallet.balance_cedis += transfer.amount_cedis
        
        # Save transactions
        db.add(sender_transaction)
        db.add(recipient_transaction)
        db.flush()
        
        # Update transfer with transaction IDs
        transfer.sender_transaction_id = sender_transaction.id
        transfer.recipient_transaction_id = recipient_transaction.id
        transfer.status = TransferStatus.COMPLETED
        transfer.completed_at = datetime.utcnow()
        
        # Update transfer limits usage
        _update_transfer_limits_usage(db, transfer.sender_id, transfer.bubble_id, transfer.amount_cedis)
        
    except Exception as e:
        transfer.status = TransferStatus.FAILED
        transfer.failed_at = datetime.utcnow()
        transfer.failure_reason = str(e)
        raise


def _update_transfer_limits_usage(db: Session, user_id: str, bubble_id: str, amount_cedis: int):
    """Update transfer limits usage after successful transfer"""
    
    # Update user limits
    user_limit = db.query(TransferLimit).filter(
        and_(
            TransferLimit.user_id == user_id,
            TransferLimit.is_active == True
        )
    ).first()
    
    if user_limit:
        user_limit.daily_used_cedis += amount_cedis
        user_limit.monthly_used_cedis += amount_cedis


def _generate_transfer_reference() -> str:
    """Generate unique transfer reference"""
    import random
    import string
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"TXF{timestamp}{random_part}"


def get_transfer_statistics(db: Session, bubble_id: Optional[str] = None) -> Dict[str, Any]:
    """Get transfer system statistics"""
    
    query = db.query(FundTransfer)
    if bubble_id:
        query = query.filter(FundTransfer.bubble_id == bubble_id)
    
    total_transfers = query.count()
    completed_transfers = query.filter(FundTransfer.status == TransferStatus.COMPLETED).count()
    pending_transfers = query.filter(FundTransfer.status == TransferStatus.PENDING).count()
    failed_transfers = query.filter(FundTransfer.status == TransferStatus.FAILED).count()
    
    # Volume calculations
    completed_query = query.filter(FundTransfer.status == TransferStatus.COMPLETED)
    total_volume = completed_query.with_entities(func.sum(FundTransfer.amount_cedis)).scalar() or 0
    
    # Average transfer amount
    avg_amount = completed_query.with_entities(func.avg(FundTransfer.amount_cedis)).scalar() or 0
    
    # Daily and monthly volumes
    today = datetime.utcnow().date()
    daily_volume = completed_query.filter(
        func.date(FundTransfer.completed_at) == today
    ).with_entities(func.sum(FundTransfer.amount_cedis)).scalar() or 0
    
    this_month = datetime.utcnow().replace(day=1).date()
    monthly_volume = completed_query.filter(
        func.date(FundTransfer.completed_at) >= this_month
    ).with_entities(func.sum(FundTransfer.amount_cedis)).scalar() or 0
    
    # Transfers by type
    transfers_by_type = {}
    for transfer_type in TransferType:
        count = query.filter(FundTransfer.transfer_type == transfer_type).count()
        transfers_by_type[transfer_type.value] = count
    
    # Transfers by status
    transfers_by_status = {}
    for status in TransferStatus:
        count = query.filter(FundTransfer.status == status).count()
        transfers_by_status[status.value] = count
    
    return {
        'total_transfers': total_transfers,
        'completed_transfers': completed_transfers,
        'pending_transfers': pending_transfers,
        'failed_transfers': failed_transfers,
        'total_volume_ghs': float(total_volume / 100),
        'completed_volume_ghs': float(total_volume / 100),
        'average_transfer_amount_ghs': float(avg_amount / 100),
        'transfers_by_type': transfers_by_type,
        'transfers_by_status': transfers_by_status,
        'daily_volume_ghs': float(daily_volume / 100),
        'monthly_volume_ghs': float(monthly_volume / 100)
    }
