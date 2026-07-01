# GOAL-05 Checkout Revenue Readiness Coding Prompt

Implement guarded checkout validation lanes without enabling live mutation.

Use the remote repository `/home/ssf/Documents/Github/cliplot-service` as the
source of truth. Do not save project source under local
`/Users/Sergej.Stasok/Documents`.

Requirements:

- Keep Catalog reads authenticated through the existing machine-auth token.
- Validate Cliplot `orders.create.v1` payloads through
  `POST /api/orders/validate-create` without creating orders, reserving
  Warehouse stock, or publishing order events.
- Validate payment payloads through `POST /payments/validate-create` without
  provider calls or persistence.
- Validate notification payloads through `POST /notifications/validate`
  without sending customer notifications.
- Report readiness for order, payment, and notification validation.
- Keep checkout, payment, warehouse, and notifications live mutation guarded.
- Do not print or commit secret values.

Validation:

- `npm run build`
- `python3 scripts/pre_coding_gate.py --root .`
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`
- `python3 scripts/deployment_readiness_gate.py --root .`
- `git diff --check`
- Kubernetes dry-run for changed manifests.
- Deploy with `./scripts/deploy.sh`.
- Public or in-cluster smoke for `/api/products`,
  `/api/integrations/readiness`, and guarded `/api/checkout/submit`.
