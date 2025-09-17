Showcase Implementation Checklist

P0 — Showcase upgrades (frontend-only)

- [ ] PDF receipts on success page
  - Add "Download PDF" button on `order-success.html` using `html2pdf.js`.
  - Include store info, items, delivery fee/tax, totals, timestamp from `goshop_last_receipt`.
  - Acceptance: Button produces a branded PDF matching the on-page receipt.

- [ ] Persistent "Create Account" CTA for guests
  - Ribbon/banner on `index.html`, `shop.html`, `cart.html`, `order-success.html` when not logged in.
  - Benefits list; click-through to `auth.html`. Hide when signed in (`authStateChanged`).
  - Acceptance: Visible for guests, hidden for signed-in users.

- [ ] Units selection (piece/kg) for demo items
  - Add a unit dropdown in product cards; persist per cart line in `CartManager`.
  - Update totals to factor unit pricing (simple multiplier for kg).
  - Acceptance: Changing unit updates line price and totals consistently.

- [ ] Guest checkout: delivery day + fee
  - Add delivery day picker with cutoff rules to guest modal (`checkout.js`).
  - Show delivery fee line and include it in stored order totals.
  - Acceptance: Selected day changes fee; order reflects fee in success page.

- [ ] Member checkout polish
  - Preselect default address; show compact summary (address/day/fee) before submit.
  - Acceptance: Default address preselected; fee preview updates with day changes.

- [ ] Shop search and quick filters (client-only)
  - Filter by name/category and sort by price asc/desc; empty state.
  - Acceptance: Typing filters the grid smoothly; no backend required.

- [ ] Notification polish
  - Ensure bell in nav across pages; badge increments on order; "mark all read" persists.
  - Acceptance: Placing an order shows a toast and updates the badge/panel.

P1 — Deeper demo (frontend-only)

- [ ] Order status timeline on success page
  - Placed → Confirmed → Preparing → Out for delivery → Delivered (simulated timers).
  - Acceptance: Timeline advances over time after order placement.

- [ ] Reorder from success page
  - One-click adds last order items back to cart via `cartManager`.
  - Acceptance: Clicking "Reorder" repopulates the cart.

P2 — Lightweight vendor/admin stubs

- [ ] Vendor onboarding stub (`vendor.html`)
  - Form saves application to `localStorage` and shows pending status.
  - Acceptance: Submitting displays a confirmation and persists entry.

- [ ] Admin stats stub (`admin.html`)
  - Read-only stats from `localStorage` orders; list vendor applications.
  - Acceptance: Page renders totals and recent entries without errors.

Workflow agreement

We will implement and verify each item in order. After you confirm an item works, we check it off here and proceed to the next.


