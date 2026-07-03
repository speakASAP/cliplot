# CREATE_REPLAY_CANCEL Readiness Worker B Plan

## Scope

Worker B is read-only for runtime and code surfaces. This plan records the
existing CREATE_REPLAY_CANCEL readiness path and the remaining controlled live
smoke blockers without enabling live flags or calling mutation endpoints.

Guardrails preserved:

- `mutation=false`
- `persistence=false`
- `providerCall=false`
- `liveExecutionAllowed=false`

Forbidden for this lane:

- no edits to `src/integrations.js`, `src/server.js`, `package.json`, or
  `scripts/readiness_bundle.sh`
- no edits to dirty existing docs
- no live flag enablement
- no calls to `POST /api/checkout/live-order-warehouse-smoke-executor`
- no Orders, Warehouse, Payments, notification, callback, or status-write
  mutation calls

## Intent Preservation Chain

- Vision: Czech-first Cliplot checkout must be able to prove one bounded live
  order create, idempotent replay, and cancel/release cleanup without payment or
  notification side effects.
- Goal Impact: unblock operator readiness for a controlled
  CREATE_REPLAY_CANCEL smoke while keeping production in metadata-only mode.
- System: Cliplot delegates order creation and cancellation to Orders, stock
  reservation evidence to Warehouse, and keeps Payments/Notifications out of
  scope.
- Feature: Live Orders/Warehouse smoke readiness packet and executor contract.
- Task: Identify exact existing packet endpoints, scripts, functions, blockers,
  and safe implementation next steps.
- Execution Plan: use only read-only GET packet probes and static source
  inspection; do not call executor POST.
- Coding Prompt: [MISSING: owner approval for runtime mutation execution].
- Code: existing implementation only; this lane adds this documentation file.
- Validation: live GET/script checks listed below, all preserving guardrails.

## Existing Surfaces

HTTP packets:

- `GET /api/checkout/live-order-warehouse-smoke-plan`
- `GET /api/checkout/live-order-warehouse-smoke-execution-checklist-packet`
- `GET /api/checkout/live-order-warehouse-create-replay-cancel-contract-packet`
- `POST /api/checkout/live-order-warehouse-smoke-executor` exists but is
  forbidden for this lane because it is the live smoke executor endpoint.

Server routes:

- `src/server.js` routes the two checklist/contract GET paths to
  `liveOrderWarehouseSmokeExecutionChecklistPacket()`.
- `src/server.js` routes the plan GET path to `liveOrderWarehouseSmokePlan()`.
- `src/server.js` routes the executor POST path to
  `runLiveOrderWarehouseSmoke(payload)`.

Integration functions:

- `liveOrderWarehouseSmokePlan()`
- `liveOrderWarehouseSmokeExecutionChecklistPacket()`
- `liveOrderWarehouseSmokeExecutionBlockers(input, plan)`
- `runLiveOrderWarehouseSmoke(input)`
- `executeLiveOrderWarehouseSmoke(input, plan)` is the mutating path and must
  remain unreachable until all blockers are intentionally cleared inside an
  approved window.

Readiness scripts:

- `npm run readiness:live-smoke-plan -- https://cliplot.alfares.cz`
- `npm run readiness:live-smoke-execution-checklist -- https://cliplot.alfares.cz`
- `npm run readiness:live-smoke-contract -- https://cliplot.alfares.cz`
- `npm run readiness:live-smoke-executor -- https://cliplot.alfares.cz` exists
  but posts to the executor; do not run it for this lane.

## Current Live Evidence

Collected from read-only probes against `https://cliplot.alfares.cz`:

- live smoke plan status:
  `approved_live_order_warehouse_smoke_metadata_execution_disabled`
- execution checklist status:
  `approval_required_live_order_warehouse_smoke_execution`
- contract status:
  `create_replay_cancel_contract_recorded_execution_disabled`
- `readyForBoundedWindow=true`
- `liveExecutionAllowed=false`
- `liveOrderWarehouseSmokeFlag=false`
- metadata approvals present:
  orderWarehouseSmoke, cleanup, window, rollbackOwner, validationOwner
- service token readiness present:
  Orders service token, Orders status token, Warehouse service token
- selected product:
  `19c69d06-e3d3-471d-b417-b2fccbd63ab0`
- selected warehouse:
  `c0de0000-0000-4000-8000-000000000013`
- current allowed mutation window metadata:
  `owner-approved-2026-07-03T00:45:00+02:00..2026-07-03T01:15:00+02:00-create-replay-cancel-only`

## Remaining Blockers

The current packet reports these execution blockers:

- `[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for owner-approved smoke execution window]`
- `[MISSING: executor request body confirm=CREATE_REPLAY_CANCEL]`
- `[MISSING: executor request approvalId matches CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID]`
- `[MISSING: executor request approvedBy operator id]`
- `[MISSING: executor request reasonCode]`

The default executor blocker set is:

- `live_order_warehouse_smoke_flag_disabled`
- `invalid_or_missing_smoke_approval_id`
- `missing_CREATE_REPLAY_CANCEL_confirmation`
- `missing_approvedBy`
- `missing_reasonCode`

## Controlled Implementation Plan

1. Keep this Worker B lane metadata-only. Do not patch runtime code while
   execution-window work is dirty in the checkout.
2. Integration owner validates the dirty execution-window lane first and decides
   whether its changes supersede any package/script assertions.
3. Before any future controlled execution, rerun only the three safe GET scripts:
   live smoke plan, execution checklist, and CREATE_REPLAY_CANCEL contract.
4. Confirm the owner-approved window is current at execution time; the metadata
   window recorded in current production is date-bound and must not be assumed
   valid after `2026-07-03T01:15:00+02:00`.
5. Only a designated execution owner may temporarily set
   `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true`, and only inside a fresh
   owner-approved bounded window.
6. The executor request must include `confirm=CREATE_REPLAY_CANCEL`,
   matching `approvalId`, `approvedBy`, and
   `reasonCode=CLIPLOT_OWNER_CREATE_REPLAY_CANCEL_SMOKE`.
7. During execution, payment creation, notification send, callback persistence,
   callback replay, live status writes, provider-backed payment reads, and
   normal checkout live submit must remain disabled.
8. Validate the five-step evidence chain: before snapshot, create, idempotent
   replay, Orders cancellation cleanup, after-cancel Warehouse restoration.
9. If any partial create occurs and cleanup is incomplete, stop immediately and
   hand off to the rollback owner; do not retry mutation.

## Parallel Execution

- Worker B, design/readiness lane: complete with this new docs file.
- Execution-window code owner: dependency-gated; owns dirty files
  `src/integrations.js`, `src/server.js`, `package.json`,
  `scripts/readiness_bundle.sh`, and `scripts/live-checkout-execution-window.js`.
- Validation owner: final integration after the dirty lane settles; owns
  read-only GET packet validation and, only after explicit approval, runtime
  smoke evidence collection.
- Merge order: execution-window code owner first, then validation owner reruns
  GET readiness, then the owner decides whether to approve a fresh bounded live
  execution window.

## Validation Commands Run

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && npm run readiness:live-smoke-plan -- https://cliplot.alfares.cz'
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && npm run readiness:live-smoke-execution-checklist -- https://cliplot.alfares.cz'
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && npm run readiness:live-smoke-contract -- https://cliplot.alfares.cz'
```

Not run by design:

```bash
npm run readiness:live-smoke-executor -- https://cliplot.alfares.cz
```

Reason: that script posts to
`/api/checkout/live-order-warehouse-smoke-executor`, and this lane is forbidden
from calling live mutation endpoints including the live smoke executor POST.
