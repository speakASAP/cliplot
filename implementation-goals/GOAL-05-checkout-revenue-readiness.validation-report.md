# GOAL-05 Checkout Revenue Readiness Validation Report

## Status

Catalog lane deployed and validated. Full GOAL-05 checkout revenue readiness is
still in progress because payment identity/provider evidence, Warehouse, and
Notifications remain guarded.

## Catalog Product Read Lane

Pre-deploy validation:

- `npm run build` passed.
- `python3 scripts/pre_coding_gate.py --root .` passed.
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues` passed.
- `python3 scripts/deployment_readiness_gate.py --root .` passed.
- `git diff --check` passed.
- `kubectl apply --dry-run=server -f k8s/external-secret.yaml` passed.

Runtime validation:

- deployment succeeded after the initial rollout wait exceeded the deploy
  script timeout while image pull was still pending;
- deployed pod has `CATALOG_INTERNAL_SERVICE_TOKEN` present without printing it;
- public `/api/products` returns real Catalog products;
- public readiness reports authenticated Catalog reads;
- public guarded checkout still returns `202 service_identity_required`.

## Deferred Revenue Readiness

Payment identity auth/scope readiness is validated, but valid payment creation,
order creation, warehouse stock mutation, and notifications remain guarded until
provider-backed runtime evidence exists.

## Validation Evidence

```text
npm run build
STATIC_ASSET_CHECK=pass

python3 scripts/pre_coding_gate.py --root .
PRE_CODING_GATE=pass

python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
STRICT_DOC_AUDIT=pass

python3 scripts/deployment_readiness_gate.py --root .
DEPLOYMENT_READINESS=pass

git diff --check
pass

kubectl apply --dry-run=server -f k8s/external-secret.yaml
externalsecret.external-secrets.io/cliplot-service-secret configured (server dry run)

./scripts/deploy.sh
image localhost:5000/cliplot-service:2678d29 built and pushed
initial rollout wait timed out while new pod was still pulling image

kubectl -n statex-apps rollout status deployment/cliplot-service --timeout=180s
deployment "cliplot-service" successfully rolled out

kubectl -n statex-apps exec deploy/cliplot-service -- node -e "..."
catalogTokenPresent=true
liveOrderSubmit=false

GET https://cliplot.alfares.cz/api/integrations/readiness
http=200
catalog=read_enabled_authenticated
orders=guarded
payments=blocked_until_GOAL-05
liveOrderSubmit=false

GET https://cliplot.alfares.cz/api/products
http=200
success=true
count=8
firstId=e0034f63-53be-4287-954e-5d519eb57a79
firstName=Paměťová karta Lenovo 2Tb SD + Adaptér
fallback=false
firstImageExternal=true

POST https://cliplot.alfares.cz/api/checkout/submit
http=202
status=service_identity_required
mode=guarded_checkout_submit
liveOrderCreated=false

Payments identity onboarding
payments-microservice image=localhost:5000/payments-microservice:85a904b
apiKeyCount=7
scopeMapPresent=true
cliplotCallbackPresent=true
legacySecretEnvRemoved=true

Cliplot pod safe invalid-body smoke to POST /payments/create
http=400
code=VALIDATION_ERROR
paymentCreated=false

Cliplot pod safe invalid-body smoke to POST /api/orders
http=400
status=Bad Request
orderCreated=false

GET https://cliplot.alfares.cz/api/integrations/readiness after guard refinement
http=200
catalog=read_enabled_authenticated
payments=identity_ready_provider_guarded
orders=guarded
liveOrderSubmit=false
remainingMissing=provider_payment_evidence|warehouse_runtime_evidence|notification_template_rules

POST https://cliplot.alfares.cz/api/checkout/submit after guard refinement
http=202
status=service_identity_required
mode=guarded_checkout_submit

Warehouse receiver support
warehouse-microservice commit=9e692ff
read-only Cliplot pod smoke to POST /api/stock/availability/batch
http=201
success=true
firstProductId=e0034f63-53be-4287-954e-5d519eb57a79
firstTotalAvailable=0

Warehouse stocked product scan
visibleCatalogProductsWithPositiveWarehouseAvailability=0
configuredStockedProductIds=8

GET https://cliplot.alfares.cz/api/products after stocked selection
http=200
count=8
allDisplayedStockStatus=Skladem
allDisplayedImagesExternal=true
firstStockedProductId=19c69d06-e3d3-471d-b417-b2fccbd63ab0
firstStockedProductPriceCzk=1590

Notifications identity onboarding
notifications-microservice commits=485ef45,8ed8225
safe invalid-body Cliplot pod smoke to POST /notifications/send
before=http 401 Invalid token
after=http 500 SEND_FAILED
validNotificationSent=false
cliplotCheckoutNotificationPreview=implemented_guarded

Cliplot guarded payment-create path
paymentCreatePath=/payments/create
paymentMethod=invoice
applicationId=cliplot-service
callbackOrigin=https://cliplot.alfares.cz
livePaymentCreate=false
validPaymentCreateExecuted=false
```
