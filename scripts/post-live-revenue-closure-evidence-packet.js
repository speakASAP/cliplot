#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_POST_LIVE_REVENUE_CLOSURE_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/post-live-revenue-closure-evidence-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'post-live revenue closure evidence packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'post-live revenue closure evidence packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'validated_completed_full_checkout_live_window_closed', 'post-live revenue closure status mismatch', packet);
assert(packet.mode === 'read_only_post_live_revenue_closure_evidence_packet', 'post-live revenue closure mode mismatch', packet);
assert(packet.mutation === false, 'post-live packet reports mutation', packet);
assert(packet.persistence === false, 'post-live packet reports persistence', packet);
assert(packet.providerCall === false, 'post-live packet reports provider call', packet);
assert(packet.sideEffects === false, 'post-live packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'post-live packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'post-live packet enables runtime', packet);
assert(packet.completedWindow?.status === 'validated_completed_full_checkout_live_window_closed', 'completed live window evidence missing', packet);
assert(packet.completedWindow?.executorStatus === 'live_checkout_bounded_execution_completed_cleanup_completed', 'completed executor evidence mismatch', packet);
assert(packet.completedWindow?.cleanupSuccess === true, 'cleanup success evidence missing', packet);
assert(packet.completedWindow?.orderCreated === true, 'order create evidence missing', packet);
assert(packet.completedWindow?.warehouseReserved === true, 'warehouse reservation evidence missing', packet);
assert(packet.completedWindow?.paymentCreated === true, 'payment create evidence missing', packet);
assert(packet.completedWindow?.notificationSent === true, 'notification send evidence missing', packet);
assert(packet.completedWindow?.orderReplaySameOrderId === true, 'order replay idempotency evidence missing', packet);
assert(packet.completedWindow?.orderCancelStatus === 'cancelled', 'order cancel evidence missing', packet);
assert(packet.completedWindow?.warehouseAfterCancel?.activeReservationCount === 0, 'warehouse release evidence missing', packet);
assert(packet.completedWindow?.paymentEvidence?.status === 'processing', 'payment processing evidence missing', packet);
assert(packet.completedWindow?.notificationEvidence?.status === 'sent', 'notification sent evidence missing', packet);
assert(packet.currentClosedState?.liveFlagsClosed === true, 'live flags are not closed now', packet);
assert(packet.currentClosedState?.livePreflight === 'blocked', 'live preflight should be blocked now', packet);
assert(packet.currentClosedState?.wouldMutateNow === false, 'post-live evidence would mutate now', packet);
assert(packet.currentClosedState?.revenueClosure === 'approval_required_live_revenue_closure', 'revenue closure should remain approval-required now', packet);
assert(packet.currentClosedState?.liveReadinessHandoff === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled', 'handoff evidence mismatch', packet);
assert(packet.currentClosedState?.ownerRunbook === 'approved_owner_live_execution_runbook_contract_execution_disabled', 'owner runbook evidence mismatch', packet);
assert(packet.currentClosedState?.callbackPersistence === false, 'callback persistence enabled', packet);
assert(packet.currentClosedState?.callbackReplayEnabled === false, 'callback replay enabled', packet);
assert(packet.currentClosedState?.liveStatusWritesNow === false, 'live status writes enabled', packet);
assert(packet.distinction?.completedWindowValidated === true, 'completed-window distinction missing', packet);
assert(packet.distinction?.currentlyOpenLiveFlagsRequiredForNewMutation === true, 'future live flag distinction missing', packet);
assert(packet.distinction?.revenueClosureRemainsGuardedByDesign === true, 'guarded revenue closure distinction missing', packet);
assert(packet.distinction?.currentPacketMayOpenFlags === false, 'packet can open flags', packet);
assert(packet.distinction?.currentPacketMayCallExecutor === false, 'packet can call executor', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'post-live assertions failed', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'post-live blockers should be empty', packet);
assert(packet.forbiddenOperationsNow?.includes('do not open live flags from this packet'), 'live flag forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', '@example.com', 'recipientEmail', 'messageBody', 'rawProviderPayload', 'providerTransactionId']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  completedWindow: packet.completedWindow.status,
  executorStatus: packet.completedWindow.executorStatus,
  orderId: packet.completedWindow.orderId,
  paymentStatus: packet.completedWindow.paymentEvidence.status,
  notificationStatus: packet.completedWindow.notificationEvidence.status,
  liveFlagsClosed: packet.currentClosedState.liveFlagsClosed,
  revenueClosure: packet.currentClosedState.revenueClosure,
  revenueBlockerCount: packet.currentClosedState.revenueBlockerCount,
  liveExecutionAllowed: packet.liveExecutionAllowed,
  failedAssertionCount: packet.failedAssertions.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));
