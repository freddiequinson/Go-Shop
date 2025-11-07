"""
Gift Card endpoints for GoShopGhana
Admin can generate, users can redeem
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.giftcard import (
    GiftCardCreate, GiftCardBatchCreate, GiftCardResponse, GiftCardPublicResponse,
    GiftCardRedeem, GiftCardVerify, GiftCardVerifyResponse, GiftCardTransactionResponse,
    GiftCardStats
)
from app.crud.giftcard import (
    create_giftcard, create_batch_giftcards, get_giftcard_by_code, get_giftcard_by_id,
    verify_giftcard, redeem_giftcard, cancel_giftcard, get_giftcards, get_user_giftcards,
    get_giftcard_transactions, get_giftcard_stats
)
from app.crud.wallet import credit_wallet
from app.models.wallet import PaymentMethod
from app.core.deps import get_current_active_user, get_current_admin
from app.models.user import User
from app.models.giftcard import GiftCardStatus, GiftCardType

router = APIRouter()


@router.post("/generate", response_model=GiftCardResponse)
async def generate_giftcard(
    giftcard_data: GiftCardCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Generate a new gift card (Admin only)
    """
    try:
        giftcard = create_giftcard(db, giftcard_data, current_admin.id)
        
        return GiftCardResponse(
            id=giftcard.id,
            code=giftcard.code,
            pin=giftcard.pin,
            amount=giftcard.amount,
            original_amount=giftcard.original_amount,
            card_type=giftcard.card_type,
            status=giftcard.status,
            expires_at=giftcard.expires_at,
            generated_by_id=giftcard.generated_by_id,
            redeemed_by_id=giftcard.redeemed_by_id,
            redeemed_at=giftcard.redeemed_at,
            hash_chain=giftcard.hash_chain,
            created_at=giftcard.created_at
        )
    except Exception as e:
        import traceback
        print(f"Error generating gift card: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate gift card: {str(e)}"
        )


