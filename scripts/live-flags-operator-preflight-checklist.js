#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_CHECKOUT_FLAG_WINDOW_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

async function getJson(path) {
  const response = await fetch(new URL(path, baseUrl));
  const payload = await response.json();
  return { response, payload };
}

const { response, payload: packet } = await getJson('/api/checkout/live-flags-operator-preflight-checklist-packet');

assert(response.status === 200 && packet.success, 'live flag window checklist packet failed', packet);
assert(packet.status === 'approved_live_flags_operator_preflight_checklist_execution_disabled', 'live flag window checklist should be metadata-ready and execution-disabled', packet);
assert(packet.mode === 'read_only_live_flags_operator_preflight_checklist_packet', 'live flag window checklist mode mismatch', packet);
assert(packet.mutation === false, 'live flag checklist reports mutation', packet);
assert(packet.persistence === false, 'live flag checklist reports persistence', packet);
assert(packet.providerCall === false, 'live flag checklist reports provider call', packet);
assert(packet.liveExecutionAllowed === false, 'live flag checklist unexpectedly allows execution', packet);
assert(packet.orderCreated === false, 'live flag checklist created order', packet);
assert(packet.warehouseReserved === false, 'live flag checklist reserved Warehouse stock', packet);
assert(packet.paymentCreated === false, 'live flag checklist created payment', packet);
assert(packet.notificationSent === false, 'live flag checklist sent notification', packet);
assert(packet.metadataReady === true, 'full checkout metadata should be ready before flag-window review', packet);
assert(packet.liveFlagsClosed === true, 'production live flags should remain closed', packet);
assert(packet.currentPacketEnablesRuntime === false, 'packet enables runtime', packet);
assert(packet.currentLiveFlags?.order === false, 'order flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.payment === false, 'payment flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.notification === false, 'notification flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.orderWarehouseSmoke === false, 'order/Warehouse smoke flag unexpectedly open', packet);
assert(packet.requiredTemporaryFlagSet?.ENABLE_LIVE_ORDER_SUBMIT === 'true', 'order temporary flag requirement missing', packet);
assert(packet.requiredRestoreFlagSet?.ENABLE_LIVE_ORDER_SUBMIT === 'false', 'order restore flag requirement missing', packet);
assert(packet.requiredOperatorRequest?.flagWindow?.confirm === 'OPEN_LIVE_CHECKOUT_FLAGS', 'operator confirmation requirement missing', packet);
assert(packet.requiredOperatorRequest?.fullCheckout?.confirm === 'LIVE_CHECKOUT_EXECUTION_WINDOW', 'full checkout confirmation requirement missing', packet);
assert(packet.requiredOperatorRequest?.fullCheckout?.duplicateCheck === 'IDEMPOTENCY_KEYS_NOT_USED', 'full checkout duplicate check requirement missing', packet);
assert(packet.requiredOperatorRequest?.paymentCreate?.confirm === 'LIVE_PAYMENT_CREATE_WINDOW', 'payment create confirmation requirement missing', packet);
assert(packet.requiredOperatorRequest?.notificationSend?.confirm === 'LIVE_NOTIFICATION_SEND_WINDOW', 'notification send confirmation requirement missing', packet);
assert(packet.requiredOperatorRequest?.orderWarehouseSmoke?.confirm === 'CREATE_REPLAY_CANCEL', 'order/Warehouse smoke confirmation requirement missing', packet);
assert(packet.requiredApprovals?.CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW === true, 'checkout execution window approval missing', packet);
assert(packet.readinessEvidence?.simulatedAllFlagsPreflight === 'ready_for_approved_live_mutation', 'simulated all-flags preflight should be ready', packet);
assert(packet.evidence?.executionWindow === 'approved_live_checkout_execution_window_metadata_execution_disabled', 'execution window metadata evidence mismatch', packet);
assert(packet.evidence?.livePreflight === 'blocked', 'preflight should remain blocked before flag window', packet);
assert(packet.evidence?.revenueClosure === 'approval_required_live_revenue_closure', 'revenue closure should remain approval-required', packet);
assert(packet.evidence?.wouldMutateNow === false, 'flag checklist would mutate now', packet);
assert(packet.forbiddenOperationsNow?.includes('do not call POST /api/checkout/submit'), 'checkout submit forbidden operation missing', packet);
const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', '@example.com', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  metadataReady: packet.metadataReady,
  liveFlagsClosed: packet.liveFlagsClosed,
  liveExecutionAllowed: packet.liveExecutionAllowed,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
  executionWindow: packet.evidence.executionWindow,
  livePreflight: packet.evidence.livePreflight,
  revenueClosure: packet.evidence.revenueClosure,
}, null, 2));
