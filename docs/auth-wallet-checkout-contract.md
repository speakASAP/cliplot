# Auth Wallet Checkout Contract

Status: source/runtime selector UI plus gated browser-session fetch source path integrated; live checkout submit and wallet mutation blocked
Date: 2026-07-03
Coordinator: Auth Goal 10 orchestrator

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation.

## Purpose

This contract defines the Cliplot-specific gate for Auth customer data wallet
checkout integration. It now allows a bounded checkout selector UI that consumes
already-provided in-memory wallet rows and a gated browser-session wallet fetch
evidence source path. Default execution remains blocked, and this contract still
does not approve checkout submit changes, Auth wallet mutation, or live commerce
mutation.

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

## Gated Browser Session Fetch Source Path Acceptance Criteria

For the current lane, Cliplot includes a reusable guarded source path for
browser-session wallet-read evidence. The default verifier must stay blocked and
must not call Auth endpoints unless the explicit evidence-window flag, non-secret
approval id, and approved synthetic bearer are supplied.

- The default verifier must not call Auth wallet endpoints.
- The default source-only verifier must not read token, cookie, JWT, or
  refresh-token contents.
- The default verifier must not read token, cookie, JWT, or refresh-token
  contents.
- Future runtime execution requires an owner-approved synthetic Auth account or
  browser session, an owner-approved synthetic bearer token only for the runtime
  evidence window, and a non-secret Cliplot wallet smoke approval id.
- The wallet read scope is limited to Auth checkout-data, delivery-address, and
  invoice-profile endpoints.
- The gated fetch source path must limit reads to Auth checkout-data,
  delivery-address, and invoice-profile endpoints.
- Runtime evidence must not print Authorization headers, bearer tokens, JWTs,
  refresh tokens, cookies, raw wallet response bodies, decoded token claims,
  customer PII, service credentials, or request/response bodies.
- Runtime evidence must not print Authorization headers, bearer tokens, JWTs,
  refresh tokens, cookies, raw wallet response bodies, decoded token claims,
  customer PII, or service credentials.
- Checkout submit, Auth wallet mutation, payment creation, Warehouse
  reservation, notification sending, DB read/write, Kubernetes mutation, Vault
  mutation, and production customer/order data reads are forbidden in the
  browser-session evidence lane.
- The source-only marker is: Checkout submit, Auth wallet mutation, payment creation, Warehouse reservation.
- Missing, expired, rejected, or delayed sessions must preserve manual checkout
  and cart state.

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

## Source-Only Selector Behavior Acceptance Criteria

For the current source-only lane, selector behavior may be verified with
synthetic state transitions only. The verifier must prove:

- default wallet entries may prefill only before manual edits;
- manual edits must win over wallet defaults and selections;
- the customer can return to manual guest-style entry without saving or mutating
  Auth wallet data;
- selector labels must use customer-safe summaries, not raw full address dumps;
- wallet ids, mutable wallet references, and Auth subjects must not be
  submitted to checkout or Orders;
- selector behavior evidence must not execute checkout submit, Auth wallet
  mutation, payment creation, Warehouse reservation, or notification sending.

This policy approves only the source/runtime checkout selector UI scaffold and
the gated browser-session fetch evidence source path. It does not approve default
runtime wallet fetches, checkout submission, payment creation, Warehouse
reservation, or notification sending.

## Runtime Selector UI Integration

- The checkout form may render delivery and invoice selectors from in-memory
  `CLIPLOT_AUTH_WALLET_CHECKOUT_DATA` rows that were obtained by an approved
  future browser-session lane.
- The browser UI must not call Auth wallet endpoints directly in this selector UI lane; the approved evidence path is the guarded script/runtime helper.
- The selector controls must not have checkout form `name` attributes, so Auth
  wallet row ids and ownership fields cannot be submitted as order truth.
- Default delivery rows may prefill name, email, phone, and delivery address
  fields before manual edits. Manual edits to those fields win for the current
  checkout.
