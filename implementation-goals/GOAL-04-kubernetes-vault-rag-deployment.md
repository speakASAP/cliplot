# GOAL-04: Kubernetes, Vault, RAG Deployment

## Objective

Make Cliplot deployable in Kubernetes with Vault-backed secrets and docs-rag
documentation publication.

## Planned Scope

- Dockerfile.
- Kubernetes deployment/service/ingress/configmap/external-secret.
- Vault path and ExternalSecret key mapping.
- `./scripts/deploy.sh` active deployment.
- health endpoint.
- RAG documentation publication.
- public smoke.

## Blockers

- GOAL-02 app source.
- GOAL-03 runtime contracts.
- `[MISSING: Vault values at secret/prod/cliplot-service]`
- `[MISSING: docs-rag publication path/token]`
