#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_SMOKE_PLAN_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/live-order-warehouse-smoke-plan', baseUrl));
const plan = await response.json();

assert(response.status === 200 && plan.success, 'live smoke plan request failed', {
  httpStatus: response.status,
  status: plan.status,
});
assert(plan.status === 'approval_required', 'live smoke plan is not approval-gated', plan);
assert(plan.mutation === false && plan.providerCall === false && plan.persistence === false, 'plan endpoint is not read-only', plan);
assert(plan.liveExecutionAllowed === false, 'plan unexpectedly allows live execution', plan);
assert(plan.approvalRequired?.orderCreate === true && plan.approvalRequired?.warehouseReservation === true, 'required approval map missing', plan);
assert(Array.isArray(plan.liveExecutionBlockers) && plan.liveExecutionBlockers.length >= 4, 'plan blockers missing', plan);
assert(plan.liveCheckoutPreflight?.status === 'blocked', 'live preflight is not blocked', plan.liveCheckoutPreflight || {});
assert(plan.liveCheckoutPreflight?.wouldMutate === false, 'live preflight would mutate', plan.liveCheckoutPreflight || {});
assert(plan.liveCheckoutPreflight?.mutationPlan?.wouldReserveWarehouse === false, 'live preflight would reserve Warehouse before approval', plan.liveCheckoutPreflight || {});
assert(plan.readiness?.status === 'validated_no_mutation', 'order/Warehouse readiness is not validated', plan.readiness || {});
assert(plan.readiness?.orderValidation?.status === 'validated_no_mutation', 'Orders validation is not ready', plan.readiness?.orderValidation || {});
assert(plan.readiness?.warehouseReservationReadiness?.status === 'validated_no_mutation', 'Warehouse readiness is not ready', plan.readiness?.warehouseReservationReadiness || {});
assert(plan.readiness?.catalog?.productScopeEvidence?.approvedCliplotSkuScope === true, 'product SKU scope approval evidence missing', plan.readiness?.catalog || {});
assert(Array.isArray(plan.readiness?.catalog?.productScopeEvidence?.blockers) && plan.readiness.catalog.productScopeEvidence.blockers.length === 0, 'approved product scope should not have blockers', plan.readiness?.catalog || {});
assert(plan.noPaymentNotificationBoundary?.paymentCreateAllowed === false, 'payment boundary is not closed', plan.noPaymentNotificationBoundary || {});
assert(plan.noPaymentNotificationBoundary?.notificationSendAllowed === false, 'notification boundary is not closed', plan.noPaymentNotificationBoundary || {});
assert(plan.plan?.scopeEvidence?.productId && plan.plan?.scopeEvidence?.warehouseId, 'plan lacks product or warehouse evidence', plan.plan || {});
assert(plan.plan?.payloadPreview?.fingerprintSha256, 'payload fingerprint missing', plan.plan || {});
assert(Array.isArray(plan.plan?.steps) && plan.plan.steps.length === 5, 'plan steps missing', plan.plan || {});
assert(plan.plan?.endpoints?.createOrder === '/api/orders', 'create endpoint missing', plan.plan || {});
assert(plan.plan?.endpoints?.cancelOrderThroughOrders === '/api/orders/{orderId}/status', 'cleanup endpoint missing', plan.plan || {});
assert(plan.plan.steps.some((step) => step.name === 'approved_order_create' && step.endpoint === '/api/orders'), 'approved create step missing', plan.plan || {});
assert(plan.plan.steps.some((step) => step.name === 'idempotent_order_replay'), 'idempotent replay step missing', plan.plan || {});
assert(plan.plan.steps.some((step) => step.name === 'approved_order_cancel_release' && step.endpoint === '/api/orders/{orderId}/status'), 'cancel/release step missing', plan.plan || {});
assert(plan.requiredApprovalIds?.includes('CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID'), 'approval IDs missing', plan);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: plan.status,
  service: plan.service,
  liveExecutionAllowed: plan.liveExecutionAllowed,
  blockerCount: plan.liveExecutionBlockers.length,
  productId: plan.plan.scopeEvidence.productId,
  warehouseId: plan.plan.scopeEvidence.warehouseId,
  sampleExternalOrderId: plan.plan.sampleExternalOrderId,
  payloadFingerprint: plan.plan.payloadPreview.fingerprintSha256,
  stepCount: plan.plan.steps.length,
  createEndpoint: plan.plan.steps.find((step) => step.name === 'approved_order_create')?.endpoint,
  replayStep: plan.plan.steps.some((step) => step.name === 'idempotent_order_replay'),
  cleanupEndpoint: plan.plan.steps.find((step) => step.name === 'approved_order_cancel_release')?.endpoint,
  readiness: plan.readiness.status,
  livePreflight: plan.liveCheckoutPreflight.status,
  wouldReserveWarehouse: plan.liveCheckoutPreflight.mutationPlan.wouldReserveWarehouse,
  mutation: plan.mutation,
  providerCall: plan.providerCall,
  persistence: plan.persistence,
}, null, 2));
