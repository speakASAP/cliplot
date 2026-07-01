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

Status: partially resolved by GOAL-03 and GOAL-04; still blocks live
stock/notification/product/payment evidence.

Missing facts:

- Catalog marketplace key.
- Provider-backed payment evidence.
- Auth client/callback policy.
- Warehouse default warehouse/role validation.
- Notification sender/template contract.

Resolution target: GOAL-05 for provider-backed payment/order evidence, with
Vault values prepared through GOAL-04.

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

Status: blocks Cliplot documentation ingestion and retrieval.

Evidence:

```text
docs-rag OLLAMA_URL=http://192.168.88.53:11434
Error: connect ECONNREFUSED 192.168.88.53:11434
```

Resolution target: restore the Ollama endpoint or migrate docs-rag embeddings to
an available in-cluster embedding service.

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
