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

### VD-002: Shared service identity contract missing

Status: partially resolved by GOAL-03 service identity scaffolding; still
blocks live order/payment/stock/notification mutation.

Missing facts:

- Catalog marketplace key.
- Orders channel/account.
- Payment applicationId and callback keys.
- Auth client/callback policy.
- Warehouse service token/default warehouse.
- Notification sender/template contract.

Resolution target: GOAL-05 for provider-backed payment/order evidence, with
Vault values prepared through GOAL-04.

### VD-003: Cliplot Vault path missing

Status: blocks secret sync and live shared-service mutation.

Evidence:

```text
ExternalSecret cliplot-service-secret: SecretSyncedError
Vault key: secret/prod/cliplot-service
Message: Secret does not exist
```

Resolution target: GOAL-04.

### VD-004: Docs/RAG embedding backend unavailable

Status: blocks Cliplot documentation ingestion and retrieval.

Evidence:

```text
docs-rag OLLAMA_URL=http://192.168.88.53:11434
Error: connect ECONNREFUSED 192.168.88.53:11434
```

Resolution target: restore the Ollama endpoint or migrate docs-rag embeddings to
an available in-cluster embedding service.

### VD-005: Cliplot unsupported by Orders and Payments live contracts

Status: blocks live order/payment mutation.

Evidence:

```text
Orders endpoint is POST /api/orders with orders.create.v1.
Orders allowed channels do not include cliplot.
Orders allowed internal callers do not include cliplot-service.
Payments allowlists do not include cliplot-service or https://cliplot.alfares.cz.
```

Resolution target: Orders and Payments service patches plus deployment.

### VD-006: Cliplot Catalog scope missing

Status: blocks real product catalog.

Evidence:

```text
Catalog requires authentication for product APIs.
Catalog supports marketplace keys allegro, bazos, aukro, flipflop, heureka.
Catalog has no cliplot marketplace key.
Cliplot /api/products currently returns fallback product IDs.
```

Resolution target: approved Catalog product scope and service-auth path for
Cliplot.
