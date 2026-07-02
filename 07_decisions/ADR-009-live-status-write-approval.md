# ADR-009: Live Status Write Approval Boundary

Status: Proposed metadata packet, runtime disabled
Date: 2026-07-03

## Context

Cliplot now has owner-approved read-only customer status rendering from the
Payments DB-only snapshot route. Callback persistence, callback replay
execution, and live order/payment status writes remain blocked. A separate
owner-facing packet is needed so the live status write approval boundary can be
reviewed without enabling a write path.

## Decision

Expose `GET /api/payments/live-status-write-approval-packet` and
`npm run readiness:payment-live-status-write` / `npm run readiness:payment-live-status-write-approval` as a read-only approval packet.
The packet may aggregate passive snapshot read approval, ADR-006 mapping
ownership, callback persistence approval state, callback replay rollout state,
and rollback/validation requirements.

The packet must keep `mutation=false`, `persistence=false`,
`providerCall=false`, `callbackPersistence=false`,
`callbackReplayEnabled=false`, `liveStatusWritesEnabled=false`, and
`liveStatusWritesNow=false`.

## Guardrails

- No Cliplot-local payment status writes.
- No live order/payment status writes.
- No callback persistence.
- No callback replay execution.
- No provider-backed `/payments/{paymentId}` reads.
- No payment creation, order creation, Warehouse reservation, or notification
  sends.
- No webhook key values, API key values, raw provider payloads, payment rows,
  provider transaction IDs, or customer PII in packet output.

## Required Before Runtime Use

- Owner approval before enabling live status writes.
- Approved callback persistence storage backend.
- Approved callback persistence rollout plan.
- Callback replay execution rollout approval.
- Bounded live status write window.
- Validation owner checklist for live status writes.
- Rollback owner procedure for live status writes.
