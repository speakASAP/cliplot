# GOAL-06 Operational Closure Validation Report

## Status

In progress. The read-only readiness bundle, Docs/RAG preflight, controlled
Docs/RAG ingestion, and retrieval evidence are implemented and validated.
Final GOAL-06 closure remains blocked by live checkout approval evidence.

## Readiness Bundle Validation

Commit: `ed802c5`

Commands:

```bash
bash -n scripts/readiness_bundle.sh
npm run check
npm run build
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
npm run readiness:bundle
npm run smoke:checkout -- https://cliplot.alfares.cz
```

Evidence:

```text
npm run check=pass
npm run build=pass
PRE_CODING_GATE=pass
STRICT_DOC_AUDIT=pass
DEPLOYMENT_READINESS=pass
READINESS_STEP=git_clean exit=0
READINESS_STEP=kubernetes_rollout exit=0
kubernetes.image=localhost:5000/cliplot-service:2148565
kubernetes.updated=1
kubernetes.ready=1
kubernetes.available=1
READINESS_STEP=live_preflight exit=0
livePreflight.status=blocked
livePreflight.wouldMutate=false
livePreflight.wouldCreateOrder=false
livePreflight.wouldCreatePayment=false
livePreflight.wouldSendNotification=false
READINESS_STEP=integrations_readiness exit=0
readiness.liveOrderSubmit=false
readiness.livePaymentCreate=false
readiness.liveNotifications=false
readiness.approval.order=false
readiness.approval.payment=false
readiness.approval.notification=false
readiness.orderValidation=enabled_no_mutation
readiness.paymentValidation=enabled_no_mutation
readiness.notificationValidation=enabled_no_send
readiness.warehouseReservation=readiness_check_available
readiness.paymentStatus=guarded_no_persistence
READINESS_STEP=vault_presence exit=0
VAULT_SECRET_PRESENCE=pass
READINESS_STEP=docs_rag_preflight exit=2
docsRagStatusHttp=200
embeddingBackendConfigured=true
embeddingBackendUrl=http://192.168.88.53:11434
embeddingReason=embedding_backend_fetch_failed
DOCS_RAG_PREFLIGHT=blocked
READINESS_STEP=guarded_checkout_smoke exit=0
checkoutHttpStatus=202
checkoutStatus=service_identity_required
orderValidation=validated_no_mutation
paymentValidation=validated_no_mutation
notificationValidation=validated_no_send
warehouseReservationReadiness=validated_no_mutation
mutation=false
CLIPLOT_READINESS_BUNDLE=blocked
READINESS_BUNDLE_EXIT=2
finalExternalK8sProbe.ok=true
finalInternalK8sProbe.ok=true
finalDeployment.image=localhost:5000/cliplot-service:013b506
finalCronJob.suspend=false
```

The bundle is read-only. It does not call `./scripts/deploy.sh`, does not run
normal Docs/RAG publication, and does not create orders, payments, Warehouse
reservations, callback persistence, or notifications.

## Kubernetes Readiness Monitor Validation

Code commit: `f5912a8`
Final deployed evidence commit: `013b506`

Commands:

```bash
node --check scripts/k8s-readiness-probe.js
npm run check
npm run build
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
npm run readiness:k8s -- https://cliplot.alfares.cz
kubectl apply --dry-run=server -f k8s/readiness-cronjob.yaml -n statex-apps
./scripts/deploy.sh
kubectl exec -n statex-apps cliplot-service-74f7966c5b-4sgx7 -- node scripts/k8s-readiness-probe.js http://cliplot-service:8080
npm run smoke:checkout -- https://cliplot.alfares.cz
npm run readiness:bundle
```

Evidence:

```text
npm run check=pass
npm run build=pass
PRE_CODING_GATE=pass
STRICT_DOC_AUDIT=pass
DEPLOYMENT_READINESS=pass
cronjob.batch/cliplot-readiness-monitor created (server dry run)
deployment.image=localhost:5000/cliplot-service:013b506
deployment.updated=1
deployment.ready=1
deployment.available=1
cronjob.name=cliplot-readiness-monitor
cronjob.schedule=*/30 * * * *
cronjob.suspend=false
externalK8sProbe.ok=true
externalK8sProbe.livePreflightStatus=blocked
externalK8sProbe.wouldMutate=false
externalK8sProbe.liveOrderSubmit=false
externalK8sProbe.livePaymentCreate=false
externalK8sProbe.liveNotifications=false
externalK8sProbe.paymentStatus=payment_status_guarded_no_persistence
internalK8sProbe.ok=true
internalK8sProbe.baseUrl=http://cliplot-service:8080
internalK8sProbe.livePreflightStatus=blocked
internalK8sProbe.wouldMutate=false
internalK8sProbe.liveOrderSubmit=false
internalK8sProbe.livePaymentCreate=false
internalK8sProbe.liveNotifications=false
internalK8sProbe.paymentStatus=payment_status_guarded_no_persistence
checkoutHttpStatus=202
checkoutStatus=service_identity_required
orderValidation=validated_no_mutation
paymentValidation=validated_no_mutation
notificationValidation=validated_no_send
warehouseReservationReadiness=validated_no_mutation
mutation=false
READINESS_STEP=docs_rag_preflight exit=2
embeddingBackendUrl=http://192.168.88.53:11434
embeddingReason=embedding_backend_fetch_failed
CLIPLOT_READINESS_BUNDLE=blocked
READINESS_BUNDLE_EXIT=2
finalExternalK8sProbe.ok=true
finalInternalK8sProbe.ok=true
finalDeployment.image=localhost:5000/cliplot-service:013b506
finalCronJob.suspend=false
```

