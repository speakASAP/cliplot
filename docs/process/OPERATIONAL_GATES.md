# Operational Gates

## Gate Types

| Gate | Timing | Blocks on |
| --- | --- | --- |
| Pre-coding | Before product code | Missing goal, execution plan, validation plan, invariants, sensitive-data handling, or execution-critical blockers. |
| Delegation | Before worker coding | Missing context package, coding prompt, disjoint ownership, or expected worker report. |
| Integration | Before merging worker output | Missing validation evidence, conflicting write ownership, unresolved contract issues. |
| Deployment | Before Kubernetes deploy | Missing app, Dockerfile, manifests, Vault/ESO, health check, validation evidence, or deployment approval/evidence. |
| Revenue readiness | Before claiming checkout works | Missing provider-backed payment evidence, order evidence, stock evidence, notification evidence. |

## Required Commands

```bash
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
git diff --check
```

## Failure Policy

Failed gates block the next phase. Do not weaken a gate to pass. Fix the
artifact, split the goal, or record a human-approved exception.
