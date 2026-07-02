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
| Guarded checkout intent and smoke lane | done | main orchestrator | Cliplot checkout frontend/backend and smoke script | public smoke preserves `externalOrderId` and proves no-mutation/no-send statuses |
| Checkout review totals lane | done | main orchestrator | Cliplot checkout frontend/backend and smoke script | public smoke proves subtotal, shipping cost, payment fee, total, and no-mutation preview compatibility |
| Guarded checkout status surface lane | done | main orchestrator | Cliplot status frontend, payment status endpoint, callback ACK evidence, smoke script | public smoke proves status shell, unauthorized callback, guarded payment status, and no live objects |
| Product detail route lane | done | main orchestrator plus read-only sidecars | Cliplot product frontend and smoke script | public smoke proves `/produkt/:id` static shell and guarded checkout contract remains no-mutation/no-send |
| Cart review readiness lane | done | main orchestrator plus read-only sidecar | Cliplot cart frontend and smoke script | public smoke proves cart feedback/edit contract and guarded checkout remains no-mutation/no-send |
| Live checkout preflight guard lane | done | main orchestrator plus read-only sidecar | Cliplot readiness and guarded checkout response | public smoke proves preflight is blocked and `wouldMutate=false` until all flags and approval IDs exist |
| Live checkout preflight endpoint lane | done | main orchestrator plus read-only sidecars | Cliplot read-only checkout preflight endpoint and smoke script | public smoke proves endpoint JSON is blocked, `wouldMutate=false`, and all mutation-plan booleans are false |
| Live notification send path lane | done/guarded | main orchestrator | Cliplot notification send wiring | activation matrix proves send path only appears in fully approved simulated config |
| Live revenue mutation | dependency-gated | main orchestrator | Cliplot checkout/order/payment/notification mutation paths | approved live order-create/Warehouse, payment-create, and notification-send evidence |
| Final integration | dependency-gated | main orchestrator | Cliplot checkout/payment code | guarded order/payment/notification smoke |

## Blockers

- `[MISSING: approved Cliplot product SKU list/filtering rule]`
- `[MISSING: approved live order-create execution and Warehouse reservation evidence for Cliplot]`
- `[MISSING: approved live payment-create execution evidence for Cliplot]`
- `[MISSING: approved live notification send validation for Cliplot order confirmations]`
## Live Mutation Approval Gate Lane

Status: deployed and validated in guarded mode.

Live order/payment/notification env flags are intentionally insufficient on
their own. Runtime must also expose the corresponding approval IDs before any
live mutation path is allowed:

```text
CLIPLOT_LIVE_ORDER_APPROVAL_ID
CLIPLOT_LIVE_PAYMENT_APPROVAL_ID
CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID
```

Default values are empty. Guarded checkout must keep returning
`service_identity_required` with approval blockers until approved live mutation
evidence exists.


## Guarded Checkout Intent Lane

Status: deployed and validated in guarded mode.

The storefront now creates a stable cart-scoped checkout intent and passes it
as `externalOrderId` to `/api/checkout/submit`. Cliplot normalizes that ID,
derives order/payment/notification idempotency keys from it, returns the
non-secret checkout intent evidence in guarded responses, and validates the
public path with `scripts/guarded-checkout-smoke.js`.

This lane does not enable live order, payment, warehouse, or notification
mutation. It reduces duplicate-submit risk before the approval-gated live
checkout lane.


## Checkout Review Totals Lane

Status: deployed and validated in guarded mode.

Checkout now presents a buyer-safe review before submission with item lines,
delivery/payment choices, subtotal, delivery cost, payment fee, and final total
in Kč. Backend checkout ignores client-provided totals as authority and
recalculates the same breakdown before building Orders and Payments previews.

This lane does not enable live order, payment, warehouse, or notification
mutation. It reduces hidden-fee and duplicate-total risk before the
approval-gated live checkout lane.


## Guarded Checkout Status Surface Lane

Status: deployed and validated in guarded mode.

Successful guarded checkout stores a local customer-safe summary and navigates
to `/objednavka/stav`. The page shows reference, status `Čeká na kontrolu`,
items, shipping/payment labels, and total without claiming payment success,
order confirmation, stock reservation, invoice, tracking, or provider status.

Payments status is exposed only as `guarded_no_persistence`: it does not call
the provider, does not persist callback state, and does not create or update an
order/payment record.


## Product Detail Route Lane

Status: deployed and validated in guarded mode.

Product cards now link to `/produkt/:id`. The detail route is client-rendered
from existing `/api/products` data and does not introduce a local product
database or product API mutation path. Catalog descriptions are rendered as
escaped plain text, not raw HTML. The add-to-cart button still reuses the
existing Warehouse-origin guard through `warehouseId`.

This lane improves buyer confidence before checkout while preserving the
GOAL-05 live-mutation boundary.


## Cart Review Readiness Lane

Status: deployed and validated in guarded mode.

Cart add-to-cart now opens the drawer with a Czech aria-live confirmation.
Cart rows show unit price, quantity, line total, product-specific quantity
button labels, and an explicit `Odebrat` action. This improves the customer's
path from product detail to checkout while preserving the guarded checkout
boundary.

This lane does not enable live order creation, payment creation, Warehouse
reservation, callback persistence, or notification send.


## Live Checkout Preflight Guard Lane

Status: deployed and validated in guarded mode.

Readiness and guarded checkout responses now expose `liveCheckoutPreflight`.
The contract reports current live flags, approval booleans, validation lane
statuses, remaining blockers, and whether a checkout would mutate state. In
the current guarded configuration it is explicitly `blocked` and
`wouldMutate=false`.

This lane does not enable live order creation, payment creation, Warehouse
reservation, callback persistence, or notification send.


## Live Checkout Preflight Endpoint Lane

Status: deployed and validated in guarded mode.

`GET /api/checkout/live-preflight` exposes a read-only operational go/no-go
contract for live checkout activation. It returns the current preflight status,
live flags, approval booleans, validation lane status, remaining blockers,
`wouldMutate`, and an explicit mutation plan. In the current guarded
configuration it remains `blocked`, `wouldMutate=false`, with `wouldCreateOrder=false`,
`wouldReserveWarehouse=false`, `wouldCreatePayment=false`, and
`wouldSendNotification=false`.

This lane does not enable live order creation, payment creation, Warehouse
reservation, callback persistence, or notification send.
