# Implementation State

## Current Status

**Date:** 2026-07-02
**Mode:** Goal-driven orchestration enabled  
**Active goal:** GOAL-06-operational-closure
**Goal status:** GOAL-06 active for safe operational readiness increments; final closure dependency-gated
**Current checkpoint:** GOAL-06 read-only Kubernetes readiness monitor is deployed while GOAL-05 live revenue mutation remains blocked by approval evidence. GOAL-05 guarded checkout revenue path is deployed;
Warehouse-derived `warehouseId` is carried from product availability into
checkout order validation payloads, and no-mutation order-create/payment-create
validation plus no-send notification validation pass while live order creation,
live payment creation, Warehouse reservation, and live notification sends remain
approval-gated.

## Current Intent Summary

Create a Czech-first Cliplot storefront at `https://cliplot.alfares.cz/` with a
human-designed, conversion-first UX and shared Alfares commerce integrations.

## Completed In This Setup

- Design direction created and preserved as `docs/DESIGN_CONTRACT.md`.
- Remote repository path selected: `/home/ssf/Documents/Github/cliplot`.
- Goal-driven structure defined.
- Guardrails modeled after RunLayer and FlipFlop patterns.
- Initial gate scripts and guarded deploy script planned.
- Gate scripts created.
- Design mockup stored at `docs/design/cliplot-homepage-mockup.png`.
- IPS anchor docs created under `00_constitution` through `24_onboarding`.
- Initial foundation commit created: `0f360ce docs: initialize cliplot service foundation`.
- GOAL-02 frontend source committed: `aad9cc8 feat: implement cliplot frontend storefront`.
- Cliplot frontend deployed to Kubernetes as `cliplot`.
- Public `https://cliplot.alfares.cz/` smoke returned HTTP 200.
- Public `https://cliplot.alfares.cz/health` smoke returned HTTP 200.
- Public `https://cliplot.alfares.cz/api/products` returned live product data.
- Non-mutating checkout preview returned `frontend_preview_only`.
- GOAL-03 integration source committed: `0556cec feat: add guarded shared service integration`.
- Cliplot guarded shared-service integration deployed to Kubernetes.
- Public `https://cliplot.alfares.cz/api/integrations/readiness` returned shared-service status.
- Public `https://cliplot.alfares.cz/api/auth/links` returned hosted Auth URLs with contract-unverified status.
- Public `https://cliplot.alfares.cz/api/checkout/submit` returned `service_identity_required` without live order/payment mutation.
- GOAL-04 platform source committed: `a969cb5 feat: harden cliplot platform operations`.
- GOAL-04 deploy evidence committed: `60852dd docs: record cliplot platform deploy evidence`.
- Design reference lock committed: `dafaaf6 docs: lock homepage mockup reference`.
- Vault path `secret/prod/cliplot` exists with required key names and no values printed.
- `cliplot-secret` and `orders-microservice-secret` are synced from Vault.
- Orders Cliplot support deployed as `localhost:5000/orders-microservice:971a446`.
- Payments Cliplot allowlist deployed as `localhost:5000/payments-microservice:eab6ae7`.
- Public Cliplot readiness shows service tokens present, live submit still disabled, and checkout still guarded.
- GOAL-05 Catalog lane started: Cliplot uses the existing Catalog
  machine-auth header contract with Auth-owned
  `CATALOG_INTERNAL_SERVICE_TOKEN` and will stop relying on fallback products
  when Catalog responds.
- GOAL-05 guarded payment-create path deployed as `2eb170e`: checkout submit
  now builds order, payment, and notification previews while
  `ENABLE_LIVE_ORDER_SUBMIT=false`, `ENABLE_LIVE_PAYMENT_CREATE=false`, and
  `ENABLE_LIVE_NOTIFICATIONS=false`.
- GOAL-05 payment callback lane is implemented as a guarded authenticated ACK
  endpoint at `/api/payments/callback`; it validates the Payments callback
  API key and payload shape, but does not persist payment/order state until live
  checkout storage is approved.
- GOAL-05 no-mutation payment create validation is enabled through
  payments-microservice `POST /payments/validate-create`; guarded checkout can
  validate the full Cliplot payment payload and still returns
  `service_identity_required` until live order/payment mutation is approved.
  Deployed Cliplot image `localhost:5000/cliplot:52596f5` returned
  `paymentValidation.status=validated_no_mutation`, `mutation=false`, and
  `providerCall=false`.
