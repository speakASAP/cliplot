# Specification: Cliplot Storefront

## Product Surface

### Homepage

Must show in the first viewport:

- compact header;
- logo `Cliplot`;
- category navigation;
- search;
- cart;
- product/category hero with real product imagery;
- price in Kč;
- stock state;
- delivery estimate;
- primary `Do košíku` or `Koupit` action;
- trust signals.

### Catalog

Must support:

- category browse;
- search;
- price display;
- availability display;
- delivery estimate;
- responsive product grid;
- simple filters: category, price, availability, action/discount where available.

### Product Detail

Must show:

- real product images;
- price and stock above fold;
- sticky mobile add-to-cart;
- delivery/payment summary;
- short benefits;
- full description from canonical Catalog content;
- legal and return information links.

### Cart

Must show:

- item list;
- price totals;
- delivery/payment estimates;
- clear edit/remove controls;
- CTA to checkout;
- no hidden fees.

### Checkout

Target checkout flow:

1. Contact and address.
2. Delivery and payment.
3. Review and confirmation.

Guest checkout is required. Account creation must be optional after purchase or
through shared auth.

## Non-Functional Requirements

- Mobile width down to 360px.
- No heavy hero video.
- Avoid large client bundles.
- Accessible text contrast and focus states.
- Touch targets suitable for older users.
- Czech copy by default.
- SEO metadata sourced from approved Catalog/AI review data.

## Forbidden Implementation

- App-local payment provider state machine.
- App-local stock truth.
- App-local product pricing truth.
- Fake checkout success.
- Mandatory registration before purchase.
- Secrets in `.env`, source, docs, logs, screenshots, or prompts.

## Acceptance Gates

Product code may start only after:

- GOAL-01 is complete;
- GOAL-02 execution plan is approved by repository state;
- docs-rag retrieval is attempted or blocker recorded;
- pre-coding and strict documentation audits pass;
- missing production secrets are documented and do not block local/static work.
