# GOAL-10 Auth Wallet Checkout Readiness Execution Plan

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation.

## Current Lane

Dependency-gated Cliplot readiness for the Auth customer data wallet rollout.
Cliplot has checkout/cart/customer contact surfaces, but Auth live wallet
endpoints are now deployed and protected. The Auth coordinator recorded
Source Preflight HEAD `2871a6f345f7d33aeaaa2f41350d67a6b50c1d7d` with
`/health` returning HTTP 200 and the wallet endpoints returning HTTP 401
unauthenticated for:

- `/auth/profile/checkout-data`
- `/auth/profile/delivery-addresses`
- `/auth/profile/invoice-profiles`

This lane is source-only planning and verification. It must not fetch Auth
wallet data, render wallet selectors, create orders, reserve Warehouse stock,
create payments, send notifications, query databases, or deploy runtime changes.

## Repo Surface Inspection

Observed Cliplot surfaces that may need wallet integration after dependencies
are ready:

- `public/index.html` checkout form collects guest name, email, phone, and
  delivery address.
- `public/app.js` stores guarded checkout snapshots in browser local storage and
  submits guest checkout data to `/api/checkout/submit`.
- `src/integrations.js` normalizes customer name, email, phone, address,
  shipping, and payment for guarded checkout validation.
- `src/server.js` exposes `/api/auth/links`, `/api/checkout/submit`, and
  read-only checkout readiness/status endpoints.

Current checkout remains guest-first and guarded. Auth is present only as a
hosted login link surface, not as wallet data ownership inside Cliplot.

## Required Future Contract

Before product checkout changes, the owner/integration lane must provide an
approved Auth wallet contract covering:

- authenticated session handoff from Cliplot to Auth wallet reads;
- response shape for checkout profile defaults;
- response shape for delivery address selection;
- response shape for invoice profile selection;
- consent/visibility rules for saved customer PII;
- no-secret logging and frontend bundle constraints;
- checkout fallback behavior when wallet reads fail or the customer is a guest.

## Allowed Changes In This Lane

- `implementation-goals/GOAL-10-auth-wallet-checkout-readiness.execution-plan.md`
- `reports/validation/GOAL-10-auth-wallet-checkout-readiness.md`
- `scripts/auth-wallet-checkout-readiness.js`
- `package.json` script wiring for the verifier

## Forbidden Changes In This Lane

- Runtime wallet fetch integration.
- Auth wallet selector UI.
- Checkout/order/payment/Warehouse/notification behavior changes.
- Live calls to Auth, Orders, Payments, Warehouse, Notifications, or Catalog.
- Kubernetes, deploy, DB, Vault, token, cookie, or secret mutation.
- Logging or committing customer data, secrets, JWTs, OAuth tokens, magic-link
  tokens, reset tokens, passwords, cookies, or service credentials.

## Dependency Gates

- Auth live wallet endpoint presence gate is complete: the endpoints above
  return HTTP 401 unauthenticated, proving the wallet routes are deployed and
  protected without exposing wallet data.
- `[MISSING: owner approval for Cliplot checkout wallet selector behavior]`
- `[MISSING: authenticated browser session contract for wallet reads]`
- `[MISSING: no-PII logging and frontend exposure review for wallet data]`
- `[UNKNOWN: exact Auth wallet response fields and stable version identifier]`

## Parallel Execution Section

| Workstream | Status | Owner | Files | Validation |
| --- | --- | --- | --- | --- |
| Auth wallet endpoint presence | complete | Auth owner | Auth service/API docs | Auth `/health` 200 and wallet endpoint HTTP 401 evidence without secrets |
| Cliplot source readiness verifier | ready now | Cliplot worker | `scripts/auth-wallet-checkout-readiness.js`, `package.json` | `npm run readiness:auth-wallet-checkout` |
| Checkout wallet UX plan | dependency-gated | product/checkout owner | future checkout UI files | owner-approved selector behavior and guest fallback |
| Runtime integration | blocked | integration owner | future Cliplot runtime files | only after selector, session, PII, and response-contract approvals exist |
| Final integration | blocked | Cliplot orchestrator | checkout/frontend/backend files | guarded checkout smoke plus wallet-specific no-mutation tests |

## Execution Plan

1. Inspect checkout/cart/customer source surfaces and existing readiness
   conventions.
2. Add a source-only verifier that confirms Cliplot has wallet-relevant checkout
   surfaces, records dependency blockers, and confirms runtime wallet integration
   has not been added prematurely.
3. Wire the verifier into `package.json` without changing runtime behavior.
4. Record validation evidence in `reports/validation`.
5. Commit the repo-local readiness work only; do not deploy.

## Coding Prompt

Implement a source-only Cliplot readiness verifier for Auth wallet checkout.
The verifier must read local source files, produce JSON evidence, avoid all live
network calls, and fail if runtime files start calling the Auth wallet endpoints
before this plan's dependency blockers are resolved.

## Validation

Primary validation:

```bash
npm run readiness:auth-wallet-checkout
node --check scripts/auth-wallet-checkout-readiness.js
git diff --check
```

Secret scan on changed files:

```bash
git diff --cached --name-only | xargs -r rg -n "(JWT|Bearer|password|secret|token|cookie|oauth|magic-link|reset token)"
```

Expected result: no committed secrets/tokens/customer data and no live wallet
integration until selector behavior, browser session, PII exposure, and response
contract approvals are ready.
