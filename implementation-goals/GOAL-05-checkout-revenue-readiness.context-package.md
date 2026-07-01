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
- Payments `POST /payments/validate-create` validates the Cliplot payment
  payload without persistence or provider calls.
- Notifications `POST /notifications/validate` validates the Cliplot order
  confirmation payload without persistence, provider calls, or customer send.
- Cliplot guarded checkout returns `paymentValidation.status=validated_no_mutation`
  and `notificationValidation.status=validated_no_send` while still returning
  `service_identity_required`.
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

`ENABLE_LIVE_ORDER_SUBMIT`, `ENABLE_LIVE_PAYMENT_CREATE`, and
`ENABLE_LIVE_NOTIFICATIONS` remain false. Catalog reads and no-mutation/no-send
validation can run, but order creation, payment initiation, stock mutation, and
customer notification sends remain guarded until explicit provider-backed
validation and approval exist.