- GOAL-05 no-send notification validation is enabled through
  notifications-microservice `POST /notifications/validate`; guarded checkout
  validates the Cliplot order confirmation payload and still returns
  `service_identity_required` until live customer notification send is
  approved. Deployed Cliplot image
  `localhost:5000/cliplot:fef5fd8` returned
  `notificationValidation.status=validated_no_send`, `mutation=false`,
  `providerCall=false`, and `notificationSent=false`.
- GOAL-05 no-mutation order create validation is enabled through
  orders-microservice `POST /api/orders/validate-create`; guarded checkout
  validates the full Cliplot `orders.create.v1` payload and still returns
  `service_identity_required` until live order creation and Warehouse
  reservation are approved. Deployed Cliplot image
  `localhost:5000/cliplot:80e23c5` returned
  `orderValidation.status=validated_no_mutation`, `mutation=false`,
  `orderCreated=false`, `warehouseMutation=false`, and
  `eventPublished=false`.
- GOAL-05 Warehouse routing propagation deployed as
  `localhost:5000/cliplot:da5d9cf`. In-cluster product smoke returned
  `warehouseId=c0de0000-0000-4000-8000-000000000013`,
  `warehouseType=own`, `availableStock=63`, and `stockQuantity=63`. Guarded
  checkout returned HTTP `202`, carried the same `warehouseId` into
  `orderPreview.items[0]`, and kept `orderValidation.status=validated_no_mutation`,
  `orderCreated=false`, `warehouseMutation=false`, and `eventPublished=false`.

- GOAL-05 guarded checkout intent lane deployed as
  `localhost:5000/cliplot:07a3bfe`. Frontend checkout now sends a
  stable cart-scoped `externalOrderId`; backend normalizes that ID, derives
  order/payment/notification idempotency keys from it, and returns non-secret
  checkout intent evidence in guarded responses. Buyer-facing checkout copy no
  longer exposes Vault/Orders/provider blocker language. Public
  `npm run smoke:checkout -- https://cliplot.alfares.cz` returned HTTP `202`,
  preserved `externalOrderId=cliplot-smoke-1782964759958`, kept
  `status=service_identity_required`, and verified
  `orderValidation=validated_no_mutation`,
  `paymentValidation=validated_no_mutation`,
  `notificationValidation=validated_no_send`,
  `warehouseReservationReadiness=validated_no_mutation`, and `mutation=false`.

- GOAL-05 checkout review totals lane deployed as
  `localhost:5000/cliplot:7128c33`. Checkout now shows a buyer-facing
  review block before submit with item lines, `Mezisoučet`, delivery cost,
  payment fee, and final `Celkem k úhradě`; public copy no longer exposes
  internal `[MISSING: ...]` blockers. Server-side checkout recalculates
  subtotal, shipping, payment fee, and total before building Orders and
  Payments previews. Public guarded smoke returned HTTP `202` with
  `subtotal=1590`, `shippingCost=69`, `paymentFee=0`, `total=1659`,
  `orderValidation=validated_no_mutation`,
  `paymentValidation=validated_no_mutation`,
  `notificationValidation=validated_no_send`, and
  `warehouseReservationReadiness=validated_no_mutation`.

- GOAL-06 Kubernetes readiness monitor deployed as
  `cliplot-readiness-monitor` on schedule `*/30 * * * *` with deployed
  image `localhost:5000/cliplot:013b506`. Production
  `npm run readiness:k8s -- https://cliplot.alfares.cz` returned
  `ok=true`, `livePreflightStatus=blocked`, `wouldMutate=false`,
  `liveOrderSubmit=false`, `livePaymentCreate=false`,
  `liveNotifications=false`, and
  `paymentStatus=payment_status_guarded_no_persistence`. In-pod internal
  probe against `http://cliplot:8080` returned the same guarded
  state.

