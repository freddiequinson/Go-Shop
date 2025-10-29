"""
Payment endpoints for GoShopGhana
Ghana market focused with Paystack integration
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.schemas.payment import (
    PaymentInitRequest, PaymentInitResponse, PaymentVerificationResponse,
    WalletResponse, TransactionResponse, WalletCreditRequest, WalletDebitRequest,
    PaymentStats
)
from app.models.wallet import TransactionStatus, PaymentMethod
from app.crud.wallet import (
    get_or_create_wallet, credit_wallet, debit_wallet, get_wallet_transactions,
    create_payment_session, get_payment_session_by_reference, 
    process_successful_payment, get_wallet_statistics
)
from app.services.paystack import paystack_service
from app.core.deps import get_current_active_user, get_current_admin
from app.models.user import User
import json

router = APIRouter()

import hashlib
import hmac


@router.get("/wallet", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's wallet information
    """
    wallet = get_or_create_wallet(db, current_user.id)
    
    return WalletResponse(
        id=wallet.id,
        user_id=wallet.user_id,
        balance_cedis=wallet.balance_cedis,
        balance=wallet.balance,
        is_active=wallet.is_active,
        is_frozen=wallet.is_frozen,
        created_at=wallet.created_at,
        updated_at=wallet.updated_at
    )


@router.get("/wallet/transactions", response_model=List[TransactionResponse])
async def get_wallet_transactions_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's wallet transaction history
    """
    transactions = get_wallet_transactions(db, current_user.id, skip, limit)
    
    return [
        TransactionResponse(
            id=t.id,
            wallet_id=t.wallet_id,
            transaction_type=t.transaction_type,
            amount_cedis=t.amount_cedis,
            amount=t.amount,
            status=t.status,
            payment_method=t.payment_method,
            payment_reference=t.payment_reference,
            description=t.description,
            meta_data=t.meta_data,
            order_id=t.order_id,
            created_at=t.created_at,
            updated_at=t.updated_at,
            completed_at=t.completed_at
        )
        for t in transactions
    ]


@router.post("/initialize", response_model=PaymentInitResponse)
async def initialize_payment(
    payment_request: PaymentInitRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Initialize payment with Paystack for Ghana market
    """
    try:
        # Convert amount to cedis (kobo equivalent for Ghana)
        amount_cedis = paystack_service.cedis_to_kobo(payment_request.amount)
        
        # Generate unique reference
        reference = paystack_service.generate_reference()
        
        # Prepare metadata
        metadata = {
            "user_id": current_user.id,
            "user_email": current_user.email,
            "order_id": payment_request.order_id,
            "custom_metadata": payment_request.metadata or {}
        }
        
        # Initialize payment with Paystack
        paystack_response = await paystack_service.initialize_payment(
            email=current_user.email,
            amount_cedis=amount_cedis,
            reference=reference,
            callback_url=payment_request.callback_url,
            metadata=metadata
        )
        
        if not paystack_response.get("status"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment initialization failed: {paystack_response.get('message', 'Unknown error')}"
            )
        
        # Extract response data
        data = paystack_response["data"]
        
        # Create payment session in database
        payment_session = create_payment_session(
            db=db,
            user_id=current_user.id,
            amount_cedis=amount_cedis,
            paystack_reference=reference,
            email=current_user.email,
            order_id=payment_request.order_id,
            paystack_access_code=data.get("access_code"),
            authorization_url=data.get("authorization_url"),
            metadata=json.dumps(metadata)
        )
        
        return PaymentInitResponse(
            payment_session_id=payment_session.id,
            paystack_reference=reference,
            authorization_url=data["authorization_url"],
            access_code=data["access_code"],
            amount=float(payment_request.amount),
            currency="GHS",
            status="pending"
        )
        
    except Exception as e:
        import traceback
        print(f"Payment initialization error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initialization failed: {str(e)}"
        )


