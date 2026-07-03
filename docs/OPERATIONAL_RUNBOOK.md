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

`CLIPLOT_LIVE_ORDER_APPROVAL_ID` is recorded as `owner-approved-2026-07-03-live-order-warehouse-create-replay-cancel` from
the controlled Orders/Warehouse smoke evidence. `CLIPLOT_LIVE_PAYMENT_APPROVAL_ID`
is recorded as `owner-approved-2026-07-03-payment-create-metadata` from the
no-mutation payment-create evidence packet, and
`CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID` is recorded as
`owner-approved-2026-07-03-notification-send-metadata` from the no-send
notification evidence packet. These are metadata approvals only: all live flags
remain `false`, `/api/checkout/submit` stays guarded, and live payment creation
or notification sends still require a separate bounded execution window plus the
corresponding false-to-true flag change.




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
npm run readiness:live-smoke-execution-checklist -- https://cliplot.alfares.cz
npm run readiness:live-smoke-contract -- https://cliplot.alfares.cz
npm run readiness:live-smoke-executor -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/checkout/live-order-warehouse-smoke-plan
curl -s https://cliplot.alfares.cz/api/checkout/live-order-warehouse-smoke-execution-checklist-packet
curl -s https://cliplot.alfares.cz/api/checkout/live-order-warehouse-create-replay-cancel-contract-packet
```

The plan must report `liveExecutionAllowed=false`, list any remaining execution blockers, name the selected Catalog/Warehouse product, and include the exact create, idempotent replay, cancel/release, and before/after availability evidence steps. It may return `approved_live_order_warehouse_smoke_metadata_execution_disabled` only after owner metadata includes a concrete execution window; placeholder values such as `owner-approved-window-required-before-enabling-flag` must remain `[MISSING: concrete owner-approved smoke execution window]`. Metadata approval is not permission to execute the live smoke while `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`.

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

The packet must report `approval_required_live_checkout_execution`,
`mutation=false`, `providerCall=false`, `persistence=false`,
`catalogSource=catalog`, at least one Warehouse-backed product, blocked live
preflight, and the exact approval ID names still missing. It aggregates
Catalog/SKU scope, Orders/Warehouse no-mutation readiness, live smoke metadata,
payment status runtime-read evidence, callback persistence blockers,
read-only customer status evidence, and live preflight state. It must never
print secret values.

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
evidence. It also classifies blockers into metadata-packet-eligible readiness
work versus items that require true owner live mutation approval, while keeping
the classification itself read-only. Current production must return
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

`GET /api/payments/callback-replay-policy` is the approval gate for future callback persistence and replay policy metadata. It may return `approved_callback_replay_policy_metadata_execution_disabled`, but it must keep `callbackPersistence=false`, `callbackReplayEnabled=false`, `mutation=false`, `persistence=false`, and `providerCall=false`. It keeps storage writes, provider calls, order updates, payment updates, and replay disabled until separate storage and replay rollout approvals exist.

```bash
npm run readiness:payment-callback-policy -- https://cliplot.alfares.cz
```

`GET /api/payments/callback-persistence-approval-packet` is the read-only approval packet for the future callback persistence storage backend. It aggregates guarded callback ACK evidence, ADR-005 policy metadata, Payments-owned passive status storage, idempotency keys, duplicate/conflict handling, retention metadata, rollback owner, validation owner, exact storage/replay blockers, a metadata-only storage backend proposal, a dry-run rollout plan, and a replay dry-run contract. The proposal names the Payments-owned callback event projection as the candidate backend and keeps Cliplot non-authoritative. It may return `approved_callback_persistence_metadata_execution_disabled` once all metadata approvals are recorded, but it must still keep `callbackPersistence=false`, `callbackReplayEnabled=false`, `mutation=false`, `persistence=false`, and `providerCall=false`; the proposal fields are not approval to persist callbacks, replay callbacks, update statuses, or call a provider.

```bash
npm run readiness:payment-callback-persistence -- https://cliplot.alfares.cz
```

For a narrower review surface, `GET /api/payments/callback-storage-backend-proposal-packet`
returns only the metadata-only storage backend proposal, rollout plan, replay
dry-run contract, and guard evidence. It must return
`proposal_metadata_recorded_approval_required` and keep runtime enablement,
callback persistence, replay execution, live status writes, provider calls,
storage writes, real order/payment IDs, callback payloads, provider transaction
IDs, customer PII, and secret values out of the packet.

```bash
npm run readiness:payment-callback-storage-proposal -- https://cliplot.alfares.cz
```


`GET /api/payments/callback-persistence-storage-contract-packet` and
`GET /api/payments/callback-persistence-storage-approval-checklist-packet` are
the read-only storage contract/checklist packets for future callback persistence. It narrows
the ADR-007 storage backend proposal into identity, idempotency, uniqueness,
retention/deletion, rollback, validation, and approval-flag requirements while
keeping `callbackPersistence=false`, `callbackReplayEnabled=false`,
`liveStatusWritesNow=false`, `mutation=false`, `persistence=false`, and
`providerCall=false`.

```bash
npm run readiness:payment-callback-storage-contract -- https://cliplot.alfares.cz
npm run readiness:payment-callback-storage-approval-checklist -- https://cliplot.alfares.cz
```

`GET /api/payments/callback-replay-execution-rollout-proposal-packet` is the read-only
approval packet for a future callback replay execution window. It records the
bounded execution-window proposal, synthetic dry-run plan, rollback plan, and
guard evidence while keeping replay execution, callback persistence, live status
writes, provider calls, notification sends, storage writes, real order/payment
IDs, callback payloads, provider transaction IDs, customer PII, and secret values
out of the packet.

```bash
npm run readiness:payment-callback-replay-rollout -- https://cliplot.alfares.cz
```


`GET /api/payments/live-status-write-approval-packet` is the read-only approval
packet for a future bounded live status write window. It aggregates approved
passive Payments snapshot-read evidence, ADR-006 non-authoritative mapping
ownership, callback persistence blockers, callback replay rollout blockers,
and rollback/validation requirements while keeping live status writes disabled.
It may return `approved_live_status_write_metadata_execution_disabled` after metadata approvals are recorded, but it must keep
`liveStatusWritesEnabled=false`, `liveStatusWritesNow=false`,
`callbackPersistence=false`, `callbackReplayEnabled=false`, `mutation=false`,
`persistence=false`, and `providerCall=false`. It is not approval to persist
callbacks, replay callbacks, write order/payment status, call a provider, create
payments, or send notifications.

```bash
npm run readiness:payment-live-status-write -- https://cliplot.alfares.cz
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
ownership proposal for future payment status persistence. It may return `approved_payment_status_storage_metadata_execution_disabled` after callback storage, rollout, retention, uniqueness, replay, and live-status-write metadata approvals are recorded; otherwise it returns
`blocked_storage_backend_not_approved`. In both cases it must keep `mutation=false`, `persistence=false`,
and `providerCall=false`. It records shared Payments ownership for passive DB snapshot reads when approved, while callback persistence, Cliplot-local writes, and live status writes remain blocked.

