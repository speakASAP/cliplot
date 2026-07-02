#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_SMOKE_EXECUTOR_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
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

const { response, payload } = await postJson('/api/checkout/live-order-warehouse-smoke-executor', {
  confirm: 'PLAN_ONLY',
  approvedBy: 'readiness-probe',
  approvalId: 'not-a-real-approval',
});

assert(response.status === 202, 'guarded executor should refuse with HTTP 202 by default', {
  httpStatus: response.status,
  payload,
});
assert(payload.success === true, 'guarded executor response is not successful readiness envelope', payload);
assert(payload.status === 'approval_required', 'guarded executor is not approval gated by default', payload);
assert(payload.mode === 'guarded_live_order_warehouse_smoke_executor', 'executor mode missing', payload);
assert(payload.mutation === false, 'guarded executor default response reports mutation', payload);
assert(payload.providerCall === false, 'guarded executor default response reports provider call', payload);
assert(payload.persistence === false, 'guarded executor default response reports persistence', payload);
assert(payload.liveExecutionAllowed === false, 'guarded executor unexpectedly allows live execution', payload);
assert(payload.approvalRequired?.owner === true, 'owner approval requirement missing', payload);
assert(payload.approvalRequired?.orderCreate === true, 'order approval requirement missing', payload);
assert(payload.approvalRequired?.warehouseReservation === true, 'Warehouse approval requirement missing', payload);
assert(payload.approvalRequired?.payment === false, 'payment should remain outside this smoke executor', payload);
assert(payload.approvalRequired?.notification === false, 'notification should remain outside this smoke executor', payload);
assert(Array.isArray(payload.blockers) && payload.blockers.includes('live_order_warehouse_smoke_flag_disabled'), 'disabled flag blocker missing', payload);
assert(Array.isArray(payload.blockers) && payload.blockers.includes('invalid_or_missing_smoke_approval_id'), 'approval blocker missing', payload);
assert(Array.isArray(payload.blockers) && !payload.blockers.includes('missing_ORDERS_STATUS_SERVICE_TOKEN'), 'Orders status token should be projected after status-smoke provisioning', payload);
assert(['approval_required', 'approved_live_order_warehouse_smoke_metadata_execution_disabled'].includes(payload.plan?.status), 'executor did not include the read-only smoke plan', payload);
assert(payload.plan?.mutation === false, 'embedded plan reports mutation', payload.plan || {});
assert(payload.plan?.liveExecutionAllowed === false, 'embedded plan unexpectedly allows execution', payload.plan || {});
assert(payload.noPaymentNotificationBoundary?.paymentCreateAllowed === false, 'payment boundary not closed', payload);
assert(payload.noPaymentNotificationBoundary?.notificationSendAllowed === false, 'notification boundary not closed', payload);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  httpStatus: response.status,
  status: payload.status,
  mode: payload.mode,
  liveExecutionAllowed: payload.liveExecutionAllowed,
  blockerCount: payload.blockers.length,
  planStatus: payload.plan.status,
  mutation: payload.mutation,
  providerCall: payload.providerCall,
  persistence: payload.persistence,
  paymentBoundary: payload.noPaymentNotificationBoundary.paymentCreateAllowed,
  notificationBoundary: payload.noPaymentNotificationBoundary.notificationSendAllowed,
}, null, 2));