@router.post("/verify/{reference}")
async def verify_payment(
    reference: str,
    db: Session = Depends(get_db)
):
    """
    Verify payment with Paystack and update wallet
    No authentication required - uses payment reference for security
    """
    try:
        print(f"\n{'='*50}")
        print(f"PAYMENT VERIFICATION STARTED")
        print(f"Reference: {reference}")
        print(f"{'='*50}\n")
        
        # Get payment session
        payment_session = get_payment_session_by_reference(db, reference)
        
        if not payment_session:
            print(f"❌ Payment session not found for reference: {reference}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment session not found"
            )
        
        print(f"✅ Payment session found:")
        print(f"   - User ID: {payment_session.user_id}")
        print(f"   - Amount: {payment_session.amount_cedis / 100} GHS")
        print(f"   - Current Status: {payment_session.status}")
        
        # Verify payment with Paystack
        print(f"\n🔍 Verifying with Paystack...")
        paystack_response = await paystack_service.verify_payment(reference)
        
        print(f"📥 Paystack Response:")
        print(f"   - Status: {paystack_response.get('status')}")
        print(f"   - Data: {paystack_response.get('data', {})}")
        
        if not paystack_response.get("status"):
            print(f"❌ Paystack verification failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment verification failed: {paystack_response.get('message', 'Unknown error')}"
            )
        
        # Extract verification data
        data = paystack_response["data"]
        payment_status = data.get("status")
        
        print(f"\n💳 Payment Status from Paystack: {payment_status}")
        
        if payment_status == "success":
            print(f"\n✅ Payment SUCCESSFUL - Processing...")
            
            # Process successful payment
            try:
                transaction = process_successful_payment(
                    db=db,
                    paystack_reference=reference,
                    payment_method=PaymentMethod.MOBILE_MONEY if "mobile" in str(data.get("channel", "")).lower() else PaymentMethod.CARD
                )
                
                print(f"💰 Wallet credited successfully!")
                print(f"   - Transaction ID: {transaction.id if transaction else 'Already processed'}")
                print(f"   - Amount: {payment_session.amount_cedis / 100} GHS")
                print(f"\n{'='*50}\n")
                
                return {
                    "payment_session_id": payment_session.id,
                    "reference": reference,
                    "status": "success",
                    "amount": payment_session.amount_cedis / 100,
                    "currency": "GHS",
                    "payment_method": data.get("channel", "card"),
                    "transaction_id": transaction.id if transaction else None,
                    "message": "Payment verified and wallet credited successfully"
                }
            except Exception as e:
                print(f"❌ Error processing payment: {str(e)}")
                import traceback
                print(traceback.format_exc())
                raise
        elif payment_status in ["failed", "cancelled", "abandoned"]:
            # Payment failed
            from app.crud.wallet import update_payment_session_status
            update_payment_session_status(db, reference, TransactionStatus.FAILED)
            
            return {
                "payment_session_id": payment_session.id,
                "reference": reference,
                "status": "failed",
                "amount": payment_session.amount_cedis / 100,
                "currency": "GHS",
                "message": f"Payment {payment_status}"
            }
        else:
            # Payment still pending
            return {
                "payment_session_id": payment_session.id,
                "reference": reference,
                "status": "pending",
                "amount": payment_session.amount_cedis / 100,
                "currency": "GHS",
                "message": "Payment is still being processed"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )


