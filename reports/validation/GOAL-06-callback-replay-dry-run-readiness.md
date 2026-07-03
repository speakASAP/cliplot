# GOAL-06 Callback Replay Dry-Run Readiness Evidence

## IPS Chain

- Constitution: Cliplot remains a Czech storefront and non-authoritative renderer for shared commerce state.
- Vision: Enable checkout readiness without turning Cliplot into a payment-status backend.
- Business Case: Reduce remaining revenue-closure blockers through auditable, owner-approved callback replay metadata while avoiding unsafe payment/order mutation.
- System: Cliplot reads shared-service evidence and exposes guarded packets.
- Subsystem: Payments callback persistence/replay readiness.
- Roadmap: GOAL-06 operational closure, callback dry-run readiness lane.
- Milestone: Callback replay dry-run metadata can be validated without persistence or provider calls.
- Feature: `readiness:payment-callback-persistence` now prints and asserts callback storage owner, idempotency, uniqueness/conflict, retention, rollback, validation, rollout, and replay dry-run guards.
- Task: Prove the current live packet keeps callback persistence and replay execution disabled unless separately approved.
- Goal Impact: Callback persistence/replay metadata can be reviewed as closed for dry-run readiness while runtime callback writes and replay remain blocked.
- Execution Plan: Inspect live packet, strengthen the readiness validator output/assertions, run callback policy/storage/replay/revenue/bundle validation, and deploy only if runtime code changes require it.
- Context Package: Remote repo `/home/ssf/Documents/Github/cliplot`, production `https://cliplot.alfares.cz`, current image `localhost:5000/cliplot:71a8122`.
- Coding Prompt: Add a non-mutating evidence increment for callback replay dry-run readiness; do not enable callback persistence, replay execution, payment creation, order creation, notifications, provider-backed reads, or live flags.
- Code: `scripts/payment-callback-persistence-approval-packet.js` validator output/assertions only.
- Validation Report: Pending at commit time; commands must include callback policy, persistence, storage contract, replay rollout, revenue closure, bundle, build/check, doc gates, deployment gate, and diff check.
- State Update: Runtime remains unchanged; this report is evidence-only until validation completes.

## Required Guard Evidence

- Callback storage owner: `payments-microservice`.
- Cliplot role: guarded callback ACK and non-authoritative renderer.
- Idempotency keys: `paymentId`, `orderId`, `event`, `paymentStatus`.
- Uniqueness/conflict: `externalOrderId`, `paymentId`, duplicate callbacks idempotent, incompatible terminal status requires manual review.
- Retention: metadata-only 90-day minimum policy approved before runtime storage.
- Rollback owner: `cliplot-operator`.
- Validation owner: `cliplot-validation-owner`.
- Runtime guards: `callbackPersistence=false`, `callbackReplayEnabled=false`, `replayExecutionNow=false`, `liveStatusWritesNow=false`, `mutation=false`, `persistence=false`, `providerCall=false`.

## Forbidden In This Lane

- No callback persistence or replay execution.
- No live order creation, live payment creation, Warehouse reservation, or notification send.
- No provider-backed `/payments/{paymentId}` read.
- No raw provider payload, payment row, customer PII, provider transaction ID, webhook key, or API key output.


## Synthetic Replay Dry-Run Assertions

The replay rollout packet exposes `syntheticReplayDryRunAssertions` for these non-mutating cases:

- `duplicate_same_semantic_callback`: duplicate callback handling remains idempotent and writes nothing.
- `incompatible_terminal_status_conflict`: incompatible terminal status conflicts require manual review and do not auto-update customer-visible status.
- `terminal_status_ordering_rule`: terminal ordering still depends on Payments snapshot evidence.
- `retention_and_deletion_metadata`: retention/deletion metadata is present without enabling storage.
- `rollback_and_validation_owner`: rollback and validation owners are present.
- `runtime_guard_closed`: replay execution, callback persistence, and live status writes remain disabled.


## Callback/Payment Status Reconciliation Readiness

The reconciliation readiness packet is read-only and intended for owner review:

```bash
npm run readiness:payment-status-reconciliation -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/payments/status-reconciliation-readiness-packet
```

Expected status:
`ready_for_callback_payment_status_reconciliation_review_execution_disabled`.

It must keep callback persistence, callback replay execution, live status
writes, payment creation, notification sends, provider-backed payment detail
reads, and Cliplot-local payment truth disabled. It must report
`mutation=false`, `persistence=false`, `providerCall=false`,
`liveExecutionAllowed=false`, and `failedAssertionCount=0`.



## Synthetic Callback-To-Status-Write Dry-Run Contract

The synthetic dry-run packet is GET-only and validates future mapping shapes
without replaying callbacks or writing payment status:

```bash
npm run readiness:payment-callback-to-status-write-dry-run-contract -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/payments/callback-to-status-write-dry-run-contract-packet
```

Expected status:
`ready_for_synthetic_callback_to_status_write_dry_run_execution_disabled`.

It proves a synthetic callback event can map to a Payments-owned callback event
projection and then to a future Payments-owned status-write command shape while
keeping `ENABLE_PAYMENT_CALLBACK_PERSISTENCE=false`,
`ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION=false`,
`ENABLE_PAYMENT_LIVE_STATUS_WRITE=false`, `mutation=false`,
`persistence=false`, `providerCall=false`, and `liveExecutionAllowed=false`.

## Payment Status Write-Window Request Packet

The write-window request packet is read-only and execution-disabled:

```bash
npm run readiness:payment-status-write-window-request -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/payments/status-write-window-request-packet
```

Expected status:
`ready_for_bounded_payment_status_write_window_request_execution_disabled`.

It must define operator request fields, rollback steps, validation steps, and
post-window reconciliation evidence while keeping callback persistence, callback
replay execution, live status writes, payment creation, notification sends,
provider-backed payment reads, and Cliplot-local payment truth disabled.


## 2026-07-03 Post-Live Status-Write Handoff

After the controlled full-checkout live window completed and all live flags were
restored to `false`, the payment status write-window request packet now carries
a sanitized completed-window handoff. This links the successful order/payment/
notification evidence to any future bounded status-write review without enabling
callback persistence, callback replay execution, live status writes, provider
reads, payment creation, notification sends, or local Cliplot status truth.

Expected packet evidence:

```text
status=ready_for_bounded_payment_status_write_window_request_execution_disabled
postLiveRevenueClosure=validated_completed_full_checkout_live_window_closed
completedLiveWindow=validated_completed_full_checkout_live_window_closed
completedOrderId=7938b1c4-1fb8-44e3-a4f3-e61e71052afb
completedPaymentStatus=processing
completedNotificationStatus=sent
liveExecutionAllowed=false
mutation=false
persistence=false
providerCall=false
failedAssertionCount=0
```

The handoff is still read-only metadata. It must be validated before any later
status-write window with:

```bash
npm run readiness:payment-status-write-window-request -- https://cliplot.alfares.cz
npm run readiness:payment-status-write-bounded-executor -- https://cliplot.alfares.cz
npm run readiness:revenue-handoff-reconciliation -- https://cliplot.alfares.cz
npm run readiness:bundle
```

## Payment Status Write Bounded Executor Guard

The disabled guard endpoint is `POST /api/payments/status-write-bounded-executor`
with `npm run readiness:payment-status-write-bounded-executor`. It returns
`approval_required` and verifies no payment status write, order status write,
callback persistence, callback replay execution, payment creation, notification
send, provider-backed read, mutation, persistence, provider call, or side effect
occurred. It embeds the read-only write-window request packet as evidence and
keeps runtime implementation blocked for a later approval lane.
