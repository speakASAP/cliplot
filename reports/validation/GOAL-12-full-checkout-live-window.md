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
