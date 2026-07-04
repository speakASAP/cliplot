#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_OWNER_BOUNDED_WINDOW_HANDOFF_BASE_URL || 'http://127.0.0.1:8080';

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

const { response, payload: packet } = await getJson('/api/checkout/owner-bounded-window-readiness-handoff-packet');

assert(response.status === 200 && packet.success, 'owner bounded-window handoff packet failed', packet);
assert(packet.status === 'ready_for_owner_bounded_window_handoff_execution_disabled', 'owner bounded-window handoff status mismatch', packet);
assert(packet.mode === 'read_only_owner_bounded_window_readiness_handoff_packet', 'owner bounded-window handoff mode mismatch', packet);
assert(packet.mutation === false, 'handoff packet reports mutation', packet);
assert(packet.persistence === false, 'handoff packet reports persistence', packet);
assert(packet.providerCall === false, 'handoff packet reports provider call', packet);
assert(packet.sideEffects === false, 'handoff packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'handoff packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'handoff packet enables runtime', packet);
assert(packet.executorCalled === false, 'handoff packet called an executor', packet);
assert(packet.liveFlagsClosed === true, 'live flags are not closed', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_ORDER_SUBMIT === false, 'order flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_PAYMENT_CREATE === false, 'payment flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_NOTIFICATIONS === false, 'notification flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE === false, 'order/Warehouse smoke flag unexpectedly open', packet);
assert(packet.readinessEvidence?.liveReadinessHandoff === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled', 'handoff evidence mismatch', packet);
assert(packet.readinessEvidence?.liveCheckoutExecutionRequest === 'approved_live_checkout_execution_request_contract_execution_disabled', 'execution request evidence mismatch', packet);
assert(packet.readinessEvidence?.ownerExecutionRunbook === 'approved_owner_live_execution_runbook_contract_execution_disabled', 'owner runbook evidence mismatch', packet);
assert(packet.readinessEvidence?.liveFlagsOperatorPreflight === 'approved_live_flags_operator_preflight_checklist_execution_disabled', 'operator preflight evidence mismatch', packet);
assert(packet.readinessEvidence?.paymentCreateExecutionWindow === 'approved_payment_create_window_metadata_execution_disabled', 'payment window evidence mismatch', packet);
assert(packet.readinessEvidence?.notificationSendExecutionWindow === 'approved_notification_send_window_metadata_execution_disabled', 'notification window evidence mismatch', packet);
assert(packet.readinessEvidence?.authWalletRuntimeCheckout === 'auth_wallet_runtime_checkout_evidence_recorded_no_live_calls', 'Auth wallet evidence mismatch', packet);
assert(packet.readinessEvidence?.authWalletFetch === false, 'Auth wallet fetch enabled', packet);
assert(packet.readinessEvidence?.authWalletCheckoutSubmit === false, 'Auth wallet checkout submit enabled', packet);
assert(packet.readinessEvidence?.postLiveRevenueClosure === 'validated_completed_full_checkout_live_window_closed', 'post-live revenue evidence mismatch', packet);
assert(packet.readinessEvidence?.revenueHandoffReconciliation === 'ready_for_revenue_handoff_reconciliation_review_execution_disabled', 'revenue handoff evidence mismatch', packet);
assert(['validated_payments_read_scope_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(packet.readinessEvidence?.paymentReadScopeStatus), 'payment read scope status evidence mismatch', packet);
const paymentReadScopeFreshness = packet.readinessEvidence?.paymentReadScopeFreshness;
const paymentReadScopeFreshnessStatus = typeof paymentReadScopeFreshness === 'string' ? paymentReadScopeFreshness : paymentReadScopeFreshness?.status;
assert(['fresh', 'stale_rate_limited'].includes(paymentReadScopeFreshnessStatus), 'payment read scope freshness evidence mismatch', packet);
assert(packet.readinessEvidence?.externalStatusReconciliation === 'validated_external_status_reconciliation_completed_closed', 'external status reconciliation evidence mismatch', packet);
assert(packet.readinessEvidence?.reconciledPaymentStatus === 'cancelled', 'reconciled payment status evidence mismatch', packet);
assert(packet.remainingRevenueClosure?.status === 'approval_required_live_revenue_closure', 'revenue closure status mismatch', packet);
assert(packet.remainingRevenueClosure?.blockerCount === 5, 'revenue blocker count mismatch', packet);
assert(Array.isArray(packet.remainingRevenueClosure?.expectedRevenueBlockers) && packet.remainingRevenueClosure.expectedRevenueBlockers.length === 5, 'expected revenue blocker set mismatch', packet);
assert(Array.isArray(packet.remainingRevenueClosure?.missingExpectedRevenueBlockers) && packet.remainingRevenueClosure.missingExpectedRevenueBlockers.length === 0, 'expected revenue blockers missing', packet);
assert(Array.isArray(packet.remainingRevenueClosure?.unexpectedRevenueBlockers) && packet.remainingRevenueClosure.unexpectedRevenueBlockers.length === 0, 'unexpected revenue blockers present', packet);
assert(packet.ownerWindowRequest?.temporaryFlagOpenRequired?.ENABLE_LIVE_ORDER_SUBMIT === 'true', 'temporary flag-open contract missing', packet);
assert(packet.ownerWindowRequest?.restoreFlagsRequired?.ENABLE_LIVE_ORDER_SUBMIT === 'false', 'restore flag contract missing', packet);
assert(packet.ownerWindowRequest?.fullCheckoutExecutorRequest?.confirm === 'LIVE_CHECKOUT_EXECUTION_WINDOW', 'full checkout request missing', packet);
assert(packet.ownerWindowRequest?.createReplayCancelRequest?.confirm === 'CREATE_REPLAY_CANCEL', 'CREATE_REPLAY_CANCEL request missing', packet);
assert(packet.ownerWindowRequest?.duplicateCheck === 'IDEMPOTENCY_KEYS_NOT_USED', 'duplicate check contract missing', packet);
assert(packet.handoffBoundaries?.mayOpenFlagsNow === false, 'handoff allows opening flags', packet);
assert(packet.handoffBoundaries?.mayCallExecutorNow === false, 'handoff allows executor call', packet);
assert(packet.handoffBoundaries?.mayCreatePaymentNow === false, 'handoff allows payment create', packet);
assert(packet.handoffBoundaries?.maySendNotificationNow === false, 'handoff allows notification send', packet);
assert(packet.handoffBoundaries?.authWalletLiveFetchAllowedNow === false, 'handoff allows Auth wallet live fetch', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'handoff assertions failed', packet);
assert(packet.forbiddenOperationsNow?.includes('do not open live flags from this packet'), 'live flag forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('do not fetch Auth wallet rows or browser session tokens from this packet'), 'Auth wallet forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', '@example.com', 'recipientEmail', 'messageBody', 'rawProviderPayload', 'providerTransactionId']) {
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
  paymentCreateExecutionWindow: packet.readinessEvidence.paymentCreateExecutionWindow,
  notificationSendExecutionWindow: packet.readinessEvidence.notificationSendExecutionWindow,
  paymentReadScopeStatus: packet.readinessEvidence.paymentReadScopeStatus,
  paymentReadScopeFreshness: packet.readinessEvidence.paymentReadScopeFreshness,
  externalStatusReconciliation: packet.readinessEvidence.externalStatusReconciliation,
  reconciledPaymentStatus: packet.readinessEvidence.reconciledPaymentStatus,
  authWalletRuntimeCheckout: packet.readinessEvidence.authWalletRuntimeCheckout,
  failedAssertionCount: packet.failedAssertions.length,
}, null, 2));
