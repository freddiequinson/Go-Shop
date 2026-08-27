# Architecture

## System boundary

The browser talks to the Next.js application and the FastAPI API over TLS. FastAPI owns business
rules and persistence. PostgreSQL is the system of record. Paystack, object storage, SMS, email,
OAuth, and Groq are adapters outside the trust boundary.

```text
Browser
  |-- Next.js storefront and operations UI
  |-- FastAPI /api/v1
          |-- PostgreSQL through SQLAlchemy and Alembic
          |-- Paystack payment adapter
          |-- Spaces compatible object storage
          |-- optional SMS, email, OAuth, and Groq adapters
```

## Runtime topologies

The local Compose stack contains PostgreSQL, FastAPI, and Next.js. PostgreSQL has no host port.
FastAPI waits for the database health check and runs migrations before serving requests.

The production Compose stack contains only FastAPI and Next.js. It requires managed PostgreSQL and
binds both services to loopback for a separate TLS reverse proxy. The public API origin is a
frontend build argument because Next.js embeds `NEXT_PUBLIC_API_URL` into browser assets.

Frontend diagnostic pages are not part of the release tree. Backend test, sample-data, and temporary
migration routers are registered only when the explicit `DEBUG` setting is true. Production leaves
that setting false.

## Payment flow

For an authenticated order, the API first loads the order using both order ID and current user ID.
Only eligible unpaid states may initialize a payment. The Paystack adapter returns an authorization
URL and the API records the payment attempt and reference before returning to the browser.

Paystack webhooks are authenticated against the exact raw request bytes using HMAC-SHA512 before
JSON parsing or payment-state access. Invalid or missing signatures receive HTTP 401. A successful
event is processed idempotently by checking the existing payment session status.

## Important invariants

- The API, not the browser, owns order eligibility, monetary state, and authorization decisions.
- An order lookup for a customer is scoped by both order ID and authenticated user ID.
- An unsigned webhook never reaches JSON parsing or payment mutation.
- Required production configuration fails during Compose interpolation rather than falling back.
- Optional integrations may be absent without preventing the core application from starting.
- Test and temporary migration endpoints are absent from the production route table.
- Database schema changes run through Alembic.
- The browser bundle and API CORS allowlist must describe the same deployed origins.

Removing the API authorization checks would expose cross-user commerce operations. Removing the raw
webhook signature gate would let an attacker submit forged payment events. Removing the frontend
build argument would compile a production browser bundle that calls the wrong API.
