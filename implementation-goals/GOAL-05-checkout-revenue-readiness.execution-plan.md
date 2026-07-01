# GOAL-05 Checkout Revenue Readiness Execution Plan

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding
Prompt -> Code -> Validation.

## Current Lane

Guarded checkout revenue validation: authenticated Catalog product reads,
Warehouse-derived `warehouseId` propagation into order validation payloads,
no-mutation order-create validation, no-mutation payment-create validation, and
no-send notification payload validation.

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
| Payment API key/scope lane | done | payments/platform lane | Payments Vault/K8s identity maps | invalid-body smoke returned 400 VALIDATION_ERROR |
| Order validation lane | done | main orchestrator | Orders validate endpoint and Cliplot checkout order validation | checkout returned `orderValidation.status=validated_no_mutation` with Warehouse `warehouseId` in `orderPreview.items[0]` |
| Payment validation lane | done | main orchestrator | Cliplot checkout/payment code and payments validate endpoint | checkout returned `paymentValidation.status=validated_no_mutation` |
| Notification validation lane | done | main orchestrator | Cliplot checkout notification code and notifications validate endpoint | checkout returned `notificationValidation.status=validated_no_send` |
| Live revenue mutation | dependency-gated | main orchestrator | Cliplot checkout/order/payment/notification mutation paths | approved live order-create/Warehouse, payment-create, and notification-send evidence |
| Final integration | dependency-gated | main orchestrator | Cliplot checkout/payment code | guarded order/payment/notification smoke |

## Blockers

- `[MISSING: approved Cliplot product SKU list/filtering rule]`
- `[MISSING: approved live order-create execution and Warehouse reservation evidence for Cliplot]`
- `[MISSING: approved live payment-create execution evidence for Cliplot]`
- `[MISSING: approved live notification send validation for Cliplot order confirmations]`
