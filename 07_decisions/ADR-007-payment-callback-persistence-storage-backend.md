# ADR-007: Payment Callback Persistence Storage Backend

## Status

Proposed for owner approval. Runtime persistence and replay execution remain
guarded.

## Context

Cliplot currently accepts payment callbacks only as a guarded ACK. The callback
handler validates metadata and returns without persisting callback state,
replaying callbacks, updating orders, updating payments, calling a payment
provider, reserving Warehouse stock, or sending notifications.

ADR-002 approves Payments as the authoritative payment status owner for passive
DB snapshot reads. ADR-005 approves callback replay and persistence policy
metadata only; it does not approve callback storage writes or replay execution.

## Proposal

Use a Payments-owned callback event projection as the future storage backend for
callback persistence, if the owner later approves runtime writes. Cliplot remains
a non-authoritative renderer and guarded callback ACK surface.

The proposal is exposed by:

- `GET /api/payments/callback-storage-backend-proposal-packet`
- `npm run readiness:payment-callback-storage-proposal -- https://cliplot.alfares.cz`

## Required Owner Approval Before Use

- approved callback persistence storage backend approval;
- approved callback persistence rollout plan;
- approved retention/deletion policy for persisted callback events;
- approved rollback owner and validation owner for persisted callback/status
  writes;
- approved callback replay execution rollout before replay execution.

## Guardrails

Until separate owner approval exists, all of the following remain false:

- callback persistence;
- callback replay execution;
- Cliplot-local callback storage writes;
- Cliplot-local payment status writes;
- live order/payment status writes;
- provider-backed `/payments/{paymentId}` reads;
- payment provider calls;
- live payment creation.

The proposal packet must not include real order IDs, real payment IDs, callback
payloads, provider transaction IDs, customer PII, webhook key values, or payment
API key values.

## Validation

- `npm run readiness:payment-callback-storage-proposal -- https://cliplot.alfares.cz`
- `npm run readiness:payment-callback-persistence -- https://cliplot.alfares.cz`
- `npm run readiness:revenue-closure -- https://cliplot.alfares.cz`

All must preserve `mutation=false`, `persistence=false`, and
`providerCall=false`.
