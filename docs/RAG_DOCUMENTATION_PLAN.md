# RAG Documentation Plan

## Purpose

Cliplot must use `docs-rag-microservice` as the ecosystem documentation
retrieval and storage surface, following the RunLayer/FlipFlop rule: query RAG
before broad source reads when available.

## Initial Retrieval Queries

Before product code, run or record blockers for:

```text
cliplot-service storefront shared FlipFlop catalog payments notifications warehouse auth deployment
```

```text
Vault ExternalSecrets secret/prod cliplot-service Kubernetes statex-apps deploy.sh
```

```text
catalog-microservice marketplace connector flipflop structured_blocks cliplot
```

## Publication Command

Run from `alfares`:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot-service && ./scripts/publish_docs_rag.sh cliplot-service'
```

The script executes inside the docs-rag pod, uses the pod's existing
`JWT_TOKEN`, and does not print token values.

## Publication Plan

Publish or synchronize these docs when the docs-rag ingestion path is confirmed:

- `README.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `SPEC.md`
- `PLAN.md`
- `docs/DESIGN_CONTRACT.md`
- `docs/INTENT_MEMORY.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/VAULT_AND_SECRETS.md`
- active goal execution plans and validation reports.

## Blockers

- `[BLOCKED: docs-rag embedding backend at 192.168.88.53:11434 refused connection]`
- `[MISSING: docs-rag registry entry for cliplot-service]`

Until resolved, keep canonical docs in this repository and query existing RAG
only when available.
