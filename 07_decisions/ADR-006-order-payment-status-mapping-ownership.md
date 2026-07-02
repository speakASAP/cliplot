# ADR-006: Order And Payment Status Mapping Ownership

## Status

Approved for non-authoritative customer-safe rendering. Runtime mutation remains guarded.

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

Use shared service ownership for the status map. Owner approval is recorded by
`CLIPLOT_STATUS_MAPPING_OWNERSHIP_APPROVAL_ID=owner-approved-2026-07-02-order-payment-status-mapping-renderer`.
Rollback owner is `cliplot-operator`; validation owner is
`cliplot-validation-owner`. This approval covers non-authoritative rendering only
and does not approve live payment creation, callback persistence, provider-refresh
reads, Cliplot-local status writes, Warehouse reservation, or notification sends.

Approved ownership:

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

This ADR approves read-only customer-safe rendering through the Payments DB-only
snapshot route after the existing runtime flags and approval IDs are present. It
does not approve callback persistence, local storage writes, provider-refresh
reads, live checkout mutation, payment creation, Warehouse reservation, or
notification sends.

## Guardrails

Until separate live mutation approvals exist, Cliplot must keep all of the
following false:

- callback persistence
- Cliplot-local payment status writes
- provider-backed `/payments/{paymentId}` reads
- live order creation
- live payment creation
- Warehouse reservation
- notification sends

## Required Evidence Before Runtime Enablement

- `npm run readiness:payment-mapping -- https://cliplot.alfares.cz` returns
  `approved_order_payment_status_mapping_ownership` after the approval ID and owner metadata are configured, while live writes remain disabled.
- `npm run readiness:payment-callback-policy -- https://cliplot.alfares.cz`
  returns `approved_callback_replay_policy_metadata_execution_disabled` with
  callback persistence and replay disabled.
- `npm run readiness:payment-snapshot-read-approval -- https://cliplot.alfares.cz`
  returns `approved_passive_payments_snapshot_read`.
- Owner approval explicitly confirms Orders owner, Payments owner, Cliplot
  renderer role, customer-safe Czech copy, rollback owner, and validation owner.
