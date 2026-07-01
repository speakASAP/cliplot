# Goals

## Goal Model

Cliplot implementation is goal-driven. Work proceeds through
`implementation-goals/README.md`, not ad hoc edits.

## Goal Roadmap

| Goal | Status | Outcome |
| --- | --- | --- |
| `GOAL-01-orchestration-foundation` | active | Remote repo, IPS guardrails, design contract, RAG/Vault/deploy planning, and gates exist. |
| `GOAL-02-storefront-foundation` | planned | First static storefront slice matching the design contract. |
| `GOAL-03-shared-service-integration` | planned | Catalog, stock, cart/order, payments, notifications, auth boundaries wired safely. |
| `GOAL-04-kubernetes-vault-rag-deployment` | planned | Kubernetes manifests, Vault/ESO integration, deploy script, RAG publication, runtime smoke. |
| `GOAL-05-checkout-revenue-readiness` | blocked | Provider-backed checkout evidence without fake payment success. |
| `GOAL-06-operational-closure` | blocked | Monitoring, runbook, validation, final handoff, and clean state. |

## Goal Closure Rule

Every completed goal must include:

- execution plan;
- context package;
- coding prompt when implementation or delegation occurs;
- validation report;
- Intent Compliance Report;
- updated `docs/IMPLEMENTATION_STATE.md`;
- git commit.