- GOAL-05 guarded checkout status surface deployed as
  `localhost:5000/cliplot:cb00ffd`. Successful guarded checkout now
  stores a customer-safe local status summary and navigates to
  `/objednavka/stav`; `/checkout/success` and `/checkout/cancelled` render the
  same safe shell without claiming payment success. Payments status now exposes
  `GET /api/payments/status` as a guarded no-persistence contract returning
  `payment_status_guarded_no_persistence`, `mutation=false`,
  `persistence=false`, and `providerCall=false`. Public smoke returned
  `statusPage=200`, `callbackUnauthorizedStatus=401`,
  `paymentStatusContract=payment_status_guarded_no_persistence`, and preserved
  no-mutation/no-send checkout validations.


## Active Goal: GOAL-06-operational-closure

### Objective

Add operator-safe readiness automation and handoff evidence while keeping live
order creation, payment creation, Warehouse reservation, callback persistence,
notification sends, and Docs/RAG ingestion gated.

### Current Findings

- GOAL-06 readiness bundle now passes after Docs/RAG embedding connectivity was restored via Docker Ollama host port `11435`, `scripts/publish_docs_rag.sh` was hardened to select the newest Running Ready non-deleting Docs/RAG pod, and Docs/RAG chunking was capped by character length in `docs-rag-microservice:febd791`.
- Controlled Docs/RAG ingestion for repoName `cliplot` passed with job `7a03ada9-9b99-4ef7-8223-5c5a298244f5`, `chunksProcessed=76`, `chunksTotal=76`. Retrieval search returned HTTP 200 with 5 results, and agent-context returned HTTP 200 with 6 sources; both top results were `cliplot/implementation-goals/GOAL-06-operational-closure.execution-plan.md`.
- The full `npm run readiness:bundle` is the operator aggregate check and now passes with Docs/RAG preflight, guarded checkout smoke, Vault presence, and Kubernetes rollout evidence.
- The live activation gate now blocks partial future live configurations. `npm run readiness:activation -- https://cliplot.alfares.cz` proves order-only and order-plus-payment scenarios remain `blocked` with `wouldMutate=false`; a fully approved simulated configuration becomes `ready_for_approved_live_mutation` with order, payment, and notification mutation plan booleans true.
- The Kubernetes readiness monitor lane is endpoint-only and read-only. It
  checks `/health`, `/api/checkout/live-preflight`,
  `/api/integrations/readiness`, and `/api/payments/status` without POST or
  Kubernetes API permissions.
- Final live revenue closure remains blocked until approval IDs and runtime
  evidence exist.

## Dependency-Gated Goal: GOAL-05-checkout-revenue-readiness

### Objective

Create provider-backed checkout evidence without fake payment success. This
goal may enable live order/payment only after Catalog, Orders, Payments,
Warehouse, Notifications, Auth, and Vault contracts are verified with runtime
smoke evidence.

### Current Findings

- Orders accepts `cliplot` and channel `cliplot`, and the Orders pod has
  `CLIPLOT_ORDERS_SERVICE_TOKEN`.
- Payments allowlists include `cliplot` and `https://cliplot.alfares.cz`.
- Cliplot has required secret keys projected, but `ENABLE_LIVE_ORDER_SUBMIT`
  remains `false`.
- Catalog product APIs are Auth-guarded, and Cliplot uses the existing
  `x-internal-service-token` plus `x-service-name` machine-auth contract backed
  by Auth-owned `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`.
  Public `/api/products` now reports `catalogSource=catalog` and smoke requires
  Catalog-sourced products with Warehouse `warehouseId` evidence.
- Docs/RAG publication tooling now uses repoName `cliplot`. Controlled ingestion passed after Docs/RAG chunking was capped by character length; retrieval and agent-context both return Cliplot sources without printing secrets.
- Warehouse stocked product selection, notification preview, and guarded
  payment-create payload generation have runtime smoke evidence.
- Payment callback URL implementation has synthetic no-mutation validation as a
  guarded ACK path for downstream callbacks from payments-microservice.
- GOAL-05 live notification send path is wired to `POST /notifications/send` with a separate `cliplot-notification-send-*` idempotency key, but remains unreachable in production because live flags and approval IDs are empty.
- Valid order payload validation now has a no-mutation Orders endpoint. Valid
  payment payload validation now has a no-mutation Payments endpoint. Valid
  notification payload validation now has a no-send Notifications endpoint.
  Live order creation, live payment creation, and live notification sends still
  require explicit approved runtime evidence.
