# CREATE_REPLAY_CANCEL Worker B Read-Only Evidence Lane

## Scope

Worker B owns this independent read-only readiness/evidence lane for the
Orders/Warehouse `CREATE_REPLAY_CANCEL` smoke. It complements runtime execution
work without editing runtime routes, executor code, callback persistence/replay,
provider integrations, or live flags.

Forbidden operations preserved:

- no live flag enablement;
- no calls to live mutation endpoints;
- no callback persistence or replay;
- no DB writes;
- no provider calls;
- no secret printing;
- no destructive commands.

## Intent Preservation Chain

- Vision: Cliplot checkout can prove a bounded real Orders/Warehouse lifecycle
  without broad production checkout mutation.
- Goal Impact: keep execution disabled now while making the evidence contract
  explicit for any future approved `CREATE_REPLAY_CANCEL` window.
- System: Cliplot read-only readiness packets, Orders, Warehouse, Payments,
  Notifications, and operator-owned live flags.
- Feature: independent Worker B readiness/evidence validator.
- Task: validate current production remains disabled and enumerate required
  after-approval evidence.
- Execution Plan: read only the three GET packets; do not call executor POST.
- Coding Prompt: add a distinct script and package command; do not change
  runtime routes or shared execution scripts.
- Code: `scripts/create-replay-cancel-readiness-evidence-lane.js` and
  `npm run readiness:create-replay-cancel-evidence-lane`.
- Validation: targeted non-mutating commands listed below.

## Status Fields Required Now

The Worker B lane must pass only when these production fields are true:

- `runtimeMutationAttempted=false`
- `planStatus=approved_live_order_warehouse_smoke_metadata_execution_disabled`
- `checklistStatus=approval_required_live_order_warehouse_smoke_execution`
- `contractStatus=create_replay_cancel_contract_recorded_execution_disabled`
- `readiness=validated_no_mutation`
- `livePreflight=blocked`
- `liveExecutionAllowed=false`
- `liveOrderWarehouseSmokeFlag=false`
- `mutation=false`
- `persistence=false`
- `providerCall=false`
- `paymentCreateAllowed=false`
- `notificationSendAllowed=false`
- `callbackPersistenceAllowed=false`
- `directWarehouseMutationAllowed=false`

## Evidence Required After Approved CREATE_REPLAY_CANCEL

After a fresh owner-approved bounded window, the integration or validation owner
must record all of the following without raw secrets or PII:

1. Create idempotency: approved external order id/idempotency key, Orders create
   response, created order id, and Warehouse reservation handoff for the
   approved Cliplot product/warehouse.
2. Replay idempotency/no duplicate: a second create attempt with the same
   external order id/idempotency key returns the same order id or an explicit
   duplicate-safe result, with no additional active Warehouse reservation.
3. Cancel/rollback outcome: cancellation only through the Orders status
   endpoint, final order status `cancelled`, Warehouse handoff cancelled or
   released, and `activeReservationCount=0`.
4. Notification/payment/order side effects: `paymentCreated=false`,
   `notificationSent=false`, live checkout submit remains disabled, and no
   provider-backed payment create/status write/callback replay occurred.
5. Secret/PII redaction: no service token values, bearer tokens, webhook
   secrets, provider payload secrets, customer email/name/phone/address, or raw
   payment identifiers in persisted evidence.
6. Live flags restored false: `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false` and all
   payment, notification, callback persistence/replay, status-write, and live
   checkout mutation flags false after the window.

## Parallel Execution

- Worker B evidence lane: ready now and independent; owns only this report,
  `scripts/create-replay-cancel-readiness-evidence-lane.js`, and the package
  command for that script.
- Runtime execution owner: dependency-gated; owns any future approved live flag
  window and executor call. Worker B does not edit or run that path.
- Integration owner: final integration; may decide whether this validator joins
  a larger readiness bundle after concurrent Worker A changes settle.
- Validation owner: reruns the Worker B command plus existing GET validators;
  no POST executor validation unless separately approved by the owner.
- Merge order: Worker A runtime route/script work first if overlapping, Worker B
  read-only evidence lane second, integration owner finalizes shared readiness
  bundles last.

## Validation Commands

Safe GET-only commands:

```bash
npm run readiness:live-smoke-plan -- https://cliplot.alfares.cz
npm run readiness:live-smoke-execution-checklist -- https://cliplot.alfares.cz
npm run readiness:live-smoke-contract -- https://cliplot.alfares.cz
npm run readiness:create-replay-cancel-evidence-lane -- https://cliplot.alfares.cz
npm run check
```

Forbidden in this lane:

```bash
npm run readiness:live-smoke-executor -- https://cliplot.alfares.cz
```

Reason: the executor readiness script performs `POST
/api/checkout/live-order-warehouse-smoke-executor`; Worker B is GET-only.
