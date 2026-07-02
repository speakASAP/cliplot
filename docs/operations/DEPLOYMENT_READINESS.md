# Deployment Readiness

## Current Status

Partially ready. The frontend storefront is deployed, and GOAL-03 adds a
guarded shared-service integration foundation. Live payment/order revenue
readiness remains blocked until Vault secrets and provider-backed evidence are
present.

## Deployment Target

- Host: `cliplot.alfares.cz`
- Namespace: `statex-apps`
- Deployment name: `cliplot-service`
- TLS secret: `cliplot-service-tls`
- Secret target: `cliplot-service-secret`
- Vault path: `secret/prod/cliplot-service`

## Deployed Artifacts

- Dockerfile.
- Application source.
- `/health` endpoint.
- `k8s/configmap.yaml`.
- `k8s/external-secret.yaml`.
- `k8s/deployment.yaml`.
- `k8s/service.yaml`.
- `k8s/ingress.yaml`.
- Vault secret presence by key name.
- Build command.
- Public smoke contract.
- Rollback command.

## Current Safety Contract

- `ENABLE_LIVE_ORDER_SUBMIT` remains `false`.
- `cliplot-service-secret` is mounted as optional.
- `k8s/external-secret.yaml` maps planned keys from
  `secret/prod/cliplot-service`.
- `/api/checkout/submit` must return `service_identity_required` until live
  order submission is explicitly enabled with required tokens.

## Deploy Command

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && ./scripts/deploy.sh'
```

## Rollback Plan

Use the previous image tag from deployment history:

```bash
ssh alfares 'kubectl rollout undo deployment/cliplot-service -n statex-apps'
```
## Live Mutation Approval Contract

- `ENABLE_LIVE_ORDER_SUBMIT`, `ENABLE_LIVE_PAYMENT_CREATE`, and
  `ENABLE_LIVE_NOTIFICATIONS` remain `false` by default.
- `CLIPLOT_LIVE_ORDER_APPROVAL_ID`, `CLIPLOT_LIVE_PAYMENT_APPROVAL_ID`, and
  `CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID` must stay empty until approved live
  mutation evidence exists.
- Deployment readiness now checks both false live flags and empty approval IDs.


## Docs/RAG Operational Readiness

Docs/RAG ingestion is a two-phase operation. Run the non-mutating preflight
before publication:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot-service'
```

Do not run the normal publication command until preflight passes and ingestion
is intentionally approved.
