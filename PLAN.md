# Implementation Plan

## Phase 0: Foundation And Guardrails

Objective: create a remote repository that can safely coordinate future
implementation.

Steps:

1. Create `/home/ssf/Documents/Github/cliplot-service`.
2. Run `git init`.
3. Add repository instructions and required reading.
4. Add design contract from the approved mockup.
5. Add system, product, and business specs.
6. Add IPS-style implementation goals.
7. Add gate scripts.
8. Add guarded deployment script.
9. Validate documentation baseline.
10. Commit the foundation.

## Phase 1: Storefront Foundation

Objective: build a first Cliplot storefront slice without live mutations.

Scope:

- homepage;
- catalog/category shell;
- product card;
- product detail shell;
- cart shell;
- checkout shell;
- responsive Czech copy;
- no live payment or order mutation.

Validation:

- build;
- lint/typecheck when available;
- static accessibility checklist;
- design-contract checklist;
- no secret leakage.

## Phase 2: Shared Service Integration

Objective: wire Cliplot to shared ecosystem services without creating parallel
business truth.

Lanes:

- Catalog lane: product list/detail and canonical content.
- Warehouse lane: stock display and stock-gated add-to-cart.
- Cart/Orders lane: cart persistence and order creation.
- Payments lane: payment initiation through `payments-microservice`.
- Notifications lane: confirmation email through `notifications-microservice`.
- Auth lane: optional account, guest checkout preserved.
- Logging lane: structured errors and operational events.

## Phase 3: Kubernetes, Vault, RAG

Objective: make Cliplot deployable in `statex-apps`.

Required artifacts:

- Dockerfile;
- Kubernetes deployment/service/ingress/configmap/external-secret;
- Vault path `secret/prod/cliplot-service`;
- RAG documentation publication/update;
- health endpoint;
- deploy script validation.

## Phase 4: Checkout Revenue Readiness

Objective: prove checkout can reach provider-backed payment flows safely.

Blocked until:

- `[MISSING: Cliplot payment provider identity and callback keys]`
- `[MISSING: approved SKU list and product pricing source]`
- `[MISSING: Warehouse service token and default warehouse id]`
- `[MISSING: owner approval for any live mutating smoke]`

## Parallel Execution Section

| Lane | Status | Owner role | Write ownership | Validation owner | Merge order |
| --- | --- | --- | --- | --- | --- |
| Foundation docs/gates | ready now | Orchestrator | `AGENTS.md`, root docs, `docs/**`, `implementation-goals/**`, `scripts/**` | Orchestrator | 1 |
| Design/storefront UI | dependency-gated on GOAL-01 | Frontend worker | future `app/**`, `components/**`, styles | Orchestrator | 2 |
| Shared service contracts | ready as read-only, code gated | Integration explorer/worker | future service clients only after plan approval | Orchestrator | 3 |
| Kubernetes/Vault/RAG | dependency-gated | Platform worker | `k8s/**`, `scripts/deploy.sh`, RAG docs | Orchestrator | 4 |
| Checkout/payment evidence | blocked | Payment integration owner | payment/order adapters only | Orchestrator + owner | 5 |

Shared files such as `docs/IMPLEMENTATION_STATE.md`,
`implementation-goals/README.md`, and validation reports are integration-owner
files. Workers must not edit them unless explicitly assigned.

## Current Blockers

- `[MISSING: Cliplot product/catalog scope and approved SKU list]`
- `[MISSING: Cliplot brand/legal/payment identity approval]`
- `[MISSING: production payment provider credentials/webhook evidence for Cliplot]`
- `[MISSING: Warehouse service token accepted by warehouse-microservice and default warehouseId]`
- `[UNKNOWN: whether Catalog needs new marketplace key cliplot or reuse flipflop connector]`
- `[UNKNOWN: exact app stack and image name until GOAL-02 execution plan]`
