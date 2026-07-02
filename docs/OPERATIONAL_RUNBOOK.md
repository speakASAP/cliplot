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
kubectl get pods -n statex-apps -l app=cliplot
kubectl get ingress -n statex-apps cliplot
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
kubectl get externalsecret -n statex-apps cliplot-secret
kubectl get secret -n statex-apps cliplot-secret
python3 scripts/vault_secret_presence_gate.py --allow-missing
```

Do not print secret values.

## Docs/RAG Preflight And Publication

Run the non-mutating preflight first:

```bash
DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot
# or
./scripts/publish_docs_rag.sh --preflight cliplot
```

The preflight checks docs-rag pod discovery, JWT token presence, read-only
ingestion status, and embedding backend reachability without calling
`/ingestion/trigger`.

Only after preflight passes and publication is intentionally approved, run the
mutating ingestion step:

```bash
./scripts/publish_docs_rag.sh cliplot
```

Current evidence: docs-rag preflight reaches
`OLLAMA_URL=http://192.168.88.53:11435` and returns
`DOCS_RAG_PREFLIGHT=pass` for repoName `cliplot`.

## Checkout Contract Status

- Orders create endpoint: `POST /api/orders`.
- Orders no-mutation validation endpoint: `POST /api/orders/validate-create`.
- Required order contract: `orders.create.v1`.
- Payments no-mutation validation endpoint: `POST /payments/validate-create`.
- Notifications no-send validation endpoint: `POST /notifications/validate`.
- Notifications live send path: `POST /notifications/send`, guarded by full live preflight and a separate notification-send idempotency key.
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




## Live Activation Gate

Before changing any live checkout flag, run the fail-closed activation gate:

```bash
npm run readiness:activation -- https://cliplot.alfares.cz
```

The gate must report `wouldMutate=false`, `wouldCreateOrder=false`,
`wouldReserveWarehouse=false`, `wouldCreatePayment=false`,
`wouldSendNotification=false`, all live flags false, and all approval booleans false in the current guarded
deployment. If a future partial configuration sets only some flags or approval
IDs, `/api/checkout/live-preflight` must remain blocked and `submitCheckout`
must stay in guarded validation mode.

## Live Orders/Warehouse Smoke Plan

Before requesting owner approval for live order mutation, generate the read-only smoke plan:

```bash
npm run readiness:live-smoke-plan -- https://cliplot.alfares.cz
npm run readiness:live-smoke-executor -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/checkout/live-order-warehouse-smoke-plan
```

The plan must report `liveExecutionAllowed=false`, list approval blockers, name the selected Catalog/Warehouse product, and include the exact create, idempotent replay, cancel/release, and before/after availability evidence steps. It is not permission to execute the live smoke.

The executor endpoint is `POST /api/checkout/live-order-warehouse-smoke-executor`.
It must remain blocked in normal production and return `approval_required` until
all of the following are present: `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true`,
`CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID`, `ORDERS_STATUS_SERVICE_TOKEN`,
body `confirm=CREATE_REPLAY_CANCEL`, `approvalId`, `approvedBy`, and
`reasonCode`. The executor is Orders/Warehouse-only: it must not create payments
or send notifications, and cleanup must go through Orders cancellation rather
than direct Warehouse mutation. After cleanup, Warehouse reservation readback is
required because Orders can persist order status even if Warehouse cleanup
reports a failed handoff.

## Live Checkout Approval Packet

Before enabling any live checkout flag or approval ID, generate the read-only
approval packet:

```bash
npm run readiness:approval -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/checkout/approval-packet
```

The packet must report `mutation=false`, `providerCall=false`,
`persistence=false`, `catalogSource=catalog`, at least one Warehouse-backed
product, blocked live preflight, and the exact approval ID names still missing.
It must never print secret values.

## Product Filter Readiness

`GET /api/products/filter-readiness` is the read-only approval gate for the Cliplot product SKU/filtering rule. It proves that the storefront is using authenticated Catalog data, that at least one Catalog product has Warehouse availability evidence, and that the current selection mode is either `active_catalog_query` or `configured_product_ids`. It must return `approval_required_catalog_product_filter_rule`, `catalogSource=catalog`, `warehouseBackedProductCount>0`, `approvedCliplotSkuScope=false`, `mutation=false`, `persistence=false`, and `providerCall=false` until the owner approves the final Cliplot SKU/filtering rule. It exposes count and fingerprint metadata for configured product IDs, not raw configured ID lists.