- Cliplot now selects a Warehouse availability origin for each displayed
  product and carries the Warehouse-owned `warehouseId` through checkout
  normalization into `orders.create.v1` validation. This is payload enrichment
  only; the stability smoke showed Warehouse `totalAvailable=63`,
  `totalReserved=0`, warehouse `available=63`, and `reserved=0` unchanged before
  and after guarded checkout.

## Closed Goal: GOAL-04-kubernetes-vault-rag-deployment

### Objective

Make Cliplot platform operations repeatable with Vault presence checks,
docs-rag publication tooling, deployment readiness gates, and contract-ready
order payload shape while keeping live commerce disabled.

### Current Findings

- Vault is reachable with `VAULT_ADDR=http://127.0.0.1:8200`.
- `secret/prod/cliplot` exists and required key names are present.
- Docs/RAG can trigger repoName `cliplot` ingestion from the pod. The old `cliplot`/`192.168.88.53:11434` blocker is superseded by current `DOCS_RAG_PUBLICATION=pass` evidence for repoName `cliplot`.
- Auth validates `https://cliplot.alfares.cz/auth/callback`, but
  `cliplot` is not documented in the hosted-auth client registry.
- Catalog is Auth-guarded and has no approved Cliplot-specific marketplace/SKU scope yet; Cliplot currently reads active Catalog products through service auth and labels the source as `catalog`.
- Orders accepts `cliplot` and channel `cliplot`.
- Payments allowlists include `cliplot` and
  `https://cliplot.alfares.cz`.

## Closed Goal: GOAL-03-shared-service-integration

### Objective

Connect Cliplot to shared Alfares commerce boundaries in a guarded way: Catalog
read, hosted Auth links, service readiness, Vault projection, and checkout
submit that refuses live order/payment mutation until secrets and contracts are
present.

### Allowed Changes

- `src/server.js`;
- `src/integrations.js`;
- `public/index.html`;
- `public/app.js`;
- `public/styles.css`;
- `package.json`;
- `k8s/configmap.yaml`;
- `k8s/deployment.yaml`;
- `k8s/external-secret.yaml`;
- `scripts/deploy.sh`;
- `scripts/deployment_readiness_gate.py`;
- `scripts/verify-static-assets.js`;
- GOAL-03 docs and validation report;
- state/goal/deployment readiness docs.

### Forbidden Changes

- Production secrets.
- Live payment initiation.
- Stock reservation or decrement.
- Customer notification send.
- Claims that checkout revenue is production-ready.

## Closed Goal: GOAL-02-storefront-foundation

### Objective

Serve the first production-visible Cliplot storefront frontend at
`https://cliplot.alfares.cz/` without live payment or order mutation.

### Allowed Changes

- `package.json`;
- `Dockerfile`;
- `.dockerignore`;
- `src/**`;
- `public/**`;
- `k8s/configmap.yaml`;
- `k8s/deployment.yaml`;
- `k8s/service.yaml`;
- `k8s/ingress.yaml`;
- GOAL-02 docs and validation report;
- guarded deploy script.

### Forbidden Changes

- Production secrets.
- Live payment initiation.
- Live order creation.
- Stock reservation or decrement.
- App-local canonical product, price, or stock truth.

## Next Action

Continue GOAL-05 checkout readiness: keep live payment/order/notification
mutation disabled, collect approved live order-create plus Warehouse
reservation evidence, approved live payment-create evidence, and approved live
notification-send evidence when allowed, and preserve guarded frontend checkout
behavior until those approvals are present.

## Blockers For Product Code

- `[MISSING: approved Cliplot product SKU list/filtering rule; current Catalog read lane uses active Catalog products until owner-specific SKU scope exists]`
- `[MISSING: Cliplot brand/legal/payment identity approval]`
- `[MISSING: production payment provider credentials/webhook evidence for Cliplot]`
- `[MISSING: approved live Warehouse reservation execution evidence for Cliplot]`
- `[UNKNOWN: whether Catalog needs new marketplace key cliplot or reuse flipflop connector for long-term owner-specific filtering]`
- `[UNKNOWN: whether Cliplot is separate deployment, domain-only storefront variant, or tenant/brand inside FlipFlop]`

## Parallel Execution Status

