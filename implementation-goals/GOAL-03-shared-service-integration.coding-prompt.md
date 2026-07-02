# GOAL-03 Coding Prompt

Implement the Cliplot shared-service integration foundation in
`/home/ssf/Documents/Github/cliplot`.

## Objective

Add deployable service integration boundaries for Catalog, Auth, Orders,
Warehouse, Notifications, Payments, and Vault while keeping all live commerce
mutations disabled until secrets and provider-backed evidence exist.

## Allowed Files

- `src/server.js`
- `src/integrations.js`
- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `package.json`
- `k8s/configmap.yaml`
- `k8s/deployment.yaml`
- `k8s/external-secret.yaml`
- `scripts/deploy.sh`
- `scripts/deployment_readiness_gate.py`
- `scripts/verify-static-assets.js`
- `GOALS.md`
- `docs/**`
- `implementation-goals/GOAL-03-*`
- `implementation-goals/README.md`

## Forbidden

- Do not call payment creation.
- Do not reserve or decrement warehouse stock.
- Do not send customer notifications.
- Do not hardcode credentials.
- Do not mark GOAL-05 as ready.

## Implementation Requirements

- Add `/api/checkout/submit`.
- Return `service_identity_required` with explicit missing facts unless
  `ENABLE_LIVE_ORDER_SUBMIT=true` and required service tokens exist.
- Add `/api/auth/links`.
- Add `/api/integrations/readiness`.
- Keep `/api/products` read-only and resilient.
- Add `k8s/external-secret.yaml` for `secret/prod/cliplot-service`.
- Mount `cliplot-service-secret` as optional in the deployment.
- Keep deployment green while Vault values are missing.

## Validation Commands

```bash
npm run build
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
kubectl apply --dry-run=client -f k8s/configmap.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/external-secret.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/deployment.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/service.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/ingress.yaml -n statex-apps
./scripts/deploy.sh
```
