import os


_TEST_ENV = {
    "DATABASE_URL": "postgresql://audit:audit@127.0.0.1:5432/audit",
    "SECRET_KEY": "test-only-signing-key",
    "JWT_SECRET_KEY": "test-only-jwt-key",
    "PAYSTACK_SECRET_KEY": "test-only-paystack-secret",
    "PAYSTACK_PUBLIC_KEY": "test-only-paystack-public",
}

for name, value in _TEST_ENV.items():
    os.environ.setdefault(name, value)

os.environ.pop("GROQ_API_KEY", None)
