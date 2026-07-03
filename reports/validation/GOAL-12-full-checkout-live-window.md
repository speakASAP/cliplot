# GOAL-12 Full Checkout Live Window Evidence

## Intent Preservation Chain

- Vision: Cliplot can complete a real revenue checkout through shared Alfares services without becoming the source of commerce truth.
- Goal Impact: Proved one bounded live checkout window with order creation, Warehouse reservation, payment creation, notification send, idempotent order replay, and cleanup.
- System: Cliplot storefront with Orders, Warehouse, Payments, and Notifications integrations.
- Feature: Guarded full checkout bounded executor.
- Task: Open the four live flags only for the approved window, execute once, restore flags, and validate post-close guarded state.
- Execution Plan: Run pre-open read-only readiness, patch live flags for one selected pod, execute `POST /api/checkout/live-bounded-executor` once with unique idempotency keys, restore all flags through a trap, then run post-close readiness bundle.
- Coding Prompt: Do not enable callback persistence, callback replay, live status writes, provider-backed payment reads, or secret/PII output.
- Code: No runtime code change in this lane; execution used deployed image `localhost:5000/cliplot:abdf9eb`.
- Validation: See production evidence and post-close validation below.

## Production Execution Evidence

- Execution time: `2026-07-03T12:35:19Z` window start marker.
- External order id: `cliplot-full-checkout-20260703T123519Z`.
- Order id: `28783f0d-9652-4ced-8bd1-0a1b6cec42ff`.
- Executor status: `live_checkout_bounded_execution_completed_cleanup_completed`.
- HTTP status: `201`.
- Cleanup success: `true`.
- Order cancel status: `cancelled`.
- Order readback status: `cancelled`.
- Warehouse after cancel: `reservationCount=1`, `activeReservationCount=0`.
- After-readiness status: `validated_no_mutation`.
- Create evidence: `status=pending`, `warehouseStatus=reserved`.
- Replay evidence: `id=28783f0d-9652-4ced-8bd1-0a1b6cec42ff`, `status=pending`, `warehouseStatus=reserved`.
- Payment evidence: `status=processing`, `resultFingerprint=bb6b34cab04230561577b3270ad6ee6f8c819fb753f7d402ce3d573352efdf27`, `payloadFingerprint=33ea2bd8a4e2b7eaaeaacc8c4011b42d3848af371349e5fa225d0647dd996d18`, `idempotencyKeyFingerprint=79bb7edb40b7b42a4afcacd6f0e9655e79b8668aa60c61e9d2ae20d915e6a77d`.
- Notification evidence: `status=sent`, `resultFingerprint=7fee1aed11adf9f97fcb4ddbf98078467ccc0bb8be64da7922ebb5cbb4b3c4b9`, `payloadFingerprint=39cb42afa4ce23cd8a27da90e914c3b81e8fc1eb5aa1ce7d9fdd9346105b8f00`, `idempotencyKeyFingerprint=ce9517384889e7247193f69f6facfebc153c96c48ae6b407b912be62d3e33c56`.
- Live boundaries during execution: `orderCreated=true`, `warehouseReserved=true`, `paymentCreated=true`, `notificationSent=true`.
- Side-effect flags during execution: `mutation=true`, `persistence=true`, `providerCall=true`.
- Executor blockers: `0`.

## Window Control Evidence

- Pre-open validation passed:
  - `npm run readiness:activation -- https://cliplot.alfares.cz`
  - `npm run readiness:live-readiness-handoff-evidence -- https://cliplot.alfares.cz`
  - `npm run readiness:live-checkout-execution-request -- https://cliplot.alfares.cz`
  - `npm run readiness:live-flags-operator-preflight -- https://cliplot.alfares.cz`
- Temporary flags opened only for the selected verified pod:
  - `ENABLE_LIVE_ORDER_SUBMIT=true`
  - `ENABLE_LIVE_PAYMENT_CREATE=true`
  - `ENABLE_LIVE_NOTIFICATIONS=true`
  - `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true`