```bash
npm run readiness:product-filter -- https://cliplot.alfares.cz
```

## Revenue Closure Packet

Before enabling live checkout mutation, run the read-only revenue closure packet:

```bash
npm run readiness:revenue-closure -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/checkout/revenue-closure-packet
```

The packet aggregates live checkout approval, product-filter scope, order and
Warehouse readiness, live smoke planning, payment status/storage/decision/mapping
evidence, callback replay policy, and approved read-only customer status
evidence. Current production must return
`approval_required_live_revenue_closure`, `wouldMutateNow=false`,
`mutation=false`, `persistence=false`, and `providerCall=false` until the live
approval IDs, product scope, live Orders/Warehouse smoke, payment, and
notification evidence blockers are closed.

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

`GET /api/payments/status` is non-authoritative. In the current approved
read-only runtime it may read only the Payments DB-only by-order-id snapshot
route and must still return `mutation=false`, `persistence=false`, and
`providerCall=false`. Safe customer-facing fallback states include
`payment_status_snapshot_not_available` and
`payment_status_snapshot_temporarily_unavailable`; `/payments/{paymentId}` stays
forbidden for passive Cliplot reads.

`GET /api/checkout/status-surface-contract` is the metadata-only contract for
the customer status surface. Current approved production returns
`approved_read_only_customer_status_surface_contract`, `currentDataSource=browser_local_checkout_snapshot`,
`runtimeReadEnabled=true`, `paymentsSnapshotReadEnabled=true`,
`storageRead=false`, `mutation=false`, `persistence=false`, and
`providerCall=false`. It must not accept or return real order/payment rows,
customer PII, provider transaction IDs, or raw provider payloads.

```bash
npm run readiness:checkout-status-surface -- https://cliplot.alfares.cz
```

`GET /api/checkout/customer-status-runtime-rollout-plan` is the read-only
runtime rollout plan for the approved customer status surface. Current approved
production returns `approved_read_only_customer_status_runtime_rollout`,
`runtimeReadEnabled=true`, `paymentsSnapshotReadEnabled=true`,
`storageRead=false`, `callbackPersistence=false`, `mutation=false`,
`persistence=false`, and `providerCall=false`. This approval covers passive
Payments DB snapshot reads only; it does not approve live order/payment,
Warehouse, callback persistence, local storage, or notification mutation.

```bash
npm run readiness:customer-status-rollout -- https://cliplot.alfares.cz
```

`GET /api/checkout/customer-status-runtime-activation-gate` is the fail-closed
activation gate for read-only customer status. Current approved production
returns `ready_for_approved_read_only_customer_status_runtime`,
`runtimeReadEnabled=true`, `paymentsSnapshotReadEnabled=true`,
`storageRead=false`, `callbackPersistence=false`, `wouldReadPaymentsSnapshot=true`,
`wouldRenderRuntimeCustomerStatus=true`, `mutation=false`, `persistence=false`,
and `providerCall=false`. It still does not approve live
order/payment/Warehouse/notification mutation.

```bash
npm run readiness:customer-status-activation -- https://cliplot.alfares.cz
```

`GET /api/checkout/customer-status-approval-evidence-packet` is the operator-facing evidence packet for read-only customer status. Current approved production returns `approved_customer_status_runtime_evidence_packet`, `baselineGuarded=true`, `runtimeReadEnabled=true`, `paymentsSnapshotReadEnabled=true`, `storageRead=false`, `callbackPersistence=false`, `wouldReadPaymentsSnapshot=true`, `wouldRenderRuntimeCustomerStatus=true`, `mutation=false`, `persistence=false`, and `providerCall=false`. It is approval evidence only and must not enable live order creation, payment creation, Warehouse reservation, callback persistence, notification sends, provider-refreshing reads, or local payment status storage.

```bash
npm run readiness:customer-status-approval -- https://cliplot.alfares.cz
```

