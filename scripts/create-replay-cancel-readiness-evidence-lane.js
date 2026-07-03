#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_CREATE_REPLAY_CANCEL_EVIDENCE_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

async function fetchJson(path) {
  const response = await fetch(new URL(path, baseUrl));
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    assert(false, `${path} returned non-json response`, {
      httpStatus: response.status,
      body: text.slice(0, 300),
    });
  }
  assert(response.status === 200 && payload.success === true, `${path} request failed`, {
    httpStatus: response.status,
    status: payload.status,
  });
  return payload;
}

function assertDisabledPacket(label, packet) {
  assert(packet.mutation === false, `${label} reports mutation`, packet);
  assert(packet.persistence === false, `${label} reports persistence`, packet);
  assert(packet.providerCall === false, `${label} reports provider call`, packet);
  assert(packet.liveExecutionAllowed === false, `${label} allows live execution`, packet);

  const serialized = JSON.stringify(packet);
  const unredactedSecretPattern = /sk_live|sk_test|whsec_|Bearer\s+(?!<redacted>)[^"\s]+|x-internal-service-token:(?!<redacted>)[^"\s]+/i;
  const unapprovedEmailPattern = /[A-Z0-9._%+-]+@(?!cliplot\.invalid)[A-Z0-9.-]+\.[A-Z]{2,}/i;
  assert(!unredactedSecretPattern.test(serialized), `${label} exposes unredacted secret material`, packet);
  assert(!unapprovedEmailPattern.test(serialized), `${label} exposes non-synthetic email material`, packet);
}

const [plan, checklist, contract] = await Promise.all([
  fetchJson('/api/checkout/live-order-warehouse-smoke-plan'),
  fetchJson('/api/checkout/live-order-warehouse-smoke-execution-checklist-packet'),
  fetchJson('/api/checkout/live-order-warehouse-create-replay-cancel-contract-packet'),
]);

assertDisabledPacket('plan packet', plan);
assertDisabledPacket('execution checklist packet', checklist);
assertDisabledPacket('CREATE_REPLAY_CANCEL contract packet', contract);

assert(plan.status === 'approved_live_order_warehouse_smoke_metadata_execution_disabled', 'plan status is not disabled metadata-approved smoke state', plan);
assert(plan.readiness?.status === 'validated_no_mutation', 'plan readiness is not validated_no_mutation', plan.readiness || {});
assert(plan.liveCheckoutPreflight?.status === 'blocked', 'live checkout preflight is not blocked', plan.liveCheckoutPreflight || {});
assert(plan.liveCheckoutPreflight?.mutationPlan?.wouldReserveWarehouse === false, 'live checkout preflight would reserve Warehouse now', plan.liveCheckoutPreflight || {});
assert(Array.isArray(plan.plan?.steps) && plan.plan.steps.length === 5, 'plan does not expose five CREATE_REPLAY_CANCEL steps', plan.plan || {});
assert(plan.plan?.steps?.some((step) => step.name === 'idempotent_order_replay'), 'idempotent replay step missing', plan.plan || {});
assert(plan.plan?.steps?.some((step) => step.name === 'approved_order_cancel_release'), 'cancel/release step missing', plan.plan || {});
assert(plan.noPaymentNotificationBoundary?.paymentCreateAllowed === false, 'payment create boundary is open', plan.noPaymentNotificationBoundary || {});
assert(plan.noPaymentNotificationBoundary?.notificationSendAllowed === false, 'notification send boundary is open', plan.noPaymentNotificationBoundary || {});

