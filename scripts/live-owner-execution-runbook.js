#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_OWNER_RUNBOOK_BASE_URL || 'http://127.0.0.1:8080';

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

const { response, payload: packet } = await getJson('/api/checkout/live-owner-execution-runbook-packet');

assert(response.status === 200 && packet.success, 'owner execution runbook packet failed', packet);
assert(packet.status === 'approved_owner_live_execution_runbook_contract_execution_disabled', 'owner execution runbook status mismatch', packet);
assert(packet.mode === 'read_only_owner_live_execution_runbook_packet', 'owner execution runbook mode mismatch', packet);
assert(packet.mutation === false, 'runbook packet reports mutation', packet);
assert(packet.persistence === false, 'runbook packet reports persistence', packet);
assert(packet.providerCall === false, 'runbook packet reports provider call', packet);
assert(packet.sideEffects === false, 'runbook packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'runbook packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'runbook packet enables runtime', packet);
assert(packet.executorCalled === false, 'runbook packet called executor', packet);
assert(packet.liveFlagsClosed === true, 'live flags are not closed', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_ORDER_SUBMIT === false, 'order flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_PAYMENT_CREATE === false, 'payment flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_NOTIFICATIONS === false, 'notification flag unexpectedly open', packet);
assert(packet.currentLiveFlags?.ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE === false, 'order/Warehouse smoke flag unexpectedly open', packet);
assert(packet.readinessEvidence?.handoff === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled', 'handoff evidence mismatch', packet);
assert(packet.readinessEvidence?.executionRequest === 'approved_live_checkout_execution_request_contract_execution_disabled', 'execution request mismatch', packet);
assert(packet.readinessEvidence?.flagPreflight === 'approved_live_flags_operator_preflight_checklist_execution_disabled', 'flag preflight mismatch', packet);
assert(packet.readinessEvidence?.revenueClosure === 'approval_required_live_revenue_closure', 'revenue closure mismatch', packet);
assert(packet.readinessEvidence?.revenueBlockerCount === 5, 'revenue blocker count mismatch', packet);
assert(packet.ownerRunbook?.phaseOrder?.length === 5, 'phase order missing', packet);
assert(packet.ownerRunbook?.phaseOrder?.[0] === 'pre_open_evidence', 'pre-open phase missing', packet);
assert(packet.ownerRunbook?.phaseOrder?.[4] === 'post_close_evidence', 'post-close phase missing', packet);
assert(packet.ownerRunbook?.temporaryFlagOpenRequired?.ENABLE_LIVE_ORDER_SUBMIT === 'true', 'temporary flag-open contract missing', packet);
assert(packet.ownerRunbook?.restoreFlagsRequired?.ENABLE_LIVE_ORDER_SUBMIT === 'false', 'restore flag contract missing', packet);
assert(packet.ownerRunbook?.executionRequestsRequired?.fullCheckout?.confirm === 'LIVE_CHECKOUT_EXECUTION_WINDOW', 'full checkout executor request missing', packet);
assert(packet.ownerRunbook?.executionRequestsRequired?.createReplayCancel?.confirm === 'CREATE_REPLAY_CANCEL', 'CREATE_REPLAY_CANCEL request missing', packet);
assert(packet.evidenceCaptureSchema?.preOpen?.includes('idempotencyTupleFingerprint'), 'pre-open evidence schema missing idempotency fingerprint', packet);
assert(packet.evidenceCaptureSchema?.restore?.includes('allLiveFlagsFalse'), 'restore evidence schema missing live flag proof', packet);
assert(packet.evidenceCaptureSchema?.postClose?.includes('forbiddenSideEffectsFalse'), 'post-close forbidden side effect proof missing', packet);
assert(packet.guardrails?.getOnlyRoute === true, 'GET-only guardrail missing', packet);
assert(packet.guardrails?.liveFlagPatchAllowedNow === false, 'runbook allows flag patch now', packet);
assert(packet.guardrails?.dbWriteAllowed === false, 'runbook allows DB writes', packet);
assert(packet.guardrails?.providerCallAllowed === false, 'runbook allows provider calls', packet);
assert(packet.guardrails?.secretPrintingAllowed === false, 'runbook allows secret printing', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'runbook assertions failed', packet);
assert(packet.forbiddenOperationsNow?.includes('do not patch ENABLE_LIVE_* flags from this packet'), 'flag patch forbidden operation missing', packet);

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
  phaseCount: packet.ownerRunbook.phaseOrder.length,
  failedAssertionCount: packet.failedAssertions.length,
}, null, 2));
