# GOAL-03: Shared Service Integration

## Objective

Wire Cliplot into the Alfares shared services — Catalog, Auth, Orders,
Warehouse, Notifications, and Payments — as deployable code, while keeping every
live commerce mutation disabled until contracts, Vault secrets, and
provider-backed evidence exist.

## Scope

Allowed:

- server-side integration module for Catalog, Auth, Orders readiness,
  Warehouse readiness, Notifications readiness, and payment gating;
- guarded `POST /api/checkout/submit`;
- `GET /api/products` backed by Catalog with local fallback products;
- `GET /api/auth/links` and `GET /api/integrations/readiness`;
- Kubernetes service identity config and ExternalSecret scaffolding for
  `secret/prod/cliplot-service`;
- frontend checkout copy and result handling;
- gates, validation reports, and state docs.

Forbidden:

- live payment creation;
- stock reservation, decrement, or any warehouse mutation;
- customer notification sends;
- hardcoded secrets;
- invented Orders, Payments, Auth, or Warehouse contracts beyond explicitly
  marked defaults and `[MISSING: ...]` blockers.

## Acceptance Criteria

- `/api/products` reads Catalog and degrades to local fallback products
  instead of failing.
- `/api/checkout/submit` returns `service_identity_required` with explicit
  missing facts unless `ENABLE_LIVE_ORDER_SUBMIT=true` and the required
  service tokens exist.
- `/api/auth/links` and `/api/integrations/readiness` respond.
- `k8s/external-secret.yaml` targets `secret/prod/cliplot-service` and
  `cliplot-service-secret` mounts as optional, so deployment stays green while
  Vault values are missing.
- Gates, Kubernetes dry-runs, deploy, and non-mutating public smoke pass.

## Intent Compliance

This goal preserves the owner requirement that the storefront behave like a
real Alfares service without ever producing a fake success state for orders,
payments, stock, or notifications.

## Blockers

- `[MISSING: Catalog product scope/service-auth path for Cliplot product reads]`
- `[MISSING: Warehouse Auth role token for Cliplot stock reads/mutations]`
- `[MISSING: Notification channel/template contract for Cliplot order confirmations]`
- Revenue enablement remains deferred to GOAL-05.
