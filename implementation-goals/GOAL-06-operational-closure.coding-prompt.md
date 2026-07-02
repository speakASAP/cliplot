# GOAL-06 Operational Closure Coding Prompt

Implement an operator-safe readiness bundle for Cliplot.

Constraints:

- Do not enable live mutations.
- Do not call Docs/RAG ingestion from the bundle.
- Fail closed before checkout POST smoke if live preflight is not guarded.
- Treat Docs/RAG preflight exit `2` as operational blocked, not pass.
- Never print secret values.

Validation:

```bash
bash -n scripts/readiness_bundle.sh
npm run check
npm run build
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
npm run readiness:bundle
```
