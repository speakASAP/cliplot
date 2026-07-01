# Vault And Secrets Plan

## Principle

No secrets are stored in this repository. Runtime secrets must live in Vault and
be projected into Kubernetes through ExternalSecrets.

## Planned Vault Path

```text
secret/prod/cliplot-service
```

## Planned Secret Properties

These are the current projected keys for Cliplot. Values must be populated in
Vault only; do not commit or print them.

```text
JWT_SECRET
AUTH_SERVICE_TOKEN
CATALOG_SERVICE_TOKEN
WAREHOUSE_SERVICE_TOKEN
ORDERS_SERVICE_TOKEN
PAYMENT_API_KEY
PAYMENT_APPLICATION_ID
PAYMENT_WEBHOOK_API_KEY
NOTIFICATIONS_SERVICE_TOKEN
LOGGING_SERVICE_TOKEN
AI_SERVICE_TOKEN
DOCS_RAG_SERVICE_TOKEN
```

## Presence Gate

Run from `alfares`:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot-service && python3 scripts/vault_secret_presence_gate.py --allow-missing'
```

The gate prints key presence only and intentionally does not print secret
values.

## Kubernetes Projection

Planned ExternalSecret:

```text
k8s/external-secret.yaml
```

Target Kubernetes Secret:

```text
cliplot-service-secret
```

## Sensitive Operations

Do not print secret values. Validation may check presence by key name only.

## Open Blockers

- `[MISSING: approved service principal tokens for Cliplot]`
- `[MISSING: payment callback API key entry for cliplot-service]`
- `[MISSING: Vault values at secret/prod/cliplot-service]`
- `[MISSING: Auth role contract for Cliplot token accepted by warehouse-microservice]`
- `[MISSING: Orders support for cliplot-service token alias]`
- `[MISSING: Payments API key/scope for cliplot-service]`