| Lane | Status | Notes |
| --- | --- | --- |
| RunLayer guardrail inspection | running/read-only | Subagent lane; no file edits. |
| FlipFlop integration inspection | running/read-only | Subagent lane; no file edits. |
| Kubernetes/Vault/RAG pattern inspection | running/read-only | Subagent lane; no file edits. |
| Foundation integration | done | Main orchestrator wrote and committed repo baseline. |
| Storefront foundation | done | Frontend source, Dockerfile, K8s manifests, deploy, and public smoke completed. |
| Shared-service guarded integration | done | Server integration layer, frontend checkout submit, ExternalSecret scaffold, deploy, and public smoke completed. |
| Vault secret population | done | `secret/prod/cliplot`, Cliplot ExternalSecret, and Orders ExternalSecret synced. |
| Docs/RAG publication | done | Controlled repoName `cliplot` ingestion passed with retrieval and agent-context evidence. |
| Orders Cliplot support | done | `orders-microservice:971a446` deployed. |
| Payments Cliplot allowlist | done | `payments-microservice:eab6ae7` deployed. |
| Catalog real product reads | active | Wiring Auth-owned Catalog machine-auth token and real Catalog response normalization. |
| Order validation | done | Guarded no-mutation `orders.create.v1` payload validation is deployed. |
| Payment validation | done | Guarded no-mutation payment payload validation is deployed. |
| Notification validation | done | Guarded no-send order confirmation payload validation is deployed. |
| Live revenue mutation | dependency-gated | Requires approved live order-create/Warehouse, payment-create, and notification-send evidence. |

## Validation Log

2026-07-01:

- `python3 scripts/pre_coding_gate.py --root .` passed.
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues` passed.
- `python3 scripts/deployment_readiness_gate.py --root .` returned blocked because deployable app artifacts do not exist yet. This is expected for GOAL-01 and recorded in `docs/orchestrator/VALIDATION_DEBT.md`.
- `git diff --check` passed.
- `npm run build` passed for GOAL-02.
- `node --check public/app.js` passed.
- `python3 scripts/deployment_readiness_gate.py --root .` passed for frontend foundation.
- Kubernetes dry-run passed for configmap, deployment, service, and ingress.
- Temporary remote runtime smoke passed for `/health`, `/`, `/api/products`, and `/api/checkout/preview`.
- `./scripts/deploy.sh` built and pushed image `localhost:5000/cliplot:aad9cc8`; initial rollout wait timed out while the local registry pull took about 2m40s, then `kubectl rollout status deployment/cliplot -n statex-apps --timeout=180s` completed successfully.
- Deployment `cliplot` reached `1/1` ready/available.
- Public smoke passed for `https://cliplot.alfares.cz/`, `https://cliplot.alfares.cz/health`, `https://cliplot.alfares.cz/api/products`, and non-mutating checkout preview.
- GOAL-03 `npm run build` passed.
- GOAL-03 `python3 scripts/pre_coding_gate.py --root .` passed.
- GOAL-03 `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues` passed.
- GOAL-03 `python3 scripts/deployment_readiness_gate.py --root .` passed.
- GOAL-03 Kubernetes dry-run passed for configmap, external-secret, deployment, service, and ingress.
- GOAL-03 temporary runtime smoke passed for `/health`, `/api/integrations/readiness`, `/api/auth/links`, `/api/products`, and `/api/checkout/submit`.
- GOAL-03 `./scripts/deploy.sh` passed and deployed image `localhost:5000/cliplot:0556cec`.
- GOAL-03 public smoke from `alfares` passed for `/health`, `/api/integrations/readiness`, `/api/auth/links`, `/api/products`, and `/api/checkout/submit`.
- GOAL-05 Catalog lane pre-deploy validation passed: `npm run build`,
  `python3 scripts/pre_coding_gate.py --root .`,
  `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`,
  `python3 scripts/deployment_readiness_gate.py --root .`, `git diff --check`,
  and `kubectl apply --dry-run=server -f k8s/external-secret.yaml`.
- GOAL-05 Catalog lane deployed as `localhost:5000/cliplot:2678d29`.
  Initial deploy script rollout wait timed out while the new pod was still
  pulling the image; follow-up `kubectl -n statex-apps rollout status
  deployment/cliplot --timeout=180s` succeeded. Public
  `/api/products` returned 8 real Catalog products with UUID IDs and
  `fallback=false`; readiness returned `catalog=read_enabled_authenticated`;
  guarded checkout remained `202 service_identity_required`.
