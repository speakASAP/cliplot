# GOAL-01 Context Package

## Repository

Remote source of truth:

```text
/home/ssf/Documents/Github/cliplot
```

## Baseline

- The repository does not yet exist at goal start; GOAL-01 creates it.
- No product source code, no deployment, and no Vault values are in scope.
- Cliplot is planned as a Czech e-commerce storefront published at
  `https://cliplot.alfares.cz`.

## Required Context

- `/home/ssf/.claude/CLAUDE.md` for ecosystem operating rules.
- `/home/ssf/Documents/Github/shared/AGENTS.md` for agent-neutral policy.
- `shared/docs/DOCUMENTATION_AUTHORITY.md` for documentation authority.
- Existing Alfares storefront repositories, read-only, for layout and
  deploy-script patterns.
- Owner design mockup, stored under `docs/design/`.

## Produced Artifacts

- Root documentation baseline: `AGENTS.md`, `README.md`, `BUSINESS.md`,
  `SYSTEM.md`, `SPEC.md`, `GOALS.md`, `PLAN.md`.
- Process documentation under `docs/` and `docs/process/`.
- Goal backlog `implementation-goals/README.md` plus GOAL-01 artifacts.
- Gate scripts `scripts/pre_coding_gate.py`,
  `scripts/strict_doc_audit.py`, `scripts/deployment_readiness_gate.py`.
- Guarded deploy scaffold `scripts/deploy.sh` and `k8s/**` placeholders.

## Sensitive Data Rule

No secret values may be printed, committed, or copied into docs. Vault paths
and secret key names may be documented; values may not.

## Blocked Outputs

- Product storefront source, deferred to GOAL-02.
- Shared service integration, deferred to GOAL-03.
- Kubernetes deployment of an unimplemented app, deferred to GOAL-04.
