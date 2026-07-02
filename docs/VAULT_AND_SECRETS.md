# Vault And Secrets Plan

## Principle

No secrets are stored in this repository. Runtime secrets must live in Vault and
be projected into Kubernetes through ExternalSecrets.

## Planned Vault Path

```text
secret/prod/cliplot
```

## Runtime Secret Sources

These are the current projected keys for Cliplot. Values must be populated in
Vault only; do not commit or print them.

```text
WAREHOUSE_SERVICE_TOKEN
ORDERS_SERVICE_TOKEN
PAYMENT_API_KEY
PAYMENT_WEBHOOK_API_KEY
CLIPLOT_SERVICE_TOKEN
DOCS_RAG_SERVICE_TOKEN
NOTIFICATIONS_SERVICE_TOKEN
```

Catalog reads use the existing Catalog machine-auth contract. The projected
`CATALOG_INTERNAL_SERVICE_TOKEN` is sourced from Auth-owned Vault path
`secret/prod/auth-microservice#CATALOG_INTERNAL_SERVICE_TOKEN`, matching the
active Catalog runtime pattern. It is not duplicated into the Cliplot Vault
path.

## Presence Gate

Run from `alfares`:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && python3 scripts/vault_secret_presence_gate.py --allow-missing'
```

The gate prints key presence only and intentionally does not print secret
values.

## Guarded Live Orders/Warehouse Smoke Keys

The dedicated Orders/Warehouse live smoke executor is disabled by default. These
keys are tracked by the Vault presence gate for a future owner-approved smoke
window, but their values must remain absent or empty until approval exists:

```text
ORDERS_STATUS_SERVICE_TOKEN
CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID
```

`ORDERS_STATUS_SERVICE_TOKEN` is separated from the normal
`ORDERS_SERVICE_TOKEN` because Orders status cancellation can require a stronger
admin/status-transition identity than order creation. The approval ID must never
be committed or printed.

Do not add these keys to `k8s/external-secret.yaml` until they exist in Vault.
Adding missing remote properties can break ExternalSecret sync for the currently
working `cliplot-secret`.

## Kubernetes Projection

Planned ExternalSecret:

```text
k8s/external-secret.yaml
```

Target Kubernetes Secret:

```text
cliplot-secret
```

## Sensitive Operations

Do not print secret values. Validation may check presence by key name only.

## Open Blockers

- `[MISSING: approved service principal tokens for Cliplot]`
- `[MISSING: payment callback API key entry for cliplot]`
- `[MISSING: Auth role contract for Cliplot token accepted by warehouse-microservice]`
- `[MISSING: Payments API key/scope for cliplot]`
## Live Mutation Approval Evidence

Live mutation approvals are currently represented by non-secret runtime config
IDs and default to empty strings in `k8s/configmap.yaml`:

```text
CLIPLOT_LIVE_ORDER_APPROVAL_ID
CLIPLOT_LIVE_PAYMENT_APPROVAL_ID
CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID
CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID
```

If these approval IDs later become sensitive or centrally issued, promote them
to Vault/ExternalSecret keys by name only. Do not commit or print approval token
values.


## Live-Smoke Projection Readiness

Run the read-only projection gate before adding live-smoke keys to
`k8s/external-secret.yaml`:

```bash
npm run readiness:vault-live-smoke
```

The gate checks `ORDERS_STATUS_SERVICE_TOKEN` and
`CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID` in `secret/prod/cliplot`
without printing values. `LIVE_SMOKE_PROJECTION=ready` only means the Vault
properties exist and can be reviewed for ExternalSecret projection. It does not
authorize `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true` and does not authorize live
Orders/Warehouse execution.
