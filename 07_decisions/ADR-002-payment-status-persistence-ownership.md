# ADR-002: Payment Status Persistence Ownership

## Status

Proposed for owner approval. Runtime remains guarded.

## Context

Cliplot needs a future customer-safe payment status after approved live checkout.
Current Cliplot payment status surfaces are guarded and non-authoritative:
`mutation=false`, `persistence=false`, and `providerCall=false`.

Payments already owns payment identity and status semantics. It stores payment
ID, order ID, amount, currency, payment method, provider transaction data, and
payment status. Payments currently exposes `GET /payments/{paymentId}` with
`payments:read`, but pending/processing Stripe/card reads can refresh provider
state, so Cliplot must not call that endpoint from guarded readiness.

Orders owns order lifecycle, `externalOrderId` idempotency, and bounded payment
references. Orders must not become the authoritative provider payment-status
source without an approved Payments-to-Orders projection.

Cliplot must not create parallel payment/order truth locally before an explicit
ownership decision and migration are approved.

## Decision

Prefer shared commerce ownership with **Payments as the authoritative payment
status owner**.

Cliplot may render customer-safe status only after one of these approved paths
exists:

1. Payments provides a provider-refresh-free DB-only payment status read model
   and Cliplot has a safe `paymentId` mapping.
2. Payments provides an approved read-by-orderId status endpoint scoped to
   Cliplot application/order identity.
3. A separate approved shared commerce projection exposes customer-safe status
   without making Cliplot the source of truth.

Cliplot-local storage remains deferred and requires a separate approved
architecture decision, migration, replay/reconciliation plan, retention policy,
and owner approval.

## Guardrails

Before approval, all of the following must remain true:

- no provider-backed status read from Cliplot;
- no Cliplot-local payment status writes;
- no callback persistence;
- no status claim that an order is paid, confirmed, reserved, shipped,
  invoiced, or completed;
- no secret values printed in readiness or decision packets.

## Owner Approval Checklist

This ADR is recorded but not accepted for runtime enablement. Owner approval
must explicitly confirm:

- Payments remains the authoritative payment status owner for Cliplot;
- Cliplot may use only the provider-refresh-free
  `/payments/status/by-order-id` DB snapshot contract for passive customer
  status reads;
- customer-safe Czech status labels are approved for the checkout status page;
- callback persistence remains disabled until replay, reconciliation, and
  retention rules are approved;
- Cliplot-local payment status storage remains deferred unless a separate
  architecture decision and migration are approved.

## Not Approved For Runtime Enablement

Recording this ADR does not approve:

- live payment creation;
- provider-backed `GET /payments/{paymentId}` status reads;
- callback persistence;
- Cliplot-local payment status writes;
- customer-facing claims that an order is paid, confirmed, reserved, shipped,
  invoiced, or completed.

## Required Evidence Before Runtime Enablement

- `npm run readiness:payment-status -- https://cliplot.alfares.cz` passes with
  `mutation=false`, `persistence=false`, and `providerCall=false`.
- `npm run readiness:payment-storage -- https://cliplot.alfares.cz` passes with
  `blocked_storage_backend_not_approved` until storage ownership is approved.
- `npm run readiness:payment-decision -- https://cliplot.alfares.cz` returns
  `decision_recorded_approval_required` and recommends
  `shared-payments-source-of-truth`.
- Payments provides provider-refresh-free status read evidence or read-by-orderId
  contract evidence.
- Cliplot `PAYMENT_API_KEY` has confirmed `payments:read` runtime scope without
  exposing the key value.

## Consequences

- Cliplot avoids duplicating payment truth.
- Payments contract work is required before live status reads.
- Orders can remain focused on customer order journey and bounded payment
  references.
- Live callback persistence remains blocked until the approved owner path exists.
