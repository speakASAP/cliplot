# Validation Debt

## Active Debt

### VD-001: Deployment readiness blocked

Status: expected during GOAL-01.

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

Resolution target: GOAL-04.

### VD-002: Shared service identity contract missing

Status: blocks live integrations.

Missing facts:

- Catalog marketplace key.
- Orders channel/account.
- Payment applicationId and callback keys.
- Auth client/callback policy.
- Warehouse service token/default warehouse.
- Notification sender/template contract.

Resolution target: GOAL-03.
