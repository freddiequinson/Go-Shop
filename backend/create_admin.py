"""
Create or update admin user with proper email
"""

from app.db.database import SessionLocal
from app.models.user import User, UserType, VerificationStatus
import uuid
import hashlib

def simple_hash_password(password: str) -> str:
    """Simple password hashing using SHA256 (bypasses broken bcrypt)"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin exists by username
        admin = db.query(User).filter(User.username == "admin").first()
        
        if admin:
            # Update existing admin with email
            admin.email = "admin@goshopghana.com"
            admin.password_hash = simple_hash_password("admin1234")
            admin.user_type = UserType.ADMIN
            admin.verification_status = VerificationStatus.VERIFIED
            admin.is_active = True
            db.commit()
            print("✅ Updated existing admin user")
            print(f"   Email: admin@goshopghana.com")
            print(f"   Username: admin")
            print(f"   Password: admin1234")
        else:
            # Create new admin
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@goshopghana.com",
                username="admin",
                full_name="Admin User",
                password_hash=simple_hash_password("admin1234"),
                user_type=UserType.ADMIN,
                verification_status=VerificationStatus.VERIFIED,
                is_active=True,
                location="Accra, Ghana"
            )
            db.add(admin)
            db.commit()
            print("✅ Created new admin user")
            print(f"   Email: admin@goshopghana.com")
            print(f"   Username: admin")
            print(f"   Password: admin1234")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
