# Deployment Readiness

## Current Status

Partially ready. The frontend storefront is deployed, and GOAL-03 adds a
guarded shared-service integration foundation. Live payment/order revenue
readiness remains blocked until Vault secrets and provider-backed evidence are
present.

## Deployment Target

- Host: `cliplot.alfares.cz`
- Namespace: `statex-apps`
- Deployment name: `cliplot`
- TLS secret: `cliplot-tls`
- Secret target: `cliplot-secret`
- Vault path: `secret/prod/cliplot`

## Deployed Artifacts

- Dockerfile.
- Application source.
- `/health` endpoint.
- `k8s/configmap.yaml`.
- `k8s/external-secret.yaml`.
- `k8s/deployment.yaml`.
- `k8s/service.yaml`.
- `k8s/ingress.yaml`.
- `k8s/readiness-cronjob.yaml`.
- Vault secret presence by key name.
- Build command.
- Public smoke contract.
- Rollback command.

## Current Safety Contract

- `ENABLE_LIVE_ORDER_SUBMIT` remains `false`.
- `ENABLE_LIVE_PAYMENT_CREATE` remains `false`.
- `ENABLE_LIVE_NOTIFICATIONS` remains `false`.
- `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE` remains `false`.
- `cliplot-secret` is mounted as optional.
- `k8s/external-secret.yaml` maps planned keys from
  `secret/prod/cliplot`.
- `/api/checkout/submit` must return `service_identity_required` until live
  order submission is explicitly enabled with required tokens.
- Payment read-scope is validated through the DB-only
  `/payments/status/by-order-id` readiness probe, but passive customer status
  reads remain disabled until ADR-002 owner approval, callback replay policy,
  and live status read/write approvals exist.

## Deploy Command

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && ./scripts/deploy.sh'
```

## Rollback Plan

Use the previous image tag from deployment history:

```bash
ssh alfares 'kubectl rollout undo deployment/cliplot -n statex-apps'
```
## Live Mutation Approval Contract

- `ENABLE_LIVE_ORDER_SUBMIT`, `ENABLE_LIVE_PAYMENT_CREATE`, and
  `ENABLE_LIVE_NOTIFICATIONS` remain `false` by default.
- `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE` remains `false` by default, with
  `CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID` projected by name only for a
  future owner-approved smoke window.
- `CLIPLOT_LIVE_ORDER_APPROVAL_ID`, `CLIPLOT_LIVE_PAYMENT_APPROVAL_ID`, and
  `CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID` must stay empty until approved live
  mutation evidence exists.
- Deployment readiness now checks both false live flags and empty approval IDs.


## Docs/RAG Operational Readiness

Docs/RAG ingestion is a two-phase operation. Run the non-mutating preflight
before publication:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot'
```

Do not run the normal publication command until preflight passes and ingestion
is intentionally approved.


## Read-Only Bundle

For an operator-safe aggregate check:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && npm run readiness:bundle'
```

The command must not create orders, payments, Warehouse reservations,
notifications, callback persistence, or Docs/RAG ingestion jobs.

## Kubernetes Readiness CronJob

`./scripts/deploy.sh` applies `k8s/readiness-cronjob.yaml` after the service
and ingress. The CronJob is intentionally narrower than the operator
`readiness:bundle`: it runs an endpoint-only GET probe inside the cluster and
does not require Vault CLI, `kubectl`, Docs/RAG ingestion, or checkout POST
smoke.

Before deployment:

```bash
npm run readiness:k8s -- https://cliplot.alfares.cz
kubectl apply --dry-run=server -f k8s/readiness-cronjob.yaml -n statex-apps
```
