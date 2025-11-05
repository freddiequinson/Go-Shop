"""
Simple script to convert a user to a rider using raw SQL
Run this from the backend directory:
python fix_rider_simple.py
"""
import sys
import psycopg2
from app.core.config import settings

def fix_rider_user(user_id: str):
    """Convert a user to a rider and create rider profile"""
    
    try:
        # Connect to database
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor()
        
        print("=" * 60)
        print("🚴 RIDER USER FIX SCRIPT")
        print("=" * 60)
        
        # Get current user info
        cur.execute("""
            SELECT id, email, full_name, user_type, phone 
            FROM users 
            WHERE id = %s
        """, (user_id,))
        
        user = cur.fetchone()
        
        if not user:
            print(f"\n❌ User not found: {user_id}")
            return False
        
        user_id, email, full_name, user_type, phone = user
        
        print(f"\n📋 Current User Info:")
        print(f"   Email: {email}")
        print(f"   Name: {full_name}")
        print(f"   Current Type: {user_type}")
        print(f"   Phone: {phone}")
        
        # Update user type to RIDER
        if user_type != "RIDER":
            print(f"\n🔄 Updating user type from {user_type} to RIDER...")
            cur.execute("""
                UPDATE users 
                SET user_type = 'RIDER'
                WHERE id = %s
            """, (user_id,))
            conn.commit()
            print("✅ User type updated to RIDER")
        else:
            print("\n✅ User is already a RIDER")
        
        # Check if rider profile exists
        cur.execute("""
            SELECT id, phone, is_verified, is_online 
            FROM riders 
            WHERE user_id = %s
        """, (user_id,))
        
        existing_rider = cur.fetchone()
        
        if existing_rider:
            rider_id, rider_phone, is_verified, is_online = existing_rider
            print(f"\n✅ Rider profile already exists:")
            print(f"   Rider ID: {rider_id}")
            print(f"   Phone: {rider_phone}")
            print(f"   Verified: {is_verified}")
            print(f"   Online: {is_online}")
        else:
            print(f"\n🔄 Creating rider profile...")
            
            # Create rider profile
            cur.execute("""
                INSERT INTO riders (
                    id, user_id, phone, is_verified, is_online,
                    current_status, total_deliveries, successful_deliveries,
                    failed_deliveries, cancelled_deliveries, rating
                )
                VALUES (
                    gen_random_uuid(), %s, %s, true, true,
                    'available', 0, 0, 0, 0, 5.0
                )
                RETURNING id, phone
            """, (user_id, phone or '0241234567'))
            
            new_rider = cur.fetchone()
            conn.commit()
            
            print(f"✅ Rider profile created:")
            print(f"   Rider ID: {new_rider[0]}")
            print(f"   Phone: {new_rider[1]}")
            print(f"   Status: available")
        
        print(f"\n✅ SUCCESS! User {email} is now a rider!")
        print(f"\n🔐 You can now login with:")
        print(f"   Email: {email}")
        print(f"   Go to: http://localhost:3000/rider")
        print(f"\n⚠️  IMPORTANT: Clear your browser cache and login again!")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False


if __name__ == "__main__":
    # The user ID from the logs
    user_id = "b2ad517b-9868-48a5-a400-efaa0f3e0c4c"
    
    success = fix_rider_user(user_id)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ ALL DONE! Clear browser cache and try again.")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("❌ FAILED! Check the error above.")
        print("=" * 60)
        sys.exit(1)