- GOAL-05 Payment identity lane deployed in `payments-microservice` as
  `localhost:5000/payments-microservice:85a904b`; runtime identity maps now
  come from Vault-backed `payments-microservice-secret`. Safe invalid-body
  smoke from the Cliplot pod to `POST /payments/create` returned HTTP `400`
  with `VALIDATION_ERROR`, proving Cliplot API-key auth and `payments:create`
  scope without creating a payment. Provider-backed payment creation remains
  disabled until an approved valid-body/payment-provider validation exists.
- GOAL-05 Orders identity smoke from the Cliplot pod to `POST /api/orders`
  returned HTTP `400 Bad Request` for an invalid body, proving the Cliplot
  Orders service token is accepted before validation and no order was created.
- GOAL-05 notification validation code validation passed: `npm run build`,
  `python3 scripts/pre_coding_gate.py`, `python3 scripts/strict_doc_audit.py`,
  `python3 scripts/deployment_readiness_gate.py`, `git diff --check`, and
  `node --check src/integrations.js src/server.js`.
- GOAL-05 notification validation deployed as
  `localhost:5000/cliplot:fef5fd8`. Initial rollout stalled while
  container runtime sandbox creation lagged; deleting only the stuck new
  Cliplot pod allowed the deployment controller to recreate it, and rollout
  completed.
- In-cluster Cliplot pod smoke returned
  `readiness.notificationValidation=enabled_no_send`,
  `readiness.liveNotifications=false`, guarded checkout HTTP `202`,
  `checkout.notificationValidation.status=validated_no_send`,
  `checkout.notificationValidation.valid=true`,
  `checkout.notificationValidation.mutation=false`,
  `checkout.notificationValidation.providerCall=false`, and
  `checkout.notificationValidation.notificationSent=false`.
- GOAL-05 order validation code validation passed: `npm run build`,
  `python3 scripts/pre_coding_gate.py`, `python3 scripts/strict_doc_audit.py`,
  `python3 scripts/deployment_readiness_gate.py`, `git diff --check`, and
  Orders full `npm test` for the new validation endpoint.
- Orders no-mutation endpoint deployed as
  `localhost:5000/orders-microservice:0611e4c`; direct Cliplot pod smoke to
  `POST /api/orders/validate-create` returned HTTP `201`, `valid=true`,
  `mutation=false`, `orderCreated=false`, `warehouseMutation=false`,
  `eventPublished=false`, and `idempotencyStatus=available`.
- Cliplot order validation deployed as
  `localhost:5000/cliplot:80e23c5`. In-cluster checkout smoke returned
  `readiness.orderValidation=enabled_no_mutation`, guarded checkout HTTP `202`,
  `checkout.orderPreview.contractVersion=orders.create.v1`,
  `checkout.orderPreview.totals.subtotal=1590`,
  `checkout.orderValidation.status=validated_no_mutation`,
  `checkout.orderValidation.mutation=false`,
  `checkout.orderValidation.orderCreated=false`,
  `checkout.orderValidation.warehouseMutation=false`,
  `checkout.orderValidation.eventPublished=false`, and no live `order` object.
  Checkout guard text now blocks on provider-backed payment evidence,
  Warehouse runtime evidence, and notification template rules rather than the
  already-deployed Orders channel support.
- GOAL-05 checkout guard refinement deployed as
  `localhost:5000/cliplot:7ba1936`. Public readiness now reports
  `payments=identity_ready_provider_guarded`, `catalog=read_enabled_authenticated`,
  `orders=guarded`, and `liveOrderSubmit=false`. Public guarded checkout still
  returns HTTP `202 service_identity_required`; remaining blockers are
  provider-backed valid-body payment evidence, Warehouse runtime evidence, and
  notification sender/template rules.
- GOAL-05 Warehouse receiver support deployed in `warehouse-microservice` commit
  `9e692ff`. Cliplot read-only Warehouse availability smoke returned HTTP `201`
  and `success=true` with no stock mutation. The first active Catalog list had
  zero Warehouse availability, so Cliplot storefront product selection now uses
  explicit stocked `CLIPLOT_PRODUCT_IDS` and enriches product cards with
  Warehouse batch availability.
