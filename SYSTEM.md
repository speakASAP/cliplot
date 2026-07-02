# System: cliplot

## Target Architecture

Cliplot is planned as a separate deployable storefront/service at
`cliplot.alfares.cz` that reuses existing Alfares ecosystem services.

```text
Customer browser
  -> cliplot frontend/API boundary
  -> catalog-microservice for product and canonical content
  -> warehouse-microservice for stock truth
  -> cart/order path based on FlipFlop/shared Orders contracts
  -> payments-microservice for provider payment initiation and callbacks
  -> notifications-microservice for transactional email
  -> auth-microservice for optional account/auth flows
  -> logging-microservice for operational logs
  -> docs-rag-microservice for agent documentation retrieval
  -> Vault/ExternalSecrets for runtime secrets
```

## Shared Service Boundaries

| Boundary | Cliplot rule |
| --- | --- |
| Catalog | Read canonical product/content data; do not store parallel product truth. |
| Warehouse | Read/reserve stock through approved service token; do not hardcode stock. |
| Orders | Use central Orders or FlipFlop-proven order path; do not invent order state. |
| Payments | Use `payments-microservice`; provider webhooks are the payment truth. |
| Notifications | Use `notifications-microservice`; do not embed SMTP credentials. |
| Auth | Allow guest checkout; use shared auth for account flows. |
| AI | Draft-only content generation; human approval before publishing claims. |
| RAG | Store project docs and retrieve ecosystem docs before broad reads. |
| Secrets | Vault path `secret/prod/cliplot` planned; no repo secrets. |

## Deployment Target

- Namespace: `statex-apps`
- Host: `cliplot.alfares.cz`
- TLS: cert-manager / Traefik pattern used by existing Alfares services
- Image registry: local cluster registry pattern, final name `[UNKNOWN: image name until app stack is selected]`

## Open Architecture Decisions

- `[UNKNOWN: whether Catalog needs marketplace key cliplot or reuse flipflop connector]`
- `[UNKNOWN: whether Cliplot is separate deployment, domain-only storefront variant, or tenant/brand inside FlipFlop]`
- `[MISSING: selected application stack after GOAL-01 planning]`
- `[MISSING: approved Kubernetes image/service naming]`
- `[MISSING: approved Vault properties for service tokens and payment callback keys]`

## Initial Stack Direction

Default direction unless a later goal changes it:

- Next.js SSR storefront, because FlipFlop already uses a Next.js storefront.
- Minimal API boundary only where needed to protect server-side tokens.
- No database in Cliplot unless a goal proves it needs app-local state.
- Device-local UI preferences may use browser storage.
- Durable product, stock, order, payment, and notification state stays in shared
  services.