@router.post("/webhook")
async def paystack_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Paystack webhook endpoint for payment notifications
    This is called directly by Paystack when payment status changes
    """
    try:
        # Get request body
        body = await request.body()
        
        # Verify webhook signature (if secret is configured)
        signature = request.headers.get("x-paystack-signature")
        
        print(f"\n{'='*50}")
        print(f"WEBHOOK RECEIVED FROM PAYSTACK")
        print(f"Signature: {signature}")
        print(f"{'='*50}\n")
        
        # Parse webhook data
        webhook_data = json.loads(body)
        event = webhook_data.get("event")
        data = webhook_data.get("data", {})
        
        print(f"Event: {event}")
        print(f"Data: {data}")
        
        # Handle charge.success event
        if event == "charge.success":
            reference = data.get("reference")
            status_paystack = data.get("status")
            
            print(f"\n✅ Charge Success Event")
            print(f"   - Reference: {reference}")
            print(f"   - Status: {status_paystack}")
            
            if reference and status_paystack == "success":
                # Get payment session
                payment_session = get_payment_session_by_reference(db, reference)
                
                if payment_session and payment_session.status != TransactionStatus.SUCCESS:
                    print(f"   - Processing payment...")
                    
                    # Process the payment
                    transaction = process_successful_payment(
                        db=db,
                        paystack_reference=reference,
                        payment_method=PaymentMethod.MOBILE_MONEY if "mobile" in str(data.get("channel", "")).lower() else PaymentMethod.CARD
                    )
                    
                    print(f"   - ✅ Wallet credited!")
                    print(f"   - Transaction ID: {transaction.id if transaction else 'Already processed'}")
                else:
                    print(f"   - ⚠️ Payment already processed or session not found")
        
        print(f"\n{'='*50}\n")
        
        # Return 200 OK to Paystack
        return {"status": "success"}
        
    except Exception as e:
        print(f"❌ Webhook error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        # Still return 200 to prevent Paystack from retrying
        return {"status": "error", "message": str(e)}


class WalletFundRequest(BaseModel):
    """Request schema for wallet funding"""
    amount_cedis: float
    payment_method: str
    phone_number: Optional[str] = None


@router.post("/wallet/fund")
async def fund_wallet(
    request: WalletFundRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Fund wallet using Paystack (supports mobile money and cards)
    All payment methods go through Paystack with appropriate channels
    """
    try:
        amount_cedis = request.amount_cedis
        payment_method = request.payment_method
        phone_number = request.phone_number
        # Map payment methods to Paystack channels
        channel_mapping = {
            "mtn-momo": "mobile_money",
            "telecel-cash": "mobile_money",
            "at-money": "mobile_money",
            "paystack": "card"
        }
        
        # Map to mobile money providers
        mobile_money_providers = {
            "mtn-momo": "mtn",
            "telecel-cash": "vod",  # Vodafone/Telecel
            "at-money": "tgo"  # AirtelTigo
        }
        
        channel = channel_mapping.get(payment_method, "card")
        
        # Generate unique reference
        reference = paystack_service.generate_reference()
        
        # Convert amount to kobo (pesewas for Ghana)
        amount_kobo = int(amount_cedis * 100)
        
        # Prepare metadata
        metadata = {
            "user_id": current_user.id,
            "user_email": current_user.email,
            "purpose": "wallet_funding",
            "payment_method": payment_method
        }
        
        # Initialize payment with Paystack
        paystack_data = {
            "email": current_user.email,
            "amount": amount_kobo,
            "reference": reference,
            "currency": "GHS",
            "channels": [channel],
            "metadata": metadata
        }
        
        # Add mobile money specific data
        if channel == "mobile_money" and phone_number:
            paystack_data["mobile_money"] = {
                "phone": phone_number,
                "provider": mobile_money_providers.get(payment_method, "mtn")
            }
        
        # For mobile money, use direct charge with pre-filled details
        if channel == "mobile_money" and phone_number:
            provider = mobile_money_providers.get(payment_method, "mtn")
            
            try:
                # Direct charge for mobile money
                paystack_response = await paystack_service.charge_mobile_money(
                    email=current_user.email,
                    amount_cedis=amount_kobo,
                    phone=phone_number,
                    provider=provider,
                    reference=reference,
                    metadata=metadata
                )
                
                if not paystack_response.get("status"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Mobile money charge failed: {paystack_response.get('message')}"
                    )
                
                data = paystack_response["data"]
                
                # Create payment session
                payment_session = create_payment_session(
                    db=db,
                    user_id=current_user.id,
                    amount_cedis=amount_kobo,
                    paystack_reference=reference,
                    email=current_user.email,
                    paystack_access_code=data.get("access_code"),
                    authorization_url=data.get("authorization_url") or data.get("display_text"),
                    metadata=json.dumps(metadata)
                )
                
                # Get payment method name
                method_names = {
                    "mtn-momo": "MTN Mobile Money",
                    "telecel-cash": "Telecel Cash",
                    "at-money": "AT Money"
                }
                method_name = method_names.get(payment_method, "mobile money")
                
                return {
                    "status": "success",
                    "message": f"Please approve the payment on your {method_name} phone",
                    "reference": reference,
                    "display_text": data.get("display_text", "Check your phone to approve payment"),
                    "payment_method": payment_method,
                    "channel": channel,
                    "requires_approval": True
                }
            except Exception as e:
                # Fallback to redirect if direct charge fails
                pass
        
        # For cards or fallback, use redirect flow
        callback_url = "http://localhost:3000/wallet/payment-callback"
        
        paystack_response = await paystack_service.initialize_payment(
            email=current_user.email,
            amount_cedis=amount_kobo,
            reference=reference,
            callback_url=callback_url,
            metadata=metadata,
            channels=[channel]
        )
        
        if not paystack_response.get("status"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment initialization failed: {paystack_response.get('message')}"
            )
        
        data = paystack_response["data"]
        
        # Create payment session
        payment_session = create_payment_session(
            db=db,
            user_id=current_user.id,
            amount_cedis=amount_kobo,
            paystack_reference=reference,
            email=current_user.email,
            paystack_access_code=data.get("access_code"),
            authorization_url=data.get("authorization_url"),
            metadata=json.dumps(metadata)
        )
        
        return {
            "status": "success",
            "message": "Payment initialized",
            "reference": reference,
            "authorization_url": data["authorization_url"],
            "access_code": data["access_code"],
            "payment_method": payment_method,
            "channel": channel,
            "requires_approval": False
        }
        
    except Exception as e:
        import traceback
        print(f"Wallet funding error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Wallet funding failed: {str(e)}"
        )


