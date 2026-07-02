# ADR-008: Payment Callback Replay Execution Rollout

## Status

Proposed for owner approval. Runtime replay execution remains guarded.

## Context

ADR-005 approves callback replay policy metadata only. ADR-007 proposes a future
Payments-owned callback event projection as the storage backend. Neither ADR
approves replay execution, callback persistence, live status writes, provider
calls, or notification sends.

Cliplot therefore needs a separate approval packet for the replay execution
rollout before any replay window can be opened.

## Proposal

Expose a read-only callback replay execution rollout packet:

- `GET /api/payments/callback-replay-execution-rollout-proposal-packet`
- `npm run readiness:payment-callback-replay-rollout -- https://cliplot.alfares.cz`

The packet records a bounded execution-window proposal, synthetic dry-run plan,
rollback plan, approval placeholders, and guard evidence.

## Required Approval Before Runtime Use

- approved callback persistence storage backend approval;
- approved callback persistence rollout plan;
- approved callback replay execution rollout approval;
- bounded replay execution window;
- operator rollback owner;
- validation owner checklist.

## Guardrails

Until separate owner approval exists, all of the following remain false:

- callback persistence;
- callback replay execution;
- Cliplot-local callback storage writes;
- Cliplot-local payment status writes;
- live order/payment status writes;
- provider-backed `/payments/{paymentId}` reads;
- payment provider calls;
- notification sends;
- live payment creation.

The rollout packet must not include real order IDs, real payment IDs, callback
payloads, provider transaction IDs, customer PII, webhook key values, or payment
API key values.

## Validation

- `npm run readiness:payment-callback-replay-rollout -- https://cliplot.alfares.cz`
- `npm run readiness:payment-callback-storage-proposal -- https://cliplot.alfares.cz`
- `npm run readiness:payment-callback-persistence -- https://cliplot.alfares.cz`
- `npm run readiness:revenue-closure -- https://cliplot.alfares.cz`

All must preserve `mutation=false`, `persistence=false`, and
`providerCall=false`.
