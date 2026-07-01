# GOAL-02 Execution Plan

## Goal

Implement the first production-visible Cliplot storefront frontend slice.

## Traceability

Vision -> Czech-first storefront at `cliplot.alfares.cz`
Goal Impact -> customers can see a working shop surface before payment wiring
System -> single `cliplot-service` frontend/API boundary
Feature -> homepage, product grid, cart, checkout shell
Task -> build static frontend with local cart and checkout preview
Validation -> build, static asset check, health/API smoke, Kubernetes deploy

## Scope

Allowed:

- dependency-light Node HTTP server;
- static HTML/CSS/JS storefront;
- seeded product fallback;
- Catalog product proxy when available;
- localStorage cart;
- checkout preview endpoint that does not create paid orders;
- Dockerfile;
- Kubernetes configmap/deployment/service/ingress;
- deploy script.

Forbidden:

- live order creation;
- payment initiation;
- provider callback handling;
- stock reservation/decrement;
- app-local product/pricing truth beyond frontend fallback display;
- production secret values.

## Frontend Acceptance Criteria

- Header has `Cliplot`, category nav, search, and cart.
- First viewport is product-first with price, `Skladem`, `Doruceni 1-2 dny`, and CTA.
- Product cards show image, category, price, stock, delivery, and `Do kosiku`.
- Cart supports quantity changes and total in Kc.
- Checkout shell has contact, delivery, payment placeholder, and order summary feedback.
- Checkout copy clearly says real payment is not live yet.
- Mobile width 360px remains readable.
- Visual system follows `docs/DESIGN_CONTRACT.md`.

## Sensitive Data

No secrets are required for GOAL-02. Vault integration remains planned for
service tokens and payment keys in later goals.

## Contract Impact

Adds public frontend routes and non-mutating endpoints:

- `GET /`
- `GET /health`
- `GET /ready`
- `GET /api/products`
- `POST /api/checkout/preview`

`POST /api/checkout/preview` is explicitly non-mutating.

## Replay/Determinism

Build and smoke commands are deterministic and do not require external
credentials. Product data falls back to static seeded products if Catalog is
unavailable.

## Parallelization

| Lane | Can start | Owner | Write ownership | Validation |
| --- | --- | --- | --- | --- |
| Storefront UI | yes | Main thread | `public/**` | static asset check, visual/manual smoke |
| Server/API shell | yes | Main thread | `src/server.js`, `package.json` | `npm run build`, health/API smoke |
| Kubernetes deploy | after source | Main thread | `Dockerfile`, `k8s/**`, `scripts/deploy.sh` | dry-run/apply, rollout, public smoke |
| Payment integration | no | future worker | none in GOAL-02 | blocked to GOAL-05 |

## Rollback

Use Kubernetes deployment history after first successful deploy:

```bash
kubectl rollout undo deployment/cliplot-service -n statex-apps
```
