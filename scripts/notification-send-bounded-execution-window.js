#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_NOTIFICATION_SEND_EXECUTION_BASE_URL || 'http://127.0.0.1:8080';

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

const packetResult = await getJson('/api/notifications/send-execution-window-packet');
const packet = packetResult.payload;

assert(packetResult.response.status === 200 && packet.success, 'notification execution window packet failed', packet);
assert(['approval_required_notification_send_execution_window', 'approved_notification_send_window_metadata_execution_disabled'].includes(packet.status), 'notification execution window status mismatch', packet);
assert(packet.mode === 'guarded_notification_send_bounded_execution_window_packet', 'notification execution window mode mismatch', packet);
assert(packet.mutation === false, 'notification execution packet reports mutation', packet);
assert(packet.persistence === false, 'notification execution packet reports persistence', packet);
assert(packet.providerCall === false, 'notification execution packet reports provider call', packet);
assert(packet.liveExecutionAllowed === false, 'notification execution unexpectedly allowed', packet);
assert(packet.requiredRuntime?.liveFlag === 'ENABLE_LIVE_NOTIFICATIONS', 'notification live flag requirement missing', packet);
assert(packet.requiredRuntime?.approvalId === 'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID', 'notification approval id requirement missing', packet);
assert(packet.requiredRuntime?.executionWindow === 'CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW', 'notification execution window requirement missing', packet);
assert(packet.duplicatePolicy?.idempotencyKeyRequired === true, 'notification idempotency requirement missing', packet);
assert(packet.fullCheckoutIsolation?.fullCheckoutActivationAllowed === false, 'notification packet allows full checkout activation', packet);
assert(packet.fullCheckoutIsolation?.liveOrderSubmit === false, 'notification packet has order submit enabled', packet);
assert(packet.fullCheckoutIsolation?.livePaymentCreate === false, 'notification packet has payment create enabled', packet);
assert(packet.forbiddenOperationsNow?.includes('POST /notifications/send'), 'notification send forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('create payment'), 'payment boundary missing from notification packet', packet);
assert(packet.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_NOTIFICATIONS=true')), 'notification live flag blocker missing', packet);
assert(packet.approvalMetadata?.approvalPresent === true, 'notification approval metadata should be recorded', packet);
assert(packet.approvalMetadata?.metadataReady === (packet.status === 'approved_notification_send_window_metadata_execution_disabled'), 'notification metadata readiness mismatch', packet);
assert(packet.blockerClassification?.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_NOTIFICATIONS=true')), 'notification live execution blocker missing', packet);

const executorResult = await postJson('/api/notifications/send-bounded-executor', {
  confirm: 'PLAN_ONLY',
  approvalId: 'not-approved',
});
const executor = executorResult.payload;

assert(executorResult.response.status === 202, 'notification executor should return 202 while blocked', executor);
assert(executor.success === true, 'notification executor envelope failed', executor);
assert(executor.status === 'approval_required', 'notification executor should require approval', executor);
assert(executor.mode === 'guarded_notification_send_bounded_executor_stub', 'notification executor mode mismatch', executor);
assert(executor.mutation === false, 'notification executor reports mutation', executor);
assert(executor.persistence === false, 'notification executor reports persistence', executor);
assert(executor.providerCall === false, 'notification executor reports provider call', executor);
assert(executor.notificationSent === false, 'notification executor sent notification', executor);
assert(executor.liveExecutionAllowed === false, 'notification executor unexpectedly allowed live execution', executor);
assert(executor.endpointBoundary?.forbiddenLiveEndpoint === '/notifications/send', 'notification live endpoint boundary missing', executor);
assert(executor.endpointBoundary?.fullCheckoutActivationAllowed === false, 'notification executor allows full checkout activation', executor);
assert(executor.blockers?.includes('missing_notification_send_idempotency_key'), 'notification idempotency blocker missing', executor);
assert(executor.blockers?.includes('missing_notification_duplicate_check'), 'notification duplicate blocker missing', executor);
assert(executor.blockers?.includes('missing_notification_rollback_plan'), 'notification rollback blocker missing', executor);
assert(executor.sensitiveDataPolicy?.includes('no NOTIFICATIONS_SERVICE_TOKEN value'), 'notification secret policy missing', executor);

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
  notificationSent: executor.notificationSent,
}, null, 2));
