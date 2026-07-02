# GOAL-04: Kubernetes, Vault, RAG Deployment

## Objective

Make Cliplot deployable in Kubernetes with Vault-backed secrets and docs-rag
documentation publication.

## Status

Done.

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
| GOAL-04 platform docs/scripts | done | Orchestrator | Cliplot repo docs/scripts | Gates and dry-run. |
| Orders Cliplot support | done | Orders worker | `orders-microservice` only | Build/test/deploy evidence. |
| Payments Cliplot allowlist | done | Payments worker | `payments-microservice` only | Build/test/deploy evidence. |
| Warehouse/Notifications contract | done/read-only | Explorer | Read-only report | Blockers recorded. |
| Auth/Catalog/RAG contract | done/read-only | Explorer | Read-only report | Blockers recorded. |

## Blockers

- `[RESOLVED: docs-rag embedding backend reachable at http://192.168.88.53:11435]`
- `[MISSING: Catalog product scope/service-auth path for Cliplot product reads]`
