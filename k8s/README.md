# Kubernetes Manifests

These manifests deploy Cliplot to `statex-apps` as `cliplot`.

## Applied By Deploy Script

- `configmap.yaml`
- `external-secret.yaml`
- `deployment.yaml`
- `service.yaml`
- `ingress.yaml`
- `readiness-cronjob.yaml`

## Readiness CronJob

`readiness-cronjob.yaml` schedules `cliplot-readiness-monitor` every 30
minutes. The job uses the Cliplot application image and runs:

```bash
node scripts/k8s-readiness-probe.js http://cliplot:8080
```

The monitor is read-only and endpoint-only. It performs GET requests against
Cliplot health, live checkout preflight, integration readiness, and guarded
payment status. It must not create orders, payments, stock reservations,
notifications, payment persistence, or Docs/RAG ingestion jobs.
