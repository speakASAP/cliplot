# GOAL-05 Checkout Revenue Readiness Execution Plan

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding
Prompt -> Code -> Validation.

## Current Lane

Authenticated Catalog product reads.

## Allowed Changes

- `src/integrations.js`
- `k8s/external-secret.yaml`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/VAULT_AND_SECRETS.md`
- `docs/orchestrator/VALIDATION_DEBT.md`
- `GOALS.md`
- `implementation-goals/README.md`
- `implementation-goals/GOAL-05-checkout-revenue-readiness*.md`

## Forbidden Changes

- Vault value printing or committed secrets.
- Live payment initiation.
- Live order creation.
- Warehouse stock mutation.
- Notification sending.
- Product schema changes in Catalog.
- Payment or Orders contract changes in this lane.

## Steps

1. Add `CATALOG_INTERNAL_SERVICE_TOKEN` to Cliplot ExternalSecret, sourced from
   Auth-owned Vault path `secret/prod/auth-microservice`.
2. Send Catalog machine-auth headers from Cliplot product reads when the token
   is present.
3. Remove unsupported `marketplace=cliplot` product query parameter.
4. Query active Catalog products with `limit=8`, `isActive=true`, and
   `lifecycle=active`.
5. Normalize Catalog response fields for title, categories, pricing, media, and
   rich descriptions.
6. Keep fallback products only for degraded Catalog failures.
7. Update GOAL-05 state and validation debt.
8. Run local repository gates on the remote repo.
9. Deploy through `./scripts/deploy.sh`.
10. Smoke public products and readiness endpoints.

## Parallel Execution Section

| Workstream | Status | Owner | Files | Validation |
| --- | --- | --- | --- | --- |
| Catalog product read lane | ready now | main orchestrator | Cliplot integration and ExternalSecret files | build, docs gates, deploy, public product smoke |
| Payment API key/scope lane | running/read-only | subagent | no edits | exact payment blocker and next task |
| Warehouse/notification lane | dependency-gated | future worker | no edits until Catalog lane lands | service-token and template evidence |
| Final integration | dependency-gated | main orchestrator | Cliplot checkout/payment code | guarded order/payment smoke |

## Blockers

- `[MISSING: approved Cliplot product SKU list/filtering rule]`
- `[MISSING: production payment provider credentials/webhook evidence for Cliplot]`
- `[MISSING: Warehouse service token accepted by warehouse-microservice and default warehouseId]`
- `[MISSING: Notification sender/template rules for Cliplot order confirmations]`