The Kubernetes monitor is read-only. It does not run the full operator bundle,
does not run checkout POST smoke, and does not mutate orders, payments,
Warehouse stock, callbacks, notifications, or Docs/RAG ingestion.

## Docs/RAG Pod Selection Fix

Status: validated.

`scripts/publish_docs_rag.sh` now selects the newest Running Ready
non-deleting `docs-rag-microservice` pod instead of `.items[0]`. This prevents
operator preflight from execing into a terminating pod during or immediately
after Docs/RAG rollouts.

Evidence:

```text
bash -n scripts/publish_docs_rag.sh=pass
DOCS_RAG_PREFLIGHT=pass
docsRagStatusHttp=200
embeddingBackendUrl=http://192.168.88.53:11435
embeddingHttp=200
docsRagPreflightExit=0
```

## Final Readiness Bundle Pass

Commit: `872c535`

Evidence:

```text
READINESS_STEP=git_clean exit=0
READINESS_STEP=kubernetes_rollout exit=0
image=localhost:5000/cliplot-service:013b506
READINESS_STEP=live_preflight exit=0
livePreflight.status=blocked
livePreflight.wouldMutate=false
READINESS_STEP=integrations_readiness exit=0
readiness.liveOrderSubmit=false
readiness.livePaymentCreate=false
readiness.liveNotifications=false
readiness.approval.order=false
readiness.approval.payment=false
readiness.approval.notification=false
READINESS_STEP=vault_presence exit=0
VAULT_SECRET_PRESENCE=pass
READINESS_STEP=docs_rag_preflight exit=0
docsRagStatusHttp=200
embeddingBackendUrl=http://192.168.88.53:11435
embeddingHttp=200
DOCS_RAG_PREFLIGHT=pass
READINESS_STEP=guarded_checkout_smoke exit=0
checkoutHttpStatus=202
checkoutStatus=service_identity_required
orderValidation=validated_no_mutation
paymentValidation=validated_no_mutation
notificationValidation=validated_no_send
warehouseReservationReadiness=validated_no_mutation
mutation=false
CLIPLOT_READINESS_BUNDLE=pass
```

Docs/RAG operational preflight is no longer blocked. Live order creation, live
payment creation, Warehouse reservation, callback persistence, and notification
sends remain approval-gated.


## Controlled Docs/RAG Ingestion And Retrieval

Status: validated.

Commands:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/docs-rag-microservice && npm test -- --runTestsByPath test/ingestion/markdown-chunker.spec.ts && npm run build'
ssh alfares 'cd /home/ssf/Documents/Github/docs-rag-microservice && ./scripts/deploy.sh'
ssh alfares 'cd /home/ssf/Documents/Github/cliplot && ./scripts/publish_docs_rag.sh cliplot'
```

Evidence:

```text
docsRagCommit=febd791 fix: cap markdown chunks by character length
markdownChunkerSpec=pass
docsRagBuild=pass
docsRagDeployment.image=localhost:5000/docs-rag-microservice:febd791
DOCS_RAG_PUBLICATION=pass
repoName=cliplot
jobId=7a03ada9-9b99-4ef7-8223-5c5a298244f5
chunksProcessed=76
chunksTotal=76
retrieval.search.http=200
retrieval.search.count=5
retrieval.search.top=cliplot/implementation-goals/GOAL-06-operational-closure.execution-plan.md
retrieval.agentContext.http=200
retrieval.agentContext.count=6
retrieval.agentContext.top=cliplot/implementation-goals/GOAL-06-operational-closure.execution-plan.md
```

Secrets were not printed. Retrieval validation ran inside the Docs/RAG pod using
the pod-projected `JWT_TOKEN` and emitted only HTTP status, counts, source paths,
and scores.


## Live Checkout Approval Packet

Status: implemented as a read-only approval dossier.

Expected validation:

```bash
npm run readiness:approval -- https://cliplot.alfares.cz
```

Expected evidence:

```text
status=approval_required
catalogSource=catalog
warehouseBackedProductCount>0
livePreflight=blocked
wouldMutate=false
mutation=false
providerCall=false
persistence=false
requiredApprovalIds=CLIPLOT_LIVE_ORDER_APPROVAL_ID,CLIPLOT_LIVE_PAYMENT_APPROVAL_ID,CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID
```


## Fail-Closed Live Activation Gate

Status: implemented and validated in guarded mode.

`submitCheckout` now enters the live order branch only when
`liveCheckoutPreflight.status=ready_for_approved_live_mutation`. Partial future
configuration is fail-closed: enabling only a subset of live flags or approval
IDs must keep `wouldMutate=false`.

Expected validation:

```bash
npm run readiness:activation -- https://cliplot.alfares.cz
```

Validation evidence:

```text
npm run readiness:activation -- https://cliplot.alfares.cz
status=approval_required
livePreflight=blocked
wouldMutate=false
wouldCreateOrder=false
wouldCreatePayment=false
wouldSendNotification=false
partialActivationMatrix.order_only_with_all_approvals=blocked,wouldMutate=false
partialActivationMatrix.order_and_payment_without_notification_flag=blocked,wouldMutate=false
partialActivationMatrix.all_flags_before_notification_send_implementation=blocked,wouldMutate=false
```
