# GOAL-04: Kubernetes, Vault, RAG Deployment

## Objective

Make Cliplot deployable in Kubernetes with Vault-backed secrets and docs-rag
documentation publication.

## Status

Active.

## Planned Scope

- Dockerfile.
- Kubernetes deployment/service/ingress/configmap/external-secret.
- Vault path and ExternalSecret key mapping.
- `./scripts/deploy.sh` active deployment.
- health endpoint.
- RAG documentation publication.
- public smoke.
- repeatable Vault presence gate.
- repeatable docs-rag publication script.
- contract-ready Cliplot order payload shape while live submit remains off.

## Parallel Execution

| Lane | Status | Owner | Scope | Validation |
| --- | --- | --- | --- | --- |
| GOAL-04 platform docs/scripts | active | Orchestrator | Cliplot repo docs/scripts | Gates and dry-run. |
| Orders Cliplot support | running | Orders worker | `orders-microservice` only | Worker build/test/commit evidence. |
| Payments Cliplot allowlist | running | Payments worker | `payments-microservice` only | Worker build/test/commit evidence. |
| Warehouse/Notifications contract | done/read-only | Explorer | Read-only report | Blockers recorded. |
| Auth/Catalog/RAG contract | done/read-only | Explorer | Read-only report | Blockers recorded. |

## Blockers

- GOAL-02 app source.
- GOAL-03 runtime contracts.
- `[MISSING: Vault values at secret/prod/cliplot-service]`
- `[MISSING: docs-rag publication path/token]`
- `[BLOCKED: docs-rag embedding backend at 192.168.88.53:11434 refused connection]`
- `[MISSING: Orders support for cliplot-service internal caller and channel cliplot]`
- `[MISSING: Payments allowlist for cliplot-service and https://cliplot.alfares.cz]`
- `[MISSING: Catalog product scope/service-auth path for Cliplot product reads]`
