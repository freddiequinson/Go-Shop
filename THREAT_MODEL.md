# Threat model

## Protected assets

The primary assets are customer identities and addresses, authenticated sessions, order and wallet
state, payment references, signing keys, provider credentials, inventory records, and operational
role permissions.

## Trust boundaries

1. An untrusted browser crosses into Next.js and FastAPI over TLS.
2. FastAPI crosses into managed PostgreSQL and object storage using service credentials.
3. FastAPI crosses into Paystack and other optional providers over their HTTPS APIs.
4. Paystack crosses back into the public webhook endpoint with a signed raw payload.
5. Deployment operators cross into the host and secret store with privileged access.

## Material threats and controls

| Threat | Control | Verification |
|---|---|---|
| Forged payment success event | HMAC-SHA512 validation before parsing or mutation | Missing, invalid, and valid signature endpoint tests |
| Cross-user order payment | Order lookup includes authenticated user ID | Unowned-order checkout test proves no provider call |
| Secret committed to Git | Placeholder-only examples and redacted tree/history scanning | Scanner canary plus both scan modes |
| Weak fallback configuration | Required Compose interpolation for database, signing, and payment values | Compose failure tests |
| Public database exposure | No database host port and managed database in production | Rendered Compose contract tests |
| Browser calls wrong API | `NEXT_PUBLIC_API_URL` supplied at image build | Local and production Compose contract tests |
| AI provider outage or missing key | Groq adapter remains optional | Startup test without Groq key |
| Provider rejection hidden as server fault | Intentional HTTP errors escape generic catch-all | Provider rejection endpoint test |
| Test or migration controls exposed publicly | Diagnostic pages removed and routers gated by `DEBUG` | Production route-table test and build inventory |
| Duplicate payment processing | Existing session status checked before credit | Payment integration and manual staging test |
| Supply-chain compromise | Locked npm dependencies, production audit, pinned scanner image | CI install, audit, build, and secret scan |

## Residual risks before a live claim

- Complete database integration and migration tests require a representative PostgreSQL dataset.
- Payment verification, refund, and retry behavior need a Paystack test-mode staging rehearsal.
- Rate limits, CSRF posture, session storage, role coverage, and audit-log sensitivity need a broader
  application security review.
- The inherited codebase has a large router import surface and substantial validation warnings.
- The frontend lint gate keeps hook-order and render-purity failures strict while inherited type and
  effect warnings remain visible through `npm run lint:debt`.
- Next.js 16.3.3 depends on `eslint-plugin-react` 7.37, whose current peer range ends at ESLint 9.
  ESLint remains pinned to 9.39.5 until that plugin supports ESLint 10; dependency audits and the
  lockfile gate remain mandatory during the compatibility window.
- Credential rotation evidence remains an operational prerequisite after any historical exposure.

Production availability must not be claimed until these release checks and manual UAT are recorded.
