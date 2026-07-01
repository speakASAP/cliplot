# Project Invariants

## Product Invariants

- Czech storefront first; not a dashboard-first product.
- Products, prices, stock, delivery, and purchase CTA must be visible early.
- Guest checkout is required.
- Mobile and older-device usability is required.
- Design must follow `docs/DESIGN_CONTRACT.md`.

## Commerce Invariants

- Product truth belongs to Catalog.
- Stock truth belongs to Warehouse.
- Payment truth belongs to provider-backed `payments-microservice` evidence.
- Notification delivery belongs to `notifications-microservice`.
- Auth belongs to shared auth surfaces.
- Cliplot must not create parallel business truth for shared commerce state.

## Safety Invariants

- No secrets in repo, prompts, logs, screenshots, or reports.
- No fake successful payment/order evidence.
- No pricing or order-total mutation without approval.
- No deploy without deployment-readiness evidence or explicit blocker.
- Preserve `[MISSING: ...]` and `[UNKNOWN: ...]` instead of inventing facts.
