# ADR-006: Order And Payment Status Mapping Ownership

## Status

Proposed for owner approval. Runtime remains guarded.

## Context

Cliplot now has a customer-safe checkout status shell, a guarded payment status
endpoint, a passive Payments DB snapshot-read proposal, and a callback replay
policy proposal. Those pieces still need one explicit ownership map before any
customer-facing runtime status read can be approved.

The important boundary is that Cliplot must not invent a second order/payment
truth model:

- Orders owns order lifecycle, customer order identity, and Warehouse
  reservation side effects.
- Payments owns payment identity, payment status, amount/currency, method, and
  provider-derived truth.
- Cliplot may render customer-safe status copy only after an approved read-only
  projection exists and must remain non-authoritative.

## Decision

Use shared service ownership for the future status map:

1. `orders-microservice` remains authoritative for order lifecycle and
   `externalOrderId`/order idempotency.
2. `payments-microservice` remains authoritative for payment status and exposes
   the only approved passive read shape:
   `/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}`.
3. Cliplot may correlate and render status only after owner approval, using
   customer-safe Czech copy and no local truth writes.

The proposed future mapping fields are:

- `externalOrderId`
- `orderId`
- `paymentId`
- `paymentCreateIdempotencyKey`
- `amount`
- `currency`
- `status`
- `customerSafePaymentStatus`
- `createdAt`
- `completedAt`

This ADR does not approve runtime reads, callback persistence, local storage, or
live checkout mutation.

## Guardrails

Until owner approval exists, Cliplot must keep all of the following false:

- `ENABLE_CUSTOMER_STATUS_RUNTIME_READ`
- `ENABLE_PAYMENT_STATUS_SNAPSHOT_READ`
- callback persistence
- Cliplot-local payment status writes
- provider-backed `/payments/{paymentId}` reads
- live order creation
- live payment creation
- Warehouse reservation
- notification sends

## Required Evidence Before Runtime Enablement

- `npm run readiness:payment-mapping -- https://cliplot.alfares.cz` returns
  `approval_required_order_payment_status_mapping_ownership`.
- `npm run readiness:payment-callback-policy -- https://cliplot.alfares.cz`
  returns `approval_required_callback_replay_policy` with callback persistence
  and replay disabled.
- `npm run readiness:payment-snapshot-read-approval -- https://cliplot.alfares.cz`
  returns `approval_required_passive_payments_snapshot_read`.
- Owner approval explicitly confirms Orders owner, Payments owner, Cliplot
  renderer role, customer-safe Czech copy, rollback owner, and validation owner.
