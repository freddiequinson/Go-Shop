"""
CRUD operations for Gift Cards
"""

import secrets
import string
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.gift_card import GiftCard, GiftCardStatus
from app.schemas.gift_card import GiftCardCreate, GiftCardUpdate


def generate_gift_card_code() -> str:
    """
    Generate a unique gift card code
    Format: GOSHOP-XXXX-XXXX-XXXX
    """
    # Use uppercase letters and numbers, excluding similar-looking characters
    chars = string.ascii_uppercase.replace('O', '').replace('I', '').replace('L', '') + string.digits.replace('0', '').replace('1', '')
    
    # Generate 3 segments of 4 characters each
    segments = []
    for _ in range(3):
        segment = ''.join(secrets.choice(chars) for _ in range(4))
        segments.append(segment)
    
    return f"GOSHOP-{'-'.join(segments)}"


def create_gift_card(
    db: Session,
    gift_card_data: GiftCardCreate,
    created_by: str
) -> GiftCard:
    """Create a single gift card"""
    # Convert amount to cedis (multiply by 100)
    amount_cedis = int(gift_card_data.amount * 100)
    
    # Generate unique code
    code = generate_gift_card_code()
    while get_gift_card_by_code(db, code):
        code = generate_gift_card_code()
    
    gift_card = GiftCard(
        code=code,
        amount_cedis=amount_cedis,
        created_by=created_by,
        message=gift_card_data.message,
        expires_at=gift_card_data.expires_at,
        status=GiftCardStatus.ACTIVE
    )
    
    db.add(gift_card)
    db.commit()
    db.refresh(gift_card)
    return gift_card


def create_gift_cards_bulk(
    db: Session,
    gift_card_data: GiftCardCreate,
    created_by: str
) -> List[GiftCard]:
    """Create multiple gift cards"""
    gift_cards = []
    
    for _ in range(gift_card_data.quantity):
        gift_card = create_gift_card(db, gift_card_data, created_by)
        gift_cards.append(gift_card)
    
    return gift_cards


def get_gift_card(db: Session, gift_card_id: str) -> Optional[GiftCard]:
    """Get gift card by ID"""
    return db.query(GiftCard).filter(GiftCard.id == gift_card_id).first()


def get_gift_card_by_code(db: Session, code: str) -> Optional[GiftCard]:
    """Get gift card by code"""
    # Normalize code (remove spaces, dashes, uppercase)
    normalized_code = code.replace(' ', '').replace('-', '').upper()
    
    # Try exact match first
    gift_card = db.query(GiftCard).filter(GiftCard.code == code).first()
    if gift_card:
        return gift_card
    
    # Try normalized match
    all_cards = db.query(GiftCard).all()
    for card in all_cards:
        if card.code.replace('-', '').upper() == normalized_code:
            return card
    
    return None


def get_gift_cards(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[GiftCardStatus] = None,
    created_by: Optional[str] = None
) -> List[GiftCard]:
    """Get list of gift cards with filters"""
    query = db.query(GiftCard)
    
    if status:
        query = query.filter(GiftCard.status == status)
    
    if created_by:
        query = query.filter(GiftCard.created_by == created_by)
    
    return query.order_by(GiftCard.created_at.desc()).offset(skip).limit(limit).all()


def count_gift_cards(
    db: Session,
    status: Optional[GiftCardStatus] = None,
    created_by: Optional[str] = None
) -> int:
    """Count gift cards with filters"""
    query = db.query(func.count(GiftCard.id))
    
    if status:
        query = query.filter(GiftCard.status == status)
    
    if created_by:
        query = query.filter(GiftCard.created_by == created_by)
    
    return query.scalar()


def update_gift_card(
    db: Session,
    gift_card_id: str,
    gift_card_data: GiftCardUpdate
) -> Optional[GiftCard]:
    """Update gift card"""
    gift_card = get_gift_card(db, gift_card_id)
    if not gift_card:
        return None
    
    update_data = gift_card_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gift_card, field, value)
    
    db.commit()
    db.refresh(gift_card)
    return gift_card


def cancel_gift_card(db: Session, gift_card_id: str) -> Optional[GiftCard]:
    """Cancel a gift card"""
    gift_card = get_gift_card(db, gift_card_id)
    if not gift_card:
        return None
    
    gift_card.status = GiftCardStatus.CANCELLED
    db.commit()
    db.refresh(gift_card)
    return gift_card


def redeem_gift_card(
    db: Session,
    code: str,
    user_id: str
) -> tuple[Optional[GiftCard], str]:
    """
    Redeem a gift card
    Returns (gift_card, error_message)
    """
    gift_card = get_gift_card_by_code(db, code)
    
    if not gift_card:
        return None, "Gift card not found"
    
    # Check if can redeem
    can_redeem, error_msg = gift_card.can_redeem()
    if not can_redeem:
        return None, error_msg
    
    # Mark as redeemed
    gift_card.status = GiftCardStatus.REDEEMED
    gift_card.redeemed_by = user_id
    gift_card.redeemed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(gift_card)
    
    return gift_card, ""


def get_gift_card_stats(db: Session, created_by: Optional[str] = None) -> dict:
    """Get gift card statistics"""
    query = db.query(GiftCard)
    
    if created_by:
        query = query.filter(GiftCard.created_by == created_by)
    
    all_cards = query.all()
    
    stats = {
        'total_created': len(all_cards),
        'total_redeemed': len([c for c in all_cards if c.status == GiftCardStatus.REDEEMED]),
        'total_active': len([c for c in all_cards if c.status == GiftCardStatus.ACTIVE]),
        'total_expired': len([c for c in all_cards if c.status == GiftCardStatus.EXPIRED]),
        'total_cancelled': len([c for c in all_cards if c.status == GiftCardStatus.CANCELLED]),
        'total_value_created': sum(c.amount for c in all_cards),
        'total_value_redeemed': sum(c.amount for c in all_cards if c.status == GiftCardStatus.REDEEMED),
        'total_value_active': sum(c.amount for c in all_cards if c.status == GiftCardStatus.ACTIVE),
    }
    
    return stats


def expire_old_gift_cards(db: Session) -> int:
    """
    Expire gift cards that have passed their expiration date
    Returns number of cards expired
    """
    now = datetime.utcnow()
    
    expired_cards = db.query(GiftCard).filter(
        and_(
            GiftCard.status == GiftCardStatus.ACTIVE,
            GiftCard.expires_at.isnot(None),
            GiftCard.expires_at < now
        )
    ).all()
    
    count = 0
    for card in expired_cards:
        card.status = GiftCardStatus.EXPIRED
        count += 1
    
    if count > 0:
        db.commit()
    
    return count
