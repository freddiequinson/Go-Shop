"""
Script to convert a user to a rider
Run this from the backend directory:
python fix_rider_user.py
"""
import sys
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User
from app.models.rider import Rider
import uuid

def fix_rider_user(user_id: str):
    """Convert a user to a rider and create rider profile"""
    db = SessionLocal()
    
    try:
        # Get the user
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            print(f"❌ User not found: {user_id}")
            return False
        
        print(f"\n📋 Current User Info:")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.full_name}")
        print(f"   Current Type: {user.user_type}")
        print(f"   Phone: {user.phone}")
        
        # Update user type to RIDER
        if user.user_type != "RIDER":
            print(f"\n🔄 Updating user type from {user.user_type} to RIDER...")
            user.user_type = "RIDER"
            db.commit()
            print("✅ User type updated to RIDER")
        else:
            print("\n✅ User is already a RIDER")
        
        # Check if rider profile exists
        existing_rider = db.query(Rider).filter(Rider.user_id == user_id).first()
        
        if existing_rider:
            print(f"\n✅ Rider profile already exists:")
            print(f"   Rider ID: {existing_rider.id}")
            print(f"   Phone: {existing_rider.phone}")
            print(f"   Verified: {existing_rider.is_verified}")
            print(f"   Online: {existing_rider.is_online}")
        else:
            print(f"\n🔄 Creating rider profile...")
            
            # Create rider profile
            new_rider = Rider(
                id=str(uuid.uuid4()),
                user_id=user_id,
                phone=user.phone or "0241234567",
                is_verified=True,
                is_online=True,
                current_status="available",
                total_deliveries=0,
                successful_deliveries=0,
                failed_deliveries=0,
                cancelled_deliveries=0,
                rating=5.0
            )
            
            db.add(new_rider)
            db.commit()
            db.refresh(new_rider)
            
            print(f"✅ Rider profile created:")
            print(f"   Rider ID: {new_rider.id}")
            print(f"   Phone: {new_rider.phone}")
            print(f"   Status: {new_rider.current_status}")
        
        print(f"\n✅ SUCCESS! User {user.email} is now a rider!")
        print(f"\n🔐 You can now login with:")
        print(f"   Email: {user.email}")
        print(f"   Go to: http://localhost:3000/rider")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    # The user ID from the logs
    user_id = "b2ad517b-9868-48a5-a400-efaa0f3e0c4c"
    
    print("=" * 60)
    print("🚴 RIDER USER FIX SCRIPT")
    print("=" * 60)
    
    success = fix_rider_user(user_id)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ ALL DONE! Restart your browser and try again.")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("❌ FAILED! Check the error above.")
        print("=" * 60)
        sys.exit(1)
