# GOAL-03: Shared Service Integration

## Objective

Wire Cliplot to shared Alfares commerce services without duplicating product,
stock, order, payment, notification, auth, logging, or AI truth.

## Planned Lanes

- Catalog product read model.
- Warehouse stock display/reservation.
- Cart and order lifecycle.
- Payments initiation/callback handling through `payments-microservice`.
- Notifications through `notifications-microservice`.
- Auth optional account flow.
- Logging and operational alerts.

## Blockers

- `[MISSING: Cliplot product/catalog scope and approved SKU list]`
- `[MISSING: service tokens and Vault projection]`
- `[UNKNOWN: Catalog marketplace key cliplot vs flipflop]`
