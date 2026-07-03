# GOAL-11 Full Checkout Live Window Evidence

Date: 2026-07-03

## Scope

Controlled Cliplot full-checkout live window on Alfares after deployment of `localhost:5000/cliplot:6d8eaa4`.

Allowed temporary live flags during the bounded window:

- `ENABLE_LIVE_ORDER_SUBMIT=true`
- `ENABLE_LIVE_PAYMENT_CREATE=true`
- `ENABLE_LIVE_NOTIFICATIONS=true`
- `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true`

The runner used a shell `trap` to restore all four flags to `false` and delete the superseded true-flag pod.

## Pre-Window Evidence

- Repo: `main...origin/main`
- Head before live run: `6d8eaa4 fix: reconcile live revenue window readiness`
- Deployment image: `localhost:5000/cliplot:6d8eaa4`
- Running pod: `cliplot-866bd6889f-wqc7q`
- Closed live flags: all four `false`
- `npm run readiness:live-checkout-execution-window -- https://cliplot.alfares.cz`: pass, `executorStatus=approval_required`, `mutation=false`, `persistence=false`, `providerCall=false`
- `npm run readiness:bundle`: pass with `image=localhost:5000/cliplot:7537a33` before the final revenue-window patch, then targeted checks passed on `6d8eaa4` before the live run

## Execution Evidence

Executor:

```text
POST /api/checkout/live-bounded-executor
HTTP 201
status=live_checkout_bounded_execution_completed_cleanup_completed
mode=guarded_live_checkout_bounded_executor
liveExecutionAllowed=true
mutation=true
persistence=true
providerCall=true
orderCreated=true
warehouseReserved=true
paymentCreated=true
notificationSent=true
payment.status=processing
notification.status=sent
```

Sensitive data policy observed:

- No API key values printed.
- No raw provider payload printed.
- No raw customer/contact/address/payment payload printed.
- No raw notification recipient or message body printed.

## Cleanup And Post-Close Evidence

Restore trap:

```text
RESTORE_FLAGS=start
deployment "cliplot" successfully rolled out
DELETE_TRUE_FLAG_POD=cliplot-865449d4c5-nh6rj flags=true/true/true/true
RESTORE_FLAGS=done
```

Running-pod-only post-close flags:

```text
RUNNING_POD=pod/cliplot-866bd6889f-fxqq4
ENABLE_LIVE_NOTIFICATIONS=false
ENABLE_LIVE_ORDER_SUBMIT=false
ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false
ENABLE_LIVE_PAYMENT_CREATE=false
```

Post-close validation:

- `npm run readiness:live-checkout-execution-window -- https://cliplot.alfares.cz`: pass, execution disabled, mutation flags false.
- `npm run readiness:revenue-closure -- https://cliplot.alfares.cz`: pass, `approval_required_live_revenue_closure`, `wouldMutateNow=false`.
- `npm run readiness:bundle`: pass, `image=localhost:5000/cliplot:6d8eaa4`, live preflight blocked and non-mutating.

## Remaining Guardrails

- Live flags must remain closed outside an approved bounded window.
- Callback persistence and replay execution remain disabled.
- Provider-backed `/payments/{paymentId}` reads remain forbidden.
- Do not print raw provider payloads, customer PII, recipients, message bodies, API keys, or webhook keys.
