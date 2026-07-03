# GOAL-10 Auth Wallet Checkout Readiness Execution Plan

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation.

## Current Lane

Dependency-gated Cliplot readiness for the Auth customer data wallet rollout.
Cliplot has checkout/cart/customer contact surfaces, but Auth live wallet
endpoints are now deployed and protected. The Auth coordinator recorded the
current Source Preflight live refresh from HEAD
`548df583bff50057c79c4c6705e6a379f4d1b63b`, deployed image tag
`548df58-20260703051411`, and non-mutating FlipFlop post-deploy smoke evidence
with `/health` returning HTTP 200 and the wallet endpoints returning HTTP 401
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
- Cliplot field mapping from Auth wallet rows to checkout/order snapshots;
- consent/visibility rules for saved customer PII;
- no-secret logging and frontend bundle constraints;
- checkout fallback behavior when wallet reads fail or the customer is a guest.

The source-only contract is now recorded in
`docs/auth-wallet-checkout-contract.md`. It is not runtime approval by itself:
runtime wallet fetches, selectors, checkout submit changes, and live smokes
remain blocked until the contract is implemented with approved synthetic
evidence.

## Allowed Changes In This Lane

- `implementation-goals/GOAL-10-auth-wallet-checkout-readiness.execution-plan.md`
- `docs/auth-wallet-checkout-contract.md`
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
  protected without exposing wallet data. Latest Auth coordinator evidence:
  Source Preflight HEAD `548df583bff50057c79c4c6705e6a379f4d1b63b`,
  deployed image tag `548df58-20260703051411`, and FlipFlop non-mutating
  post-deploy smoke passed against gateway-proxied wallet endpoints returning
  HTTP 401.
- Cliplot source-known facts are recorded without clearing gates:
  - checkout remains guest-first and collects manual contact/address/payment
    fields;
  - checkout submit posts guest/customer form data to `/api/checkout/submit`
    and stores a browser-local last-checkout snapshot;
  - Auth is currently only a hosted login/register link surface;
  - guarded checkout still returns `service_identity_required` before live
    order/payment/Warehouse mutation;
  - runtime manifests point at Auth but do not enable wallet integration.
- Auth source-defines the checkout-data top-level stable schema version as
  `auth.customer-data-wallet.checkout-data.v1` in Goal 10.34.
- Auth source-defines checkout-data response shape for readiness:
  - top-level fields: `schemaVersion`, `user`, `deliveryAddresses`,
    `invoiceProfiles`, `defaults`;
  - defaults fields: `deliveryAddressId`, `invoiceProfileId`;
  - sanitized delivery address fields: `id`, `label`, `firstName`, `lastName`,
    `company`, `street`, `street2`, `city`, `region`, `postalCode`,
    `country`, `phone`, `email`, `deliveryInstructions`, `isDefault`,
    `sourceApplication`, `lastUsedAt`, `createdAt`, `updatedAt`;
  - sanitized invoice profile fields: `id`, `label`, `type`, `firstName`,
    `lastName`, `companyName`, `companyId`, `taxId`, `vatId`, `street`,
    `street2`, `city`, `region`, `postalCode`, `country`, `phone`, `email`,
    `isDefault`, `sourceApplication`, `lastUsedAt`, `createdAt`, `updatedAt`;
  - sanitized wallet rows omit `user`, `userId`, and `deletedAt`.
- Cliplot caveats remain: wallet fields may be nullable, timestamp JSON
  serialization is not narrowed here, `pickupPointId` is not a current Auth v1
  response field, and invoice recipient email is `email`, not `invoiceEmail`
  or `electronicInvoiceEmail`.
- Source-only contract recorded, but runtime remains gated:
  - `[MISSING: owner approval for Cliplot checkout wallet selector behavior]`
  - `[MISSING: authenticated browser session implementation and approved synthetic runtime evidence for wallet reads]`
  - `[MISSING: no-PII logging/frontend exposure implementation evidence for wallet data]`
  - `[MISSING: approved Cliplot field mapping implementation from Auth wallet rows to checkout/order snapshots]`
  - `[MISSING: approved Cliplot guest fallback implementation evidence when Auth wallet reads are unavailable]`

## Parallel Execution Section

| Workstream | Status | Owner | Files | Validation |
| --- | --- | --- | --- | --- |
| Auth wallet endpoint presence | complete | Auth owner | Auth service/API docs | Auth `/health` 200 and wallet endpoint HTTP 401 evidence without secrets |
| Cliplot source readiness verifier | ready now | Cliplot worker | `scripts/auth-wallet-checkout-readiness.js`, `package.json` | `npm run readiness:auth-wallet-checkout` |
| Checkout wallet contract | source-prepared | Cliplot coordinator | `docs/auth-wallet-checkout-contract.md`, readiness verifier | source validation only |
| Checkout wallet UX plan | dependency-gated | product/checkout owner | future checkout UI files | owner-approved selector behavior and guest fallback implementation |
| Runtime integration | blocked | integration owner | future Cliplot runtime files | only after selector, session, PII, mapping, fallback implementation and synthetic evidence exist |
| Final integration | blocked | Cliplot orchestrator | checkout/frontend/backend files | guarded checkout smoke plus wallet-specific no-mutation tests |

## Execution Plan

1. Inspect checkout/cart/customer source surfaces and existing readiness
   conventions.
2. Add a source-only verifier that confirms Cliplot has wallet-relevant checkout
   surfaces, records dependency blockers, and confirms runtime wallet integration
   has not been added prematurely.
3. Wire the verifier into `package.json` without changing runtime behavior.
4. Add the source-only Cliplot wallet checkout contract and verifier markers
   for selector behavior, session handoff, no-PII exposure, field mapping, and
   guest fallback.
5. Record validation evidence in `reports/validation`.
6. Commit the repo-local readiness work only; do not deploy.

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
