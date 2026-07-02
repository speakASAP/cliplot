# Operational Runbook

## Remote Access

```bash
ssh alfares
cd /home/ssf/Documents/Github/cliplot
```

One-off:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && <command>'
```

## Standard Checks

```bash
git status --short --branch
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
```

## Deploy

```bash
./scripts/deploy.sh
```

The script blocks until a deployable app and manifests exist.

## Kubernetes Target

```bash
kubectl get pods -n statex-apps -l app=cliplot-service
kubectl get ingress -n statex-apps cliplot-service
```

## Public Smoke

After deployment:

```bash
curl -i https://cliplot.alfares.cz/
curl -i https://cliplot.alfares.cz/health
```

## Secret Checks

Presence-only:

```bash
kubectl get externalsecret -n statex-apps cliplot-service-secret
kubectl get secret -n statex-apps cliplot-service-secret
python3 scripts/vault_secret_presence_gate.py --allow-missing
```

Do not print secret values.

## Docs/RAG Preflight And Publication

Run the non-mutating preflight first:

```bash
DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot-service
# or
./scripts/publish_docs_rag.sh --preflight cliplot-service
```

The preflight checks docs-rag pod discovery, JWT token presence, read-only
ingestion status, and embedding backend reachability without calling
`/ingestion/trigger`.

Only after preflight passes and publication is intentionally approved, run the
mutating ingestion step:

```bash
./scripts/publish_docs_rag.sh cliplot-service
```

Known current blocker: docs-rag ingestion/preflight may fail while
`OLLAMA_URL=http://192.168.88.53:11434` refuses connections.

## Checkout Contract Status

- Orders create endpoint: `POST /api/orders`.
- Orders no-mutation validation endpoint: `POST /api/orders/validate-create`.
- Required order contract: `orders.create.v1`.
- Payments no-mutation validation endpoint: `POST /payments/validate-create`.
- Notifications no-send validation endpoint: `POST /notifications/validate`.
- Runtime guarded state:
  `ENABLE_LIVE_ORDER_SUBMIT=false`,
  `ENABLE_LIVE_PAYMENT_CREATE=false`, and
  `ENABLE_LIVE_NOTIFICATIONS=false`.
- Cliplot guarded checkout currently validates order, payment, and
  notification payloads without creating orders, reserving stock, calling a
  payment provider, or sending customer notifications.
- Product reads include Warehouse availability origin fields; guarded checkout
  copies the Warehouse-owned `warehouseId` into `orderPreview.items[]` for
  `orders.create.v1` validation only.
- Frontend cart behavior is also fail-closed: products without Warehouse
  origin are not addable to the cart, and stale cart entries without a
  reservable product are pruned after product load.
- Live submit remains disabled until approved live order-create plus Warehouse
  reservation evidence, approved live payment-create evidence, approved live
  notification-send evidence, owner-specific Catalog product scope, and
  brand/legal/payment identity approvals are present.
- Warehouse batch availability reservation-readiness preflight runs during
  guarded checkout and returns `warehouseReservationReadiness` without creating a
  reservation or decrementing stock. Live Warehouse reservation still requires
  approved live order-create evidence.
## Live Mutation Approval IDs

Live env flags alone are not sufficient to mutate checkout state. Before any
live order/payment/notification mutation can run, the corresponding approval id
must also be present in runtime config:

```text
CLIPLOT_LIVE_ORDER_APPROVAL_ID
CLIPLOT_LIVE_PAYMENT_APPROVAL_ID
CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID
```

The default deployed values are empty strings. Empty approval IDs intentionally
keep `/api/checkout/submit` in `service_identity_required` guarded mode even if
shared-service validation succeeds.


## Guarded Checkout Smoke

After a Cliplot checkout deploy, run:

```bash
npm run smoke:checkout -- https://cliplot.alfares.cz
```

The smoke must return `ok=true`, HTTP `202`, `status=service_identity_required`,
preserved `checkoutIntent.externalOrderId`, order/payment/Warehouse
`validated_no_mutation`, notification `validated_no_send`, and `mutation=false`.
This script is safe while live mutation approvals remain absent.


The smoke also verifies checkout totals: item subtotal plus delivery cost plus
payment fee must equal the guarded checkout total, Orders preview total, and
Payments preview amount. If this fails, do not enable live order/payment
mutation.


## Guarded Checkout Status Surface

`/objednavka/stav`, `/checkout/success`, and `/checkout/cancelled` are
customer-safe guarded status surfaces. They must not say paid, confirmed,
reserved, shipped, invoiced, or completed until live order/payment/Warehouse
evidence and approval IDs exist.

`GET /api/payments/status` is intentionally non-authoritative while GOAL-05 is
guarded. It must return `payment_status_guarded_no_persistence`,
`mutation=false`, `persistence=false`, and `providerCall=false`.


## Operator Readiness Bundle

Run the read-only bundle before handoff or live-mutation approval reviews:

```bash
npm run readiness:bundle
```

The bundle checks git status, Kubernetes rollout state, live checkout preflight,
integration readiness, Vault key presence without printing values, Docs/RAG
preflight, and guarded checkout smoke. Docs/RAG preflight may return blocked
while the embedding backend is unreachable; that is an operational blocker, not
a checkout mutation.

## Kubernetes Readiness Monitor

Deployment applies `k8s/readiness-cronjob.yaml` as
`cliplot-readiness-monitor` in `statex-apps`.

The CronJob runs every 30 minutes inside the cluster and executes:

```bash
node scripts/k8s-readiness-probe.js http://cliplot-service:8080
```

It performs only HTTP `GET` checks against `/health`,
`/api/checkout/live-preflight`, `/api/integrations/readiness`, and
`/api/payments/status`. It does not call Kubernetes APIs, does not need RBAC,
does not run `npm run readiness:bundle`, and must not create orders, payments,
Warehouse reservations, callback persistence, notifications, or Docs/RAG
ingestion jobs.

Inspect it with:

```bash
kubectl get cronjob cliplot-readiness-monitor -n statex-apps
kubectl get jobs -n statex-apps -l component=readiness-monitor
```
