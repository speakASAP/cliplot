# Cliplot Implementation Goals

## Lifecycle

```text
backlog -> ready -> active -> validating -> done
                    \-> blocked
```

## Ordered Goals

| Goal | Status | Dependency | Outcome |
| --- | --- | --- | --- |
| `GOAL-01-orchestration-foundation` | done | none | Remote repo, guardrails, docs, design contract, gates, deploy scaffold. |
| `GOAL-02-storefront-foundation` | validating | GOAL-01 | First static storefront slice matching design contract. |
| `GOAL-03-shared-service-integration` | planned | GOAL-02 | Catalog/stock/cart/order/payment/notifications/auth integration. |
| `GOAL-04-kubernetes-vault-rag-deployment` | planned | GOAL-03 platform-ready subset | Deployable Kubernetes service with Vault and RAG docs. |
| `GOAL-05-checkout-revenue-readiness` | blocked | GOAL-03/04 plus owner/provider evidence | Provider-backed payment and order evidence. |
| `GOAL-06-operational-closure` | blocked | GOAL-05 | Monitoring, runbook, smoke, final handoff. |

## Before Coding

Run:

```bash
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
```

Coding is blocked when active goal artifacts or execution-critical facts are
missing.

## Before Deployment

Run:

```bash
python3 scripts/deployment_readiness_gate.py --root .
./scripts/deploy.sh
```

## Parallel Execution Rule

If two or more lanes can run with disjoint file ownership, create agent-ready
lanes and use subagents. Keep integration/state files owned by the orchestrator.
