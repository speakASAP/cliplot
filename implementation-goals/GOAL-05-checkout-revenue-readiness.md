# GOAL-05: Checkout Revenue Readiness

## Objective

Prove Cliplot checkout is provider-backed and contract-correct end to end using
no-mutation validation lanes, so live revenue can later be enabled by explicit
approval rather than by code change.

## Scope

Allowed:

- authenticated Catalog reads through the machine-auth token;
- `POST /api/orders/validate-create` for `orders.create.v1` payloads, without
  order creation, Warehouse reservation, or event publication;
- `POST /payments/validate-create` without provider calls or persistence;
- `POST /notifications/validate` without customer sends;
- Warehouse availability origin fields on product reads and a Warehouse-owned
  `warehouseId` carried into order validation payloads;
- order, payment, and notification validation readiness reporting;
- live-mutation approval-ID enforcement.

Forbidden:

- live order creation;
- live payment creation or provider calls;
- stock reservation, decrement, or any warehouse mutation;
- customer notification sends;
- fake success states for any of the above;
- printing or committing secret values.

## Acceptance Criteria

- Guarded checkout returns `orderValidation.status=validated_no_mutation`,
  `paymentValidation.status=validated_no_mutation`, and
  `notificationValidation.status=validated_no_send`, while still returning
  `service_identity_required`.
- `ENABLE_LIVE_ORDER_SUBMIT`, `ENABLE_LIVE_PAYMENT_CREATE`, and
  `ENABLE_LIVE_NOTIFICATIONS` cannot enable mutation on their own.
- `CLIPLOT_LIVE_ORDER_APPROVAL_ID`, `CLIPLOT_LIVE_PAYMENT_APPROVAL_ID`, and
  `CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID` are required for the matching live
  path and are empty in the deployed default.
- Smoke proves approval IDs are absent by default and that no order,
  reservation, payment, provider, or notification mutation occurs.
- `/api/checkout/live-preflight` returns `blocked` with `wouldMutate=false`.

## Intent Compliance

This goal satisfies the owner requirement that revenue readiness be proven with
real service validation rather than simulated success, and that flipping to live
require a deliberate, auditable approval rather than a deploy-time default.

## Dependencies

- GOAL-03 guarded integration foundation.
- GOAL-04 platform readiness, synced `cliplot-service-secret`, Orders
  acceptance of `cliplot-service` and channel `cliplot`, and Payments
  allowlisting of `cliplot-service` and `https://cliplot.alfares.cz`.

## Blockers

- Live mutation stays blocked until owner-approved provider-backed evidence and
  the matching `CLIPLOT_LIVE_*_APPROVAL_ID` values exist.
