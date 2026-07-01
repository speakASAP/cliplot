# GOAL-05 Checkout Revenue Readiness Context Package

## Repository

Remote source of truth:

```text
/home/ssf/Documents/Github/cliplot-service
```

## Current Evidence

- GOAL-04 platform readiness is deployed.
- `cliplot-service-secret` is synced from Vault.
- Orders accepts `cliplot-service` and channel `cliplot`.
- Payments allowlist includes `cliplot-service` and
  `https://cliplot.alfares.cz`.
- Catalog supports machine-auth through `x-internal-service-token` and
  `x-service-name`.
- Catalog's service token source is Auth-owned:
  `secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`.

## Catalog Response Shape

Catalog product reads may return:

```text
{ success: true, data: [...], pagination: {...} }
```

Product fields may include `title`, `categories`, `pricing`, `media`,
`descriptionRich`, `shortDescription`, lifecycle and active flags.

## Guarded Runtime

`ENABLE_LIVE_ORDER_SUBMIT` remains false. Catalog reads can go live, but order
creation, payment initiation, stock mutation, and notifications remain guarded
until explicit provider-backed validation exists.