assert(checklist.status === 'approval_required_live_order_warehouse_smoke_execution', 'checklist status is not approval_required', checklist);
assert(checklist.liveOrderWarehouseSmokeFlag === false, 'live smoke runtime flag is enabled', checklist);
assert(checklist.runtimeEnablement?.currentRuntimeFlagEnabled === false, 'runtimeEnablement reports enabled flag', checklist.runtimeEnablement || {});
assert(checklist.runtimeEnablement?.liveExecutionAllowedNow === false, 'runtimeEnablement allows execution now', checklist.runtimeEnablement || {});
assert(checklist.createReplayCancelContract?.status === 'create_replay_cancel_contract_recorded_execution_disabled', 'embedded CREATE_REPLAY_CANCEL contract status changed', checklist.createReplayCancelContract || {});
assert(checklist.createReplayCancelContract?.liveExecutionAllowed === false, 'embedded CREATE_REPLAY_CANCEL contract allows execution', checklist.createReplayCancelContract || {});
assert(checklist.executorRequestChecklist?.endpoint === 'POST /api/checkout/live-order-warehouse-smoke-executor', 'executor endpoint contract missing', checklist.executorRequestChecklist || {});
assert(checklist.executorRequestChecklist?.currentChecklistSendsBody === false, 'checklist sends executor body', checklist.executorRequestChecklist || {});
assert(checklist.executorRequestChecklist?.requiredBody?.confirm === 'CREATE_REPLAY_CANCEL', 'CREATE_REPLAY_CANCEL confirm body requirement missing', checklist.executorRequestChecklist || {});
assert(checklist.expectedExecutionScopeAfterApproval?.paymentCreateAllowed === false, 'payment create allowed after smoke approval', checklist.expectedExecutionScopeAfterApproval || {});
assert(checklist.expectedExecutionScopeAfterApproval?.notificationSendAllowed === false, 'notification send allowed after smoke approval', checklist.expectedExecutionScopeAfterApproval || {});
assert(checklist.expectedExecutionScopeAfterApproval?.callbackPersistenceAllowed === false, 'callback persistence allowed after smoke approval', checklist.expectedExecutionScopeAfterApproval || {});
assert(checklist.rollbackAndStopConditions?.directWarehouseMutationAllowed === false, 'direct Warehouse mutation allowed', checklist.rollbackAndStopConditions || {});
assert(checklist.defaultExecutorBlockers?.includes('live_order_warehouse_smoke_flag_disabled'), 'disabled flag blocker missing', checklist);
assert(checklist.defaultExecutorBlockers?.includes('missing_CREATE_REPLAY_CANCEL_confirmation'), 'CREATE_REPLAY_CANCEL blocker missing', checklist);
assert(checklist.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true')), 'runtime flag execution blocker missing', checklist);

assert(contract.status === checklist.status, 'contract packet status differs from checklist packet', { contractStatus: contract.status, checklistStatus: checklist.status });
assert(contract.createReplayCancelContract?.status === 'create_replay_cancel_contract_recorded_execution_disabled', 'contract packet contract status changed', contract.createReplayCancelContract || {});

const evidenceRequirementsAfterApproval = [
  'create idempotency: approved externalOrderId/idempotency key, Orders create response, created order id, and Warehouse reservation handoff for the approved Cliplot product/warehouse',
  'replay idempotency/no duplicate: second create attempt with the same externalOrderId/idempotency key returns the same order id or explicit duplicate-safe result, with no additional active Warehouse reservation',
  'cancel/rollback outcome: cancel only through Orders status endpoint, final order status cancelled, Warehouse handoff cancelled or released, activeReservationCount=0',
  'notification/payment/order side effects: paymentCreated=false, notificationSent=false, live checkout submit remains disabled, no provider-backed payment create/status write/callback replay occurred',
  'secret/PII redaction: no service token values, bearer tokens, webhook secrets, provider payload secrets, customer email/name/phone/address, or raw payment identifiers in persisted evidence',
  'live flags restored false: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false and all payment, notification, callback persistence/replay, status-write, and live checkout mutation flags false after the window',
];

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  lane: 'worker_b_create_replay_cancel_readiness_evidence',
  runtimeMutationAttempted: false,
  endpointsRead: [
    'GET /api/checkout/live-order-warehouse-smoke-plan',
    'GET /api/checkout/live-order-warehouse-smoke-execution-checklist-packet',
    'GET /api/checkout/live-order-warehouse-create-replay-cancel-contract-packet',
  ],
  statusFields: {
    planStatus: plan.status,
    checklistStatus: checklist.status,
    contractStatus: contract.createReplayCancelContract.status,
    readiness: plan.readiness.status,
    livePreflight: plan.liveCheckoutPreflight.status,
    readyForBoundedWindow: checklist.readyForBoundedWindow,
    liveExecutionAllowed: checklist.liveExecutionAllowed,
    liveOrderWarehouseSmokeFlag: checklist.liveOrderWarehouseSmokeFlag,
    mutation: checklist.mutation,
    persistence: checklist.persistence,
    providerCall: checklist.providerCall,
    paymentCreateAllowed: checklist.expectedExecutionScopeAfterApproval.paymentCreateAllowed,
    notificationSendAllowed: checklist.expectedExecutionScopeAfterApproval.notificationSendAllowed,
    callbackPersistenceAllowed: checklist.expectedExecutionScopeAfterApproval.callbackPersistenceAllowed,
    directWarehouseMutationAllowed: checklist.rollbackAndStopConditions.directWarehouseMutationAllowed,
  },
  blockers: checklist.executionBlockers,
  defaultExecutorBlockers: checklist.defaultExecutorBlockers,
  planEvidence: {
    productId: checklist.planEvidence.productId,
    warehouseId: checklist.planEvidence.warehouseId,
    payloadFingerprint: checklist.planEvidence.payloadFingerprint,
    stepCount: checklist.expectedExecutionScopeAfterApproval.stepCount,
    createEndpoint: checklist.expectedExecutionScopeAfterApproval.createEndpoint,
    cleanupEndpoint: checklist.expectedExecutionScopeAfterApproval.cleanupEndpoint,
  },
  evidenceRequirementsAfterApprovedCreateReplayCancel: evidenceRequirementsAfterApproval,
}, null, 2));