- The selected pod reported `ready_for_approved_live_mutation` before execution.
- The executor was called once through `localhost` inside the selected Cliplot pod to avoid routing to stale closed-flag pods during rollout.
- Restore trap returned both ConfigMap and Deployment env overrides to:
  - `ENABLE_LIVE_ORDER_SUBMIT=false`
  - `ENABLE_LIVE_PAYMENT_CREATE=false`
  - `ENABLE_LIVE_NOTIFICATIONS=false`
  - `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`

## Post-Close Validation

- Kubernetes deployment: `localhost:5000/cliplot:abdf9eb`, `READY=1`, `UPDATED=1`, `AVAILABLE=1`.
- ConfigMap flags after cleanup: all four live flags `false`.
- Deployment env overrides after cleanup: all four live flags `false`.
- `npm run readiness:activation -- https://cliplot.alfares.cz`: `approval_required_live_checkout_execution`, `wouldMutate=false`.
- `npm run readiness:live-checkout-execution-request -- https://cliplot.alfares.cz`: `approved_live_checkout_execution_request_contract_execution_disabled`, `liveFlagsClosed=true`, `liveExecutionAllowed=false`.
- `npm run readiness:revenue-closure -- https://cliplot.alfares.cz`: `approval_required_live_revenue_closure`, `wouldMutateNow=false`, `blockerCount=5`.
- `npm run readiness:live-readiness-handoff-evidence -- https://cliplot.alfares.cz`: `read_only_checkout_payment_notification_handoff_ready_execution_disabled`, `failedAssertionCount=0`.
- `npm run readiness:live-owner-execution-runbook -- https://cliplot.alfares.cz`: `approved_owner_live_execution_runbook_contract_execution_disabled`, `failedAssertionCount=0`.
- `npm run readiness:live-smoke-executor -- https://cliplot.alfares.cz`: `approval_required`, `liveExecutionAllowed=false`, `mutation=false`.
- `npm run readiness:bundle`: `CLIPLOT_READINESS_BUNDLE=pass`.

## Guardrails Preserved

- Callback persistence remained disabled.
- Callback replay execution remained disabled.
- Live status writes remained disabled.
- Provider-backed `/payments/{paymentId}` reads remained forbidden.
- No API keys, service tokens, webhook keys, raw provider payloads, provider transaction ids, customer PII, raw recipient, or message body are recorded here.

## Notes

- Two earlier guarded attempts stopped before executor call:
  - First attempt read the nested live-preflight packet incorrectly and exited before mutation.
  - Second attempt patched the ConfigMap only; Deployment env overrides kept the selected runtime closed, so it exited before mutation.
- The successful run patched both ConfigMap and Deployment env overrides, selected a pod that proved all four live flags were `true`, executed once, and restored all four flags to `false`.


## Post-Live Revenue Closure Packet

The follow-up read-only packet is:

```bash
npm run readiness:post-live-revenue-closure -- https://cliplot.alfares.cz
```

It distinguishes the validated completed live checkout window from the current
closed runtime. It must return
`validated_completed_full_checkout_live_window_closed`, keep
`liveExecutionAllowed=false`, and keep revenue closure
`approval_required_live_revenue_closure` while all live flags are `false`.

## Post-Live Revenue Closure Packet Validation

Validated after deployment of `localhost:5000/cliplot:617c23e`.

Commands:

```bash
npm run readiness:post-live-revenue-closure -- https://cliplot.alfares.cz
npm run readiness:bundle
```

Evidence:

```text
postLiveRevenueClosure=validated_completed_full_checkout_live_window_closed
completedWindow=validated_completed_full_checkout_live_window_closed
executorStatus=live_checkout_bounded_execution_completed_cleanup_completed
orderId=28783f0d-9652-4ced-8bd1-0a1b6cec42ff
paymentStatus=processing
notificationStatus=sent
liveFlagsClosed=true
revenueClosure=approval_required_live_revenue_closure
revenueBlockerCount=5
liveExecutionAllowed=false
failedAssertionCount=0
mutation=false
persistence=false
providerCall=false
READINESS_STEP=post_live_revenue_closure exit=0
READINESS_STEP=guarded_checkout_smoke exit=0
CLIPLOT_READINESS_BUNDLE=pass
deployment.image=localhost:5000/cliplot:617c23e
deployment.ready=1
deployment.available=1
```

