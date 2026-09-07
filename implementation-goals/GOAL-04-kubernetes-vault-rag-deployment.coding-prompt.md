# GOAL-04 Coding Prompt

Make Cliplot deployable on Kubernetes with Vault secret projection and Docs/RAG
publication, using `/home/ssf/Documents/Github/cliplot` as the source of truth.

## Objective

Deploy `cliplot-service` to `statex-apps`, project `secret/prod/cliplot-service`
through ESO, publish repository docs to Docs/RAG, and keep checkout guarded.

## Allowed Files

- `k8s/configmap.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/ingress.yaml`
- `k8s/external-secret.yaml`
- `scripts/deploy.sh`
- `scripts/deployment_readiness_gate.py`
- `scripts/vault_secret_presence_gate.py`
- `scripts/publish_docs_rag.sh`
- `src/**` for the contract-ready order payload shape only
- `GOALS.md`
- `docs/**`
- `implementation-goals/GOAL-04-*`
- `implementation-goals/README.md`

## Forbidden

- Do not print, log, echo, or commit secret values.
- Do not set `ENABLE_LIVE_ORDER_SUBMIT=true`.
- Do not create payments, reserve or decrement stock, or send notifications.
- Do not invent Orders, Payments, Catalog, Warehouse, or Auth contracts.

## Implementation Requirements

- Keep the `cliplot-service-secret` mount optional so the deployment stays
  green while Vault values are missing.
- Add a Vault presence gate that reports key names, presence, and sync status
  only, and supports `--allow-missing`.
- Give Docs/RAG publication a non-mutating preflight phase, selectable with
  `DOCS_RAG_PREFLIGHT_ONLY=1`, that does not call `/ingestion/trigger`.
- Require the platform scripts in the deployment readiness gate.
- Build the `orders.create.v1` payload shape, including a generated Cliplot
  `externalOrderId`, while live submit stays disabled.
- Record Orders, Payments, Warehouse, Notifications, Auth, and Catalog contract
  findings in the GOAL-04 context package.

## Validation Commands

```bash
npm run build
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
python3 scripts/vault_secret_presence_gate.py --allow-missing
DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot
./scripts/publish_docs_rag.sh cliplot
kubectl apply --dry-run=client -f k8s/configmap.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/external-secret.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/deployment.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/service.yaml -n statex-apps
kubectl apply --dry-run=client -f k8s/ingress.yaml -n statex-apps
./scripts/deploy.sh
```

## Expected Output

- `cliplot-service` is ready and available on the deployed image.
- `cliplot-service-secret` reports `SecretSynced=True`.
- Docs/RAG retrieval for repoName `cliplot` returns sources.
- Guarded checkout still returns `service_identity_required`.
