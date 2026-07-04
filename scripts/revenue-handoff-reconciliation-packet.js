#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_REVENUE_HANDOFF_RECONCILIATION_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/revenue-handoff-reconciliation-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'revenue handoff reconciliation packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'revenue handoff reconciliation packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'ready_for_revenue_handoff_reconciliation_review_execution_disabled', 'revenue handoff reconciliation status mismatch', packet);
assert(packet.mode === 'read_only_revenue_handoff_reconciliation_packet', 'revenue handoff reconciliation mode mismatch', packet);
assert(packet.mutation === false, 'handoff packet reports mutation', packet);
assert(packet.persistence === false, 'handoff packet reports persistence', packet);
assert(packet.providerCall === false, 'handoff packet reports provider call', packet);
assert(packet.sideEffects === false, 'handoff packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'handoff packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'handoff packet enables runtime', packet);
assert(packet.completedRevenueEvidence?.executorStatus === 'live_checkout_bounded_execution_completed_cleanup_completed', 'completed live checkout evidence missing', packet);
assert(packet.completedRevenueEvidence?.orderReplaySameOrderId === true, 'order replay idempotency evidence missing', packet);
assert(packet.completedRevenueEvidence?.orderFinalStatus === 'cancelled', 'order final status evidence missing', packet);
assert(packet.completedRevenueEvidence?.warehouseActiveReservationCount === 0, 'warehouse release evidence missing', packet);
assert(packet.completedRevenueEvidence?.paymentStatus === 'processing', 'original payment processing evidence missing', packet);
assert(packet.completedRevenueEvidence?.reconciledPaymentStatus === 'cancelled', 'reconciled payment cancellation evidence missing', packet);
assert(packet.completedRevenueEvidence?.paymentSnapshotReadback === 'resolved_from_payments_snapshot', 'payment snapshot readback evidence missing', packet);
assert(packet.completedRevenueEvidence?.notificationStatus === 'sent', 'notification sent evidence missing', packet);
assert(packet.completedRevenueEvidence?.fingerprintsOnly === true, 'fingerprints-only policy missing', packet);
assert(packet.currentClosedRuntime?.liveFlagsClosed === true, 'live flags are not closed now', packet);
assert(packet.currentClosedRuntime?.livePreflight === 'blocked', 'live preflight should be blocked now', packet);
assert(packet.currentClosedRuntime?.wouldMutateNow === false, 'handoff packet would mutate now', packet);
assert(packet.currentClosedRuntime?.revenueClosure === 'approval_required_live_revenue_closure', 'revenue closure should remain approval-required now', packet);
assert(packet.currentClosedRuntime?.callbackPersistence === false, 'callback persistence enabled', packet);
assert(packet.currentClosedRuntime?.callbackReplayEnabled === false, 'callback replay enabled', packet);
assert(packet.currentClosedRuntime?.liveStatusWritesNow === false, 'live status writes enabled', packet);
assert(packet.reconciliationBoundaries?.noLocalRevenueLedger === true, 'local revenue ledger boundary missing', packet);
assert(packet.reconciliationBoundaries?.noCallbackPersistence === true, 'callback persistence boundary missing', packet);
assert(packet.reconciliationBoundaries?.noCallbackReplayExecution === true, 'callback replay boundary missing', packet);
assert(packet.reconciliationBoundaries?.noLiveStatusWrites === true, 'live status write boundary missing', packet);
assert(packet.reconciliationBoundaries?.noProviderBackedPaymentIdReads === true, 'provider-backed payment read boundary missing', packet);
assert(packet.revenueClosureDisposition?.currentlyReadyForNewMutation === false, 'packet reports ready for mutation', packet);
assert(packet.revenueClosureDisposition?.remainingBlockersRequireFutureBoundedWindow === true, 'future bounded window disposition missing', packet);
const expectedRevenueBlockers = [
  '[MISSING: ENABLE_LIVE_ORDER_SUBMIT=true only during the approved bounded live checkout window]',
  '[MISSING: ENABLE_LIVE_PAYMENT_CREATE=true only during a separate approved bounded payment execution window]',
  '[MISSING: ENABLE_LIVE_NOTIFICATIONS=true only during a separate approved bounded notification execution window]',
  '[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for owner-approved smoke execution window]',
  '[MISSING: approved live checkout mutation activation remains blocked]',
];
assert(packet.revenueClosureDisposition?.blockerCount === expectedRevenueBlockers.length, 'unexpected revenue blocker count', packet);
assert(Array.isArray(packet.revenueClosureDisposition?.expectedFutureWindowBlockers), 'expected future-window blockers missing', packet);
assert(expectedRevenueBlockers.every((item) => packet.revenueClosureDisposition.expectedFutureWindowBlockers.includes(item)), 'expected future-window blocker set changed', packet);
assert(Array.isArray(packet.revenueClosureDisposition?.missingExpectedRevenueBlockers) && packet.revenueClosureDisposition.missingExpectedRevenueBlockers.length === 0, 'expected revenue blocker missing', packet);
assert(Array.isArray(packet.revenueClosureDisposition?.unexpectedRevenueBlockers) && packet.revenueClosureDisposition.unexpectedRevenueBlockers.length === 0, 'unexpected revenue blocker present', packet);
assert(expectedRevenueBlockers.every((item) => packet.revenueClosureDisposition.blockers.includes(item)), 'remaining revenue blockers do not match expected future-window blockers', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'handoff assertions failed', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'handoff blockers should be empty', packet);
assert(packet.forbiddenOperationsNow?.includes('do not open live flags from this packet'), 'live flag forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', '@example.com', 'recipientEmail', 'messageBody', 'rawProviderPayload', 'providerTransactionId']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  completedOrderId: packet.completedRevenueEvidence.orderId,
  executorStatus: packet.completedRevenueEvidence.executorStatus,
  paymentStatus: packet.completedRevenueEvidence.paymentStatus,
  reconciledPaymentStatus: packet.completedRevenueEvidence.reconciledPaymentStatus,
  notificationStatus: packet.completedRevenueEvidence.notificationStatus,
  liveFlagsClosed: packet.currentClosedRuntime.liveFlagsClosed,
  revenueClosure: packet.currentClosedRuntime.revenueClosure,
  revenueBlockerCount: packet.revenueClosureDisposition.blockerCount,
  failedAssertionCount: packet.failedAssertions.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));
