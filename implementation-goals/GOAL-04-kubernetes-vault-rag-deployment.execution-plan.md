# GOAL-04 Execution Plan: Kubernetes, Vault, RAG Deployment

## Vision

Cliplot should be operationally repeatable: deployable from the repo, protected
by Vault/ExternalSecrets, documented in docs-rag, and honest about platform
blockers before live commerce is enabled.

## Goal Impact

- Converts GOAL-03 scaffolding into repeatable platform checks.
- Publishes or attempts to publish Cliplot docs into the ecosystem RAG surface.
- Records cross-service blockers discovered from Orders, Payments, Warehouse,
  Notifications, Auth, Catalog, and Docs/RAG.
- Aligns Cliplot's future live order payload with the actual Orders contract
  while keeping live order/payment mutation disabled.

## Scope

Allowed:

- Add Vault presence gate script.
- Add docs-rag publication script.
- Update deployment readiness gate to require those scripts.
- Update Cliplot order create path/payload shape for `orders.create.v1`.
- Update GOAL-04 docs, runbook, RAG plan, Vault plan, validation debt, and state.

Forbidden:

- No secret values in repository or logs.
- No live payment creation.
- No stock reservation/decrement.
- No notification send.
- No enabling `ENABLE_LIVE_ORDER_SUBMIT=true`.
- No direct mutation of Orders/Payments/Catalog/Auth from the Cliplot repo.

## Parallel Workstreams

| Workstream | Status | Files/Repo | Owner | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| Cliplot platform scripts | ready now | `cliplot-service/scripts/**` | Orchestrator | GOAL-03 | Script syntax and gate output. |
| Cliplot docs/state | ready now | `cliplot-service/docs/**`, `implementation-goals/**` | Orchestrator | Contract reports | Strict doc audit. |
| Cliplot order payload prep | ready now | `cliplot-service/src/integrations.js`, `k8s/configmap.yaml` | Orchestrator | Orders contract report | `npm run build`, guarded smoke. |
| Orders support | running | `orders-microservice` | Orders worker | Repo-specific validation | Worker report. |
| Payments support | running | `payments-microservice` | Payments worker | Repo-specific validation | Worker report. |
| Docs/RAG ingestion | done | `docs-rag-microservice` runtime | Platform owner/orchestrator | Embedding backend reachable; repoName `cliplot` ingestion passed | Publication and retrieval evidence. |

## Validation Plan

1. `npm run build`.
2. `python3 scripts/pre_coding_gate.py --root .`.
3. `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`.
4. `python3 scripts/deployment_readiness_gate.py --root .`.
5. `python3 scripts/vault_secret_presence_gate.py --allow-missing`.
6. `./scripts/publish_docs_rag.sh cliplot` and record pass/fail.
7. Kubernetes dry-run for changed manifests.
8. Temporary runtime smoke for guarded checkout payload.
9. Commit and deploy only if Cliplot gates pass.

## Handoff

Docs/RAG ingestion is now validated for repoName `cliplot`. GOAL-05 cannot enable live checkout until
Orders, Payments, Catalog, Warehouse, Notifications, Auth, and Vault blockers
are resolved.
