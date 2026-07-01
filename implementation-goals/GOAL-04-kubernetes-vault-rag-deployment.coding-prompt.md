# GOAL-04 Coding Prompt

Implement Cliplot platform hardening in
`/home/ssf/Documents/Github/cliplot-service`.

## Objective

Add repeatable operational scripts and docs for Vault/ExternalSecrets and
docs-rag publication, and align Cliplot's future Orders payload with the
documented `orders.create.v1` contract while keeping live checkout disabled.

## Allowed Files

- `src/integrations.js`
- `k8s/configmap.yaml`
- `scripts/deployment_readiness_gate.py`
- `scripts/vault_secret_presence_gate.py`
- `scripts/publish_docs_rag.sh`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/RAG_DOCUMENTATION_PLAN.md`
- `docs/VAULT_AND_SECRETS.md`
- `docs/OPERATIONAL_RUNBOOK.md`
- `docs/orchestrator/VALIDATION_DEBT.md`
- `GOALS.md`
- `implementation-goals/README.md`
- `implementation-goals/GOAL-04-*`

## Forbidden

- Do not enable `ENABLE_LIVE_ORDER_SUBMIT=true`.
- Do not print or commit secret values.
- Do not start payment creation.
- Do not reserve/decrement stock.
- Do not send notifications.
- Do not patch other service repos from this Cliplot coding prompt.

## Required Behavior

- `ORDERS_CREATE_PATH` defaults to `/api/orders`.
- Future live order body uses `contractVersion: "orders.create.v1"`,
  `externalOrderId`, item `title`, and `totals.total`.
- Vault gate reports key presence only.
- Docs-rag publication script triggers `cliplot-service` ingestion from the
  docs-rag pod and reports pass/fail without exposing JWT.
- Deployment readiness gate requires both operational scripts.

## Validation

```bash
npm run build
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
python3 scripts/vault_secret_presence_gate.py --allow-missing
./scripts/publish_docs_rag.sh cliplot-service
```