- GOAL-05 stocked storefront selection deployed as
  `localhost:5000/cliplot:ea7dd54`. Public `/api/products` returned 8
  configured Catalog products with Warehouse-backed `Skladem` status, external
  product images, and Kč prices. Warehouse runtime evidence is no longer a
  checkout guard blocker for read/display; reservation/stock mutation remains
  disabled until live checkout is approved.
- GOAL-05 notification identity lane deployed in `notifications-microservice`
  commits `485ef45` and `8ed8225`. `CLIPLOT_NOTIFICATIONS_SERVICE_TOKEN` is
  projected from the Cliplot Vault path into Notifications. Safe invalid-body
  smoke from the Cliplot pod moved from HTTP `401 Invalid token` to HTTP `500
  SEND_FAILED`, proving Cliplot notification auth reached the send path without
  a valid notification payload or customer send. Cliplot now returns a guarded
  Czech order-confirmation notification preview from checkout submit; live
  notification send remains disabled pending approved live-send validation.
- GOAL-05 payment-create code path is wired behind
  `ENABLE_LIVE_PAYMENT_CREATE=false`. Cliplot now builds a Payments-compatible
  create payload with `applicationId=cliplot`, `paymentMethod=invoice`,
  allowlisted Cliplot callback/success/cancel URLs, customer fields, metadata,
  and idempotency key. No valid payment-create request was executed because it
  would write a live payment record; live payment creation remains gated by
  approved valid-body payment evidence.
- GOAL-05 Warehouse routing propagation validation passed for commit
  `da5d9cf`: `npm run build`, `python3 scripts/pre_coding_gate.py`,
  `python3 scripts/strict_doc_audit.py`, `python3 scripts/deployment_readiness_gate.py`,
  and `git diff --check` passed before deploy. `./scripts/deploy.sh` rolled out
  `localhost:5000/cliplot:da5d9cf`. In-cluster `/api/products` returned
  product `19c69d06-e3d3-471d-b417-b2fccbd63ab0` with Warehouse
  `warehouseId=c0de0000-0000-4000-8000-000000000013`, `warehouseType=own`,
  `availableStock=63`, and `stockQuantity=63`. Guarded `/api/checkout/submit`
  returned HTTP `202`, `orderPreview.items[0].warehouseId` equal to the same
  Warehouse id, `orderValidation.status=validated_no_mutation`,
  `paymentValidation.status=validated_no_mutation`,
  `notificationValidation.status=validated_no_send`, and no order, Warehouse,
  payment provider, or notification mutation. Warehouse availability before and
  after checkout remained `totalAvailable=63`, `totalReserved=0`,
  `warehouseAvailable=63`, and `warehouseReserved=0`.
- GOAL-05 frontend cart guard deployed as
  `localhost:5000/cliplot:9fce9c7`. `public/app.js` now prunes cart
  entries without Warehouse origin, disables add-to-cart for products without
  `warehouseId`, and renders `data-warehouse-id` on reservable product buttons.
  In-pod `/app.js` smoke confirmed `data-warehouse-id`,
  `removeUnreservableCartItems`, and `Nelze objednat` are present. Guarded
  checkout still returned HTTP `202`, carried the same Warehouse id into
  `orderPreview.items[0]`, and kept order/payment/notification validation
  no-mutation/no-send.
- GOAL-04/GOAL-05 docs-rag publication previously failed for the old repoName
  `cliplot`. That evidence is superseded by GOAL-06 controlled
  `./scripts/publish_docs_rag.sh cliplot` pass and retrieval validation.
- GOAL-05 Warehouse reservation-readiness is now deployed on
  `localhost:5000/cliplot:83f251c`. The earlier node-level
  `ContainerCreating` blocker cleared; redeploy succeeded and rollout returned
  `deployment "cliplot" successfully rolled out`. In-cluster guarded
  checkout returned HTTP `202`,
  `warehouseReservationReadiness.status=validated_no_mutation`, `valid=true`,
  `mutation=false`, `reservationCreated=false`, `stockMutation=false`,
  `items[0].ready=true`, `items[0].available=63`, and `items[0].warehouseType=own`.
  Warehouse availability before and after checkout stayed unchanged at
  `totalAvailable=63`, `totalReserved=0`, `warehouseAvailable=63`, and
  `warehouseReserved=0`. Live order creation, live Warehouse reservation,
  payment creation, and notification send remain approval-gated.
