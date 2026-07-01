# Vault And Secrets Plan

## Principle

No secrets are stored in this repository. Runtime secrets must live in Vault and
be projected into Kubernetes through ExternalSecrets.

## Planned Vault Path

```text
secret/prod/cliplot-service
```

## Planned Secret Properties

Final names may change after integration contracts are verified.

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
- `[MISSING: docs-rag token or ingestion path for cliplot-service]`