```bash
npm run readiness:payment-storage -- https://cliplot.alfares.cz
```

`GET /api/payments/status-persistence-decision` is the read-only ownership
approval packet. It compares Payments-owned, Cliplot-local, and Orders-owned
options and currently recommends `shared-payments-source-of-truth`. It must
return `decision_recorded_approval_required`, `mutation=false`,
`persistence=false`, and `providerCall=false`. The packet must mark
`07_decisions/ADR-002-payment-status-persistence-ownership.md` as recorded and may show `owner_approved_shared_payments_source_of_truth` when the approval ID is configured. That approval allows passive Payments DB snapshot reads only; it does not approve callback persistence, provider-backed reads, or Cliplot-local storage writes.

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
`approved_order_payment_status_mapping_ownership` when ADR-006 owner metadata is configured, with `mutation=false`, `persistence=false`, `providerCall=false`, `runtimeReadEnabled=true`, `paymentsSnapshotReadEnabled=true`, `storageRead=false`, and `callbackPersistence=false`. The packet keeps Orders authoritative for order lifecycle, Payments authoritative for payment status, and Cliplot a non-authoritative customer-safe renderer. It
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

## Notification-Send Approval Evidence

Before recording `CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID`, run:

```bash
npm run readiness:notification-send-approval -- https://cliplot.alfares.cz
```

