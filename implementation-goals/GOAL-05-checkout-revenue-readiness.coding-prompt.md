# GOAL-05 Checkout Revenue Readiness Coding Prompt

Implement the Catalog product read lane only.

Use the remote repository `/home/ssf/Documents/Github/cliplot-service` as the
source of truth. Do not save project source under local
`/Users/Sergej.Stasok/Documents`.

Requirements:

- Project `CATALOG_INTERNAL_SERVICE_TOKEN` into the Cliplot Kubernetes Secret
  from Auth-owned Vault path `secret/prod/auth-microservice`.
- Use Catalog machine-auth headers for product reads when the token is present.
- Query active Catalog products without the unsupported `marketplace=cliplot`
  parameter.
- Normalize real Catalog products to the storefront product card shape.
- Preserve fallback products only for degraded Catalog failures.
- Report Catalog readiness as `read_enabled_authenticated` when token-backed
  reads are configured.
- Keep checkout, payment, warehouse, and notifications guarded.
- Do not print or commit secret values.

Validation:

- `npm run build`
- `python3 scripts/pre_coding_gate.py --root .`
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`
- `python3 scripts/deployment_readiness_gate.py --root .`
- `git diff --check`
- Kubernetes dry-run for changed manifests.
- Deploy with `./scripts/deploy.sh`.
- Public smoke for `/api/products` and `/api/integrations/readiness`.

