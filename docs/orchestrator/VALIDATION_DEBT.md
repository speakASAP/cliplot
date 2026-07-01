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