`GET /api/payments/status-runtime-readiness` reports the passive Payments DB
snapshot adapter for `/api/payments/status`. Current approved production returns
`ready_for_approved_payments_snapshot_runtime_read`, `runtimeReadEnabled=true`,
`paymentsSnapshotReadEnabled=true`, `storageRead=false`,
`callbackPersistence=false`, `mutation=false`, `persistence=false`, and
`providerCall=false`.

The adapter must never call `/payments/{paymentId}` for passive status reads and
must not expose provider transaction IDs, metadata, callback URLs, raw provider
payloads, or secret values.

```bash
npm run readiness:customer-status-runtime-read -- https://cliplot.alfares.cz
```

The frontend status routes may call `/api/payments/status?orderId=<externalOrderId>`
after rendering the browser-local checkout snapshot. In guarded production this
must keep showing customer-safe copy only: payment is not confirmed, order is
not paid, and goods are not reserved. Validate the UI contract with
`npm run smoke:checkout` and `npm run readiness:checkout-status-surface`.

`GET /api/payments/callback-readiness` validates the configured webhook key
through an internal synthetic callback ACK. It must return
`validated_guarded_ack_no_persistence`, `mutation=false`, `persistence=false`,
and `providerCall=false`, and it must never print the webhook key. Run it with:

```bash
npm run readiness:payment-callback -- https://cliplot.alfares.cz
```

`GET /api/payments/callback-replay-policy` is the approval gate for future callback persistence and replay. It must return `approval_required_callback_replay_policy`, `callbackPersistence=false`, `callbackReplayEnabled=false`, `mutation=false`, `persistence=false`, and `providerCall=false`. It records the proposed ADR-005 policy surface and keeps storage writes, provider calls, order updates, payment updates, and replay disabled until owner approval exists.

```bash
npm run readiness:payment-callback-policy -- https://cliplot.alfares.cz
```

`GET /api/payments/read-scope-readiness` validates that Cliplot's runtime
`PAYMENT_API_KEY` reaches Payments' DB-only status snapshot route with
`payments:read`. It sends only a synthetic missing order id and treats the
Payments `404` not-found response as proof that the key passed auth/scope and
reached the DB-only handler. It must return `validated_payments_read_scope_no_mutation`,
`mutation=false`, `persistence=false`, `providerCall=false`, and it must never
print the API key. Run it with:

```bash
npm run readiness:payment-read-scope -- https://cliplot.alfares.cz
```

`GET /api/payments/status-readiness` is the read-only go/no-go contract for
customer-safe payment status. Current approved production returns
`ready_for_approved_payment_status_runtime_read` while live payment creation,
callback persistence, local storage writes, and provider-refreshing reads remain
disabled. Payments `fc42e72` exposes the DB-only snapshot route
`GET /payments/status/by-order-id?applicationId=cliplot&orderId=<orderId>` with
`providerCall=false`, `persistence=false`, and `mutation=false`; Cliplot must use
that route instead of `GET /payments/{paymentId}`, which can still refresh
pending Stripe/card records. Cliplot must not call Payments, refresh provider
status, persist status, or update an order in the current guarded deployment.
The readiness body exposes a non-authoritative
`customerSafeStatusContract` with `source=static_customer_safe_mapping`,
`labelsLocale=cs-CZ`, and Czech labels for `pending`, `processing`,
`completed`, `failed`, `cancelled`, and `refunded`; these labels are readiness
metadata only until persisted payment status storage and approved
`payments:read` access exist. The same response includes a non-authoritative
`mappingContract` proposal for `externalOrderId`, `orderId`, `paymentId`,
`paymentCreateIdempotencyKey`, amount/currency, status, and timestamps; it is a
contract proposal only, not storage. Run it with:

```bash
npm run readiness:payment-status -- https://cliplot.alfares.cz
```

`GET /api/payments/status-storage-readiness` is the read-only schema/storage
ownership proposal for future payment status persistence. It must return
`blocked_storage_backend_not_approved`, `mutation=false`, `persistence=false`,
and `providerCall=false` until a decision records whether persistence belongs in
Cliplot-local storage or an approved shared commerce service.

```bash
npm run readiness:payment-storage -- https://cliplot.alfares.cz
```

