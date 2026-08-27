# Go-Shop Ghana

Go-Shop is a full-stack grocery commerce system for Ghanaian retail operations. It combines a
customer storefront with ordering, Paystack payment initiation and verification, wallet flows,
supplier operations, warehouse workflows, delivery coordination, and administration.

This repository is a sanitized release mirror. It preserves the authorized Git history and its
contributor attribution while removing deploy credentials from the published history. Production
availability is not claimed by this repository.

## Stack

- Next.js 16, React 19, and TypeScript for the storefront and operational interfaces
- FastAPI, SQLAlchemy, Alembic, and PostgreSQL for the API and persistence layer
- Paystack for payment processing
- DigitalOcean Spaces compatible object storage for product media
- Docker Compose for local development and a separate managed-database production topology

## Local setup

Requirements: Docker Desktop with Docker Compose.

1. Copy `.env.example` to `.env`.
2. Replace every required blank with a local-only value. Do not reuse production credentials.
3. Validate the configuration with `docker compose config --quiet`.
4. Start the stack with `docker compose up --build`.
5. Open the storefront at `http://localhost:3000` and the API health endpoint at
   `http://localhost:8000/health`.

The backend container runs Alembic migrations before starting Uvicorn. PostgreSQL is reachable by
the backend inside the Compose network but is not published to the host.

## Production configuration

`docker-compose.production.yml` is intentionally separate from the local stack. It requires a
managed PostgreSQL connection, explicit signing and Paystack keys, an explicit CORS allowlist, and
the public API origin embedded into the frontend image at build time.

Copy `.env.production.example` outside the repository, replace every placeholder, then validate:

```text
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
```

The production Compose file binds application ports to loopback. Put a TLS reverse proxy in front
of them. Do not expose PostgreSQL, Uvicorn, or Next.js directly to the public internet.

## Verification

Backend release seams:

```text
cd backend
python -m pytest -p no:cacheprovider tests
```

Frontend release seams:

```text
cd frontend
npm ci
npm run lint
npm run lint:debt
npm run typecheck
npm run build
npm audit --omit=dev
```

`npm run lint` is the strict CI gate. `npm run lint:debt` also prints inherited warning-level debt
that is being reduced incrementally without hiding correctness failures.

Compose contracts:

```text
python -m pytest -p no:cacheprovider tests/test_compose_contract.py
```

See `ARCHITECTURE.md`, `SECURITY.md`, and `THREAT_MODEL.md` before changing trust boundaries.

## Licence and attribution

The code is released under the MIT License. Contributor attribution is preserved in the Git
history. Do not squash or rewrite that history when creating another mirror.