@router.post("/wallet/credit", response_model=TransactionResponse)
async def credit_wallet_endpoint(
    credit_request: WalletCreditRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Credit user's wallet (Admin only - for testing/manual operations)
    """
    try:
        # Convert amount to cedis
        amount_cedis = paystack_service.cedis_to_kobo(credit_request.amount)
        
        transaction = credit_wallet(
            db=db,
            user_id=current_admin.id,  # For now, credit admin's own wallet
            amount_cedis=amount_cedis,
            description=credit_request.description or "Manual wallet credit",
            payment_reference=credit_request.payment_reference,
            payment_method=PaymentMethod.WALLET
        )
        
        return TransactionResponse(
            id=transaction.id,
            wallet_id=transaction.wallet_id,
            transaction_type=transaction.transaction_type,
            amount_cedis=transaction.amount_cedis,
            amount=transaction.amount,
            status=transaction.status,
            payment_method=transaction.payment_method,
            payment_reference=transaction.payment_reference,
            description=transaction.description,
            meta_data=transaction.meta_data,
            order_id=transaction.order_id,
            created_at=transaction.created_at,
            updated_at=transaction.updated_at,
            completed_at=transaction.completed_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Wallet credit failed: {str(e)}"
        )


@router.post("/wallet/debit", response_model=TransactionResponse)
async def debit_wallet_endpoint(
    debit_request: WalletDebitRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Debit user's wallet (for order payments)
    """
    try:
        # Convert amount to cedis
        amount_cedis = paystack_service.cedis_to_kobo(debit_request.amount)
        
        transaction = debit_wallet(
            db=db,
            user_id=current_user.id,
            amount_cedis=amount_cedis,
            description=debit_request.description or "Wallet payment",
            order_id=debit_request.order_id
        )
        
        return TransactionResponse(
            id=transaction.id,
            wallet_id=transaction.wallet_id,
            transaction_type=transaction.transaction_type,
            amount_cedis=transaction.amount_cedis,
            amount=transaction.amount,
            status=transaction.status,
            payment_method=transaction.payment_method,
            payment_reference=transaction.payment_reference,
            description=transaction.description,
            meta_data=transaction.meta_data,
            order_id=transaction.order_id,
            created_at=transaction.created_at,
            updated_at=transaction.updated_at,
            completed_at=transaction.completed_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Wallet debit failed: {str(e)}"
        )


@router.get("/stats", response_model=PaymentStats)
async def get_payment_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get payment statistics for current user
    """
    stats = get_wallet_statistics(db, current_user.id)
    return PaymentStats(**stats)


# Ghana-specific endpoints
@router.get("/ghana/banks")
async def get_ghana_banks(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get list of supported banks in Ghana
    """
    try:
        banks = await paystack_service.list_banks("ghana")
        return banks
    except Exception as e:
        import traceback
        print(f"Ghana banks error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch Ghana banks: {str(e)}"
        )
