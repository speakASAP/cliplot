# GOAL-06 Operational Closure Context Package

## Repository

Remote source of truth: `/home/ssf/Documents/Github/cliplot` on `alfares`.

## Current Runtime Contract

- Public URL: `https://cliplot.alfares.cz`.
- Checkout is guarded.
- `/api/checkout/live-preflight` must return `blocked` and `wouldMutate=false`
  until live approval evidence exists.
- Docs/RAG publication must start with non-mutating preflight.
- Scheduled Kubernetes readiness must remain endpoint-only and read-only.

## Required Evidence

- `npm run check`
- `npm run build`
- `python3 scripts/pre_coding_gate.py --root .`
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`
- `python3 scripts/deployment_readiness_gate.py --root .`
- `npm run readiness:bundle`
- `npm run readiness:k8s -- https://cliplot.alfares.cz`
- `kubectl apply --dry-run=server -f k8s/readiness-cronjob.yaml -n statex-apps`
- `kubectl get cronjob cliplot-readiness-monitor -n statex-apps`
- `npm run smoke:checkout -- https://cliplot.alfares.cz`