The first external packet probe during rollout briefly reached the older
fallback route and returned the storefront HTML. After the rollout converged to
the single `617c23e` pod, the packet returned JSON and the full readiness bundle
passed. The current runtime remains closed and this packet does not open flags,
call the bounded executor, or perform order, Warehouse, payment, notification,
callback, status-write, provider-read, or secret-printing side effects.


## Revenue Handoff Reconciliation Packet

The follow-on handoff packet is read-only and intended for owner review of the
closed full-checkout window:

```bash
npm run readiness:revenue-handoff-reconciliation -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/checkout/revenue-handoff-reconciliation-packet
```

Expected status:
`ready_for_revenue_handoff_reconciliation_review_execution_disabled`.

The packet must keep `mutation=false`, `persistence=false`,
`providerCall=false`, `sideEffects=false`, and `liveExecutionAllowed=false`.
It must leave revenue closure guarded for future bounded windows and must not
persist callback state, replay callbacks, write live statuses, read
provider-backed payment detail, open live flags, or expose raw PII/provider
payloads.

## Owner Bounded-Window Handoff Packet

Added the read-only owner bounded-window handoff packet for future live-window
review:

```bash
npm run readiness:owner-bounded-window-handoff -- https://cliplot.alfares.cz
```

Expected evidence: `ready_for_owner_bounded_window_handoff_execution_disabled`,
all live flags closed, `liveExecutionAllowed=false`, `mutation=false`,
`persistence=false`, `providerCall=false`, payment-create and notification-send
execution windows metadata-ready, Auth wallet runtime checkout evidence recorded
with no live calls, post-live revenue closure validated, revenue handoff ready,
and exactly five expected revenue blockers for the future owner-opened bounded
window.


## 2026-07-03T20:06:24Z Controlled Live Window Re-run

After Payments service-to-service throttling was isolated by
`payments-microservice:a176f33`, Cliplot ran one additional controlled live
checkout window on deployed image `localhost:5000/cliplot:5ea0804`.

Sanitized executor evidence:

```text
httpStatus=201
executorStatus=live_checkout_bounded_execution_completed_cleanup_completed
externalOrderId=cliplot-full-checkout-20260703t200624z-816056
orderId=7938b1c4-1fb8-44e3-a4f3-e61e71052afb
orderCreated=true
warehouseReserved=true
paymentCreated=true
notificationSent=true
cleanupSuccess=true
orderCancelStatus=cancelled
orderReadbackStatus=cancelled
warehouseActiveReservationCount=0
paymentStatus=processing
paymentResultFingerprint=10187d09c7b4ece8ecde831101a6cd514c8450f47c5f5d95379d3baacb51d59a
paymentPayloadFingerprint=011a0719c397f323e92252c4f10eca88dae3aa03ab73a6ba1617be4f7d16a9f8
paymentIdempotencyKeyFingerprint=138c2767ad39fc2f1225e081796c69631c3b643420f06dce8b91e634035d6161
notificationStatus=sent
notificationResultFingerprint=e8b105c6e4f95f6b4e58ac6642df0628057a08c26adbf0c0543e4e734c9729df
notificationPayloadFingerprint=4ee7d93a2088b5bf547337aa22eacc6d8c7418e35c295c6f80f88d4caf3644e4
notificationIdempotencyKeyFingerprint=9a728dfe4778fd5fdb7754be5af09995e0228738038c700152b50e79b8812f69
```

The restore trap returned all four live flags to `false`. Manual post-close
checks confirmed Cliplot health `ok`, deployment image
`localhost:5000/cliplot:5ea0804` ready `1/1`, Payments throttling markers `0`
in the 1/2/5 minute lookback, and:

```text
postLiveRevenueClosure=validated_completed_full_checkout_live_window_closed
revenueHandoffReconciliation=ready_for_revenue_handoff_reconciliation_review_execution_disabled
revenueClosure=approval_required_live_revenue_closure
liveFlagsClosed=true
liveExecutionAllowed=false
revenueBlockerCount=5
failedAssertionCount=0
mutation=false
persistence=false
providerCall=false
```

No raw customer PII, provider payloads, provider transaction ids, recipient
addresses, message bodies, API keys, service tokens, or webhook keys were
recorded.
