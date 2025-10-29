"""
CRUD operations for Gift Cards
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import secrets

from app.models.giftcard import GiftCard, GiftCardTransaction, GiftCardStatus, GiftCardType
from app.schemas.giftcard import GiftCardCreate, GiftCardBatchCreate


def get_latest_giftcard(db: Session) -> Optional[GiftCard]:
    """Get the latest gift card for blockchain chaining"""
    return db.query(GiftCard).order_by(GiftCard.created_at.desc()).first()


def create_giftcard(
    db: Session,
    giftcard_data: GiftCardCreate,
    generated_by_id: str
) -> GiftCard:
    """Create a new gift card with blockchain-style verification"""
    
    # Get previous card for chain
    previous_card = get_latest_giftcard(db)
    
    # Create new card
    giftcard = GiftCard(
        id=str(uuid.uuid4()),
        generated_by_id=generated_by_id,
        amount_cedis=int(giftcard_data.amount * 100),
        original_amount_cedis=int(giftcard_data.amount * 100),
        card_type=giftcard_data.card_type,
        description=giftcard_data.description,
        nonce=secrets.token_hex(32)
    )
    
    # Generate code and PIN
    giftcard.code = giftcard.generate_code()
    giftcard.pin = giftcard.generate_pin()
    
    # Set expiry
    if giftcard_data.card_type == GiftCardType.EXPIRY and giftcard_data.expiry_days:
        giftcard.expires_at = datetime.utcnow() + timedelta(days=giftcard_data.expiry_days)
    
    # Set previous hash for blockchain chain
    if previous_card:
        giftcard.previous_hash = previous_card.hash_chain
    
    # Calculate and set hash
    giftcard.hash_chain = giftcard.calculate_hash()
    
    db.add(giftcard)
    db.commit()
    db.refresh(giftcard)
    
    # Create transaction record
    create_giftcard_transaction(
        db=db,
        giftcard_id=giftcard.id,
        transaction_type="generated",
        amount_cedis=giftcard.amount_cedis,
        user_id=generated_by_id,
        description=f"Gift card generated: {giftcard.code}"
    )
    
    return giftcard


def create_batch_giftcards(
    db: Session,
    batch_data: GiftCardBatchCreate,
    generated_by_id: str
) -> List[GiftCard]:
    """Create multiple gift cards in batch"""
    
    giftcards = []
    
    for _ in range(batch_data.quantity):
        card_data = GiftCardCreate(
            amount=batch_data.amount,
            card_type=batch_data.card_type,
            expiry_days=batch_data.expiry_days,
            description=batch_data.description
        )
        
        giftcard = create_giftcard(db, card_data, generated_by_id)
        giftcards.append(giftcard)
    
    return giftcards


def get_giftcard_by_code(db: Session, code: str) -> Optional[GiftCard]:
    """Get gift card by code"""
    return db.query(GiftCard).filter(GiftCard.code == code).first()


def get_giftcard_by_id(db: Session, giftcard_id: str) -> Optional[GiftCard]:
    """Get gift card by ID"""
    return db.query(GiftCard).filter(GiftCard.id == giftcard_id).first()


def verify_giftcard(db: Session, code: str) -> tuple[bool, Optional[GiftCard], str]:
    """
    Verify gift card validity
    Returns: (is_valid, giftcard, message)
    """
    giftcard = get_giftcard_by_code(db, code)
    
    if not giftcard:
        return False, None, "Gift card not found"
    
    if giftcard.status != GiftCardStatus.ACTIVE:
        return False, giftcard, f"Gift card is {giftcard.status}"
    
    if giftcard.card_type == GiftCardType.EXPIRY and giftcard.expires_at:
        if datetime.utcnow() > giftcard.expires_at:
            # Auto-expire the card
            giftcard.status = GiftCardStatus.EXPIRED
            db.commit()
            return False, giftcard, "Gift card has expired"
    
    if giftcard.amount_cedis <= 0:
        return False, giftcard, "Gift card has no remaining balance"
    
    if not giftcard.verify_hash():
        return False, giftcard, "Gift card verification failed - possible tampering detected"
    
    return True, giftcard, "Gift card is valid"


def redeem_giftcard(
    db: Session,
    code: str,
    pin: str,
    user_id: str
) -> tuple[bool, Optional[GiftCard], str]:
    """
    Redeem a gift card and credit user's wallet
    Returns: (success, giftcard, message)
    """
    # Verify card
    is_valid, giftcard, message = verify_giftcard(db, code)
    
    if not is_valid or not giftcard:
        return False, giftcard, message
    
    # Verify PIN
    if giftcard.pin != pin:
        return False, giftcard, "Invalid PIN"
    
    # Update gift card
    giftcard.status = GiftCardStatus.REDEEMED
    giftcard.redeemed_by_id = user_id
    giftcard.redeemed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(giftcard)
    
    # Create transaction record
    create_giftcard_transaction(
        db=db,
        giftcard_id=giftcard.id,
        transaction_type="redeemed",
        amount_cedis=giftcard.amount_cedis,
        user_id=user_id,
        description=f"Gift card redeemed by user {user_id}"
    )
    
    return True, giftcard, "Gift card redeemed successfully"


def cancel_giftcard(db: Session, giftcard_id: str, admin_id: str) -> Optional[GiftCard]:
    """Cancel a gift card (admin only)"""
    giftcard = get_giftcard_by_id(db, giftcard_id)
    
    if not giftcard:
        return None
    
    giftcard.status = GiftCardStatus.CANCELLED
    db.commit()
    db.refresh(giftcard)
    
    # Create transaction record
    create_giftcard_transaction(
        db=db,
        giftcard_id=giftcard.id,
        transaction_type="cancelled",
        amount_cedis=giftcard.amount_cedis,
        user_id=admin_id,
        description=f"Gift card cancelled by admin {admin_id}"
    )
    
    return giftcard


def get_giftcards(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[GiftCardStatus] = None,
    card_type: Optional[GiftCardType] = None
) -> List[GiftCard]:
    """Get gift cards with filters"""
    query = db.query(GiftCard)
    
    if status:
        query = query.filter(GiftCard.status == status)
    
    if card_type:
        query = query.filter(GiftCard.card_type == card_type)
    
    return query.order_by(GiftCard.created_at.desc()).offset(skip).limit(limit).all()


def get_user_giftcards(db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[GiftCard]:
    """Get gift cards redeemed by a user"""
    return db.query(GiftCard).filter(
        GiftCard.redeemed_by_id == user_id
    ).order_by(GiftCard.redeemed_at.desc()).offset(skip).limit(limit).all()


def create_giftcard_transaction(
    db: Session,
    giftcard_id: str,
    transaction_type: str,
    amount_cedis: int,
    user_id: str,
    description: Optional[str] = None
) -> GiftCardTransaction:
    """Create a gift card transaction record"""
    
    transaction = GiftCardTransaction(
        id=str(uuid.uuid4()),
        giftcard_id=giftcard_id,
        transaction_type=transaction_type,
        amount_cedis=amount_cedis,
        user_id=user_id,
        description=description
    )
    
    transaction.transaction_hash = transaction.calculate_transaction_hash()
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


def get_giftcard_transactions(
    db: Session,
    giftcard_id: str
) -> List[GiftCardTransaction]:
    """Get all transactions for a gift card"""
    return db.query(GiftCardTransaction).filter(
        GiftCardTransaction.giftcard_id == giftcard_id
    ).order_by(GiftCardTransaction.created_at.desc()).all()


def get_giftcard_stats(db: Session) -> dict:
    """Get gift card statistics"""
    total_generated = db.query(GiftCard).count()
    total_active = db.query(GiftCard).filter(GiftCard.status == GiftCardStatus.ACTIVE).count()
    total_redeemed = db.query(GiftCard).filter(GiftCard.status == GiftCardStatus.REDEEMED).count()
    total_expired = db.query(GiftCard).filter(GiftCard.status == GiftCardStatus.EXPIRED).count()
    
    # Calculate total values
    total_value = db.query(GiftCard).with_entities(
        db.func.sum(GiftCard.original_amount_cedis)
    ).scalar() or 0
    
    redeemed_value = db.query(GiftCard).filter(
        GiftCard.status == GiftCardStatus.REDEEMED
    ).with_entities(
        db.func.sum(GiftCard.amount_cedis)
    ).scalar() or 0
    
    return {
        "total_generated": total_generated,
        "total_active": total_active,
        "total_redeemed": total_redeemed,
        "total_expired": total_expired,
        "total_value_cedis": total_value / 100,
        "total_redeemed_value_cedis": redeemed_value / 100
    }
