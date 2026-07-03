# Auth Wallet Checkout Contract

Status: source-only; dependency-gated
Date: 2026-07-03
Coordinator: Auth Goal 10 orchestrator

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation.

## Purpose

This contract defines the Cliplot-specific gate for future Auth customer data
wallet checkout integration. It does not add runtime wallet fetches, render
wallet selectors, submit checkout, call Auth wallet endpoints, or approve a live
smoke. Runtime code must stay blocked until these rules are converted into
bounded implementation and approved synthetic evidence.

## Selector Behavior

- Authenticated customers may choose one Auth delivery address and one Auth
  invoice profile from the Auth checkout-data aggregate.
- Default Auth entries may prefill the checkout only before the customer edits
  the corresponding manual fields.
- Manual edits must override wallet defaults for the current checkout snapshot.
- The customer must be able to return to manual guest-style entry without
  saving or mutating Auth wallet data.
- Selector labels must avoid raw full address dumps; display only enough
  customer-safe summary text for selection.

## Authenticated Session Handoff

- Cliplot must use the hosted Auth login/register link surface and a future
  explicit browser-session contract before wallet reads.
- Wallet reads must use a synthetic or real authenticated Auth bearer only in
  memory for the request window; no token value may be logged, committed, or
  stored in order snapshots.
- Auth wallet reads must target only:
  - `/auth/profile/checkout-data`
  - `/auth/profile/delivery-addresses`
  - `/auth/profile/invoice-profiles`
- A missing, expired, or rejected Auth session must fall back to manual checkout
  without clearing the cart or blocking guest checkout.

## PII And Logging Constraints

- Do not log raw Auth wallet response bodies.
- Do not persist reusable Auth wallet rows in Cliplot local storage.
- Do not print names, phone numbers, emails, street addresses, company ids, tax
  ids, VAT ids, tokens, cookies, passwords, secrets, or service credentials in
  validation output.
- Evidence may contain booleans, status codes, schema version, blocker labels,
  and short non-reversible ids only.
- Frontend exposure must be limited to fields needed for checkout selection and
  immutable checkout snapshots.
- This policy is source-resolved for the future implementation lane, but
  runtime implementation evidence remains gated until Cliplot actually adds
  wallet reads/selectors.

## Source-Only No-PII Evidence Policy

For the current source-only lane, allowed evidence is limited to:

- status codes;
- booleans;
- `schemaVersion`;
- blocker labels;
- short non-reversible ids.

Forbidden evidence for future runtime wallet code includes raw wallet response
bodies, names, phone numbers, emails, street addresses, company ids, tax ids,
VAT ids, tokens, cookies, passwords, secrets, and service credentials.

The future implementation verifier must prove that browser logs, server logs,
reports, approval packets, and frontend selector labels do not expose forbidden
evidence. Because runtime wallet code is not present yet, this contract resolves
the policy only; implementation evidence remains dependency-gated.

## Source-Only Wallet Mapping Acceptance Criteria

Pure mapping helpers may be validated with synthetic fixture rows before runtime
wallet reads exist. That source-only verifier must prove:

- delivery address rows map only into current-checkout contact and delivery
  snapshot fields;
- invoice profile rows map only into current-checkout billing snapshot fields;
- nullable wallet fields are skipped instead of serialized as reusable profile
  truth;
- invoice recipient email is `email`;
- `invoiceEmail` and `electronicInvoiceEmail` are not accepted aliases;
- `id`, `user`, `userId`, `deletedAt`, `sourceApplication`, `lastUsedAt`,
  `createdAt`, `updatedAt`, and `isDefault` are excluded from checkout
  snapshots;
- no token, cookie, raw response body, wallet id, or Auth ownership field is
  printed in verifier output.

This mapping evidence does not approve runtime wallet fetches, browser-session
handling, selector UI, checkout submit changes, or live smokes.

## Field Mapping

Delivery address mapping to the checkout snapshot:

- `firstName` and `lastName` may compose customer display name only for the
  current checkout snapshot.
- `email` and `phone` may prefill contact fields.
- `street`, `street2`, `city`, `region`, `postalCode`, and `country` may prefill
  delivery address fields.
- `deliveryInstructions` may prefill a delivery note only if the checkout UI has
  an explicit note field.
- `id`, `isDefault`, `sourceApplication`, `createdAt`, `updatedAt`, and
  `lastUsedAt` must not be sent to Orders as mutable wallet references.

Invoice profile mapping to the checkout snapshot:

- `type`, `companyName`, `companyId`, `taxId`, `vatId`, `firstName`, `lastName`,
  `street`, `street2`, `city`, `region`, `postalCode`, `country`, `phone`, and
  `email` may prefill immutable billing snapshot fields.
- Invoice recipient email is `email`; `invoiceEmail` and
  `electronicInvoiceEmail` are not Auth v1 aliases.
- `id`, `isDefault`, `sourceApplication`, `createdAt`, `updatedAt`, and
  `lastUsedAt` must not be sent to Orders as mutable wallet references.

## Guest Fallback

- Guest checkout remains the default and must continue to work without an Auth
  session.
- Auth wallet load failure, 401, 403, timeout, malformed response, or empty
  address/profile lists must keep manual checkout available.
- The checkout submit path remains `/api/checkout/submit` and must receive
  resolved immutable snapshots, not Auth wallet ids.
- Runtime integration remains blocked until selector behavior, browser-session
  handling, no-PII implementation evidence, field mapping, and guest fallback
  are covered by source validation and approved synthetic runtime evidence.

## Forbidden In This Contract Lane

- Runtime wallet fetch integration.
- Auth wallet selector UI.
- Checkout submit behavior changes.
- Live calls to Auth, Orders, Payments, Warehouse, Notifications, or Catalog.
- Kubernetes, deploy, DB, Vault, token, cookie, or secret mutation.
- Logging or committing customer data, secrets, JWTs, OAuth tokens, magic-link
  tokens, reset tokens, passwords, cookies, or service credentials.

## Validation

Source-only validation:

```bash
npm run readiness:auth-wallet-checkout
node --check scripts/auth-wallet-checkout-readiness.js
npm run check
git diff --check
```

Targeted dangerous literal-secret scan on changed files must return no matches.