The packet must use only `/notifications/validate` and may return either
`ready_for_owner_notification_send_approval_metadata` before metadata acceptance
or `approved_notification_send_metadata_execution_disabled` after
`CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID` is recorded. It must prove
`validated_no_send`, `mutation=false`, `providerCall=false`,
`notificationSent=false`, `ENABLE_LIVE_NOTIFICATIONS=false`, and
`liveExecutionAllowed=false`. It does not call `/notifications/send` and does
not authorize live notification sends without a separate bounded execution
window.

## Payment-Create Approval Evidence

Before recording `CLIPLOT_LIVE_PAYMENT_APPROVAL_ID`, run:

```bash
npm run readiness:payment-create-approval -- https://cliplot.alfares.cz
```

The packet must use only `/payments/validate-create` and may return either
`ready_for_owner_payment_create_approval_metadata` before metadata acceptance or
`approved_payment_create_metadata_execution_disabled` after
`CLIPLOT_LIVE_PAYMENT_APPROVAL_ID` is recorded. It must prove `valid=true`,
`mutation=false`, `providerCall=false`, `ENABLE_LIVE_PAYMENT_CREATE=false`, and
`liveExecutionAllowed=false`. It does not call `/payments/create` and does not
authorize live payment creation without a separate bounded execution window.

## Bounded Payment-Create Execution Window

This lane is the controlled alternative to metadata-only payment approval. It
prepares the owner-approved execution window without enabling live checkout by
default.

```bash
npm run readiness:payment-create-execution-window -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/payments/create-execution-window-packet
```

The packet and executor stub must stay non-mutating and return
`liveExecutionAllowed=false` outside an approved window. Production records
`CLIPLOT_LIVE_PAYMENT_APPROVAL_ID` and
`CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW` as metadata while keeping execution
disabled. The default production state must keep
`ENABLE_LIVE_PAYMENT_CREATE=false`, `ENABLE_LIVE_ORDER_SUBMIT=false`,
`ENABLE_LIVE_NOTIFICATIONS=false`, and
`ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`. The bounded window requires all of
these before any future live payment create can be wired: the payment approval
metadata, a concrete execution window, a request idempotency key,
`duplicateCheck=IDEMPOTENCY_KEY_NOT_USED`,
`rollbackPlan=PAYMENT_VOID_OR_CANCEL_OWNER_ASSIGNED`, and
`validationPlan=EXACTLY_ONE_PAYMENT_RESULT_BY_IDEMPOTENCY_KEY`.

The executor endpoint is `POST /api/payments/create-bounded-executor`. In this
branch it is intentionally a guarded stub: it returns `approval_required`,
`paymentCreated=false`, `mutation=false`, `persistence=false`, and
`providerCall=false`. It must not call `/payments/create`, create Orders,
reserve Warehouse stock, send notifications, persist callbacks/status writes,
read `/payments/{paymentId}`, or print `PAYMENT_API_KEY` or raw provider/customer
payloads.

Rollback owner defaults to `CLIPLOT_PAYMENT_CREATE_ROLLBACK_OWNER` or
`cliplot-payment-operator`. Validation owner defaults to
`CLIPLOT_PAYMENT_CREATE_VALIDATION_OWNER` or `cliplot-validation-owner`. The
post-window validation evidence must prove exactly one payment result for the
approved idempotency key without exposing raw provider payloads.

## Bounded Notification-Send Execution Window

This lane is the controlled alternative to metadata-only notification approval.
It prepares an owner-approved notification-send window without enabling full
checkout by default.

```bash
npm run readiness:notification-send-execution-window -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/notifications/send-execution-window-packet
```

The packet and executor stub must stay non-mutating and return
`liveExecutionAllowed=false` outside an approved window. Production records
`CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID` and
`CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW` as metadata while keeping execution
disabled. The default production state must keep
`ENABLE_LIVE_NOTIFICATIONS=false`, `ENABLE_LIVE_ORDER_SUBMIT=false`,
`ENABLE_LIVE_PAYMENT_CREATE=false`, and
`ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`. The bounded window requires all of
these before any future live notification send can be wired: the notification
approval metadata, a concrete execution window, a request idempotency key,
`duplicateCheck=IDEMPOTENCY_KEY_NOT_USED`,
`rollbackPlan=NOTIFICATION_DUPLICATE_RESPONSE_OWNER_ASSIGNED`, and
`validationPlan=EXACTLY_ONE_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEY`.

