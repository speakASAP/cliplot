# GOAL-03 Context Package

## User Intent

Build Cliplot as a Czech-first e-commerce storefront at
`https://cliplot.alfares.cz/`, starting with frontend usability and then
connecting shared Alfares services without duplicating FlipFlop internals.

## Current Baseline

- GOAL-01 created the remote repo, IPS docs, gates, and deployment scaffold.
- GOAL-02 deployed the first storefront frontend.
- Catalog product reads work through the existing shared Catalog service with a
  local fallback list.
- Checkout preview exists but does not create real orders or payments.

## Guardrails

- Preserve Intent Preservation chain.
- Keep source of truth in `/home/ssf/Documents/Github/cliplot`.
- Do not save project source under `/Users/Sergej.Stasok/Documents`.
- Use `ssh alfares` and `./scripts/deploy.sh`.
- Store secrets only through Vault/ExternalSecret; never hardcode them.
- Mark unknown contracts with `[MISSING: ...]` or `[UNKNOWN: ...]`.

## Known Shared Service Defaults

- Catalog URL: `http://catalog-microservice:3200`.
- Orders URL: `http://orders-microservice:3203`.
- Warehouse URL: `http://warehouse-microservice:3201`.
- Payments URL: `http://payments-microservice:3468`.
- Notifications URL: `http://notifications-microservice:3368`.
- Auth service URL: `http://auth-microservice:3370`.
- Public Auth URL default: `https://auth.alfares.cz`.
- Vault path target: `secret/prod/cliplot-service`.
- Kubernetes namespace: `statex-apps`.

## Missing Facts

- `[MISSING: Catalog marketplace key/connector for cliplot]`
- `[MISSING: Cliplot Orders channel and channelAccountId owner approval]`
- `[MISSING: payments-microservice allowed applicationId/API key/callback key for Cliplot]`
- `[MISSING: Cliplot Auth client_id, app_domain, redirect/callback policy]`
- `[MISSING: Warehouse service token accepted by warehouse-microservice and default warehouseId]`
- `[MISSING: Notification sender/template rules for Cliplot order confirmations]`
- `[MISSING: Vault values at secret/prod/cliplot-service]`

## Expected Output

- Deployed app still browses products.
- Checkout submit returns `service_identity_required` when live submit is not
  enabled.
- Readiness endpoint exposes exact integration status.
- Kubernetes deploy remains successful without existing Vault secret values.
- Documentation records blockers instead of claiming live revenue readiness.
