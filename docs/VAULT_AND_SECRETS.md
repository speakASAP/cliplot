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
window, but token values must remain absent or empty until approval exists:

Do not add live-smoke token keys to `k8s/external-secret.yaml` until they exist
in Vault. Adding missing remote properties can break ExternalSecret sync for the
currently working `cliplot-secret`.

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
IDs in `k8s/configmap.yaml`:

```text
CLIPLOT_LIVE_ORDER_APPROVAL_ID
CLIPLOT_LIVE_PAYMENT_APPROVAL_ID
CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID
CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID
```

The current ConfigMap records order, payment, and notification approval metadata
IDs, but all live execution flags remain `false`. These IDs are not execution
secrets and do not permit mutation by themselves: payment and notification IDs
come from no-mutation/no-send evidence packets, and the Orders/Warehouse smoke
metadata remains disabled while `ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false`. If
any approval IDs later become sensitive or centrally issued, promote them to
Vault/ExternalSecret keys by name only. Do not commit or print approval token
values.

## Live-Smoke Projection Readiness

Run the read-only projection gate to confirm live-smoke secret presence without printing values:

```bash
npm run readiness:vault-live-smoke
```
