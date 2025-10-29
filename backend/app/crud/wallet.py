"""
Wallet CRUD operations for GoShopGhana
Wallet and transaction management with Ghana market support
"""

from typing import Optional, List, Dict, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime

from app.models.wallet import Wallet, Transaction, PaymentSession, TransactionType, TransactionStatus, PaymentMethod
from app.schemas.payment import WalletCreditRequest, WalletDebitRequest, TransactionCreate


def get_or_create_wallet(db: Session, user_id: str) -> Wallet:
    """Get user's wallet or create one if it doesn't exist"""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    
    if not wallet:
        wallet = Wallet(user_id=user_id, balance_cedis=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    return wallet


def get_wallet_by_user_id(db: Session, user_id: str) -> Optional[Wallet]:
    """Get user's wallet"""
    return db.query(Wallet).filter(Wallet.user_id == user_id).first()


def credit_wallet(
    db: Session, 
    user_id: str, 
    amount_cedis: int, 
    description: str = None,
    payment_reference: str = None,
    payment_method: PaymentMethod = None
) -> Transaction:
    """Credit user's wallet"""
    wallet = get_or_create_wallet(db, user_id)
    
    # Create transaction record
    transaction = Transaction(
        wallet_id=wallet.id,
        transaction_type=TransactionType.CREDIT,
        amount_cedis=amount_cedis,
        status=TransactionStatus.SUCCESS,
        payment_method=payment_method,
        payment_reference=payment_reference,
        description=description or f"Wallet credit of {amount_cedis/100} GHS"
    )
    
    # Update wallet balance
    wallet.balance_cedis += amount_cedis
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


def debit_wallet(
    db: Session,
    user_id: str,
    amount_cedis: int,
    description: str = None,
    order_id: str = None
) -> Transaction:
    """Debit user's wallet"""
    wallet = get_or_create_wallet(db, user_id)
    
    # Check if wallet has sufficient balance
    if not wallet.can_debit(amount_cedis):
        if wallet.balance_cedis < amount_cedis:
            raise ValueError(f"Insufficient wallet balance. Available: {wallet.balance} GHS, Required: {amount_cedis/100} GHS")
        elif not wallet.is_active:
            raise ValueError("Wallet is not active")
        elif wallet.is_frozen:
            raise ValueError("Wallet is frozen")
    
    # Create transaction record
    transaction = Transaction(
        wallet_id=wallet.id,
        transaction_type=TransactionType.DEBIT,
        amount_cedis=amount_cedis,
        status=TransactionStatus.SUCCESS,
        payment_method=PaymentMethod.WALLET,
        description=description or f"Wallet debit of {amount_cedis/100} GHS",
        order_id=order_id
    )
    
    # Update wallet balance
    wallet.balance_cedis -= amount_cedis
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


def get_wallet_transactions(
    db: Session, 
    user_id: str, 
    skip: int = 0, 
    limit: int = 20,
    transaction_type: TransactionType = None
) -> List[Transaction]:
    """Get user's wallet transactions"""
    wallet = get_wallet_by_user_id(db, user_id)
    if not wallet:
        return []
    
    query = db.query(Transaction).filter(Transaction.wallet_id == wallet.id)
    
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    return query.order_by(desc(Transaction.created_at)).offset(skip).limit(limit).all()


def get_transaction_by_id(db: Session, transaction_id: str, user_id: str = None) -> Optional[Transaction]:
    """Get transaction by ID, optionally filtered by user"""
    query = db.query(Transaction).filter(Transaction.id == transaction_id)
    
    if user_id:
        # Join with wallet to filter by user
        query = query.join(Wallet).filter(Wallet.user_id == user_id)
    
    return query.first()


def create_payment_session(
    db: Session,
    user_id: str,
    amount_cedis: int,
    paystack_reference: str,
    email: str,
    order_id: str = None,
    paystack_access_code: str = None,
    authorization_url: str = None,
    metadata: str = None
) -> PaymentSession:
    """Create payment session for Paystack integration"""
    from datetime import timedelta
    
    payment_session = PaymentSession(
        user_id=user_id,
        order_id=order_id,
        paystack_reference=paystack_reference,
        paystack_access_code=paystack_access_code,
        paystack_authorization_url=authorization_url,
        amount_cedis=amount_cedis,
        email=email,
        status=TransactionStatus.PENDING,
        meta_data=metadata,
        expires_at=datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    )
    
    db.add(payment_session)
    db.commit()
    db.refresh(payment_session)
    
    return payment_session


def get_payment_session_by_reference(db: Session, paystack_reference: str) -> Optional[PaymentSession]:
    """Get payment session by Paystack reference"""
    return db.query(PaymentSession).filter(
        PaymentSession.paystack_reference == paystack_reference
    ).first()


def update_payment_session_status(
    db: Session,
    paystack_reference: str,
    status: TransactionStatus,
    payment_method: PaymentMethod = None
) -> Optional[PaymentSession]:
    """Update payment session status"""
    payment_session = get_payment_session_by_reference(db, paystack_reference)
    
    if not payment_session:
        return None
    
    payment_session.status = status
    if payment_method:
        payment_session.payment_method = payment_method
    
    db.commit()
    db.refresh(payment_session)
    
    return payment_session


def process_successful_payment(
    db: Session,
    paystack_reference: str,
    payment_method: PaymentMethod = None
) -> Optional[Transaction]:
    """Process successful payment and credit wallet"""
    payment_session = get_payment_session_by_reference(db, paystack_reference)
    
    if not payment_session:
        raise ValueError(f"Payment session not found for reference: {paystack_reference}")
    
    # Check if already processed - CRITICAL for preventing duplicates
    if payment_session.status == TransactionStatus.SUCCESS:
        print(f"⚠️  Payment already processed: {paystack_reference}")
        # Return existing transaction instead of None
        existing_transaction = db.query(Transaction).filter(
            Transaction.payment_reference == paystack_reference
        ).first()
        return existing_transaction
    
    # LOCK the payment session to prevent race conditions
    # Update status first, then credit wallet
    payment_session.status = TransactionStatus.SUCCESS
    payment_session.payment_method = payment_method
    db.commit()  # Commit status change immediately
    db.refresh(payment_session)
    
    print(f"🔒 Payment session locked and marked as SUCCESS")
    
    # Now credit wallet
    transaction = credit_wallet(
        db=db,
        user_id=payment_session.user_id,
        amount_cedis=payment_session.amount_cedis,
        description=f"Payment via {payment_method.value if payment_method else 'card'}",
        payment_reference=paystack_reference,
        payment_method=payment_method
    )
    
    return transaction


def get_wallet_statistics(db: Session, user_id: str = None) -> Dict[str, Any]:
    """Get wallet statistics"""
    if user_id:
        wallet = get_wallet_by_user_id(db, user_id)
        if not wallet:
            return {
                'total_transactions': 0,
                'successful_transactions': 0,
                'failed_transactions': 0,
                'total_volume': 0.0,
                'current_balance': 0.0,
                'currency': 'GHS'
            }
        
        transactions = db.query(Transaction).filter(Transaction.wallet_id == wallet.id).all()
    else:
        transactions = db.query(Transaction).all()
        wallet = None
    
    total_transactions = len(transactions)
    successful_transactions = len([t for t in transactions if t.status == TransactionStatus.SUCCESS])
    failed_transactions = len([t for t in transactions if t.status == TransactionStatus.FAILED])
    
    # Calculate total volume (successful transactions only)
    total_volume_cedis = sum(
        t.amount_cedis for t in transactions 
        if t.status == TransactionStatus.SUCCESS
    )
    total_volume = float(total_volume_cedis) / 100
    
    result = {
        'total_transactions': total_transactions,
        'successful_transactions': successful_transactions,
        'failed_transactions': failed_transactions,
        'total_volume': total_volume,
        'currency': 'GHS'
    }
    
    if wallet:
        result['current_balance'] = wallet.balance
    
    return result


def freeze_wallet(db: Session, user_id: str, reason: str = None) -> Optional[Wallet]:
    """Freeze user's wallet"""
    wallet = get_wallet_by_user_id(db, user_id)
    if not wallet:
        return None
    
    wallet.is_frozen = True
    
    # Create transaction record for freezing
    transaction = Transaction(
        wallet_id=wallet.id,
        transaction_type=TransactionType.DEBIT,
        amount_cedis=0,
        status=TransactionStatus.SUCCESS,
        description=f"Wallet frozen: {reason or 'Administrative action'}"
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(wallet)
    
    return wallet


def unfreeze_wallet(db: Session, user_id: str, reason: str = None) -> Optional[Wallet]:
    """Unfreeze user's wallet"""
    wallet = get_wallet_by_user_id(db, user_id)
    if not wallet:
        return None
    
    wallet.is_frozen = False
    
    # Create transaction record for unfreezing
    transaction = Transaction(
        wallet_id=wallet.id,
        transaction_type=TransactionType.CREDIT,
        amount_cedis=0,
        status=TransactionStatus.SUCCESS,
        description=f"Wallet unfrozen: {reason or 'Administrative action'}"
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(wallet)
    
    return wallet
