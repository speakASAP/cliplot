#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_CHECKOUT_EXECUTION_REQUEST_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

async function getJson(path) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'GET',
    headers: { accept: 'application/json' },
  });
  const payload = await response.json();
  return { response, payload };
}

const { response, payload: packet } = await getJson('/api/checkout/live-execution-request-packet');

assert(response.status === 200 && packet.success, 'live checkout execution request packet failed', packet);
assert(packet.status === 'approved_live_checkout_execution_request_contract_execution_disabled', 'execution request packet status mismatch', packet);
assert(packet.mode === 'read_only_live_checkout_execution_request_packet', 'execution request packet mode mismatch', packet);
assert(packet.mutation === false, 'execution request packet reports mutation', packet);
assert(packet.persistence === false, 'execution request packet reports persistence', packet);
assert(packet.providerCall === false, 'execution request packet reports provider call', packet);
assert(packet.sideEffects === false, 'execution request packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'execution request packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'execution request packet enables runtime', packet);
assert(packet.orderCreated === false, 'execution request packet created order', packet);
assert(packet.warehouseReserved === false, 'execution request packet reserved Warehouse stock', packet);
assert(packet.paymentCreated === false, 'execution request packet created payment', packet);
assert(packet.notificationSent === false, 'execution request packet sent notification', packet);
assert(packet.liveFlagsClosed === true, 'live flags are not closed', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_ORDER_SUBMIT === false, 'order submit flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_PAYMENT_CREATE === false, 'payment create flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_NOTIFICATIONS === false, 'notifications flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE === false, 'order/Warehouse smoke flag unexpectedly open', packet);
assert(packet.remainingRevenueClosure?.status === 'approval_required_live_revenue_closure', 'revenue closure status mismatch', packet);
assert(packet.remainingRevenueClosure?.blockerCount === 5, 'remaining revenue blocker count mismatch', packet);
assert(Array.isArray(packet.remainingRevenueClosure?.unexpectedRevenueBlockers), 'unexpected blocker shape mismatch', packet);
assert(packet.remainingRevenueClosure.unexpectedRevenueBlockers.length === 0, 'unexpected non-execution revenue blockers present', packet);
assert(packet.readinessEvidence?.liveFlagsOperatorPreflight === 'approved_live_flags_operator_preflight_checklist_execution_disabled', 'operator preflight evidence mismatch', packet);
assert(packet.readinessEvidence?.executionEvidence === 'read_only_live_checkout_execution_evidence_packet_recorded_execution_disabled', 'execution evidence mismatch', packet);
assert(packet.readinessEvidence?.livePreflight === 'blocked', 'live preflight should remain blocked', packet);
assert(packet.readinessEvidence?.livePreflightWouldMutate === false, 'live preflight would mutate now', packet);
assert(packet.ownerExecutionRequest?.executorRequest?.confirm === 'LIVE_CHECKOUT_EXECUTION_WINDOW', 'bounded executor confirmation missing', packet);
assert(packet.ownerExecutionRequest?.createReplayCancelRequest?.confirm === 'CREATE_REPLAY_CANCEL', 'CREATE_REPLAY_CANCEL request missing', packet);
assert(packet.ownerExecutionRequest?.temporaryFlagSetOnlyDuringWindow?.ENABLE_LIVE_ORDER_SUBMIT === 'true', 'temporary flag-open contract missing', packet);
assert(packet.ownerExecutionRequest?.requiredRestoreImmediatelyAfterWindow?.ENABLE_LIVE_ORDER_SUBMIT === 'false', 'restore flag contract missing', packet);
assert(packet.guardrails?.getOnlyRoute === true, 'GET-only guardrail missing', packet);
assert(packet.guardrails?.executorCalled === false, 'packet called executor', packet);
assert(packet.guardrails?.dbWriteAllowed === false, 'packet allows DB writes', packet);
assert(packet.guardrails?.providerCallAllowed === false, 'packet allows provider calls', packet);
assert(packet.guardrails?.secretPrintingAllowed === false, 'packet allows secret printing', packet);
assert(packet.forbiddenOperationsNow?.includes('do not call POST /api/checkout/live-bounded-executor'), 'bounded executor forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', '@example.com', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  liveFlagsClosed: packet.liveFlagsClosed,
  liveExecutionAllowed: packet.liveExecutionAllowed,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
  revenueClosure: packet.remainingRevenueClosure.status,
  revenueBlockerCount: packet.remainingRevenueClosure.blockerCount,
  unexpectedRevenueBlockerCount: packet.remainingRevenueClosure.unexpectedRevenueBlockers.length,
  livePreflight: packet.readinessEvidence.livePreflight,
}, null, 2));
