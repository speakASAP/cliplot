# GOAL-04 Validation Report

## Status

Done.

## Evidence

2026-07-01 validation on `alfares`:

- `npm run build` passed.
- `python3 scripts/pre_coding_gate.py --root .` passed.
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`
  passed.
- `python3 scripts/deployment_readiness_gate.py --root .` passed.
- `python3 scripts/vault_secret_presence_gate.py --allow-missing` returned
  `VAULT_SECRET_PRESENCE=blocked` for `secret/prod/cliplot-service`.
- `./scripts/publish_docs_rag.sh cliplot` triggered job
  `4a7c1c98-26b9-4f3b-b694-827587ac1473` and returned
  `DOCS_RAG_PUBLICATION=fail` with `error=fetch failed`.
- Temporary checkout smoke returned `service_identity_required` and included a
  generated Cliplot `externalOrderId`.
- `./scripts/deploy.sh` passed and deployed image
  `localhost:5000/cliplot-service:a969cb5`.
- Public smoke from `alfares` passed for `/health`,
  `/api/integrations/readiness`, and `/api/checkout/submit`.
- Kubernetes deployment `cliplot-service` is `1/1` ready/available on image
  `a969cb5`.
- ExternalSecret `cliplot-service-secret` remains `SecretSyncedError` because
  the Vault path is missing.
- Vault path `secret/prod/cliplot-service` was created with required key names;
  no secret values were printed.
- `python3 scripts/vault_secret_presence_gate.py --allow-missing` returned
  `VAULT_SECRET_PRESENCE=pass`.
- `cliplot-service-secret` and `orders-microservice-secret` returned
  `SecretSynced=True`.
- Cliplot pod env presence check confirmed expected secret keys are present and
  `ENABLE_LIVE_ORDER_SUBMIT=false`.
- Orders deployed `localhost:5000/orders-microservice:971a446` with in-pod
  health green and `CLIPLOT_ORDERS_SERVICE_TOKEN` present.
- Payments deployed `localhost:5000/payments-microservice:eab6ae7`; runtime
  allowlists include `cliplot-service` and `https://cliplot.alfares.cz`.

## Expected Outcomes

- Vault presence gate runs without printing values.
- Docs-rag publication path is reproducible and current repoName `cliplot` ingestion is validated.
- Deployment readiness gate requires platform scripts.
- Cliplot checkout live submit remains disabled.
- Future order payload shape matches `orders.create.v1`.

## Known Blockers

- `[RESOLVED: docs-rag embedding backend reachable at http://192.168.88.53:11435]`
- `[MISSING: Catalog product scope/service-auth path for Cliplot product reads]`
- `[MISSING: Warehouse Auth role token for Cliplot stock reads/mutations]`
- `[MISSING: Notification channel/template contract for Cliplot order confirmations]`


2026-07-02 Docs/RAG two-phase preflight hardening:

- `bash -n scripts/publish_docs_rag.sh` passed.
- `python3 scripts/pre_coding_gate.py --root .` passed.
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`
  passed.
- `python3 scripts/deployment_readiness_gate.py --root .` passed.
- `npm run smoke:checkout -- https://cliplot.alfares.cz` passed with guarded
  checkout still returning `service_identity_required`, `mutation=false`,
  `liveCheckoutPreflight=blocked`, and all mutation-plan booleans false.
- `DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh cliplot`
  originally returned a non-mutating blocker that is now superseded:

```text
docsRagStatusHttp=200
embeddingBackendConfigured=true
embeddingBackendUrl=http://192.168.88.53:11434
embeddingReason=embedding_backend_fetch_failed
embeddingError=fetch_failed
DOCS_RAG_PREFLIGHT=blocked
DOCS_RAG_PREFLIGHT_EXIT=2
```

The preflight did not call `/ingestion/trigger`. This old blocker is
superseded by current GOAL-06 evidence: `DOCS_RAG_PREFLIGHT=pass`,
`DOCS_RAG_PUBLICATION=pass`, and retrieval/agent-context sources for repoName
`cliplot`.
