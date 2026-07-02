# ADR-005: Payment Callback Replay Policy

## Status

Proposed for owner approval. Runtime remains guarded.

## Context

Cliplot receives payment callbacks at `POST /api/payments/callback`. The
current handler validates the webhook key and payload shape, then returns a
guarded ACK with `mutation=false`, `persistence=false`, and
`providerCall=false`. It does not persist callback state, replay callbacks,
update orders, update payments, reserve Warehouse stock, or send
notifications.

ADR-002 records Payments as the authoritative payment status owner. For the
read-only customer status runtime, missed or delayed callbacks must be
reconciled through the Payments DB snapshot read model, not through Cliplot
callback storage.

## Decision

For read-only customer status activation, Cliplot keeps callback persistence
and replay disabled. Payments remains the callback/status owner, and Cliplot
may only render customer-safe status after owner approval for the DB-only
`/payments/status/by-order-id` read path.

A future Cliplot callback persistence or replay implementation requires a
separate owner approval covering:

- callback event ownership;
- idempotency keys;
- duplicate handling;
- conflict handling for incompatible terminal statuses;
- terminal status ordering;
- retention window;
- operator replay procedure;
- rollback owner and validation owner.

## Guardrails

Before that separate approval, all of the following remain false:

- callback persistence;
- callback replay execution;
- Cliplot-local callback storage writes;
- Cliplot-local payment status writes;
- order status updates from callbacks;
- payment status updates from callbacks;
- provider-backed `/payments/{paymentId}` reads;
- live payment creation.

## Required Evidence

- `npm run readiness:payment-callback -- https://cliplot.alfares.cz` returns
  `validated_guarded_ack_no_persistence`.
- `npm run readiness:payment-callback-policy -- https://cliplot.alfares.cz`
  returns `approval_required_callback_replay_policy` with
  `callbackPersistence=false`, `callbackReplayEnabled=false`,
  `mutation=false`, `persistence=false`, and `providerCall=false`.
- `npm run readiness:customer-status-runtime-read -- https://cliplot.alfares.cz`
  keeps runtime status reads disabled until owner approval and flags exist
  together.

## Not Approved

This ADR does not approve callback persistence, callback replay execution,
Cliplot-local payment status storage, order/payment mutation, provider calls,
live payment creation, Warehouse reservation, notification sends, or
customer-facing payment success claims.
