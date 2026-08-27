import os
import json
import subprocess


REQUIRED_ENV = (
    "DATABASE_URL",
    "DB_PASSWORD",
    "SECRET_KEY",
    "JWT_SECRET_KEY",
    "PAYSTACK_SECRET_KEY",
    "PAYSTACK_PUBLIC_KEY",
)


def run_compose(*files: str, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    command = ["docker", "compose"]
    for file in files:
        command.extend(("--file", file))
    command.extend(("config", "--quiet"))
    return subprocess.run(
        command,
        check=False,
        capture_output=True,
        env=env,
        text=True,
    )


def render_compose(*files: str, env: dict[str, str]) -> dict:
    command = ["docker", "compose"]
    for file in files:
        command.extend(("--file", file))
    command.extend(("config", "--format", "json"))
    result = subprocess.run(
        command,
        check=True,
        capture_output=True,
        env=env,
        text=True,
    )
    return json.loads(result.stdout)


def test_local_compose_refuses_missing_required_configuration() -> None:
    env = os.environ.copy()
    for name in REQUIRED_ENV:
        env.pop(name, None)

    result = run_compose("docker-compose.yml", env=env)

    assert result.returncode != 0
    assert "DB_PASSWORD" in result.stderr


def test_production_compose_requires_managed_database_url() -> None:
    env = os.environ.copy()
    for name in REQUIRED_ENV:
        env.pop(name, None)

    result = run_compose("docker-compose.production.yml", env=env)

    assert result.returncode != 0
    assert "DATABASE_URL" in result.stderr


def test_production_compose_uses_only_the_managed_database() -> None:
    env = os.environ.copy()
    separator = ":" + "//"
    managed_url = f"postgresql{separator}audit:audit@db.invalid:25060/app"
    env.update(
        {
            "DATABASE_URL": managed_url,
            "SECRET_KEY": "test-only-signing-key",
            "JWT_SECRET_KEY": "test-only-jwt-key",
            "PAYSTACK_SECRET_KEY": "test-only-payment-key",
            "PAYSTACK_PUBLIC_KEY": "test-only-payment-public",
            "BACKEND_CORS_ORIGINS": '["https://shop.invalid"]',
            "NEXT_PUBLIC_API_URL": "https://api.shop.invalid",
        }
    )

    config = render_compose("docker-compose.production.yml", env=env)

    assert "db" not in config["services"]
    assert config["services"]["backend"]["environment"]["DATABASE_URL"] == managed_url


def test_local_database_is_not_published_to_the_host() -> None:
    env = os.environ.copy()
    env.update(
        {
            "DB_PASSWORD": "test-only-database-password",
            "SECRET_KEY": "test-only-signing-key",
            "JWT_SECRET_KEY": "test-only-jwt-key",
            "PAYSTACK_SECRET_KEY": "test-only-payment-key",
            "PAYSTACK_PUBLIC_KEY": "test-only-payment-public",
        }
    )

    config = render_compose("docker-compose.yml", env=env)

    assert "ports" not in config["services"]["db"]


def test_local_frontend_embeds_api_origin_during_image_build() -> None:
    env = os.environ.copy()
    env.update(
        {
            "DB_PASSWORD": "test-only-database-password",
            "SECRET_KEY": "test-only-signing-key",
            "JWT_SECRET_KEY": "test-only-jwt-key",
            "PAYSTACK_SECRET_KEY": "test-only-payment-key",
            "PAYSTACK_PUBLIC_KEY": "test-only-payment-public",
            "NEXT_PUBLIC_API_URL": "https://api.local.invalid",
        }
    )

    config = render_compose("docker-compose.yml", env=env)

    frontend = config["services"]["frontend"]
    assert frontend["build"]["args"]["NEXT_PUBLIC_API_URL"] == "https://api.local.invalid"
    assert frontend["environment"]["NEXT_PUBLIC_API_URL"] == "https://api.local.invalid"
