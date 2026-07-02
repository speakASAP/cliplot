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
- The live Orders/Warehouse smoke execution checklist must return `approval_required_live_order_warehouse_smoke_execution`, keep `liveExecutionAllowed=false`, `mutation=false`, `persistence=false`, and `providerCall=false`, and list `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true` plus `CREATE_REPLAY_CANCEL` request-body blockers before any bounded smoke run.
- `cliplot-secret` is mounted as optional.
- `k8s/external-secret.yaml` maps planned keys from
  `secret/prod/cliplot`.
- `/api/checkout/submit` must return `service_identity_required` until live
  order submission is explicitly enabled with required tokens.
- The callback replay policy gate may return `approved_callback_replay_policy_metadata_execution_disabled` once policy metadata is approved, and the callback persistence approval packet may return `approved_callback_persistence_metadata_execution_disabled` only when the storage, rollout, retention, uniqueness, replay-execution, and live-status-write metadata approvals are recorded; both must keep `callbackPersistence=false`, `callbackReplayEnabled=false`, `mutation=false`, `persistence=false`, and `providerCall=false` until a separate runtime enablement window is approved. The callback persistence packet may include `storageBackendProposal`, `rolloutPlan`, and `replayDryRunContract` metadata, and the callback replay rollout packet may include bounded execution-window and synthetic dry-run metadata; those sections are proposal-only and must keep runtime enablement, callback persistence, replay execution, live status writes, provider calls, notification sends, and storage writes false.
- The live status write approval packet may return `approved_live_status_write_metadata_execution_disabled` after owner approval, callback persistence storage/rollout, replay rollout, bounded write window, validation owner, and rollback owner metadata are present; it must still keep `liveStatusWritesEnabled=false`, `liveStatusWritesNow=false`, `callbackPersistence=false`, `callbackReplayEnabled=false`, `mutation=false`, `persistence=false`, and `providerCall=false` until runtime flags are separately enabled.
- The callback persistence storage contract/checklist packet may include `approved_callback_persistence_storage_contract_metadata_execution_disabled` child evidence after storage, rollout, retention/deletion, uniqueness/conflict, replay, live-status-write, rollback, and validation metadata approvals exist; it must still keep `callbackPersistence=false`, `callbackReplayEnabled=false`, `liveStatusWritesNow=false`, `mutation=false`, `persistence=false`, and `providerCall=false`.
- Payment status storage readiness may return `approved_payment_status_storage_metadata_execution_disabled` after callback storage, rollout, retention, uniqueness, replay, and live-status-write metadata approvals are recorded; it must keep storage writes, callback persistence, replay execution, live status writes, provider-backed reads, payment creation, and notifications disabled.
- Payment read-scope is validated through the DB-only
  `/payments/status/by-order-id` readiness probe. The approved read-only
  customer status runtime is active with `runtimeReadEnabled=true` and
  `paymentsSnapshotReadEnabled=true`, but live payment creation, callback
  persistence, local payment status storage, provider-refreshing reads, order
  creation, Warehouse reservation, and notification sends remain disabled.
- The passive payment status snapshot-read approval packet must return
  `approved_passive_payments_snapshot_read`, `runtimeReadEnabled=true`,
  `approvedRuntimeChange=true`, `mutation=false`, `persistence=false`, and
  `providerCall=false`.
- The customer status surface, rollout plan, activation gate, and approval
  evidence packet must return approved read-only statuses while preserving
  `storageRead=false`, `callbackPersistence=false`, `mutation=false`,
  `persistence=false`, and `providerCall=false`.
- The passive Payments DB snapshot adapter behind `/api/payments/status` may use
  only `/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}`.
  It must keep `/payments/{paymentId}` forbidden for passive reads and use
  customer-safe unknown/temporary-unavailable states when no snapshot can be
  rendered.

- The product filter readiness gate must remain `approval_required_catalog_product_filter_rule` with `catalogSource=catalog`, `warehouseBackedProductCount>0`, `mutation=false`, `persistence=false`, and `providerCall=false` until an owner-approved Cliplot SKU/filtering rule exists.

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
  `CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID` and smoke owner metadata
  projected for a future owner-approved smoke window; the execution flag still
  stays `false` until that window is intentionally opened.
- `CLIPLOT_LIVE_ORDER_APPROVAL_ID`, `CLIPLOT_LIVE_PAYMENT_APPROVAL_ID`, and
  `CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID` must stay empty until approved live
  mutation evidence exists.
- Deployment readiness checks false live mutation flags, empty live order/payment/notification approval IDs, and confirms that smoke metadata does not enable execution while `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`.


## Docs/RAG Operational Readiness

Docs/RAG ingestion is a two-phase operation. Run the non-mutating preflight
before publication:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot'
```

Do not run the normal publication command until preflight passes and ingestion
is intentionally approved.


## Revenue Closure Packet

`GET /api/checkout/revenue-closure-packet` is the read-only operator packet for
live revenue closure. It aggregates approval, product scope, order/Warehouse,
payment, notification, callback, status, and live smoke evidence. Current
production must return `approval_required_live_revenue_closure`,
`wouldMutateNow=false`, `mutation=false`, `persistence=false`, and
`providerCall=false`.

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && npm run readiness:revenue-closure -- https://cliplot.alfares.cz'
```

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


### Configured SKU Scope Approval

The Cliplot ConfigMap carries `CLIPLOT_PRODUCT_SCOPE_APPROVAL_ID` for the
configured `CLIPLOT_PRODUCT_IDS` lane. Deployment readiness still requires
`ENABLE_LIVE_ORDER_SUBMIT=false`, `ENABLE_LIVE_PAYMENT_CREATE=false`,
`ENABLE_LIVE_NOTIFICATIONS=false`, and `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`.
