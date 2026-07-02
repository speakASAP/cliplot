# Validation Debt

## Active Debt

### VD-001: Deployment readiness blocked

Status: resolved by GOAL-02/GOAL-03 frontend and guarded integration
deployment artifacts.

Evidence:

```text
DEPLOYMENT_READINESS=blocked
MISSING Dockerfile
MISSING k8s/deployment.yaml
MISSING k8s/service.yaml
MISSING k8s/ingress.yaml
MISSING k8s/configmap.yaml
MISSING k8s/external-secret.yaml
```

Resolution target: resolved; remaining work is revenue readiness, not base
deployment readiness.

### VD-002: Shared service identity contract incomplete

Status: partially resolved by GOAL-03, GOAL-04, and GOAL-05 guarded
validation lanes. Warehouse-derived `warehouseId` propagation is validated, but
this debt still blocks live order creation, live stock reservation, live
notification send, owner-specific product scope, and live provider payment
evidence.

Missing facts:

- Owner-specific Catalog product scope or marketplace key.
- Approved live order-create and Warehouse reservation evidence for Cliplot.
- Provider-backed payment evidence.
- Auth client/callback policy.
- Approved live notification send validation for Cliplot order confirmations.

Resolution target: GOAL-05 for provider-backed payment/order evidence, with
Vault values prepared through GOAL-04.

No-send notification validation evidence:

```text
notifications-microservice POST /notifications/validate deployed
cliplot-service commit=fef5fd8
readiness.notificationValidation=enabled_no_send
checkout.notificationValidation.status=validated_no_send
checkout.notificationValidation.mutation=false
checkout.notificationValidation.providerCall=false
checkout.notificationValidation.notificationSent=false
```

Warehouse routing propagation evidence:

```text
cliplot-service commit=da5d9cf
image=localhost:5000/cliplot-service:da5d9cf
/api/products firstWarehouseId=c0de0000-0000-4000-8000-000000000013
/api/products firstWarehouseType=own
/api/products firstAvailableStock=63
checkout.orderPreview.items[0].warehouseId=c0de0000-0000-4000-8000-000000000013
checkout.orderValidation.status=validated_no_mutation
checkout.orderValidation.warehouseMutation=false
warehouseAvailabilityBeforeAfterUnchanged=true
```

No-mutation order validation evidence:

```text
orders-microservice POST /api/orders/validate-create deployed
orders-microservice commit=0611e4c
cliplot-service commit=80e23c5
readiness.orderValidation=enabled_no_mutation
checkout.orderValidation.status=validated_no_mutation
checkout.orderValidation.mutation=false
checkout.orderValidation.orderCreated=false
checkout.orderValidation.warehouseMutation=false
checkout.orderValidation.eventPublished=false
```

### VD-003: Cliplot Vault path missing

Status: resolved by GOAL-04.

Evidence:

```text
ExternalSecret cliplot-service-secret: SecretSyncedError
Vault key: secret/prod/cliplot-service
Message: Secret does not exist
```

Resolution target: GOAL-04.

### VD-004: Docs/RAG embedding backend unavailable

Status: resolved by Docs/RAG Ollama endpoint `http://192.168.88.53:11435` and
validated preflight.

Evidence:

```text
DOCS_RAG_PREFLIGHT=pass
embeddingBackendUrl=http://192.168.88.53:11435
embeddingHttp=200
```

Resolution target: complete.

### VD-005: Cliplot unsupported by Orders and Payments live contracts

Status: resolved by Orders `971a446` and Payments `eab6ae7` deployments.

Evidence:

```text
Orders endpoint is POST /api/orders with orders.create.v1.
Orders allowed channels do not include cliplot.
Orders allowed internal callers do not include cliplot-service.
Payments allowlists do not include cliplot-service or https://cliplot.alfares.cz.
```

Resolution target: Orders and Payments service patches plus deployment.

### VD-006: Cliplot Catalog scope missing

Status: authenticated Catalog reads are resolved; owner-specific product
filtering still needs approval.

Evidence:

```text
Catalog requires authentication for product APIs.
Catalog supports marketplace keys allegro, bazos, aukro, flipflop, heureka.
Catalog has no cliplot marketplace key.
Cliplot /api/products returns `catalogSource=catalog` with Catalog UUID products and Warehouse `warehouseId` evidence.
Catalog accepts x-internal-service-token plus x-service-name through the
Auth-owned CATALOG_INTERNAL_SERVICE_TOKEN pattern.
```

Resolution target: add an approved Cliplot SKU/filtering scope when product ownership rules are available.

### VD-007: Docs RAG publication backend unavailable

Status: resolved for controlled single-repo Cliplot ingestion.

Evidence:

```text
./scripts/publish_docs_rag.sh cliplot
DOCS_RAG_PUBLICATION=pass
jobId=7a03ada9-9b99-4ef7-8223-5c5a298244f5
chunksProcessed=76
chunksTotal=76
retrieval.search.http=200 count=5
retrieval.agentContext.http=200 count=6
```

Resolution target: complete for repoName `cliplot`; trigger-all registry
coverage remains separate shared-service work.

### VD-004: Cliplot 008bacf rollout blocked by node ContainerCreating

Status: resolved by redeploy after node/container runtime recovered.

Evidence:

```text
prior blocker: cliplot-service-78cf5d95db stuck ContainerCreating with unrelated pending pods
current image=localhost:5000/cliplot-service:83f251c
rolloutStatus=success
pod=cliplot-service-b7b54f454-p9tt9 ready=1/1 restarts=0
checkout.warehouseReservationReadiness.status=validated_no_mutation
checkout.warehouseReservationReadiness.mutation=false
checkout.warehouseReservationReadiness.reservationCreated=false
checkout.warehouseReservationReadiness.stockMutation=false
availabilityUnchanged=true
```

Resolution target: resolved for no-mutation readiness. Live order-create and
Warehouse reservation execution evidence remains intentionally blocked until
approved live mutation validation exists.


Guarded checkout intent smoke evidence:

```text
cliplot-service commit=07a3bfe
npm run smoke:checkout -- https://cliplot.alfares.cz
checkoutHttpStatus=202
checkoutStatus=service_identity_required
externalOrderId preserved
orderValidation=validated_no_mutation
paymentValidation=validated_no_mutation
notificationValidation=validated_no_send
warehouseReservationReadiness=validated_no_mutation
mutation=false
```
