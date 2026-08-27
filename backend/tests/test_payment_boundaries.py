import hashlib
import hmac
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.api.api_v1.endpoints import order_payments, payments
from app.middleware.audit_middleware import AuditLoggingMiddleware
from app.models.order import OrderStatus, PaymentStatus
from main import app


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch):
    def override_db():
        yield object()

    monkeypatch.setattr(AuditLoggingMiddleware, "should_log", lambda self, path: False)
    app.dependency_overrides[get_db] = override_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_webhook_rejects_missing_signature_before_parsing(client: TestClient) -> None:
    response = client.post(
        "/api/v1/payments/webhook",
        content=b"not-json",
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid webhook signature"}


def test_webhook_rejects_invalid_signature(client: TestClient) -> None:
    response = client.post(
        "/api/v1/payments/webhook",
        json={"event": "ping", "data": {}},
        headers={"x-paystack-signature": "invalid"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid webhook signature"}


def test_webhook_accepts_valid_signature(client: TestClient) -> None:
    payload = json.dumps(
        {"event": "ping", "data": {}},
        separators=(",", ":"),
    ).encode()
    signature = hmac.new(
        b"test-only-paystack-secret",
        payload,
        hashlib.sha512,
    ).hexdigest()

    response = client.post(
        "/api/v1/payments/webhook",
        content=payload,
        headers={
            "content-type": "application/json",
            "x-paystack-signature": signature,
        },
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success"}


def test_initialize_payment_requires_authentication(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider = AsyncMock()
    monkeypatch.setattr(payments.paystack_service, "initialize_payment", provider)

    response = client.post("/api/v1/payments/initialize", json={"amount": "12.34"})

    assert response.status_code in {401, 403}
    provider.assert_not_awaited()


def test_initialize_payment_uses_authenticated_user_without_live_provider(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user = SimpleNamespace(id="user-1", email="fredrick@example.com")
    app.dependency_overrides[get_current_active_user] = lambda: user
    provider = AsyncMock(
        return_value={
            "status": True,
            "data": {
                "authorization_url": "https://checkout.example.test/session",
                "access_code": "test-access-code",
            },
        }
    )
    monkeypatch.setattr(payments.paystack_service, "initialize_payment", provider)
    monkeypatch.setattr(payments.paystack_service, "generate_reference", lambda: "test-reference")
    monkeypatch.setattr(
        payments,
        "create_payment_session",
        lambda **kwargs: SimpleNamespace(id="session-1"),
    )

    try:
        response = client.post(
            "/api/v1/payments/initialize",
            json={
                "amount": "12.34",
                "order_id": "order-1",
                "callback_url": "https://shop.example.test/payment-return",
            },
        )
    finally:
        app.dependency_overrides.pop(get_current_active_user, None)

    assert response.status_code == 200
    assert response.json() == {
        "payment_session_id": "session-1",
        "paystack_reference": "test-reference",
        "authorization_url": "https://checkout.example.test/session",
        "access_code": "test-access-code",
        "amount": 12.34,
        "currency": "GHS",
        "status": "pending",
    }
    provider.assert_awaited_once()
    assert provider.await_args.kwargs["email"] == "fredrick@example.com"
    assert provider.await_args.kwargs["amount_cedis"] == 1234


def test_initialize_payment_preserves_provider_rejection(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    app.dependency_overrides[get_current_active_user] = lambda: SimpleNamespace(
        id="user-1",
        email="fredrick@example.com",
    )
    monkeypatch.setattr(payments.paystack_service, "generate_reference", lambda: "test-reference")
    monkeypatch.setattr(
        payments.paystack_service,
        "initialize_payment",
        AsyncMock(return_value={"status": False, "message": "Provider rejected request"}),
    )

    try:
        response = client.post("/api/v1/payments/initialize", json={"amount": "12.34"})
    finally:
        app.dependency_overrides.pop(get_current_active_user, None)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Payment initialization failed: Provider rejected request"
    }


def test_checkout_does_not_contact_provider_for_an_unowned_order(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    app.dependency_overrides[get_current_active_user] = lambda: SimpleNamespace(
        id="user-1",
        email="fredrick@example.com",
    )
    provider = AsyncMock()
    monkeypatch.setattr(order_payments.paystack_service, "initialize_payment", provider)
    monkeypatch.setattr(order_payments, "get_order_by_id", lambda db, order_id, user_id: None)

    try:
        response = client.post(
            "/api/v1/orders/order-owned-by-someone-else/initialize-payment",
            json={},
        )
    finally:
        app.dependency_overrides.pop(get_current_active_user, None)

    assert response.status_code == 404
    assert response.json() == {"detail": "Order not found"}
    provider.assert_not_awaited()


def test_checkout_initializes_owned_pending_order_without_live_provider(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FakeDb:
        commits = 0

        def commit(self) -> None:
            self.commits += 1

    fake_db = FakeDb()
    user = SimpleNamespace(id="user-1", email="fredrick@example.com")
    order = SimpleNamespace(
        payment_status=PaymentStatus.PENDING,
        status=OrderStatus.PENDING_PAYMENT,
        total_cedis=1234,
        payment_reference=None,
    )
    app.dependency_overrides[get_db] = lambda: fake_db
    app.dependency_overrides[get_current_active_user] = lambda: user
    provider = AsyncMock(
        return_value={
            "status": True,
            "data": {
                "authorization_url": "https://checkout.example.test/order-session",
                "access_code": "order-access-code",
            },
        }
    )
    recorded_attempt = {}

    def find_order(db, order_id, user_id):
        assert db is fake_db
        assert order_id == "order-1"
        assert user_id == "user-1"
        return order

    monkeypatch.setattr(order_payments, "get_order_by_id", find_order)
    monkeypatch.setattr(order_payments.paystack_service, "generate_reference", lambda: "order-reference")
    monkeypatch.setattr(order_payments.paystack_service, "initialize_payment", provider)
    monkeypatch.setattr(
        order_payments,
        "create_payment_attempt",
        lambda **kwargs: recorded_attempt.update(kwargs),
    )

    try:
        response = client.post(
            "/api/v1/orders/order-1/initialize-payment",
            json={"callback_url": "https://shop.example.test/payment-return"},
        )
    finally:
        app.dependency_overrides.pop(get_current_active_user, None)

    assert response.status_code == 200
    assert response.json() == {
        "order_id": "order-1",
        "payment_reference": "order-reference",
        "authorization_url": "https://checkout.example.test/order-session",
        "access_code": "order-access-code",
        "amount": 12.34,
        "currency": "GHS",
        "status": "pending",
    }
    assert order.payment_reference == "order-reference"
    assert order.payment_status == PaymentStatus.PROCESSING
    assert fake_db.commits == 1
    assert recorded_attempt["order_id"] == "order-1"
    assert recorded_attempt["amount_cedis"] == 1234
    provider.assert_awaited_once()
