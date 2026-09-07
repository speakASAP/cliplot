# GOAL-03 Context Package

## Repository

Remote source of truth:

```text
/home/ssf/Documents/Github/cliplot
```

## Baseline

- GOAL-02 delivered the deployed storefront slice at
  `https://cliplot.alfares.cz`.
- Catalog truth is app-local placeholder data; no shared service is wired.
- No Vault path exists for Cliplot at goal start.
- Checkout is a shell with no submit path.

## Required Context

- `SPEC.md`, `SYSTEM.md`, and `docs/DESIGN_CONTRACT.md`.
- `docs/IMPLEMENTATION_STATE.md` for the active goal.
- Shared service repositories, read-only, for Catalog, Auth, Orders,
  Warehouse, Notifications, and Payments request shapes.
- Existing Alfares `k8s/**` manifests and ExternalSecret patterns.

## Integration Contracts

- Catalog: read-only `GET /api/products` through `CATALOG_SERVICE_URL`.
- Auth: public hosted links through `AUTH_PUBLIC_URL`, `AUTH_CLIENT_ID`, and
  `AUTH_RETURN_URL`; contract remains unverified in this goal.
- Orders: readiness only; no order creation.
- Warehouse: token readiness only; no reservation or decrement.
- Notifications: token/template readiness only; no outbound send.
- Payments: no payment creation until GOAL-05.

## Guarded Runtime

`ENABLE_LIVE_ORDER_SUBMIT` defaults to false. With it false, or with required
service tokens absent, `/api/checkout/submit` returns
`service_identity_required` and names the missing facts.

## Sensitive Data Rule

No secret values may be printed, committed, or copied into docs. Validation may
record only key names, presence, and sync status.

## Ready Outputs

- `src/integrations.js` service boundary module.
- Guarded checkout submit, auth links, and integration readiness endpoints.
- `k8s/external-secret.yaml` for `secret/prod/cliplot-service`, mounted
  optional.

## Blocked Outputs

- Synced `cliplot-service-secret` until Vault values exist.
- Live checkout, payment initiation, stock mutation, and customer
  notifications until GOAL-05 provider evidence exists.
