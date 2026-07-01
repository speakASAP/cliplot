# GOAL-05 Checkout Revenue Readiness

## Vision

Cliplot must become a Czech-first e-commerce storefront that can sell real
products through shared Alfares commerce services without inventing product,
payment, order, warehouse, or notification state locally.

## Goal Impact

This goal moves the storefront from guarded preview toward revenue readiness.
It must produce provider-backed evidence before any live payment or live order
creation is treated as production-ready.

## System

- Cliplot storefront: `/home/ssf/Documents/Github/cliplot-service`.
- Catalog authority: `catalog-microservice`.
- Orders authority: `orders-microservice`.
- Payments authority: `payments-microservice`.
- Warehouse authority: `warehouse-microservice`.
- Notifications authority: `notifications-microservice`.
- Auth and service identity authority: `auth-microservice`.
- Runtime secrets: Vault plus ExternalSecrets in namespace `statex-apps`.

## Feature

Authenticated Catalog product reads and guarded checkout validation are the
current executable GOAL-05 lanes. Cliplot must show real Catalog products when
Catalog is available, validate Orders/Payments/Notifications payloads without
mutation, and retain fallback products only as a degraded fallback.

## Task

Wire Cliplot to Catalog's existing machine-auth read path and prove guarded
checkout payload readiness through:

- Orders `POST /api/orders/validate-create`;
- Payments `POST /payments/validate-create`;
- Notifications `POST /notifications/validate`.

## Boundaries

- No live payment success claims.
- No live order creation until explicit runtime evidence proves the full chain.
- No stock reservation or decrement.
- No customer notification send.
- No committed or printed secret values.
- No local product authority inside Cliplot.

## Validation

Completion of the Catalog lane requires:

- `npm run build` passes.
- pre-coding and strict doc gates pass.
- deployment readiness gate passes.
- Kubernetes dry-run passes for changed manifests.
- deployed Cliplot pod has `CATALOG_INTERNAL_SERVICE_TOKEN` present without
  printing the value.
- public `/api/products` returns real Catalog product IDs, not fallback IDs.
- public or in-cluster `/api/integrations/readiness` reports authenticated
  Catalog reads plus `orderValidation=enabled_no_mutation`,
  `paymentValidation=enabled_no_mutation`, and
  `notificationValidation=enabled_no_send`;
- guarded checkout returns HTTP `202` with order, payment, and notification
  validation results and no live order/payment/notification mutation.