- GOAL-05 live mutation approval gates deployed as
  `localhost:5000/cliplot:abe3810`. `ENABLE_LIVE_ORDER_SUBMIT=false`,
  `ENABLE_LIVE_PAYMENT_CREATE=false`, and `ENABLE_LIVE_NOTIFICATIONS=false`
  remain false, and separate approval IDs are required before live order,
  payment, or notification mutation can run. Runtime readiness returned
  `liveMutationApprovals.order=false`, `payment=false`, `notification=false`,
  and three explicit `CLIPLOT_LIVE_*_APPROVAL_ID` blockers. Guarded checkout
  returned HTTP `202 service_identity_required`, exposed the same three approval
  blockers, kept `warehouseReservationReadiness.status=validated_no_mutation`,
  and still reported `orderCreated=false`, `warehouseMutation=false`,
  `paymentValidation.mutation=false`, `paymentValidation.providerCall=false`,
  and `notificationSent=false`.

- GOAL-05 guarded product detail route deployed as
  `localhost:5000/cliplot:1cebe76`. Product cards now link to
  `/produkt/:id`, the client route hydrates from existing `/api/products`
  Catalog/Warehouse data, renders real image, price, stock, delivery, available
  quantity, payment/return summary, and escaped plain-text Catalog description.
  No local product truth, backend product mutation, live order, payment,
  Warehouse reservation, or notification send was added.

- GOAL-05 guarded cart review flow deployed as
  `localhost:5000/cliplot:0e5e5db`. Add-to-cart now opens the cart
  drawer with an aria-live Czech confirmation, cart rows show line totals,
  product-specific quantity controls, and an explicit `Odebrat` action with
  44px touch targets. Guarded checkout still returns
  `service_identity_required` and no live order, payment, Warehouse
  reservation, or notification mutation.

- GOAL-05 live checkout preflight guard deployed as
  `localhost:5000/cliplot:505e90c`. Readiness and guarded checkout now
  expose `liveCheckoutPreflight.status=blocked`, `wouldMutate=false`, false
  order/payment/notification live flags, false approval booleans, validation
  lane statuses, and the remaining approval blockers. This makes the future
  live-checkout go/no-go auditable without enabling order, payment, Warehouse,
  callback persistence, or notification mutation.

- GOAL-05 live checkout preflight endpoint deployed and refined as
  `localhost:5000/cliplot:d7caf93`. `GET /api/checkout/live-preflight`
  exposes the guarded preflight contract as JSON with
  `status=blocked`, `wouldMutate=false`, and an explicit `mutationPlan` where
  `wouldCreateOrder=false`, `wouldCreatePayment=false`, and
  `wouldSendNotification=false`. This fixes the partial-live semantic risk:
  operators can distinguish full live readiness from whether any mutation would
  occur. The endpoint remains read-only and does not call Orders, Payments,
  Warehouse reservation, Notifications, or persistence.


- GOAL-04/GOAL-06 Docs/RAG publication was hardened into a two-phase flow.
  `DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot`
  now checks docs-rag pod discovery, `JWT_TOKEN` presence, read-only
  `/ingestion/status`, and embedding backend reachability without calling
  `/ingestion/trigger`. Current preflight evidence: `docsRagStatusHttp=200`,
  `embeddingBackendUrl=http://192.168.88.53:11435`, `embeddingHttp=200`,
  `DOCS_RAG_PREFLIGHT=pass`, exit `0`. Controlled publication for repoName
  `cliplot` passed with job `7a03ada9-9b99-4ef7-8223-5c5a298244f5` and
  `chunksProcessed=76`, `chunksTotal=76`.


- GOAL-06 read-only operator readiness bundle added as
  `npm run readiness:bundle`. The bundle gates checkout POST smoke behind
  `GET /api/checkout/live-preflight` and integration readiness, verifies K8s
  rollout state, Vault key presence without printing values, Docs/RAG preflight
  only, and guarded checkout smoke. Clean-worktree execution returned
  `CLIPLOT_READINESS_BUNDLE=pass` after Docs/RAG embedding and ingestion fixes. Checkout safety checks passed:
  `livePreflight.status=blocked`, `wouldMutate=false`, all mutation-plan
  booleans false, all live flags and approval booleans false, and guarded
  checkout `mutation=false`.
