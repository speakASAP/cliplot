# GOAL-02 Coding Prompt

Build the Cliplot frontend-first storefront.

Allowed files:

- `package.json`
- `Dockerfile`
- `.dockerignore`
- `src/**`
- `public/**`
- `k8s/configmap.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/ingress.yaml`
- `scripts/deploy.sh`
- `scripts/deployment_readiness_gate.py`
- GOAL-02 docs and validation reports.

Forbidden:

- payment provider code;
- live order creation;
- stock reservation/decrement;
- production secrets;
- modifying other repositories.

Expected output:

- storefront runs on port `8080`;
- `/health` returns JSON ok;
- `/api/products` returns products with safe fallback;
- checkout preview is non-mutating;
- Kubernetes deployment serves `cliplot.alfares.cz`.
