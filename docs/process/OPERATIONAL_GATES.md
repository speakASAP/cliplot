# Operational Gates

## Gate Types

| Gate | Timing | Blocks on |
| --- | --- | --- |
| Pre-coding | Before product code | Missing goal, execution plan, validation plan, invariants, sensitive-data handling, or execution-critical blockers. |
| Delegation | Before worker coding | Missing context package, coding prompt, disjoint ownership, or expected worker report. |
| Integration | Before merging worker output | Missing validation evidence, conflicting write ownership, unresolved contract issues. |
| Deployment | Before Kubernetes deploy | Missing app, Dockerfile, manifests, Vault/ESO, health check, validation evidence, or deployment approval/evidence. |
| Revenue readiness | Before claiming checkout works | Missing provider-backed payment evidence, order evidence, stock evidence, notification evidence. |

## Required Commands

```bash
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
git diff --check
```

## Failure Policy

Failed gates block the next phase. Do not weaken a gate to pass. Fix the
artifact, split the goal, or record a human-approved exception.
## Live Mutation Approval Gate

Revenue readiness requires both technical validation and explicit approval IDs.
The live env flags are not sufficient by themselves:

```text
ENABLE_LIVE_ORDER_SUBMIT=true requires CLIPLOT_LIVE_ORDER_APPROVAL_ID plus false-to-true runtime flag approval for the bounded live checkout window
ENABLE_LIVE_PAYMENT_CREATE=true requires CLIPLOT_LIVE_PAYMENT_APPROVAL_ID
ENABLE_LIVE_NOTIFICATIONS=true requires CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID
ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true requires CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID and ORDERS_STATUS_SERVICE_TOKEN
```

Payment and notification approval IDs may be recorded as metadata after the
no-mutation/no-send evidence packets pass. ID presence is not execution approval:
checkout must stay guarded while any live flag remains `false`, and the flags
must remain false until a separate bounded live execution window is approved.
The current metadata-only lane records payment and notification IDs while still
requiring `ENABLE_LIVE_PAYMENT_CREATE=false`, `ENABLE_LIVE_NOTIFICATIONS=false`,
`ENABLE_LIVE_ORDER_SUBMIT=false`, and `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`.

The dedicated Orders/Warehouse smoke executor is narrower than normal checkout:
it still mutates live Orders/Warehouse state if enabled, so it must stay blocked
until the dedicated smoke approval ID, status-transition service token, explicit
`CREATE_REPLAY_CANCEL` body confirmation, `approvedBy`, and `reasonCode` are all
present.
