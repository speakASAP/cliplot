# Operational Runbook

## Remote Access

```bash
ssh alfares
cd /home/ssf/Documents/Github/cliplot-service
```

One-off:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot-service && <command>'
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
kubectl get pods -n statex-apps -l app=cliplot-service
kubectl get ingress -n statex-apps cliplot-service
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
kubectl get externalsecret -n statex-apps cliplot-service-secret
kubectl get secret -n statex-apps cliplot-service-secret
python3 scripts/vault_secret_presence_gate.py --allow-missing
```

Do not print secret values.

## Docs/RAG Publication

```bash
./scripts/publish_docs_rag.sh cliplot-service
```

Known current blocker: docs-rag ingestion may fail while
`OLLAMA_URL=http://192.168.88.53:11434` refuses connections.

## Checkout Contract Status

- Orders create endpoint: `POST /api/orders`.
- Required order contract: `orders.create.v1`.
- Cliplot live submit remains disabled until Orders accepts
  `cliplot-service` and channel `cliplot`, Payments allowlists
  `cliplot-service`, Catalog product scope is approved, and Vault values are
  populated.
