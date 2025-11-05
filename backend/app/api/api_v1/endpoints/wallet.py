"""
User Wallet API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.wallet import Wallet, Transaction, TransactionType, TransactionStatus, PaymentMethod
from app.schemas.gift_card import GiftCardRedeem, GiftCardRedeemResponse
from app.crud import gift_card as gift_card_crud
from app.api.deps import get_current_active_user
from datetime import datetime

router = APIRouter()


@router.get("/balance")
async def get_wallet_balance(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's wallet balance
    """
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    
    if not wallet:
        # Create wallet if it doesn't exist
        wallet = Wallet(user_id=current_user.id, balance_cedis=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    return {
        "balance": wallet.balance,
        "balance_cedis": int(wallet.balance_cedis),
        "currency": "GHS",
        "is_active": wallet.is_active,
        "is_frozen": wallet.is_frozen
    }


@router.get("/transactions")
async def get_wallet_transactions(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's wallet transaction history
    """
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    
    if not wallet:
        return {
            "items": [],
            "total": 0,
            "page": 1,
            "page_size": limit
        }
    
    # Get transactions
    transactions = db.query(Transaction).filter(
        Transaction.wallet_id == wallet.id
    ).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    # Get total count
    total = db.query(Transaction).filter(Transaction.wallet_id == wallet.id).count()
    
    # Format transactions
    items = []
    for txn in transactions:
        items.append({
            "id": txn.id,
            "type": txn.transaction_type.value,
            "amount": txn.amount,
            "status": txn.status.value,
            "description": txn.description,
            "payment_method": txn.payment_method.value if txn.payment_method else None,
            "payment_reference": txn.payment_reference,
            "order_id": txn.order_id,
            "created_at": txn.created_at.isoformat(),
            "completed_at": txn.completed_at.isoformat() if txn.completed_at else None
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit
    }


@router.post("/redeem-gift-card", response_model=GiftCardRedeemResponse)
async def redeem_gift_card(
    redeem_data: GiftCardRedeem,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Redeem a gift card and credit wallet
    """
    # Get or create wallet
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id, balance_cedis=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    # Check if wallet is active
    if not wallet.is_active or wallet.is_frozen:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your wallet is not active. Please contact support."
        )
    
    # Redeem gift card
    gift_card, error_msg = gift_card_crud.redeem_gift_card(
        db, redeem_data.code, current_user.id
    )
    
    if not gift_card:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Credit wallet
    old_balance = wallet.balance_cedis
    wallet.balance_cedis += gift_card.amount_cedis
    
    # Create transaction record
    transaction = Transaction(
        wallet_id=wallet.id,
        transaction_type=TransactionType.CREDIT,
        amount_cedis=gift_card.amount_cedis,
        status=TransactionStatus.SUCCESS,
        payment_method=PaymentMethod.GIFTCARD,
        payment_reference=gift_card.code,
        description=f"Gift card redeemed: {gift_card.code}",
        completed_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(wallet)
    db.refresh(transaction)
    
    return GiftCardRedeemResponse(
        success=True,
        message=f"Successfully redeemed GH₵{gift_card.amount:.2f}",
        amount=gift_card.amount,
        new_balance=wallet.balance,
        transaction_id=transaction.id
    )


@router.get("/")
async def get_wallet_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get complete wallet information including balance and recent transactions
    """
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    
    if not wallet:
        # Create wallet if it doesn't exist
        wallet = Wallet(user_id=current_user.id, balance_cedis=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    # Get recent transactions (last 10)
    recent_transactions = db.query(Transaction).filter(
        Transaction.wallet_id == wallet.id
    ).order_by(Transaction.created_at.desc()).limit(10).all()
    
    # Format transactions
    transactions = []
    for txn in recent_transactions:
        transactions.append({
            "id": txn.id,
            "type": txn.transaction_type.value,
            "amount": txn.amount,
            "status": txn.status.value,
            "description": txn.description,
            "created_at": txn.created_at.isoformat()
        })
    
    # Calculate stats
    total_credited = db.query(Transaction).filter(
        Transaction.wallet_id == wallet.id,
        Transaction.transaction_type == TransactionType.CREDIT,
        Transaction.status == TransactionStatus.SUCCESS
    ).count()
    
    total_debited = db.query(Transaction).filter(
        Transaction.wallet_id == wallet.id,
        Transaction.transaction_type == TransactionType.DEBIT,
        Transaction.status == TransactionStatus.SUCCESS
    ).count()
    
    return {
        "wallet": {
            "id": wallet.id,
            "balance": wallet.balance,
            "balance_cedis": int(wallet.balance_cedis),
            "currency": "GHS",
            "is_active": wallet.is_active,
            "is_frozen": wallet.is_frozen,
            "created_at": wallet.created_at.isoformat()
        },
        "recent_transactions": transactions,
        "stats": {
            "total_transactions": total_credited + total_debited,
            "total_credited": total_credited,
            "total_debited": total_debited
        }
    }
