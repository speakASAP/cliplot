# ADR-010: Payment Callback Storage Contract

## Status

Proposed metadata packet, runtime disabled.

## Context

ADR-007 proposes a Payments-owned callback event projection as the future
storage backend for payment callback persistence. Before any runtime storage
write is approved, Cliplot needs an owner-reviewable contract for identity,
idempotency, uniqueness, retention, rollback, and validation requirements.

## Decision

Expose `GET /api/payments/callback-persistence-storage-contract-packet`,
`GET /api/payments/callback-persistence-storage-approval-checklist-packet`,
`npm run readiness:payment-callback-storage-contract`, and
`npm run readiness:payment-callback-storage-approval-checklist` as read-only
contract/checklist packet surfaces.

The packet records:

- Payments as the storage and write authority.
- Cliplot as a guarded callback ACK surface and non-authoritative renderer.
- Required identity, idempotency, uniqueness, duplicate, conflict, ordering,
  retention, deletion, rollback, and validation metadata.
- Required approval IDs and runtime flags for a future bounded write window.

The packet must keep `mutation=false`, `persistence=false`,
`providerCall=false`, `callbackPersistence=false`,
`callbackReplayEnabled=false`, and `liveStatusWritesNow=false`.

## Guardrails

The packet does not approve or perform:

- callback persistence;
- callback replay execution;
- Cliplot-local callback storage writes;
- Cliplot-local payment status writes;
- live order/payment status writes;
- provider-backed `/payments/{paymentId}` reads;
- payment creation;
- notification sends.

The packet must not expose webhook keys, API keys, bearer tokens, real order IDs,
real payment IDs, callback payload bodies, raw provider payloads, provider
transaction IDs, customer names, customer emails, payment rows, or customer PII.

## Required Before Runtime Use

- `CLIPLOT_CALLBACK_PERSISTENCE_STORAGE_APPROVAL_ID`;
- `CLIPLOT_CALLBACK_PERSISTENCE_ROLLOUT_APPROVAL_ID`;
- `CLIPLOT_CALLBACK_REPLAY_EXECUTION_APPROVAL_ID`;
- `CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID` before status writes;
- approved callback event retention/deletion policy;
- approved callback storage uniqueness and conflict contract;
- rollback owner and validation owner evidence.
