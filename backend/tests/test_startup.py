from fastapi.testclient import TestClient

from main import app


def test_health_is_available_without_optional_ai() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "goshopghana-api",
    }


def test_production_router_excludes_test_and_temporary_migration_endpoints() -> None:
    registered_paths = {route.path for route in app.routes}

    assert "/api/v1/test/send-email" not in registered_paths
    assert "/api/v1/test/send-sms" not in registered_paths
    assert "/api/v1/test-audit/create-sample-audit-logs" not in registered_paths
    assert "/api/v1/migrate/images-to-spaces" not in registered_paths
    assert "/api/v1/migrate/status" not in registered_paths
    assert "/api/v1/migrate-async/start" not in registered_paths
    assert "/api/v1/migrate-async/progress" not in registered_paths
