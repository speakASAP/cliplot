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
| Warehouse | Read/reserve stock through Auth-issued pair RS256 Bearer ([`SERVICE_IDENTITY_CONSUMER_STANDARD.md`](../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md)); do not hardcode stock. |
| Orders | Use central Orders or FlipFlop-proven order path; do not invent order state. |
| Payments | Use `payments-microservice` with pair RS256 Bearer (SPOT above); provider webhooks are payment settlement truth, not Alfares S2S. |
| Notifications | Use `notifications-microservice`; do not embed SMTP credentials. |
| Auth | Allow guest checkout; use hosted Auth for account flows. |
| AI | Draft-only content generation; human approval before publishing claims. |
| RAG | Store project docs and retrieve ecosystem docs before broad reads. |
| Secrets | Vault path `secret/prod/cliplot` planned; no repo secrets. |

## Deployment Target

- Namespace: `statex-apps`
- Host: `cliplot.alfares.cz`
- TLS: cert-manager / Traefik pattern used by existing Alfares services
- Image registry: local cluster registry pattern, final name `No repository-defined image name until app stack is selected`

## Open Architecture Decisions

- `No repository-defined whether Catalog needs marketplace key cliplot or reuse flipflop connector`
- `No repository-defined whether Cliplot is separate deployment, domain-only storefront variant, or tenant/brand inside FlipFlop`
- `No repository-defined selected application stack after GOAL-01 planning`
- `No repository-defined approved Kubernetes image/service naming`
- `No repository-defined approved Vault properties for Auth-issued pair RS256 Bearers (see SERVICE_IDENTITY_CONSUMER_STANDARD.md)`

## Initial Stack Direction

Default direction unless a later goal changes it:

- Next.js SSR storefront, because FlipFlop already uses a Next.js storefront.
- Minimal API boundary only where needed to protect server-side tokens.
- No database in Cliplot unless a goal proves it needs app-local state.
- Device-local UI preferences may use browser storage.
- Durable product, stock, order, payment, and notification state stays in shared
  services.

## Purpose
A Czech-first e-commerce storefront focused on product discovery, price, stock, delivery, and purchase actions.

## Responsibilities
Provide the behavior and runtime described by the tracked project documentation.

## Non-Responsibilities
Do not add integrations, persistence, or product scope not declared by repository sources.

## Inputs
Inputs are the browser, runtime, and configuration inputs described in existing project sources.

## Outputs
Outputs are the user-visible or operational results described in existing project sources.

## Dependencies
Kubernetes application at cliplot.alfares.cz using declared Catalog, Warehouse, Orders, Payments, Notifications, Auth, and Logging service URLs.

## Upstream Traceability
The approved business baseline and vision define this system’s intent.

## Downstream Artifacts
The integration contract and bootstrap chain record planning evidence.

## Validation Criteria
Run the IPS planning validator and applicable existing project checks.

## Open Questions
No new open question is asserted by this documentation-only adoption.
Status: reviewed
completeness_level: complete
