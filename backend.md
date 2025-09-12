## Backend implementation plan (to-do checklists)

### Showcase mode (self-contained, no external DB)
Goal: ship a demo-ready backend quickly with minimal moving parts. One small server that serves the static site and provides the auth/cart APIs, all in-memory (optional JSON file persistence). Keep URLs identical so the future full backend is a drop-in.

Showcase scope (1–2 days)
- [ ] Single file server (Node + Express, plain JS) at `server/index.js`
- [ ] Serve static files from project root so pages call same-origin APIs (no CORS)
- [ ] In-memory stores (with optional JSON dump on exit):
  - users: `{ id, name, username, email, location, passwordHash }`
  - products: seeded from current UI (ids, names, priceCents, imageUrl, marketSlug)
  - carts: `{ id, userId|null, items: [{ id, productId, quantity }] }`
- [ ] Auth via httpOnly cookie session (JWT or signed `{ userId }`)
- [ ] Endpoints (subset, same shapes as full plan):
  - POST `/api/auth/signup`, `/api/auth/signin`, `/api/auth/signout`, GET `/api/auth/me`
  - GET `/api/products?market=kaneshie`
  - GET `/api/cart`, GET `/api/cart/count`
  - POST `/api/cart/items`, PATCH `/api/cart/items/:id`, DELETE `/api/cart/items/:id`
  - POST `/api/cart/merge` (simple merge by productId)
  - POST `/api/orders` (stub: returns orderId and clears cart)
- [ ] Cookies: `SESSION` (user), `CART_ID` (anonymous cart)
- [ ] Minimal deps: express, cookie-parser, jsonwebtoken (or cookie-signature), bcryptjs, nanoid
- [ ] Single command run: `node server/index.js` then open `http://localhost:8080/auth.html`

Wiring steps
- [ ] Change form submits in `auth.html` to `fetch('/api/auth/...')` (already planned)
- [ ] Update `.add-to-cart` handlers in `recipes-hub.html` to POST to `/api/cart/items`
- [ ] Initialize cart count bubble via `GET /api/cart/count` on load
- [ ] `cart.html` fetches `/api/cart` and renders items; +/- uses PATCH; remove uses DELETE

Showcase milestones (S-series)
- S0 — One-file server boots and serves static (Day 0–0.5)
  - [ ] `GET /health` 200, static `index.html` served
  - Exit: Open site at `http://localhost:8080/`
- S1 — Auth minimal (Day 0.5–1)
  - [ ] Signup/signin/signout/me working with cookies, bcrypt hash
  - Exit: `auth.html` can create/sign in user and reflect state
- S2 — Cart (anonymous + count) (Day 1)
  - [ ] Add/list/update/remove items; count bubble
  - Exit: Add-to-cart from `recipes-hub.html` updates count
- S3 — Cart page + checkout stub (Day 1–2)
  - [ ] `cart.html` renders items and totals; checkout clears cart and returns orderId
  - Exit: End-to-end demo flow works

Upgrade path
- Keep API shapes identical to the “Full backend plan” below so we can swap to a real DB later without changing the front-end.

### Milestones and tracking
- M0 — Repo and skeleton (Day 0–1)
  - [ ] Server scaffolding boots (`GET /health` → 200)
  - [ ] Optional DB init (SQLite file or none for showcase)
  - Exit criteria: `npm run dev` starts server; if SQLite used, tables created on boot

- M1 — Auth MVP (Day 2–3)
  - [ ] Endpoints: signup, signin, signout, me (JWT cookie)
  - [ ] Password hashing, input validation, CORS configured
  - [ ] `auth.html` wired via `src/js/auth.js` to call API and show messages
  - Exit criteria: Can create and sign in a user; cookie present; `GET /api/auth/me` returns user

- M2 — Cart model + anonymous cart (Day 4–5)
  - [ ] Cart data structures (or SQL tables) ready: Cart, CartItem
  - [ ] Endpoints: get cart, add/update/remove items, count
  - [ ] Anonymous cart cookie issued on first add
  - Exit criteria: From `recipes-hub.html`, add-to-cart works unauthenticated; count updates

- M3 — Auth cart + merge (Day 6)
  - [ ] Merge anonymous cart into user cart on sign-in
  - [ ] Endpoint: `POST /api/cart/merge`; invoked after successful signin
  - Exit criteria: Items added before signin persist after signin

- M4 — Products listing + dynamic sidebar (Day 7)
  - [ ] Endpoint: `GET /api/products?market=...`
  - [ ] Sidebar fetch and render products per market (progressive enhancement)
  - Exit criteria: Opening "View Products" loads from API for at least two markets

- M5 — Cart page + checkout stub (Day 8–9)
  - [ ] `cart.html` renders server cart; quantity +/- and remove wired
  - [ ] `POST /api/orders` creates placeholder order and clears cart
  - Exit criteria: E2E flow from add-to-cart → cart → checkout stub works

