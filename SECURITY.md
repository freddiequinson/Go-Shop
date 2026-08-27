# Security

## Configuration and secrets

Tracked environment files contain names and placeholders only. Real credentials belong in an
untracked environment file or a deployment secret store. Local and production credentials must be
different. Signing keys should be generated independently and rotated without being printed in
logs or issue text.

The repository has both current-tree and complete-history secret scanning. A clean scan does not
prove that an exposed credential was rotated. Rotation evidence must record the provider and date,
never the credential value, before production recovery.

The repository owner confirmed on 27 August 2026 that the exposed DigitalOcean database credential
was rotated on 2 July 2026. No credential value is retained in this evidence.

## Authentication and authorization

Protected endpoints use bearer authentication and load the active user server-side. Customer order
access is scoped to that user. Administrative and specialist roles have separate dependencies.
Authorization must be checked again in the API even when the UI hides a control.

Diagnostic frontend pages are excluded from production source. Backend testing, sample-audit, and
temporary image-migration routers are imported and registered only under the explicit `DEBUG` flag.
Do not enable `DEBUG` on a public deployment.

## Payments

- Paystack secret keys are required configuration.
- The server calculates amounts from persisted order state for order checkout.
- Webhooks use HMAC-SHA512 validation over the raw body before parsing.
- Invalid signatures return a generic response and are never logged.
- Provider errors shown to users must not expose credentials, request headers, or internal traces.
- Live provider calls are excluded from automated tests.

## Network and data

PostgreSQL is not published by either supported Compose topology. Production application ports bind
to loopback and require a TLS reverse proxy. Managed PostgreSQL must use its provider TLS settings.
CORS must list exact storefront origins rather than `*`.

## Reporting a vulnerability

Do not open a public issue containing credentials, customer data, exploit payloads, or production
host details. Contact the repository owner privately with the affected component, reproduction,
impact, and a redacted proof.

## Release checklist

- Confirm all previously exposed credentials are rotated and record provider plus date.
- Run the scanner canary, current-tree scan, and complete-history scan with redaction.
- Run backend payment and startup tests, frontend lint/type/build, and Compose contracts.
- Validate production Compose with the real deployment environment without printing it.
- Rehearse backup restore and payment rollback in staging.
- Perform manual authentication, checkout, webhook, role, and browser checks before cutover.
