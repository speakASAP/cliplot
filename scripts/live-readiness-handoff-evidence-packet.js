#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_READINESS_HANDOFF_BASE_URL || 'http://127.0.0.1:8080';

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

const { response, payload: packet } = await getJson('/api/checkout/live-readiness-handoff-evidence-packet');

assert(response.status === 200 && packet.success, 'handoff evidence packet failed', packet);
assert(packet.status === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled', 'handoff evidence status mismatch', packet);
assert(packet.mode === 'read_only_checkout_payment_notification_handoff_evidence_packet', 'handoff evidence mode mismatch', packet);
assert(packet.mutation === false, 'handoff packet reports mutation', packet);
assert(packet.persistence === false, 'handoff packet reports persistence', packet);
assert(packet.providerCall === false, 'handoff packet reports provider call', packet);
assert(packet.sideEffects === false, 'handoff packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'handoff packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'handoff packet enables runtime', packet);
assert(packet.orderCreated === false, 'handoff packet created order', packet);
assert(packet.warehouseReserved === false, 'handoff packet reserved Warehouse stock', packet);
assert(packet.paymentCreated === false, 'handoff packet created payment', packet);
assert(packet.notificationSent === false, 'handoff packet sent notification', packet);
assert(packet.callbackPersistence === false, 'handoff packet allows callback persistence', packet);
assert(packet.callbackReplay === false, 'handoff packet allows callback replay', packet);
assert(packet.statusWrite === false, 'handoff packet allows status write', packet);
assert(packet.providerRead === false, 'handoff packet allows provider read', packet);
assert(packet.liveFlagsClosed === true, 'live flags are not closed', packet);
assert(packet.currentLiveFlags?.order === false, 'order flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.payment === false, 'payment flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.notification === false, 'notification flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.orderWarehouseSmoke === false, 'order/Warehouse smoke flag unexpectedly open', packet);
assert(packet.readinessEvidence?.liveCheckoutExecution === 'read_only_live_checkout_execution_evidence_packet_recorded_execution_disabled', 'live checkout execution evidence mismatch', packet);
assert(packet.readinessEvidence?.executionRequest === 'approved_live_checkout_execution_request_contract_execution_disabled', 'execution request evidence mismatch', packet);
assert(packet.readinessEvidence?.createReplayCancelReadyForBoundedWindow === true, 'CREATE_REPLAY_CANCEL bounded window readiness missing', packet);
assert(packet.readinessEvidence?.paymentCreate === 'approved_payment_create_metadata_execution_disabled', 'payment create evidence mismatch', packet);
assert(packet.readinessEvidence?.paymentCreateValidation === 'validated_no_mutation', 'payment create validation mismatch', packet);
assert(packet.readinessEvidence?.notificationSend === 'approved_notification_send_metadata_execution_disabled', 'notification send evidence mismatch', packet);
assert(packet.readinessEvidence?.notificationSendValidation === 'validated_no_send', 'notification validation mismatch', packet);
assert(packet.readinessEvidence?.paymentStatus === 'ready_for_approved_payment_status_runtime_read', 'payment status evidence mismatch', packet);
assert(['validated_payments_read_scope_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(packet.readinessEvidence?.paymentReadScopeStatus), 'payment read scope status not accepted', packet);
const paymentReadScopeFreshness = packet.readinessEvidence?.paymentReadScopeFreshness;
const paymentReadScopeFreshnessStatus = typeof paymentReadScopeFreshness === 'string' ? paymentReadScopeFreshness : paymentReadScopeFreshness?.status;
assert(['fresh', 'stale_rate_limited'].includes(paymentReadScopeFreshnessStatus), 'payment read scope freshness missing', packet);
if (packet.readinessEvidence?.paymentReadScopeStatus === 'validated_payments_read_scope_no_mutation_cached') {
  assert(paymentReadScopeFreshnessStatus === 'stale_rate_limited', 'cached payment read scope must be labeled stale_rate_limited', packet);
}
assert(packet.readinessEvidence?.checkoutStatusSurface === 'approved_read_only_customer_status_surface_contract', 'checkout status surface mismatch', packet);
assert(packet.readinessEvidence?.revenueClosure === 'approval_required_live_revenue_closure', 'revenue closure evidence mismatch', packet);
assert(packet.readinessEvidence?.liveFlagsPreflight === 'approved_live_flags_operator_preflight_checklist_execution_disabled', 'live flags preflight mismatch', packet);
assert(packet.readinessEvidence?.livePreflight === 'blocked', 'live preflight should remain blocked', packet);
assert(packet.readinessEvidence?.livePreflightWouldMutate === false, 'live preflight would mutate', packet);
assert(Array.isArray(packet.assertions) && packet.assertions.length >= 20, 'assertion list missing', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'handoff assertions failed', packet);
assert(packet.guardrails?.getOnlyRoute === true, 'GET-only guardrail missing', packet);
assert(packet.guardrails?.executorCalled === false, 'handoff packet called executor', packet);
assert(packet.guardrails?.dbWriteAllowed === false, 'handoff packet allows DB writes', packet);
assert(packet.guardrails?.providerCallAllowed === false, 'handoff packet allows provider calls', packet);
assert(packet.guardrails?.secretPrintingAllowed === false, 'handoff packet allows secret printing', packet);
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
  paymentReadScopeStatus: packet.readinessEvidence.paymentReadScopeStatus,
  paymentReadScopeFreshness: packet.readinessEvidence.paymentReadScopeFreshness,
  failedAssertionCount: packet.failedAssertions.length,
}, null, 2));