`GET /api/payments/status-persistence-decision` is the read-only ownership
approval packet. It compares Payments-owned, Cliplot-local, and Orders-owned
options and currently recommends `shared-payments-source-of-truth`. It must
return `decision_recorded_approval_required`, `mutation=false`,
`persistence=false`, and `providerCall=false`. The packet must mark
`07_decisions/ADR-002-payment-status-persistence-ownership.md` as recorded and
proposed for owner approval, but that ADR does not approve runtime status reads,
callback persistence, or Cliplot-local storage writes.

```bash
npm run readiness:payment-decision -- https://cliplot.alfares.cz
```

`GET /api/payments/status-snapshot-read-approval-packet` is the read-only
owner approval packet for passive customer-facing payment status reads. It
aggregates only metadata and readiness evidence; it must not accept real
`orderId` or `paymentId` input, return payment rows, print secrets, call
providers, persist callback state, or enable Cliplot-local storage. Current
approved production returns `approved_passive_payments_snapshot_read`,
`runtimeReadEnabled=true`, `approvedRuntimeChange=true`, `mutation=false`,
`persistence=false`, and `providerCall=false`. The only approved read contract
is the provider-refresh-free Payments DB snapshot endpoint:
`/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}`. The
packet must continue to reject `/payments/{paymentId}` for passive reads because
that endpoint can refresh pending Stripe/card provider state.

```bash
npm run readiness:payment-snapshot-read-approval -- https://cliplot.alfares.cz
```


`GET /api/payments/status-mapping-ownership` is the read-only ownership packet
for future customer-facing order/payment status correlation. It must return
`approval_required_order_payment_status_mapping_ownership`, `mutation=false`,
`persistence=false`, `providerCall=false`, `runtimeReadEnabled=false`,
`paymentsSnapshotReadEnabled=false`, `storageRead=false`, and
`callbackPersistence=false`. The packet records ADR-006 as proposed for owner
approval, keeps Orders authoritative for order lifecycle, Payments authoritative
for payment status, and Cliplot a non-authoritative customer-safe renderer. It
must not create orders, reserve Warehouse stock, create payments, send
notifications, persist callbacks, read `/payments/{paymentId}`, print secrets,
or read payment rows.

```bash
npm run readiness:payment-mapping -- https://cliplot.alfares.cz
```

## Approved Read-Only Customer Status Runtime

Production may run the customer status surface in approved read-only mode with
`ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true`,
`ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true`, and
`CLIPLOT_STATUS_RUNTIME_APPROVAL_ID=owner-approved-2026-07-02-read-only-customer-status`.
This mode allows only `GET /payments/status/by-order-id?applicationId=cliplot&orderId={orderId}`
through Payments and must continue returning `mutation=false`,
`persistence=false`, `providerCall=false`, `storageRead=false`, and
`callbackPersistence=false`. `GET /payments/{paymentId}` remains forbidden for
Cliplot passive customer status.

## Operator Readiness Bundle

Run the read-only bundle before handoff or live-mutation approval reviews:

```bash
npm run readiness:bundle
```

The bundle checks git status, Kubernetes rollout state, live checkout preflight,
integration readiness, Vault key presence without printing values, Docs/RAG
preflight, guarded payment callback ACK readiness, guarded payment status
storage readiness, and guarded checkout smoke. Docs/RAG preflight may return
blocked while the embedding backend is unreachable; that is an operational
blocker, not a checkout mutation.

## Kubernetes Readiness Monitor

Deployment applies `k8s/readiness-cronjob.yaml` as
`cliplot-readiness-monitor` in `statex-apps`.

The CronJob runs every 30 minutes inside the cluster and executes:

```bash
node scripts/k8s-readiness-probe.js http://cliplot:8080
```

It performs only HTTP `GET` checks against `/health`,
`/api/checkout/live-preflight`, `/api/integrations/readiness`, and
`/api/payments/status`, `/api/payments/callback-readiness`, and
`/api/payments/status-readiness`. It does not call Kubernetes APIs, does not
need RBAC, does not run `npm run readiness:bundle`, and must not create orders,
payments, Warehouse reservations, callback persistence, notifications, or
Docs/RAG ingestion jobs.

Inspect it with:

```bash
kubectl get cronjob cliplot-readiness-monitor -n statex-apps
kubectl get jobs -n statex-apps -l component=readiness-monitor
```
