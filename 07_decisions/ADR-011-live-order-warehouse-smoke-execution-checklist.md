# ADR-011: Live Order/Warehouse Smoke Execution Checklist

## Status

Proposed metadata packet, execution disabled.

## Context

The live Orders/Warehouse smoke plan has owner metadata, cleanup metadata,
window metadata, rollback owner, validation owner, and required service-token
projection. Execution is still intentionally blocked while
`ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false` and until an operator sends the
dedicated `CREATE_REPLAY_CANCEL` confirmation body.

## Decision

Expose `GET /api/checkout/live-order-warehouse-smoke-execution-checklist-packet`,
`GET /api/checkout/live-order-warehouse-create-replay-cancel-contract-packet`,
`npm run readiness:live-smoke-execution-checklist`, and
`npm run readiness:live-smoke-contract` as read-only packet surfaces for the
bounded execution checklist and CREATE_REPLAY_CANCEL contract.

The packet records:

- metadata approvals and service-token presence by boolean only;
- required runtime flag and request body;
- expected create, replay, cancel, readback, and cleanup evidence;
- rollback and stop conditions;
- payment, notification, callback persistence, status write, and provider-read
  boundaries.

The packet must keep `mutation=false`, `persistence=false`,
`providerCall=false`, `liveExecutionAllowed=false`, and
`ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false` in current production.

## Guardrails

This packet does not execute the smoke, enable flags, create orders, reserve
Warehouse stock, replay order create, cancel orders, create payments, send
notifications, persist callbacks, write payment status, call providers, or print
secret values.

## Required Before Runtime Use

- `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true` only inside the owner-approved window;
- executor request body `confirm=CREATE_REPLAY_CANCEL`;
- executor request `approvalId` matching
  `CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID`;
- executor request `approvedBy` and `reasonCode`;
- post-run evidence that cleanup went through Orders and Warehouse reservation
  state returned to the before snapshot.
