"""
Manual Payment Recovery Script
Use this to manually verify and credit stuck payments
"""

import asyncio
import sys
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.crud.wallet import get_payment_session_by_reference, process_successful_payment, get_wallet_by_user_id
from app.services.paystack import paystack_service
from app.models.wallet import PaymentMethod, TransactionStatus

async def verify_and_credit_payment(reference: str):
    """
    Manually verify a payment and credit wallet if successful
    """
    db = SessionLocal()
    
    try:
        print(f"\n{'='*60}")
        print(f"MANUAL PAYMENT RECOVERY")
        print(f"Reference: {reference}")
        print(f"{'='*60}\n")
        
        # Get payment session
        payment_session = get_payment_session_by_reference(db, reference)
        
        if not payment_session:
            print(f"❌ Payment session not found for reference: {reference}")
            return
        
        print(f"✅ Payment session found:")
        print(f"   - User ID: {payment_session.user_id}")
        print(f"   - Amount: {payment_session.amount_cedis / 100} GHS")
        print(f"   - Current Status: {payment_session.status}")
        print(f"   - Email: {payment_session.email}")
        
        # Check current wallet balance
        wallet = get_wallet_by_user_id(db, payment_session.user_id)
        if wallet:
            print(f"   - Current Wallet Balance: {wallet.balance_cedis / 100} GHS")
        
        # Verify with Paystack
        print(f"\n🔍 Verifying with Paystack...")
        paystack_response = await paystack_service.verify_payment(reference)
        
        if not paystack_response.get("status"):
            print(f"❌ Paystack verification failed")
            print(f"   Response: {paystack_response}")
            return
        
        data = paystack_response["data"]
        payment_status = data.get("status")
        
        print(f"📥 Paystack Response:")
        print(f"   - Status: {payment_status}")
        print(f"   - Amount: {data.get('amount')} kobo")
        print(f"   - Channel: {data.get('channel')}")
        print(f"   - Paid At: {data.get('paid_at')}")
        
        if payment_status == "success":
            if payment_session.status == TransactionStatus.SUCCESS:
                print(f"\n⚠️  Payment already processed!")
                print(f"   - Wallet should already be credited")
                
                # Check wallet again
                wallet = get_wallet_by_user_id(db, payment_session.user_id)
                if wallet:
                    print(f"   - Current Wallet Balance: {wallet.balance_cedis / 100} GHS")
            else:
                print(f"\n💰 Processing payment...")
                
                # Process the payment
                transaction = process_successful_payment(
                    db=db,
                    paystack_reference=reference,
                    payment_method=PaymentMethod.MOBILE_MONEY if "mobile" in str(data.get("channel", "")).lower() else PaymentMethod.CARD
                )
                
                print(f"✅ Wallet credited successfully!")
                print(f"   - Transaction ID: {transaction.id if transaction else 'N/A'}")
                
                # Check new wallet balance
                wallet = get_wallet_by_user_id(db, payment_session.user_id)
                if wallet:
                    print(f"   - New Wallet Balance: {wallet.balance_cedis / 100} GHS")
        else:
            print(f"\n❌ Payment not successful on Paystack")
            print(f"   - Status: {payment_status}")
            print(f"   - Cannot credit wallet")
        
        print(f"\n{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
    finally:
        db.close()


async def list_recent_payments(user_email: str = None, limit: int = 10):
    """
    List recent payment sessions
    """
    db = SessionLocal()
    
    try:
        from app.models.wallet import PaymentSession
        
        query = db.query(PaymentSession)
        
        if user_email:
            query = query.filter(PaymentSession.email == user_email)
        
        sessions = query.order_by(PaymentSession.created_at.desc()).limit(limit).all()
        
        print(f"\n{'='*60}")
        print(f"RECENT PAYMENT SESSIONS")
        if user_email:
            print(f"Email: {user_email}")
        print(f"{'='*60}\n")
        
        for session in sessions:
            print(f"Reference: {session.paystack_reference}")
            print(f"  - User: {session.email}")
            print(f"  - Amount: {session.amount_cedis / 100} GHS")
            print(f"  - Status: {session.status}")
            print(f"  - Created: {session.created_at}")
            print(f"  - Updated: {session.updated_at}")
            print()
        
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python test_payment_recovery.py <reference>           # Verify specific payment")
        print("  python test_payment_recovery.py list                  # List recent payments")
        print("  python test_payment_recovery.py list user@email.com   # List user's payments")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "list":
        email = sys.argv[2] if len(sys.argv) > 2 else None
        asyncio.run(list_recent_payments(email))
    else:
        # Assume it's a reference
        reference = command
        asyncio.run(verify_and_credit_payment(reference))