@router.post("/generate/batch", response_model=List[GiftCardResponse])
async def generate_batch_giftcards(
    batch_data: GiftCardBatchCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Generate multiple gift cards in batch (Admin only)
    """
    try:
        giftcards = create_batch_giftcards(db, batch_data, current_admin.id)
        
        return [
            GiftCardResponse(
                id=gc.id,
                code=gc.code,
                pin=gc.pin,
                amount=gc.amount,
                original_amount=gc.original_amount,
                card_type=gc.card_type,
                status=gc.status,
                expires_at=gc.expires_at,
                generated_by_id=gc.generated_by_id,
                redeemed_by_id=gc.redeemed_by_id,
                redeemed_at=gc.redeemed_at,
                hash_chain=gc.hash_chain,
                created_at=gc.created_at
            )
            for gc in giftcards
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate gift cards: {str(e)}"
        )


@router.post("/verify", response_model=GiftCardVerifyResponse)
async def verify_giftcard_endpoint(
    verify_data: GiftCardVerify,
    db: Session = Depends(get_db)
):
    """
    Verify a gift card (public endpoint)
    """
    is_valid, giftcard, message = verify_giftcard(db, verify_data.code)
    
    if not giftcard:
        return GiftCardVerifyResponse(
            valid=False,
            message=message
        )
    
    return GiftCardVerifyResponse(
        valid=is_valid,
        amount=giftcard.amount if is_valid else None,
        status=giftcard.status,
        expires_at=giftcard.expires_at,
        message=message
    )


@router.post("/redeem")
async def redeem_giftcard_endpoint(
    redeem_data: GiftCardRedeem,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Redeem a gift card and credit wallet
    """
    try:
        success, giftcard, message = redeem_giftcard(
            db, redeem_data.code, redeem_data.pin, current_user.id
        )
        
        if not success or not giftcard:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Credit user's wallet
        transaction = credit_wallet(
            db=db,
            user_id=current_user.id,
            amount_cedis=giftcard.amount_cedis,
            description=f"Gift card redemption: {giftcard.code}",
            payment_reference=giftcard.code,
            payment_method=PaymentMethod.GIFTCARD
        )
        
        return {
            "success": True,
            "message": message,
            "amount_credited": giftcard.amount,
            "giftcard_code": giftcard.code,
            "transaction_id": transaction.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error redeeming gift card: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to redeem gift card: {str(e)}"
        )


@router.get("/", response_model=List[GiftCardPublicResponse])
async def get_giftcards_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[GiftCardStatus] = None,
    card_type: Optional[GiftCardType] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all gift cards (Admin only)
    """
    giftcards = get_giftcards(db, skip, limit, status, card_type)
    
    return [
        GiftCardPublicResponse(
            id=gc.id,
            code=gc.code,
            amount=gc.amount,
            card_type=gc.card_type,
            status=gc.status,
            expires_at=gc.expires_at,
            created_at=gc.created_at
        )
        for gc in giftcards
    ]


@router.get("/my-giftcards", response_model=List[GiftCardPublicResponse])
async def get_my_giftcards(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get gift cards redeemed by current user
    """
    giftcards = get_user_giftcards(db, current_user.id, skip, limit)
    
    return [
        GiftCardPublicResponse(
            id=gc.id,
            code=gc.code,
            amount=gc.amount,
            card_type=gc.card_type,
            status=gc.status,
            expires_at=gc.expires_at,
            created_at=gc.created_at
        )
        for gc in giftcards
    ]


@router.get("/{giftcard_id}", response_model=GiftCardResponse)
async def get_giftcard_detail(
    giftcard_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get gift card details (Admin only)
    """
    giftcard = get_giftcard_by_id(db, giftcard_id)
    
    if not giftcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gift card not found"
        )
    
    return GiftCardResponse(
        id=giftcard.id,
        code=giftcard.code,
        pin=giftcard.pin,
        amount=giftcard.amount,
        original_amount=giftcard.original_amount,
        card_type=giftcard.card_type,
        status=giftcard.status,
        expires_at=giftcard.expires_at,
        generated_by_id=giftcard.generated_by_id,
        redeemed_by_id=giftcard.redeemed_by_id,
        redeemed_at=giftcard.redeemed_at,
        hash_chain=giftcard.hash_chain,
        created_at=giftcard.created_at,
        updated_at=giftcard.updated_at
    )


@router.post("/{giftcard_id}/cancel")
async def cancel_giftcard_endpoint(
    giftcard_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cancel a gift card (Admin only)
    """
    giftcard = cancel_giftcard(db, giftcard_id, current_admin.id)
    
    if not giftcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gift card not found"
        )
    
    return {
        "success": True,
        "message": "Gift card cancelled successfully",
        "giftcard_id": giftcard.id,
        "code": giftcard.code
    }


@router.get("/{giftcard_id}/transactions", response_model=List[GiftCardTransactionResponse])
async def get_giftcard_transactions_endpoint(
    giftcard_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get transaction history for a gift card (Admin only)
    """
    transactions = get_giftcard_transactions(db, giftcard_id)
    
    return [
        GiftCardTransactionResponse(
            id=t.id,
            giftcard_id=t.giftcard_id,
            transaction_type=t.transaction_type,
            amount=t.amount_cedis / 100,
            user_id=t.user_id,
            transaction_hash=t.transaction_hash,
            description=t.description,
            created_at=t.created_at
        )
        for t in transactions
    ]


@router.get("/stats/overview", response_model=GiftCardStats)
async def get_giftcard_stats_endpoint(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get gift card statistics (Admin only)
    """
    stats = get_giftcard_stats(db)
    
    return GiftCardStats(**stats)


@router.post("/{giftcard_id}/send")
async def send_giftcard(
    giftcard_id: str,
    recipient_email: Optional[str] = None,
    recipient_phone: Optional[str] = None,
    recipient_user_id: Optional[str] = None,
    message: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Send gift card via email or SMS (Admin only)
    """
    from app.core.email import send_email
    from app.services.hubtel_sms import HubtelSMSService
    from app.crud.user import get_user_by_id
    
    # Get the gift card
    giftcard = get_giftcard_by_id(db, giftcard_id)
    if not giftcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gift card not found"
        )
    
    # If recipient_user_id is provided, get user details
    if recipient_user_id:
        recipient_user = get_user_by_id(db, recipient_user_id)
        if not recipient_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient user not found"
            )
        recipient_email = recipient_email or recipient_user.email
        recipient_phone = recipient_phone or recipient_user.phone_number
    
    if not recipient_email and not recipient_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone number must be provided"
        )
    
    results = {"email": None, "sms": None}
    
    # Send via email
    if recipient_email:
        try:
            custom_message = message or "You've received a gift card from GoShopGhana!"
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #FED141; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #303A4D; margin: 0;">🎁 Gift Card from GoShopGhana</h1>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #303A4D;">{custom_message}</p>
                        <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #FED141;">
                            <p style="margin: 0; color: #666;">Gift Card Code:</p>
                            <h2 style="margin: 10px 0; color: #303A4D; font-size: 28px; letter-spacing: 2px;">{giftcard.code}</h2>
                            {f'<p style="margin: 0; color: #666;">PIN:</p><h3 style="margin: 10px 0; color: #303A4D;">{giftcard.pin}</h3>' if giftcard.pin else ''}
                            <p style="margin: 10px 0 0 0; color: #666;">Amount: <strong style="color: #303A4D;">GH₵{giftcard.amount:.2f}</strong></p>
                        </div>
                        <p style="font-size: 14px; color: #666;">
                            To redeem this gift card, visit <a href="https://goshopghana.com" style="color: #FED141;">goshopghana.com</a> 
                            and enter the code during checkout.
                        </p>
                        {f'<p style="font-size: 14px; color: #666;">Expires: {giftcard.expires_at.strftime("%B %d, %Y")}</p>' if giftcard.expires_at else ''}
                    </div>
                </body>
            </html>
            """
            
            email_sent = send_email(
                email_to=recipient_email,
                subject="🎁 You've Received a GoShopGhana Gift Card!",
                html_content=html_content
            )
            results["email"] = "sent" if email_sent else "failed"
        except Exception as e:
            results["email"] = f"error: {str(e)}"
    
    # Send via SMS
    if recipient_phone:
        try:
            sms_service = HubtelSMSService()
            sms_message = f"You've received a GoShopGhana Gift Card! Code: {giftcard.code}"
            if giftcard.pin:
                sms_message += f" | PIN: {giftcard.pin}"
            sms_message += f" | Amount: GH₵{giftcard.amount:.2f}. Redeem at goshopghana.com"
            
            sms_response = await sms_service.send_sms(
                recipient=recipient_phone,
                message=sms_message
            )
            results["sms"] = "sent" if sms_response.get("status") == "success" else "failed"
        except Exception as e:
            results["sms"] = f"error: {str(e)}"
    
    return {
        "message": "Gift card sent",
        "results": results,
        "giftcard_code": giftcard.code
    }