The executor endpoint is `POST /api/notifications/send-bounded-executor`. In
this branch it is intentionally a guarded stub: it returns `approval_required`,
`notificationSent=false`, `mutation=false`, `persistence=false`, and
`providerCall=false`. It must not call `/notifications/send`, create payments,
create Orders, reserve Warehouse stock, persist send state, or print
`NOTIFICATIONS_SERVICE_TOKEN`, raw recipients, or raw message payloads.

Rollback owner defaults to `CLIPLOT_NOTIFICATION_SEND_ROLLBACK_OWNER` or
`cliplot-notification-operator`. Validation owner defaults to
`CLIPLOT_NOTIFICATION_SEND_VALIDATION_OWNER` or `cliplot-validation-owner`. The
post-window validation evidence must prove exactly one notification result for
the approved idempotency key without exposing raw recipient or message payloads.



## Full Live Checkout Execution Window

The full checkout execution-window packet combines the existing order/Warehouse,
payment-create, notification-send, activation, and revenue-closure evidence into
one non-mutating operator packet:

```bash
npm run readiness:live-checkout-execution-window -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/checkout/live-execution-window-packet
```

The packet and `POST /api/checkout/live-bounded-executor` stub must return
`approval_required` or `approved_live_checkout_execution_window_metadata_execution_disabled`,
`liveExecutionAllowed=false`, `mutation=false`, `persistence=false`,
`providerCall=false`, `orderCreated=false`, `warehouseReserved=false`,
`paymentCreated=false`, and `notificationSent=false` until a separately
approved execution window opens. Production records
`CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW` as metadata while keeping all checkout
live flags false. The bounded executor still requires all checkout live flags,
order/payment/notification idempotency keys,
`duplicateCheck=IDEMPOTENCY_KEYS_NOT_USED`, rollback owners for order,
Warehouse, payment and notification, and validation owners for exactly one
result per idempotency key.

The live flag-window checklist is read-only and exists to review a future
operator action before any live flags are opened:

```bash
npm run readiness:live-flags-operator-preflight -- https://cliplot.alfares.cz
curl -s https://cliplot.alfares.cz/api/checkout/live-flags-operator-preflight-checklist-packet
```

It must report `approved_live_flags_operator_preflight_checklist_execution_disabled`
only while full checkout metadata is ready, all four live flags remain false,
live preflight is still blocked, revenue closure is still approval-required, and
no mutation/provider/persistence side effect has occurred. The checklist names
the temporary flag set, restore flag set, required operator request fields,
pre-open validation, and post-close validation. It is not permission to call
checkout, Orders, Warehouse, Payments, or Notifications mutation endpoints.

## Controlled Orders/Warehouse Smoke Evidence

The 2026-07-03 controlled `CREATE_REPLAY_CANCEL` smoke completed with
`status=live_order_warehouse_smoke_completed`, external order
`cliplot-live-smoke-1783034121293`, and order
`cd311dc8-d13a-4daa-81a8-c7d63b9dcbad`. Required cleanup evidence was present:
same order id on replay, order readback `status=cancelled`, Warehouse handoff
`status=cancelled`, and reservation readback `activeReservationCount=0`.
Payment creation and notification send remained outside scope and returned
`false`. This evidence backs `CLIPLOT_LIVE_ORDER_APPROVAL_ID=owner-approved-2026-07-03-live-order-warehouse-create-replay-cancel`
only. After the run, `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE` must be verified back to
`false` and `npm run readiness:live-smoke-executor -- https://cliplot.alfares.cz`
must return `approval_required` with no mutation.

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


### Configured SKU Scope Approval

`GET /api/products/filter-readiness` may return
`approved_cliplot_product_filter_scope` when `CLIPLOT_PRODUCT_SCOPE_APPROVAL_ID`
is configured and the configured Catalog products are Warehouse-backed. This is
read-only scope evidence only. It does not authorize live order creation,
Warehouse reservation, payment creation, notification sends, callback
persistence, provider-refresh reads, or live smoke execution.


### Payments Read-Scope Rate Limits

`npm run readiness:payment-read-scope` prefers fresh synthetic missing-order 404
evidence from Payments. If Payments returns 429, Cliplot may use
`validated_payments_read_scope_no_mutation_cached` only when the running process
has a recent successful proof. Treat `freshness.status=stale_rate_limited` as a
signal to reduce probe frequency or tune service-account throttling; it is not a
provider-backed payment read and does not enable live mutations.
