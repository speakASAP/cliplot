# GOAL-03 Validation Report

## Status

Done.

## Evidence

2026-07-01 pre-deploy validation on `alfares`:

- `npm run build` passed.
- `python3 scripts/pre_coding_gate.py --root .` passed with
  `scope=goal-driven`.
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`
  passed with `checked_files=5`.
- `python3 scripts/deployment_readiness_gate.py --root .` passed with
  `scope=shared-service-integration-foundation`.
- `kubectl apply --dry-run=client` passed for configmap, external-secret,
  deployment, service, and ingress.
- Temporary runtime smoke passed for `/health`, `/api/integrations/readiness`,
  `/api/auth/links`, `/api/products`, and `/api/checkout/submit`.
- `/api/checkout/submit` returned HTTP 202 with
  `status=service_identity_required`; no order/payment/stock/notification live
  mutation occurred.

2026-07-01 deploy validation:

- `./scripts/deploy.sh` passed.
- Image `localhost:5000/cliplot-service:0556cec` deployed.
- Kubernetes deployment `cliplot-service` reached `1/1` ready/available.
- In-pod `/health` smoke returned HTTP 200.
- Remote public smoke from `alfares` passed for
  `https://cliplot.alfares.cz/health`.
- Remote public smoke passed for
  `https://cliplot.alfares.cz/api/integrations/readiness`.
- Remote public smoke passed for
  `https://cliplot.alfares.cz/api/auth/links`.
- Remote public smoke passed for
  `https://cliplot.alfares.cz/api/products`.
- Remote public checkout submit returned HTTP 202 with
  `status=service_identity_required`.

## Remaining Blockers

- ExternalSecret `cliplot-service-secret` exists, but status is
  `SecretSyncedError` because Vault path `secret/prod/cliplot-service` does not
  exist yet.
- One old pod was still `Terminating` after rollout; the new pod was ready and
  available. No force deletion was performed.

## Expected Non-Mutating Runtime Results

- `/health` returns HTTP 200.
- `/api/products` returns HTTP 200 and product items.
- `/api/auth/links` returns hosted Auth URLs and records unverified Cliplot Auth
  contract.
- `/api/integrations/readiness` returns Catalog read enabled, Orders guarded,
  Warehouse token missing, Notifications token missing, Payments blocked until
  GOAL-05.
- `/api/checkout/submit` returns HTTP 202 with
  `status=service_identity_required` while live submit is disabled or Vault
  tokens are missing.

## Intent Compliance

- No live payment creation.
- No stock mutation.
- No notification send.
- No hardcoded secret.
- Missing contracts are recorded with `[MISSING: ...]`.
