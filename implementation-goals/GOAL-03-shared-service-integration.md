# GOAL-03: Shared Service Integration

## Objective

Wire Cliplot to shared Alfares commerce services without duplicating product,
stock, order, payment, notification, auth, logging, or AI truth.

## Status

Done.

## Implementation Boundary

This goal may add shared-service clients, service identity configuration,
Vault/ExternalSecret scaffolding, and a guarded checkout submit endpoint. It
must not create paid orders, start payments, reserve/decrement warehouse stock,
or send customer notifications unless all service tokens and owner-approved
contracts are present and the live feature flag is explicitly enabled.

## Planned Lanes

- Catalog product read model.
- Warehouse stock display/readiness without reservation.
- Guarded order submit boundary.
- Payments readiness contract only; no payment initiation.
- Notifications readiness contract only; no outbound customer notification.
- Auth hosted account link discovery.
- Logging and operational alerts.

## Parallel Execution

| Lane | Status | Owner | Scope | Validation |
| --- | --- | --- | --- | --- |
| GOAL-03 docs/IPS chain | done | Orchestrator | `implementation-goals/**`, `docs/**`, `GOALS.md` | Doc audit and explicit blockers. |
| Server integration layer | done | Orchestrator | `src/server.js`, `src/integrations.js` | Node syntax, guarded checkout smoke. |
| Frontend guarded checkout | done | Orchestrator | `public/**` | Static asset check and manual curl smoke. |
| Kubernetes/Vault projection | done | Orchestrator | `k8s/**`, `scripts/deploy.sh` | Deployment readiness gate and kubectl dry-run. |
| Live payment/order enablement | blocked | Future payment agent | Payment/Orders contracts and secrets | Provider-backed evidence in GOAL-05. |

## Blockers

- `[MISSING: Cliplot product/catalog scope and approved SKU list]`
- `[MISSING: service tokens and Vault projection]`
- `[UNKNOWN: Catalog marketplace key cliplot vs flipflop]`
- `[MISSING: Cliplot Orders channel and channelAccountId owner approval]`
- `[MISSING: Cliplot payment applicationId/provider evidence]`
- `[MISSING: Notification sender/template rules for Cliplot order confirmations]`
