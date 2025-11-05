"""
Set rider to online
"""
import psycopg2
from app.core.config import settings

user_id = "b2ad517b-9868-48a5-a400-efaa0f3e0c4c"

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()

# Set rider online
cur.execute("""
    UPDATE riders 
    SET is_online = true
    WHERE user_id = %s
    RETURNING id, is_online
""", (user_id,))

result = cur.fetchone()
conn.commit()

print(f"✅ Rider set to online: {result}")

# Verify user and rider
cur.execute("""
    SELECT u.email, u.user_type, r.is_online, r.is_verified
    FROM users u
    JOIN riders r ON r.user_id = u.id
    WHERE u.id = %s
""", (user_id,))

user_info = cur.fetchone()
print(f"\n📋 User Info:")
print(f"   Email: {user_info[0]}")
print(f"   Type: {user_info[1]}")
print(f"   Online: {user_info[2]}")
print(f"   Verified: {user_info[3]}")

cur.close()
conn.close()
