# Implementation State

## Current Status

**Date:** 2026-07-01  
**Mode:** Goal-driven orchestration enabled  
**Active goal:** GOAL-05-checkout-revenue-readiness
**Goal status:** GOAL-05 active
**Current checkpoint:** GOAL-05 Catalog real-product lane in progress; checkout revenue evidence not yet complete.

## Current Intent Summary

Create a Czech-first Cliplot storefront at `https://cliplot.alfares.cz/` with a
human-designed, conversion-first UX and shared Alfares commerce integrations.

## Completed In This Setup

- Design direction created and preserved as `docs/DESIGN_CONTRACT.md`.
- Remote repository path selected: `/home/ssf/Documents/Github/cliplot-service`.
- Goal-driven structure defined.
- Guardrails modeled after RunLayer and FlipFlop patterns.
- Initial gate scripts and guarded deploy script planned.
- Gate scripts created.
- Design mockup stored at `docs/design/cliplot-homepage-mockup.png`.
- IPS anchor docs created under `00_constitution` through `24_onboarding`.
- Initial foundation commit created: `0f360ce docs: initialize cliplot service foundation`.
- GOAL-02 frontend source committed: `aad9cc8 feat: implement cliplot frontend storefront`.
- Cliplot frontend deployed to Kubernetes as `cliplot-service`.
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
- Vault path `secret/prod/cliplot-service` exists with required key names and no values printed.
- `cliplot-service-secret` and `orders-microservice-secret` are synced from Vault.
- Orders Cliplot support deployed as `localhost:5000/orders-microservice:971a446`.
- Payments Cliplot allowlist deployed as `localhost:5000/payments-microservice:eab6ae7`.
- Public Cliplot readiness shows service tokens present, live submit still disabled, and checkout still guarded.
- GOAL-05 Catalog lane started: Cliplot uses the existing Catalog
  machine-auth header contract with Auth-owned
  `CATALOG_INTERNAL_SERVICE_TOKEN` and will stop relying on fallback products
  when Catalog responds.

## Active Goal: GOAL-05-checkout-revenue-readiness

### Objective

Create provider-backed checkout evidence without fake payment success. This
goal may enable live order/payment only after Catalog, Orders, Payments,
Warehouse, Notifications, Auth, and Vault contracts are verified with runtime
smoke evidence.

### Current Findings

- Orders accepts `cliplot-service` and channel `cliplot`, and the Orders pod has
  `CLIPLOT_ORDERS_SERVICE_TOKEN`.
- Payments allowlists include `cliplot-service` and `https://cliplot.alfares.cz`.
- Cliplot has required secret keys projected, but `ENABLE_LIVE_ORDER_SUBMIT`
  remains `false`.
- Catalog product APIs are Auth-guarded, but Catalog supports the existing
  `x-internal-service-token` plus `x-service-name` machine-auth contract backed
  by Auth-owned `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`.
  Cliplot is being wired to that existing read path.
- Docs/RAG publication tooling exists, but ingestion is blocked by
  `ECONNREFUSED 192.168.88.53:11434`.
- Notification template/channel and Warehouse default selection still require
  explicit runtime validation.

## Closed Goal: GOAL-04-kubernetes-vault-rag-deployment

### Objective

Make Cliplot platform operations repeatable with Vault presence checks,
docs-rag publication tooling, deployment readiness gates, and contract-ready
order payload shape while keeping live commerce disabled.

### Current Findings

- Vault is reachable with `VAULT_ADDR=http://127.0.0.1:8200`.
- `secret/prod/cliplot-service` exists and required key names are present.
- Docs/RAG can trigger `cliplot-service` ingestion from the pod, but ingestion
  is blocked by `ECONNREFUSED 192.168.88.53:11434`.
- Auth validates `https://cliplot.alfares.cz/auth/callback`, but
  `cliplot-service` is not documented in the hosted-auth client registry.
