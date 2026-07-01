# Intent Memory

## Original Owner Request

Create a new design and then a full e-commerce implementation for
`cliplot.alfares.cz`, optimized for Czech customers age 15-65 across devices.
The design must not look AI-generated. The implementation must be a separate
remote repository/folder on `alfares`, use goal-driven development, use
subagents for parallel work, deploy through Kubernetes, store secrets in Vault,
use the docs-rag system for documentation, and reuse shared services such as
FlipFlop, payments, notifications, catalog, and other ecosystem systems.

## Distilled Intent

Build Cliplot as a separate, conversion-first Czech storefront that reuses the
Alfares shared commerce ecosystem rather than duplicating business truth.

## Current Decision

Cliplot starts as a separate remote repository:

```text
/home/ssf/Documents/Github/cliplot-service
```

This does not yet decide whether runtime architecture is a fully separate app,
a domain-specific storefront variant, or a tenant-like layer over FlipFlop. That
architecture decision remains:

```text
[UNKNOWN: whether Cliplot is separate deployment, domain-only storefront variant, or tenant/brand inside FlipFlop]
```

## Preserved Constraints

- Remote-first on `alfares`.
- No local repo source under `/Users/Sergej.Stasok/Documents`.
- Goal-driven implementation.
- Detailed planning before code.
- Parallel subagents when write ownership is disjoint.
- Guardrails similar to RunLayer and FlipFlop.
- Kubernetes deployment through `./scripts/deploy.sh`.
- Vault for secrets.
- docs-rag for documentation retrieval/publication.
- Shared services for commerce capabilities.
- No fake payment/order/stock truth.

## Missing Facts

- `[MISSING: Cliplot product/catalog scope and approved SKU list]`
- `[MISSING: Cliplot brand/legal/payment identity approval]`
- `[MISSING: production payment provider credentials/webhook evidence for Cliplot]`
- `[MISSING: approved live order-create and Warehouse reservation evidence for Cliplot]`
- `[MISSING: docs-rag publication command and token evidence for cliplot-service]`
- `[UNKNOWN: whether Catalog needs new marketplace key cliplot or reuse flipflop connector]`
