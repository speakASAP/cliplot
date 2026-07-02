# ADR-003: Read-Only Customer Status Runtime Rollout

## Status

Proposed for owner approval. Runtime remains guarded.

## Context

Cliplot has a customer status surface at `/objednavka/stav`,
`/checkout/success`, and `/checkout/cancelled`. Today it uses only a
browser-local checkout snapshot and guarded non-authoritative payment metadata.
It must not claim that an order is paid, confirmed, reserved, shipped,
invoiced, or completed before approved live evidence exists.

ADR-002 records Payments as the preferred authoritative payment status owner.
The only future passive read path approved for planning is the
provider-refresh-free Payments DB snapshot route:

```text
/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}
```

Cliplot must not use `GET /payments/{paymentId}` for passive status rendering,
because that endpoint can refresh pending Stripe/card provider state.

## Decision

Plan the customer status rollout as a read-only, approval-gated runtime change.
The rollout may be implemented only after owner approval confirms the DB-only
Payments snapshot route, customer-safe Czech status copy, callback replay
policy, and status mapping ownership.

## Guardrails

Before runtime approval, all of the following remain false:

- `runtimeReadEnabled`;
- `paymentsSnapshotReadEnabled`;
- `storageRead`;
- callback persistence;
- Cliplot-local payment/order status writes;
- order creation;
- payment creation;
- Warehouse reservation;
- customer notification send.

## Required Evidence Before Runtime Enablement

- `npm run readiness:checkout-status-surface -- https://cliplot.alfares.cz`
  passes with `runtimeReadEnabled=false`.
- `npm run readiness:payment-snapshot-read-approval -- https://cliplot.alfares.cz`
  passes with `runtimeReadEnabled=false`.
- `npm run readiness:customer-status-rollout -- https://cliplot.alfares.cz`
  returns `approval_required_read_only_customer_status_runtime_rollout`.
- Owner approval explicitly limits reads to the Payments DB-only by-orderId
  snapshot route.
- Rollback plan is reviewed before the first runtime enablement.

## Not Approved

This ADR does not approve live payment creation, live order creation,
provider-refreshing status reads, callback persistence, Cliplot-local status
storage, Warehouse reservation, or notification sends.
