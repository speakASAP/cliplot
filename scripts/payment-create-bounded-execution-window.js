#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CREATE_EXECUTION_BASE_URL || 'http://127.0.0.1:8080';

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

async function postJson(path, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { response, payload };
}

const packetResult = await getJson('/api/payments/create-execution-window-packet');
const packet = packetResult.payload;

assert(packetResult.response.status === 200 && packet.success, 'payment execution window packet failed', packet);
assert(['approval_required_payment_create_execution_window', 'approved_payment_create_window_metadata_execution_disabled'].includes(packet.status), 'payment execution window status mismatch', packet);
assert(packet.mode === 'guarded_payment_create_bounded_execution_window_packet', 'payment execution window mode mismatch', packet);
assert(packet.mutation === false, 'payment execution packet reports mutation', packet);
assert(packet.persistence === false, 'payment execution packet reports persistence', packet);
assert(packet.providerCall === false, 'payment execution packet reports provider call', packet);
assert(packet.liveExecutionAllowed === false, 'payment execution unexpectedly allowed', packet);
assert(packet.requiredRuntime?.liveFlag === 'ENABLE_LIVE_PAYMENT_CREATE', 'payment live flag requirement missing', packet);
assert(packet.requiredRuntime?.approvalId === 'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID', 'payment approval id requirement missing', packet);
assert(packet.requiredRuntime?.executionWindow === 'CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW', 'payment execution window requirement missing', packet);
assert(packet.duplicatePolicy?.idempotencyKeyRequired === true, 'payment idempotency requirement missing', packet);
assert(packet.fullCheckoutIsolation?.fullCheckoutActivationAllowed === false, 'payment packet allows full checkout activation', packet);
assert(packet.fullCheckoutIsolation?.liveOrderSubmit === false, 'payment packet has order submit enabled', packet);
assert(packet.fullCheckoutIsolation?.liveNotifications === false, 'payment packet has notifications enabled', packet);
assert(packet.forbiddenOperationsNow?.includes('POST /payments/create'), 'payment create forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('send notification'), 'notification boundary missing from payment packet', packet);
assert(packet.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_PAYMENT_CREATE=true')), 'payment live flag blocker missing', packet);
assert(packet.approvalMetadata?.approvalPresent === true, 'payment approval metadata should be recorded', packet);
assert(packet.approvalMetadata?.metadataReady === (packet.status === 'approved_payment_create_window_metadata_execution_disabled'), 'payment metadata readiness mismatch', packet);
assert(packet.blockerClassification?.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_PAYMENT_CREATE=true')), 'payment live execution blocker missing', packet);

const executorResult = await postJson('/api/payments/create-bounded-executor', {
  confirm: 'PLAN_ONLY',
  approvalId: 'not-approved',
});
const executor = executorResult.payload;

assert(executorResult.response.status === 202, 'payment executor should return 202 while blocked', executor);
assert(executor.success === true, 'payment executor envelope failed', executor);
assert(executor.status === 'approval_required', 'payment executor should require approval', executor);
assert(executor.mode === 'guarded_payment_create_bounded_executor', 'payment executor mode mismatch', executor);
assert(executor.mutation === false, 'payment executor reports mutation', executor);
assert(executor.persistence === false, 'payment executor reports persistence', executor);
assert(executor.providerCall === false, 'payment executor reports provider call', executor);
assert(executor.paymentCreated === false, 'payment executor created payment', executor);
assert(executor.liveExecutionAllowed === false, 'payment executor unexpectedly allowed live execution', executor);
assert(executor.endpointBoundary?.forbiddenLiveEndpoint === '/payments/create', 'payment live endpoint boundary missing', executor);
assert(executor.endpointBoundary?.fullCheckoutActivationAllowed === false, 'payment executor allows full checkout activation', executor);
assert(executor.blockers?.includes('missing_payment_create_idempotency_key'), 'payment idempotency blocker missing', executor);
assert(executor.blockers?.includes('missing_payment_duplicate_check'), 'payment duplicate blocker missing', executor);
assert(executor.blockers?.includes('missing_payment_rollback_plan'), 'payment rollback blocker missing', executor);
assert(executor.sensitiveDataPolicy?.includes('no PAYMENT_API_KEY value'), 'payment secret policy missing', executor);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  packetStatus: packet.status,
  executorStatus: executor.status,
  liveExecutionAllowed: executor.liveExecutionAllowed,
  blockerCount: executor.blockers.length,
  mutation: executor.mutation,
  persistence: executor.persistence,
  providerCall: executor.providerCall,
  paymentCreated: executor.paymentCreated,
}, null, 2));
