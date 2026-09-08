# GOAL-04 Execution Plan: Kubernetes, Vault, and RAG Deployment

## Vision

Cliplot runs as a first-class Alfares Kubernetes service with Vault-projected
secrets and Docs/RAG coverage, while commerce mutation stays guarded.

## Goal Impact

- Replaces the deploy scaffold with a validated deploy path.
- Turns the unsynced ExternalSecret into a synced, presence-verified secret.
- Makes Cliplot documentation retrievable through Docs/RAG.
- Records the real Orders and Payments contract findings that block GOAL-05.

## Scope

Allowed:

- `k8s/configmap.yaml`, `k8s/deployment.yaml`, `k8s/service.yaml`,
  `k8s/ingress.yaml`, `k8s/external-secret.yaml`;
- `scripts/vault_secret_presence_gate.py`;
- `scripts/publish_docs_rag.sh`;
- `scripts/deployment_readiness_gate.py`;
- `scripts/deploy.sh`;
- `docs/**`, `GOALS.md`, `implementation-goals/GOAL-04-*`.

Forbidden:

- No secret values in output, logs, docs, or commits.
- No live order submit, payment creation, stock mutation, or notification send.
- No invented service contracts.

## Contract Findings To Record

- Orders create endpoint is `POST /api/orders`, not `/api/orders/guest`.
- Orders requires `contractVersion: "orders.create.v1"`, `channel`,
  `externalOrderId`, `channelAccountId`, `items[].title`,
  `items[].quantity`, `items[].unitPrice`, and `totals.total/currency`.
- Payments `POST /payments/create` requires an Auth-issued RS256 service JWT in
  `Authorization: Bearer` for the `(cliplot -> payments)` pair, plus an allowed
  `applicationId`, per
  [`SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md).
  Do not use `X-API-Key` / `PAYMENT_API_KEY` as Payments S2S credentials.
- Warehouse requires an Auth-issued Bearer service JWT with an explicit warehouse
  role per the same standard.
- Notifications requires an Auth-issued Bearer service JWT plus an approved
  channel/template per the same standard.

## Implementation Steps

1. Complete the Kubernetes manifest set and keep the secret mount optional.
2. Add the Vault presence gate that reports key names and status only.
3. Create `secret/prod/cliplot-service` with required key names.
4. Confirm `cliplot-service-secret` reaches `SecretSynced=True`.
5. Add Docs/RAG publication with a non-mutating preflight phase.
6. Tighten the deployment readiness gate to require platform scripts.
7. Add the contract-ready `orders.create.v1` payload shape, live submit off.
8. Deploy, then run non-mutating public smoke.

## Sensitive Data

Only key names, presence, and sync status may be recorded. Values may not.

## Contract Impact

No live shared-service contract is mutated. Findings are recorded as blockers
for GOAL-05.

## Replay/Determinism

The Vault presence gate, readiness gate, and Docs/RAG preflight are rerunnable
and non-mutating.

## Parallelization

| Lane | Can start | Owner | Write ownership | Validation |
| --- | --- | --- | --- | --- |
| Kubernetes manifests | yes | Orchestrator | `k8s/**` | `kubectl apply --dry-run` |
| Vault presence | yes | Orchestrator | `scripts/vault_secret_presence_gate.py` | presence gate pass |
| Docs/RAG publication | yes | Orchestrator | `scripts/publish_docs_rag.sh` | preflight then publish |
| Contract discovery | yes | Subagents | read-only shared services | findings recorded in context package |

Shared state files are integrated by the orchestrator.

## Validation Plan

1. `npm run build`.
2. `python3 scripts/pre_coding_gate.py --root .`.
3. `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`.
4. `python3 scripts/deployment_readiness_gate.py --root .`.
5. `python3 scripts/vault_secret_presence_gate.py --allow-missing`.
6. `./scripts/publish_docs_rag.sh cliplot`.
7. Kubernetes dry-run for every changed manifest.
8. `./scripts/deploy.sh`.
9. Public smoke for `/health`, `/api/integrations/readiness`, and guarded
   `/api/checkout/submit`.

## Handoff Notes

GOAL-04 is complete when the service is deployed, the secret is synced and
presence-verified, Docs/RAG retrieval for repoName `cliplot` works, and
checkout is still guarded. GOAL-05 stays blocked on provider-backed payment
evidence and the recorded Catalog, Warehouse, and Notifications blockers.