- Invoice rows may be represented as selector options before the checkout has
  explicit billing fields; selecting an invoice profile must not submit wallet
  ids or hidden wallet metadata.
- The manual fallback action must leave guest/manual checkout available and must
  not clear the cart.

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
  handling, no-PII implementation evidence, field mapping, and runtime guest
  fallback evidence are covered by source validation and approved synthetic
  runtime evidence.

## Source-Only Guest Fallback Acceptance Criteria

For the current source-only lane, missing Auth session, wallet HTTP 401, wallet
HTTP 403, timeout, malformed response, and empty wallet row scenarios must be
represented only as sanitized status labels and booleans. In every scenario:

- manual checkout must remain available;
- cart must remain preserved;
- checkout submit must not run as part of the fallback verifier;
- Auth wallet data must not be mutated;
- the current checkout submit path remains `/api/checkout/submit`;
- evidence must not include raw wallet response bodies, customer PII, tokens,
  cookies, or reusable wallet identifiers.

This policy does not approve runtime wallet fetches, selector UI, browser-session
handoff, live smoke, checkout submission, payment creation, Warehouse
reservation, or notification sending.

## Guarded Synthetic Browser Session Smoke Harness

`scripts/auth-wallet-browser-session-smoke.js` is approval-gated runtime evidence
scaffolding for a future synthetic browser/session wallet read. Its default mode
records that live execution is blocked and performs no network call. Runtime use
requires all of the following, supplied only for the evidence window:

- `ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE=true`;
- a non-secret approval id in `CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID`;
- an owner-approved synthetic bearer supplied either inline in
  `AUTH_WALLET_SYNTHETIC_BEARER` or from a temporary `0600` file path in
  `AUTH_WALLET_SYNTHETIC_BEARER_FILE`;
- the Cliplot/Auth base URL passed as an argument or
  `CLIPLOT_AUTH_WALLET_SMOKE_BASE_URL`.

The harness is limited to GET reads of the three Auth wallet endpoints listed in
this contract. It must not use Vault, cookies, checkout submit, Auth wallet
mutation, payment creation, Warehouse reservation, notification sending, DB
mutation, Kubernetes mutation, or customer data logging. Evidence is limited to
status codes, status labels, endpoint labels, booleans, and `schemaVersion`; raw
response bodies, Authorization headers, bearer tokens, cookies, decoded token
claims, and customer PII remain forbidden.

Future live command shape, without secret values:

```bash
ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE=true \
CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID=CLIPLOT-AUTH-WALLET-SMOKE-<ID> \
AUTH_WALLET_SYNTHETIC_BEARER_FILE=<0600 approved bearer file> \
npm run smoke:auth-wallet-browser-session -- <base-url>
```

Inline `AUTH_WALLET_SYNTHETIC_BEARER` remains accepted for backwards
compatibility, but the file-based path is preferred so the bearer value does not
appear in the process command line. Supplying both sources in the same run is
rejected as ambiguous.


## 2026-07-06 Lane G Wallet Write Decision

Decision: Cliplot remains a read-only Auth wallet checkout consumer for this
lane. The approved Cliplot surface may read Auth checkout-data, delivery-address,
and invoice-profile rows only for current-checkout selector/pre-fill behavior.
It must not expose user-editable Auth delivery, invoice, or profile write
surfaces from Cliplot.

Rationale:

- No approved Auth-owned write contract for Cliplot delivery-address,
  invoice-profile, or profile mutation is recorded in this repo.
- The existing Auth wallet contract approves GET reads of the three wallet
  endpoints only; it repeatedly blocks Auth wallet mutation and checkout submit
  changes.
- Cliplot checkout only needs immutable current-checkout snapshots for order
  intent; reusable delivery/invoice/profile truth remains Auth-owned.
- Guest/manual checkout must stay available without saving or mutating Auth
  wallet rows.

