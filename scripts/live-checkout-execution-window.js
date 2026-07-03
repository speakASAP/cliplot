#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_CHECKOUT_EXECUTION_BASE_URL || 'http://127.0.0.1:8080';

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

const packetResult = await getJson('/api/checkout/live-execution-window-packet');
const packet = packetResult.payload;

assert(packetResult.response.status === 200 && packet.success, 'live checkout execution window packet failed', packet);
assert(packet.status === 'approval_required_live_checkout_execution_window', 'live checkout execution window should remain blocked by default', packet);
assert(packet.mode === 'guarded_live_checkout_execution_window_packet', 'live checkout execution window mode mismatch', packet);
assert(packet.mutation === false, 'live checkout packet reports mutation', packet);
assert(packet.persistence === false, 'live checkout packet reports persistence', packet);
assert(packet.providerCall === false, 'live checkout packet reports provider call', packet);
assert(packet.liveExecutionAllowed === false, 'live checkout execution unexpectedly allowed', packet);
assert(packet.orderCreated === false, 'live checkout packet created order', packet);
assert(packet.warehouseReserved === false, 'live checkout packet reserved Warehouse stock', packet);
assert(packet.paymentCreated === false, 'live checkout packet created payment', packet);
assert(packet.notificationSent === false, 'live checkout packet sent notification', packet);
assert(packet.liveFlags?.order === false, 'live order flag unexpectedly enabled', packet);
assert(packet.liveFlags?.payment === false, 'live payment flag unexpectedly enabled', packet);
assert(packet.liveFlags?.notification === false, 'live notification flag unexpectedly enabled', packet);
for (const approvalName of ['order', 'payment', 'notification']) {
  assert(typeof packet.approvals?.[approvalName] === 'boolean', `${approvalName} approval metadata shape mismatch`, packet);
}
if (packet.approvals.order === false) {
  assert(packet.executionBlockers?.some((item) => item.includes('CLIPLOT_LIVE_ORDER_APPROVAL_ID')), 'order approval blocker missing', packet);
}
if (packet.approvals.payment === false) {
  assert(packet.executionBlockers?.some((item) => item.includes('CLIPLOT_LIVE_PAYMENT_APPROVAL_ID')), 'payment approval blocker missing', packet);
}
if (packet.approvals.notification === false) {
  assert(packet.executionBlockers?.some((item) => item.includes('CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID')), 'notification approval blocker missing', packet);
}
assert(packet.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_ORDER_SUBMIT=true')), 'order live flag blocker missing', packet);
assert(packet.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_PAYMENT_CREATE=true')), 'payment live flag blocker missing', packet);
assert(packet.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_NOTIFICATIONS=true')), 'notification live flag blocker missing', packet);
assert(packet.executionBlockers?.some((item) => item.includes('CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW')), 'concrete checkout window blocker missing', packet);
assert(packet.duplicatePolicy?.duplicateCheckRequired === 'IDEMPOTENCY_KEYS_NOT_USED', 'duplicate policy missing', packet);
assert(packet.forbiddenOperationsNow?.includes('POST /payments/create'), 'payment create forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('POST /notifications/send'), 'notification send forbidden operation missing', packet);

const executorResult = await postJson('/api/checkout/live-bounded-executor', {
  confirm: 'PLAN_ONLY',
  executionWindow: 'not-approved',
});
const executor = executorResult.payload;

assert(executorResult.response.status === 202, 'live checkout executor should return 202 while blocked', executor);
assert(executor.success === true, 'live checkout executor envelope failed', executor);
assert(executor.status === 'approval_required', 'live checkout executor should require approval', executor);
assert(executor.mode === 'guarded_live_checkout_bounded_executor_stub', 'live checkout executor mode mismatch', executor);
assert(executor.mutation === false, 'live checkout executor reports mutation', executor);
assert(executor.persistence === false, 'live checkout executor reports persistence', executor);
assert(executor.providerCall === false, 'live checkout executor reports provider call', executor);
assert(executor.orderCreated === false, 'live checkout executor created order', executor);
assert(executor.warehouseReserved === false, 'live checkout executor reserved Warehouse stock', executor);
assert(executor.paymentCreated === false, 'live checkout executor created payment', executor);
assert(executor.notificationSent === false, 'live checkout executor sent notification', executor);
assert(executor.liveExecutionAllowed === false, 'live checkout executor unexpectedly allowed live execution', executor);
assert(executor.blockers?.includes('missing_order_idempotency_key'), 'order idempotency blocker missing', executor);
assert(executor.blockers?.includes('missing_payment_idempotency_key'), 'payment idempotency blocker missing', executor);
assert(executor.blockers?.includes('missing_notification_idempotency_key'), 'notification idempotency blocker missing', executor);
assert(executor.blockers?.includes('missing_checkout_duplicate_check'), 'checkout duplicate blocker missing', executor);
assert(executor.sensitiveDataPolicy?.includes('no raw customer PII'), 'customer PII policy missing', executor);

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
  orderCreated: executor.orderCreated,
  warehouseReserved: executor.warehouseReserved,
  paymentCreated: executor.paymentCreated,
  notificationSent: executor.notificationSent,
}, null, 2));