- M6 — Hardening + release (Day 10)
  - [ ] Rate limits, error handling, zod validation everywhere
  - [ ] Seed data finalized; README and `.env.example` added
  - [ ] Deploy to staging; secure cookies and CORS for prod
  - Exit criteria: Staging smoke test passes (auth, add-to-cart, cart page)

Notes
- Track milestone status in PR titles and a simple CHANGELOG.
- Each milestone should include a short demo GIF in the PR description.

### 1) Foundation and project setup
- [ ] Pick stack: Node.js 20 + Express + TypeScript
- [ ] Create `server/` workspace: `server/src`, `server/.env`, `tsconfig.json`, `eslint`, `prettier`
- [ ] Add core deps: express, cors, cookie-parser, jsonwebtoken, bcryptjs, zod (validation), uuid
- [ ] Add dev deps: typescript, ts-node, nodemon, @types/*
- [ ] Choose DB: Showcase uses in-memory; optional SQLite (file) via better-sqlite3; Postgres later via pg
- [ ] If SQLite chosen: create tables on boot with simple `CREATE TABLE IF NOT EXISTS` SQL
- [ ] Add Docker for Postgres (optional later): `docker-compose.yml`
- [ ] Define env vars: `PORT`, `DATABASE_URL` (if used), `JWT_SECRET`, `COOKIE_NAME`, `CORS_ORIGIN`

### 2) Data model (SQL, no ORM)
- [ ] `User`: id (uuid), name, username (unique), email (unique), location, passwordHash, createdAt, updatedAt
- [ ] `Product`: id, name, description, priceCents, imageUrl, stock, marketSlug, vendorName, createdAt, updatedAt
- [ ] `Cart`: id, userId (nullable for anonymous), createdAt, updatedAt
- [ ] `CartItem`: id, cartId, productId, quantity
- [ ] `Order`: id, userId, status, subtotalCents, deliveryFeeCents, totalCents, createdAt
- [ ] Indices and FKs; cascade deletes for `Cart -> CartItem`

### 3) API surface (versioned under `/api`)
- [ ] `POST /api/auth/signup` — create user, set httpOnly cookie session (JWT) and return minimal user
- [ ] `POST /api/auth/signin` — verify creds, set cookie session, return user
- [ ] `POST /api/auth/signout` — clear cookie
- [ ] `GET /api/auth/me` — return current user (by cookie)
- [ ] `GET /api/products?market=kaneshie` — list products filtered by `market` (maps to current page markets)
- [ ] `GET /api/cart` — get active cart (user or anonymous)
- [ ] `GET /api/cart/count` — count of items for navbar bubble
- [ ] `POST /api/cart/items` — add item `{ productId, quantity }`
- [ ] `PATCH /api/cart/items/:id` — update quantity
- [ ] `DELETE /api/cart/items/:id` — remove item
- [ ] `POST /api/cart/merge` — merge anonymous cart into user cart on sign-in
- [ ] `POST /api/orders` — create order from cart (placeholder checkout)

### 4) Security/middleware
- [ ] CORS allowlist `http://localhost:5500` (or local static server), later prod domain
- [ ] Cookie settings: httpOnly, sameSite=lax (dev), secure=true (prod https)
- [ ] JWT strategy: sign minimal `{ sub: userId }`, verify on protected routes
- [ ] Rate limit auth endpoints
- [ ] Input validation with zod for all payloads
- [ ] Central error handler with safe error shapes

### 5) Auth flows wired to `auth.html`
- [ ] Replace form actions (currently `action="#"`) with JS `fetch` to `/api/auth/signup` and `/api/auth/signin`
- [ ] Map existing inputs to backend fields:
  - Sign in: name, username, email, location, password (current UI collects more than typical; backend will accept `usernameOrEmail` + `password`, front-end should adapt)
- [ ] Show success/error using existing `.success_message` and `.error_message` containers
- [ ] On success: keep session via cookie, optionally store lightweight user in `localStorage` for UX
- [ ] Add client check to call `GET /api/auth/me` on load to update UI state (e.g., greet user on navbar)
- [ ] Implement “Forgot Password?” stub: POST `/api/auth/forgot` (optional later)

### 6) Cart flows for `recipes-hub.html`
- [ ] Add `data-product-id` attributes to each product DOM block in the sidebar lists
- [ ] Update existing `.add-to-cart` click handler to POST `/api/cart/items` with `{ productId, quantity: 1 }`
- [ ] On success: keep the current visual feedback; additionally fetch `/api/cart/count` and update `.c-nav-shop_num`
- [ ] On page load: fetch `/api/cart/count` to initialize the cart bubble in navbar
- [ ] Hook the “View Products” per-market to fetch from `/api/products?market=<slug>` and render list dynamically (retain seeded static markup as fallback)

### 7) Cart page (`cart.html`) integration
- [ ] On load: GET `/api/cart` and render line items, totals
- [ ] Wire +/- buttons to `PATCH /api/cart/items/:id`
- [ ] Wire remove to `DELETE /api/cart/items/:id`
- [ ] Compute totals on client or return computed totals from server
- [ ] Proceed to checkout button → POST `/api/orders` (mock), navigate to Thank You or Orders

### 8) Anonymous vs authenticated carts
- [ ] For anonymous users: issue signed `cartId` cookie on first add-to-cart
- [ ] For authenticated users: ensure single active cart by `userId`
- [ ] On sign-in: call `/api/cart/merge` to combine anonymous cart into user cart

### 9) Seed data to match current UI
- [ ] Add seed routine at server boot to insert products (if empty) matching sidebar items:
  - Kaneshie: Fresh Bananas, Fresh Herbs, Fresh Tomatoes
  - Accra: Roma Tomatoes, Imported Rice, Green Apples
  - Kumasi: Garden Eggs, Kontomire Leaves, Local Red Rice
  - Tamale, Cape, Takoradi, Sunyani, Koforidua: at least 1 product each
- [ ] Ensure `imageUrl` points to existing assets in `src/images/...`

### 10) Server scaffolding
- [ ] `server/src/index.ts` Express bootstrap, health check
- [ ] `server/src/config/env.ts` env loader
- [ ] `server/src/middleware/auth.ts` JWT verify, optional user
- [ ] `server/src/routes/auth.ts`, `products.ts`, `cart.ts`, `orders.ts`
- [ ] `server/src/services/*` encapsulate business logic
- [ ] `server/src/db` provide in-memory maps or `better-sqlite3` helpers (no ORM)

### 11) Frontend glue (minimal JS additions)
- [ ] `src/js/auth.js`: intercept submit on `auth.html`, call backend, toggle messages
- [ ] `src/js/cart.js`: helpers for add-to-cart, get count, update navbar bubble
- [ ] `src/js/products.js`: fetch and render products per market (progressive enhancement)
- [ ] Ensure navbar cart/profile icons remain linked to `cart.html` and `auth.html`

### 12) DX scripts and running locally
- [ ] `npm run dev` (concurrently: server watch + static file server e.g., `live-server`)
- [ ] `npm run build` and `npm run start` for server
- [ ] If SQLite chosen: tables created on boot; optional SQL seed script (no migrations initially)

### 13) Testing
- [ ] Add Jest/Supertest for auth and cart endpoints (happy path + edge cases)
- [ ] Smoke test for anonymous cart merge

### 14) Deployment
- [ ] Choose platform (Render/Railway/Fly.io) and provision Postgres
- [ ] Set env vars securely; set cookies `secure=true`, `sameSite=strict` in prod
- [ ] Configure CORS for production domain

### 15) Observability and quality
- [ ] Structured logs (pino) with request ids
- [ ] Basic metrics (Prometheus endpoint optional)
- [ ] Error monitoring hook (Sentry optional)

---

## API contracts (concise)

### Auth
- POST /api/auth/signup
  - req: `{ name, username, email, location, password }`
  - res: `201 { user: { id, name, username, email } }` (+ httpOnly cookie)
- POST /api/auth/signin
  - req: `{ usernameOrEmail, password }`
  - res: `200 { user }` (+ cookie)
- GET /api/auth/me → `200 { user }` or `401`
- POST /api/auth/signout → `204` (cookie cleared)

### Cart
- GET /api/cart → `200 { id, items: [{ id, product, quantity }], totals }`
- GET /api/cart/count → `200 { count }`
- POST /api/cart/items → req: `{ productId, quantity }` → `201 { item }`
- PATCH /api/cart/items/:id → req: `{ quantity }` → `200 { item }`
- DELETE /api/cart/items/:id → `204`
- POST /api/cart/merge → `200 { cart }`

### Products
- GET /api/products?market=kaneshie → `200 [{ id, name, priceCents, imageUrl, stock }]`

### Orders (placeholder)
- POST /api/orders → req: `{ cartId, deliveryMode }` → `201 { orderId }`

---

## Page-specific wiring checklist

### `auth.html`
- [ ] Add `src/js/auth.js` to intercept submit for Sign In / Create Account
- [ ] Validate on client, then call backend; display `.success_message` or `.error_message`
- [ ] On success, redirect or keep on page and update header state

### `recipes-hub.html`
- [ ] Add `data-product-id` attributes to product cards/buttons
- [ ] Update `.add-to-cart` handler to POST to `/api/cart/items`
- [ ] After add, GET `/api/cart/count` and update `.c-nav-shop_num`
- [ ] Optionally fetch products dynamically by `market` on sidebar open

### `cart.html`
- [ ] Fetch and render cart; wire quantity updates and removal
- [ ] Implement checkout button to `POST /api/orders`

---

## Nice-to-haves (later)
- [ ] OAuth (Google/Apple) sign-in
- [ ] Email verification and password reset flows
- [ ] Coupons/discounts integration
- [ ] Inventory reservations and stock checks
- [ ] Order history page and status tracking


