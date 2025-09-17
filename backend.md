
## Backend roadmap (Go‑Shop)

This document defines the phased plan to take the current Node/Express backend from prototype to production‑ready service, with stable APIs for the existing frontend.

### Current state (implemented)
- Static hosting + JSON APIs under `/api`
- Cookie sessions (JWT httpOnly)
- File‑backed JSON persistence (debounced writes)
- Auth: signup/signin/signout/me
- Products: list with optional `?market=` filter
- Cart: anonymous + user carts, merge on signin
- Orders: create, list, detail

---

## Phased milestones

### M1 — Hardening and structure (TypeScript + modules)
- [ ] Migrate codebase to TypeScript
- [ ] Restructure into `config/`, `middleware/`, `routes/`, `services/`, `db/`
- [ ] Add middleware: `helmet`, `compression`, `express-rate-limit`, centralized error handler
- [ ] Input validation with `zod` for all routes (body/query/params)
- [ ] Structured logs with `pino` and request IDs; `/health` and `/ready` endpoints

### M2 — Real database
- [ ] Introduce SQLite (local/dev) via `better-sqlite3` or Postgres via `pg`
- [ ] Create tables and indices; add simple migration system (drizzle/prisma/sql DDL)
- [ ] Wrap transactional flows (e.g., checkout) in DB transactions
- [ ] Data access layer in `db/`

### M3 — Security & auth flows
- [ ] CSRF protection for cookie‑based auth (double‑submit token or SameSite strategy)
- [ ] Rate limit auth routes; login throttling
- [ ] Optional: short‑lived access + refresh cookie rotation or server‑side sessions
- [ ] Password reset and (optional) email verification endpoints

### M4 — Orders domain expansion
- [ ] Order model: addresses, contact phone, delivery method/fee calculation
- [ ] Order statuses: PLACED → CONFIRMED → DISPATCHED → DELIVERED → CANCELED
- [ ] Snapshot line items (name, image, price) at order time
- [ ] Idempotency key for checkout
- [ ] Optional: payment integration (Cash on Delivery first; later Stripe/Paystack)

### M5 — Catalog & search
- [ ] Pagination, sorting, filtering (market, price range, stock) for `/api/products`
- [ ] Admin endpoints for product CRUD and inventory
- [ ] Stock checks/reservations during add‑to‑cart/checkout

### M6 — Observability, testing, CI/CD
- [ ] Metrics endpoint (Prometheus) and dashboards
- [ ] Error monitoring (Sentry)
- [ ] Tests: Jest + Supertest (auth, cart, orders, products)
- [ ] CI: lint, typecheck, test; deploy pipeline (Railway/Render/Fly.io)

## Data model (SQL)
- `users(id, name, username UNIQUE, email UNIQUE, location, password_hash, created_at, updated_at)`
- `products(id, name, description, price_cents, image_url, stock, market_slug, vendor_name, created_at, updated_at)`
- `carts(id, user_id NULL, created_at, updated_at)`
- `cart_items(id, cart_id, product_id, quantity)`
- `orders(id, user_id, status, subtotal_cents, delivery_fee_cents, total_cents, created_at)`
- `order_items(id, order_id, product_id, name, image_url, price_cents, quantity)`

FKs and indices as appropriate; cascade `carts → cart_items`, `orders → order_items`.

## API surface (stable)

### Auth
- POST `/api/auth/signup` → `201 { user }` (sets session cookie)
- POST `/api/auth/signin` → `200 { user }` (sets session cookie)
- POST `/api/auth/signout` → `204`
- GET `/api/auth/me` → `200 { user }` or `401`

### Products
- GET `/api/products?market=kaneshie&limit=20&offset=0&sort=price_cents`

### Cart
- GET `/api/cart` → `{ id, items:[{ id, quantity, product:{ id,name,priceCents,imageUrl } }], totals }`
- GET `/api/cart/count` → `{ count }`
- POST `/api/cart/items` → `{ item }` (body: `{ productId, quantity }` or `{ productName, marketSlug }`)
- PATCH `/api/cart/items/:id` → `{ item }`
- DELETE `/api/cart/items/:id` → `204`
- POST `/api/cart/merge` → `{ cart }` (merge anon cart on signin)

### Orders
- POST `/api/orders` → `201 { orderId }` (snapshots items and clears cart)
- GET `/api/orders` → `200 [{ id, createdAt, status, totals, itemsCount }]`
- GET `/api/orders/:id` → `200 { id, items:[...], totals, status, createdAt }`

## Security & middleware
- Cookies: `httpOnly`, `sameSite=lax` (dev) / `strict` (prod), `secure=true` in prod
- `helmet`, `compression`, `express-rate-limit` on sensitive routes
- CSRF protection strategy for all state‑changing routes
- Centralized error handler; uniform error shape `{ error, details? }`

## Observability & quality
- Logging: `pino` with request IDs; redact sensitive fields
- Metrics: request latency, rate limits, error rates, DB timings
- Tests: unit + integration (Supertest) with seeded test DB
- CI/CD: lint, typecheck, test; deploy with environment‑specific configs

## Developer experience
- Scripts
  - `npm run dev` — local dev with reload
  - `npm run build` — compile TypeScript
  - `npm run start` — run compiled server
- Config: `.env` for `PORT`, `JWT_SECRET`, `DATABASE_URL`, cookie names, rate limits
- Docs: OpenAPI/Swagger generated from route schemas; `README` and `.env.example`

## Security & middleware
## Observability & quality
## Developer experience

---

## Immediate next steps
- Convert server to TypeScript and modular structure (M1)
- Add `zod`, `helmet`, `compression`, rate limiter, centralized error handling
- Introduce SQLite with schema and transactional checkout (M2)
- Add CSRF protection and signin throttling (M3)


