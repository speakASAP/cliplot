# GOAL-04 Context Package

## Baseline

- `cliplot-service` is deployed at `https://cliplot.alfares.cz/`.
- Current live image before GOAL-04 is
  `localhost:5000/cliplot-service:0556cec`.
- GOAL-03 added `k8s/external-secret.yaml`, guarded checkout submit, Auth
  links, integration readiness, and non-mutating public smoke.
- ExternalSecret `cliplot-service-secret` exists but does not sync because
  `secret/prod/cliplot-service` is missing in Vault.

## Contract Findings

- Orders implemented create endpoint is `POST /api/orders`, not
  `/api/orders/guest`.
- Orders requires `contractVersion: "orders.create.v1"`, `channel`,
  `externalOrderId`, `channelAccountId`, `items[].title`,
  `items[].quantity`, `items[].unitPrice`, and `totals.total/currency`.
- Orders does not yet accept `cliplot-service` or channel `cliplot`.
- Payments requires `POST /payments/create` with `X-API-Key` and an allowed
  `applicationId`.
- Payments allowlists do not yet include `cliplot-service` or
  `https://cliplot.alfares.cz`.
- Warehouse requires Auth-validated Bearer token with warehouse admin role.
- Notifications requires service/JWT token plus approved channel/template.
- Auth validates the Cliplot return URL but client registry docs do not list
  `cliplot-service`.
- Catalog is Auth-guarded, has no `cliplot` marketplace key, and current
  Cliplot product reads fall back to local placeholder products.
- Docs/RAG is mounted to `/home/ssf/Documents/Github`, but ingestion/retrieval
  is blocked by `ECONNREFUSED 192.168.88.53:11434`.

## Sensitive Data Rule

No secret values may be printed, committed, or copied into docs. Validation may
record only key names, presence, and sync status.

## Ready Outputs

- Vault presence script.
- Docs/RAG publication script.
- Updated readiness gate.
- Contract-ready Cliplot order payload shape with live submit still disabled.

## Blocked Outputs

- Fully synced Cliplot ExternalSecret until Vault values exist.
- Successful docs-rag ingestion until embedding backend is reachable.
- Live checkout until Orders/Payments/Catalog/Warehouse/Notifications/Auth
  contracts are patched and validated.