- Catalog is Auth-guarded, has no `cliplot` marketplace key, and Cliplot is
  currently serving fallback products.
- Orders accepts `cliplot-service` and channel `cliplot`.
- Payments allowlists include `cliplot-service` and
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

Continue GOAL-05 Catalog lane: deploy authenticated Catalog reads, prove
`/api/products` returns real Catalog product IDs instead of fallback Cliplot
IDs, then proceed to payment API key/scopes and provider-backed checkout
readiness. Keep live payment/order mutation disabled until Catalog, Warehouse,
Notifications, Auth, and provider-backed payment evidence are verified.

## Blockers For Product Code

- `[MISSING: approved Cliplot product SKU list/filtering rule; current Catalog read lane uses active Catalog products until owner-specific SKU scope exists]`
- `[MISSING: Cliplot brand/legal/payment identity approval]`
- `[MISSING: production payment provider credentials/webhook evidence for Cliplot]`
- `[MISSING: Warehouse service token accepted by warehouse-microservice and default warehouseId]`
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
| Vault secret population | done | `secret/prod/cliplot-service`, Cliplot ExternalSecret, and Orders ExternalSecret synced. |
| Docs/RAG publication | blocked | Embedding backend `192.168.88.53:11434` refused connection. |
| Orders Cliplot support | done | `orders-microservice:971a446` deployed. |
| Payments Cliplot allowlist | done | `payments-microservice:eab6ae7` deployed. |
| Catalog real product reads | active | Wiring Auth-owned Catalog machine-auth token and real Catalog response normalization. |
| Payment integration | planned | GOAL-05 after Catalog/Warehouse/Notifications/Auth/provider evidence. |

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
- `./scripts/deploy.sh` built and pushed image `localhost:5000/cliplot-service:aad9cc8`; initial rollout wait timed out while the local registry pull took about 2m40s, then `kubectl rollout status deployment/cliplot-service -n statex-apps --timeout=180s` completed successfully.
- Deployment `cliplot-service` reached `1/1` ready/available.
- Public smoke passed for `https://cliplot.alfares.cz/`, `https://cliplot.alfares.cz/health`, `https://cliplot.alfares.cz/api/products`, and non-mutating checkout preview.
- GOAL-03 `npm run build` passed.
- GOAL-03 `python3 scripts/pre_coding_gate.py --root .` passed.
- GOAL-03 `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues` passed.
- GOAL-03 `python3 scripts/deployment_readiness_gate.py --root .` passed.
- GOAL-03 Kubernetes dry-run passed for configmap, external-secret, deployment, service, and ingress.
- GOAL-03 temporary runtime smoke passed for `/health`, `/api/integrations/readiness`, `/api/auth/links`, `/api/products`, and `/api/checkout/submit`.
- GOAL-03 `./scripts/deploy.sh` passed and deployed image `localhost:5000/cliplot-service:0556cec`.
- GOAL-03 public smoke from `alfares` passed for `/health`, `/api/integrations/readiness`, `/api/auth/links`, `/api/products`, and `/api/checkout/submit`.
- GOAL-05 Catalog lane pre-deploy validation passed: `npm run build`,
  `python3 scripts/pre_coding_gate.py --root .`,
  `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`,
  `python3 scripts/deployment_readiness_gate.py --root .`, `git diff --check`,
  and `kubectl apply --dry-run=server -f k8s/external-secret.yaml`.
- GOAL-05 Catalog lane deployed as `localhost:5000/cliplot-service:2678d29`.
  Initial deploy script rollout wait timed out while the new pod was still
  pulling the image; follow-up `kubectl -n statex-apps rollout status
  deployment/cliplot-service --timeout=180s` succeeded. Public
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
  Checkout guard text now blocks on provider-backed payment evidence,
  Warehouse runtime evidence, and notification template rules rather than the
  already-deployed Orders channel support.
- GOAL-05 checkout guard refinement deployed as
  `localhost:5000/cliplot-service:7ba1936`. Public readiness now reports
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
