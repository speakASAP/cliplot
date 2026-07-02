# GOAL-06 Operational Closure Coding Prompt

Implement operator-safe readiness automation for Cliplot.

Current increment: add a Kubernetes scheduled endpoint monitor that complements the full operator readiness bundle.

Constraints:

- Do not enable live mutations.
- Do not call Docs/RAG ingestion from the bundle.
- Fail closed before checkout POST smoke if live preflight is not guarded.
- Treat Docs/RAG preflight exit `2` as operational blocked, not pass.
- Never print secret values.
- The Kubernetes CronJob must not use `POST`, run Docs/RAG ingestion, run `readiness:bundle`, create orders, create payments, persist payment callbacks, reserve Warehouse stock, or send notifications.
- The Kubernetes CronJob should use only in-app HTTP GET readiness endpoints and no Kubernetes API permissions.

Validation:

```bash
bash -n scripts/readiness_bundle.sh
npm run check
npm run build
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
npm run readiness:bundle
npm run readiness:k8s -- https://cliplot.alfares.cz
kubectl apply --dry-run=server -f k8s/readiness-cronjob.yaml -n statex-apps
```
