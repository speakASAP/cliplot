# GOAL-04: Kubernetes, Vault, and RAG Deployment

## Objective

Make Cliplot a fully deployable Kubernetes service with Vault-backed secret
projection and reproducible Docs/RAG publication, while checkout live mutation
stays disabled.

## Scope

Allowed:

- Kubernetes manifests for configmap, deployment, service, ingress, and
  ExternalSecret;
- Vault path `secret/prod/cliplot-service` with required key names only;
- `scripts/vault_secret_presence_gate.py` presence checking without value
  disclosure;
- `scripts/publish_docs_rag.sh` for Docs/RAG publication;
- deployment readiness gate updates requiring platform scripts;
- contract-ready `orders.create.v1` payload shape with live submit disabled.

Forbidden:

- printing, committing, or copying secret values;
- enabling `ENABLE_LIVE_ORDER_SUBMIT`;
- live payment creation, stock mutation, or customer notification sends;
- inventing Orders, Payments, or Catalog contracts.

## Acceptance Criteria

- `cliplot-service` deployment is ready and available in `statex-apps`.
- `cliplot-service-secret` reports `SecretSynced=True` once the Vault path
  exists.
- Vault presence gate returns `VAULT_SECRET_PRESENCE=pass` without printing
  values.
- Docs/RAG publication path is reproducible and repoName `cliplot` ingestion
  is validated.
- Pod env presence check confirms expected secret keys and
  `ENABLE_LIVE_ORDER_SUBMIT=false`.
- Non-mutating public smoke passes for `/health`,
  `/api/integrations/readiness`, and `/api/checkout/submit`.

## Intent Compliance

This goal makes Cliplot operationally real — deployed, secret-backed, and
discoverable through Docs/RAG — without moving any commerce mutation boundary.

## Blockers

- `[MISSING: Catalog product scope/service-auth path for Cliplot product reads]`
- `[MISSING: Warehouse Auth role token for Cliplot stock reads/mutations]`
- `[MISSING: Notification channel/template contract for Cliplot order confirmations]`
