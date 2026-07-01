# cliplot-service

Cliplot is a Czech-first e-commerce storefront planned for:

```text
https://cliplot.alfares.cz/
```

The repository starts as an implementation-governed foundation. Product code is
not allowed until the goal-driven planning and pre-coding gates pass.

## Current Status

- Remote repository: `/home/ssf/Documents/Github/cliplot-service`
- Deployment target: Kubernetes namespace `statex-apps`
- Runtime host: `cliplot.alfares.cz`
- Source mode: remote-first on `alfares`
- Active goal: `GOAL-01-orchestration-foundation`
- Product code status: blocked until pre-coding gates pass for `GOAL-02`

## Intent

Cliplot must be a practical, conversion-focused Czech storefront. It should show
products, prices, stock state, delivery, and purchase actions immediately,
without a generic marketing hero or AI-looking design.

## Shared Service Strategy

Cliplot must reuse the existing Alfares ecosystem:

| Capability | Source |
| --- | --- |
| Product data and canonical content | `catalog-microservice` |
| Product/checkout patterns | `flipflop-service` |
| Stock truth | `warehouse-microservice` |
| Order lifecycle | `orders-microservice` and/or FlipFlop order path |
| Payments | `payments-microservice` |
| Notifications | `notifications-microservice` |
| Auth | `auth-microservice` / shared auth boundary |
| Logs | `logging-microservice` |
| AI content drafts | `ai-microservice`, approval-first only |
| Documentation retrieval | `docs-rag-microservice` |
| Secrets | Vault + ExternalSecrets |

## Required Commands

```bash
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
./scripts/deploy.sh
```

`./scripts/deploy.sh` is intentionally guarded. It blocks until a deployable app,
Kubernetes manifests, Vault-backed secrets, and validation evidence exist.

## Documentation Map

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Agent and orchestrator rules |
| `BUSINESS.md` | Business goal and customer assumptions |
| `SYSTEM.md` | Target architecture and shared services |
| `SPEC.md` | Product and technical specification |
| `GOALS.md` | Goal-level roadmap |
| `PLAN.md` | Detailed implementation plan |
| `docs/DESIGN_CONTRACT.md` | Approved visual and UX direction |
| `docs/INTENT_MEMORY.md` | Preserved original intent and decisions |
| `docs/IMPLEMENTATION_ORCHESTRATOR.md` | Goal-driven operating model |
| `docs/IMPLEMENTATION_STATE.md` | Current checkpoint and next action |
| `docs/RAG_DOCUMENTATION_PLAN.md` | docs-rag publication plan |
| `docs/VAULT_AND_SECRETS.md` | Vault and ExternalSecrets plan |
| `implementation-goals/` | Goal execution artifacts |
| `scripts/` | Guard and deploy scripts |

## Continuation

Use:

```text
CLIPLOT ORCHESTRATOR: continue implementation
```
