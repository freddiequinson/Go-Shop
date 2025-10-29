"""
Create or update admin user with proper email
"""

from app.db.database import SessionLocal
from app.models.user import User, UserType, VerificationStatus
from app.core.security import get_password_hash
import uuid

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin exists by username
        admin = db.query(User).filter(User.username == "admin").first()
        
        if admin:
            # Update existing admin with email
            admin.email = "admin@goshopghana.com"
            admin.password_hash = get_password_hash("admin1234")
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
                password_hash=get_password_hash("admin1234"),
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
