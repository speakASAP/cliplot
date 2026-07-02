# GOAL-06 Operational Closure Execution Plan

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding
Prompt -> Code -> Validation.

## Current Lane

Read-only operator readiness bundle for Cliplot guarded checkout and platform
readiness.

## Allowed Changes

- `scripts/readiness_bundle.sh`
- `scripts/k8s-readiness-probe.js`
- `package.json`
- `k8s/readiness-cronjob.yaml`
- `scripts/deploy.sh`
- `scripts/deployment_readiness_gate.py`
- `docs/OPERATIONAL_RUNBOOK.md`
- `docs/operations/DEPLOYMENT_READINESS.md`
- `docs/IMPLEMENTATION_STATE.md`
- `implementation-goals/GOAL-06-operational-closure*.md`

## Forbidden Changes

- Live order creation.
- Live payment creation/provider calls.
- Warehouse reservation or stock mutation.
- Notification send.
- Payment callback persistence.
- Docs/RAG ingestion trigger from the readiness bundle.
- Secret value printing.

## Steps

1. Add `scripts/readiness_bundle.sh`.
2. Add `npm run readiness:bundle`.
3. Gate checkout POST smoke behind live preflight and integration readiness.
4. Run Vault presence check without printing values.
5. Run Docs/RAG preflight only, accepting exit `2` as operational blocked.
6. Record evidence and blockers.
7. Add a Kubernetes scheduled endpoint-only readiness monitor that runs inside the cluster without Kubernetes API permissions.
8. Keep the cluster monitor read-only: GET `/health`, `/api/checkout/live-preflight`, `/api/integrations/readiness`, and `/api/payments/status` only.

## Parallel Execution Section

| Workstream | Status | Owner | Files | Validation |
| --- | --- | --- | --- | --- |
| Readiness bundle script | ready now | main orchestrator | `scripts/readiness_bundle.sh`, `package.json` | `bash -n`, `npm run readiness:bundle` |
| Operational docs | ready now | main orchestrator | `docs/OPERATIONAL_RUNBOOK.md`, `docs/operations/DEPLOYMENT_READINESS.md` | strict doc audit |
| Live approval packet | ready now | main orchestrator | approval packet endpoint/script/docs | `npm run readiness:approval -- https://cliplot.alfares.cz` |
| Passive payment snapshot-read approval packet | ready now | main orchestrator | payment snapshot-read approval endpoint/script/docs | `npm run readiness:payment-snapshot-read-approval -- https://cliplot.alfares.cz` |
| Callback replay policy gate | ready now | main orchestrator | callback replay policy endpoint/script/docs | `npm run readiness:payment-callback-policy -- https://cliplot.alfares.cz` |
| Customer status surface contract | ready now | main orchestrator | checkout status surface contract endpoint/script/docs | `npm run readiness:checkout-status-surface -- https://cliplot.alfares.cz` |
| Customer status runtime rollout plan | ready now | main orchestrator | customer status rollout plan endpoint/script/ADR/docs | `npm run readiness:customer-status-rollout -- https://cliplot.alfares.cz` |
| Customer status runtime activation gate | ready now | main orchestrator | customer status activation endpoint/script/docs | `npm run readiness:customer-status-activation -- https://cliplot.alfares.cz` |
| Passive status runtime read adapter | ready now | main orchestrator | disabled adapter endpoint/script/docs | `npm run readiness:customer-status-runtime-read -- https://cliplot.alfares.cz` |
| Frontend guarded customer status read | ready now | main orchestrator | status page frontend/smoke/docs | `npm run smoke:checkout -- https://cliplot.alfares.cz` |
| Customer status approval evidence packet | ready now | main orchestrator | customer status approval evidence endpoint/script/docs | `npm run readiness:customer-status-approval -- https://cliplot.alfares.cz` |
| Order/payment status mapping ownership | ready now | main orchestrator | payment mapping ownership endpoint/script/ADR/docs | `npm run readiness:payment-mapping -- https://cliplot.alfares.cz` |
| Approved read-only customer status runtime | ready now | main orchestrator | runtime flags, status scripts, k8s probe | `npm run readiness:customer-status-runtime-read -- https://cliplot.alfares.cz`, `npm run readiness:k8s -- https://cliplot.alfares.cz` |
| Final live revenue closure | dependency-gated | main orchestrator | checkout/order/payment/notification config | approved live evidence and approval IDs |
| Kubernetes readiness monitor | ready now | main orchestrator | `scripts/k8s-readiness-probe.js`, `k8s/readiness-cronjob.yaml`, `scripts/deploy.sh` | `npm run readiness:k8s -- https://cliplot.alfares.cz`, server dry-run, deployed CronJob inspect |
| Docs/RAG publication | dependency-gated | main orchestrator | docs-rag service | preflight pass then intentional ingestion approval |

## Blockers

- `[MISSING: CLIPLOT_LIVE_ORDER_APPROVAL_ID after approved live order-create and Warehouse reservation evidence for Cliplot]`
- `[MISSING: CLIPLOT_LIVE_PAYMENT_APPROVAL_ID after approved live payment-create execution evidence for Cliplot]`
- `[MISSING: CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID after approved live notification send validation for Cliplot order confirmations]`
- `[RESOLVED: Docs/RAG controlled ingestion for repoName cliplot passed; retrieval and agent-context return Cliplot sources]`
