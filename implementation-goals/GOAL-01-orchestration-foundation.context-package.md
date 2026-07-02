# GOAL-01 Context Package

## Repository

`/home/ssf/Documents/Github/cliplot`

## Read Before Work

- `AGENTS.md`
- `README.md`
- `PLAN.md`
- `docs/INTENT_MEMORY.md`
- `docs/DESIGN_CONTRACT.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `implementation-goals/README.md`

## Important Existing Patterns

- RunLayer guardrails: goal state drives continuation.
- FlipFlop constraints: shared services for catalog, stock, orders, payments,
  notifications, auth, logging, and AI.
- Shared Kubernetes patterns: `statex-apps`, Traefik ingress, cert-manager,
  Vault + ExternalSecrets.

## Blockers

Product code is blocked until GOAL-02 planning and pre-coding gate pass.
