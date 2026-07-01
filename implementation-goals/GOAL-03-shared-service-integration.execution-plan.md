# GOAL-03 Execution Plan: Shared Service Integration

## Vision

Cliplot should behave like a real Alfares storefront while refusing unsafe live
commerce mutations until contracts, Vault secrets, and provider evidence exist.

## Goal Impact

- Keeps the storefront usable for product browsing and checkout preparation.
- Moves shared service wiring from documentation into deployable code.
- Prevents fake success states for orders, payments, stock, or notifications.

## Scope

Allowed:

- Add a server-side integration module for Catalog, Auth, Orders readiness,
  Warehouse readiness, Notifications readiness, and payment gating.
- Add `/api/checkout/submit` as a guarded endpoint.
- Keep `/api/products` backed by Catalog with local fallback products.
- Add `/api/auth/links` and `/api/integrations/readiness`.
- Add Kubernetes service identity config and ExternalSecret scaffolding.
- Update frontend checkout copy and result handling.
- Update gates, validation reports, and state docs.

Forbidden:

- No live payment creation.
- No stock reservation, decrement, or warehouse mutation.
- No customer notification sends.
- No hardcoded secrets.
- No invented Orders, Payments, Auth, or Warehouse contracts beyond explicitly
  marked defaults and `[MISSING: ...]` blockers.

## Workstreams

| Workstream | Status | Files | Owner | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| IPS/docs | ready now | `GOALS.md`, `docs/**`, `implementation-goals/**` | Orchestrator | GOAL-02 closure | Strict doc audit. |
| Integration code | ready now | `src/server.js`, `src/integrations.js` | Orchestrator | Catalog read contract | `npm run build`, endpoint smoke. |
| Frontend checkout | ready now | `public/index.html`, `public/app.js`, `public/styles.css` | Orchestrator | Integration endpoint shape | Static asset check. |
| K8s/Vault | ready now | `k8s/**`, `scripts/deploy.sh`, `scripts/deployment_readiness_gate.py` | Orchestrator | Existing deploy target | Dry-run and deploy. |
| Revenue enablement | blocked | `[MISSING]` | Future payment agent | Provider evidence and Vault secrets | GOAL-05 validation. |

## Integration Contracts

- Catalog: read-only `GET /api/products` through `CATALOG_SERVICE_URL`.
- Auth: public hosted links through `AUTH_PUBLIC_URL`, `AUTH_CLIENT_ID`, and
  `AUTH_RETURN_URL`; contract remains unverified.
- Orders: guarded submit shape uses `ORDERS_SERVICE_URL`,
  `ORDERS_CREATE_PATH`, `ORDERS_SERVICE_TOKEN`, `CLIPLOT_ORDER_CHANNEL`, and
  `CLIPLOT_CHANNEL_ACCOUNT_ID`; live submit disabled by default.
- Warehouse: token readiness only in this goal; no reservation/decrement.
- Notifications: token/template readiness only in this goal; no outbound send.
- Payments: no payment creation until GOAL-05.

## Validation Plan

1. `npm run build`.
2. `python3 scripts/pre_coding_gate.py --root .`.
3. `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`.
4. `python3 scripts/deployment_readiness_gate.py --root .`.
5. Kubernetes dry-run for configmap, external-secret, deployment, service, and
   ingress.
6. Temporary runtime smoke for `/health`, `/api/products`,
   `/api/auth/links`, `/api/integrations/readiness`, and
   `/api/checkout/submit`.
7. `./scripts/deploy.sh`.
8. Public smoke for the same non-mutating endpoints.

## Handoff Notes

GOAL-03 is complete when the guarded integration foundation is deployed and
validated. GOAL-05 remains blocked until owner-approved service identities,
Vault values, and provider-backed payment evidence are present.