Source-prepared scope:

- Allowed now: read-only checkout selector/pre-fill from approved in-memory Auth
  wallet data or the gated browser-session read evidence path.
- Forbidden now: `POST`, `PUT`, `PATCH`, or `DELETE` calls to Auth wallet/profile
  endpoints; Cliplot UI controls that save delivery addresses, invoice profiles,
  or profile fields back to Auth; checkout payloads that submit wallet ids or
  Auth ownership fields as order truth.
- Future write surfaces require a separate owner-approved Auth-owned mutation
  contract with consent, idempotency, audit, no-PII evidence, rollback, and
  validation ownership before Cliplot source may add write calls.

Verifier marker:

`npm run readiness:auth-wallet-checkout` must report
`authWalletWriteDecision.status=read_only_checkout_scope_selected` and fail if
runtime source adds Auth wallet/profile write calls or wallet save UI hooks.

## Forbidden In This Contract Lane

- Ungated runtime wallet fetch integration.
- Direct browser UI calls to Auth wallet endpoints.
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


## 2026-07-03 Gate 5 Synthetic Browser/Session Wallet-Read Evidence

Gate 5 live wallet-read smoke passed with approval id
`CLIPLOT-AUTH-WALLET-SMOKE-20260703-GATE5` against `https://auth.alfares.cz`.

Sanitized evidence:

- Status: `sanitized_auth_wallet_browser_session_smoke_recorded`.
- Endpoint count: 3.
- `/auth/profile/checkout-data`: HTTP 200, schema version
  `auth.customer-data-wallet.checkout-data.v1`.
- `/auth/profile/delivery-addresses`: HTTP 200.
- `/auth/profile/invoice-profiles`: HTTP 200.
- `checkoutSubmit=false`, `authWalletMutation=false`,
  `paymentCreation=false`, `warehouseReservation=false`,
  `notificationSend=false`, `databaseMutation=false`,
  `kubernetesMutation=false`.
- `bodyPrinted=false`, `tokenPrinted=false`, and
  `customerDataPrinted=false` for all wallet-read results.

This closes the approved synthetic browser/session wallet-read evidence gate.
Gated runtime checkout selector implementation, no-PII frontend exposure evidence,
Auth wallet row-to-checkout/order field mapping implementation, and guest
fallback implementation are now covered by source/runtime evidence. Checkout
submit, Auth wallet mutation, payment, Warehouse, notification, DB, Kubernetes,
Vault, and ungated wallet fetch execution remain blocked until separately scoped.

## 2026-07-03 Gate 7 Approved Browser/Session Wallet-Fetch Evidence

Gate 7 live wallet-fetch smoke passed with approval id
`CLIPLOT-AUTH-WALLET-SMOKE-20260703-GATE7` against `https://auth.alfares.cz`.

Sanitized evidence:

- Status: `sanitized_auth_wallet_browser_session_fetch_recorded`.
- Endpoint count: 3.
- `/auth/profile/checkout-data`: HTTP 200, schema version
  `auth.customer-data-wallet.checkout-data.v1`.
- `/auth/profile/delivery-addresses`: HTTP 200.
- `/auth/profile/invoice-profiles`: HTTP 200.
- `authWalletFetch=true` and `browserSessionRead=true` for the approved
  evidence window only.
- `checkoutSubmit=false`, `authWalletMutation=false`,
  `paymentCreation=false`, `warehouseReservation=false`,
  `notificationSend=false`, `databaseMutation=false`,
  `kubernetesMutation=false`, and `vaultUsage=false`.
- `bodyPrinted=false`, `tokenPrinted=false`, and
  `customerDataPrinted=false` for all wallet-read results.

This closes the approved browser/session wallet-fetch evidence gate. Checkout
submit, Auth wallet mutation, payment, Warehouse, notification, DB, Kubernetes,
Vault, and live commerce mutation remain blocked until separately scoped.
