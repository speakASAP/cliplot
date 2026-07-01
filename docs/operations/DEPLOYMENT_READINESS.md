# Deployment Readiness

## Current Status

Blocked. The repository contains foundation docs and guard scripts, but no
deployable application yet.

## Deployment Target

- Host: `cliplot.alfares.cz`
- Namespace: `statex-apps`
- Deployment name: `cliplot-service`
- TLS secret: `cliplot-service-tls`
- Secret target: `cliplot-service-secret`
- Vault path: `secret/prod/cliplot-service`

## Required Before First Deploy

- Dockerfile.
- Application source.
- `/health` endpoint.
- `k8s/configmap.yaml`.
- `k8s/external-secret.yaml`.
- `k8s/deployment.yaml`.
- `k8s/service.yaml`.
- `k8s/ingress.yaml`.
- Vault secret presence by key name.
- Build command.
- Public smoke contract.
- Rollback command.

## Deploy Command

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot-service && ./scripts/deploy.sh'
```

## Rollback Plan

`[MISSING: rollback command after first successful image-tag deployment]`
