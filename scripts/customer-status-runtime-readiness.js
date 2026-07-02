#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_CUSTOMER_STATUS_RUNTIME_READINESS_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

async function getJson(path) {
  const response = await fetch(new URL(path, baseUrl));
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    assert(false, 'non-json response', { path, httpStatus: response.status, body: text.slice(0, 300) });
  }
  return { response, payload };
}

const { response: readinessResponse, payload: readiness } = await getJson('/api/payments/status-runtime-readiness');
assert(readinessResponse.status === 200 && readiness.success, 'payment status runtime readiness request failed', {
  httpStatus: readinessResponse.status,
  status: readiness.status,
});
const approved = readiness.status === 'ready_for_approved_payments_snapshot_runtime_read';
assert(approved || readiness.status === 'blocked_payments_snapshot_runtime_read', 'runtime snapshot read status unexpected', readiness);
assert(readiness.storageRead === false, 'storage read unexpectedly enabled', readiness);
assert(readiness.callbackPersistence === false, 'callback persistence unexpectedly enabled', readiness);
assert(readiness.providerCall === false, 'runtime readiness reported provider call', readiness);
assert(readiness.mutation === false, 'runtime readiness reported mutation', readiness);
assert(readiness.persistence === false, 'runtime readiness reported persistence', readiness);
assert(readiness.readContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'snapshot endpoint changed', readiness);
assert(readiness.readContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', readiness);
assert(readiness.readContract?.providerCall === false, 'read contract would call provider', readiness);
assert(Array.isArray(readiness.forbiddenOperations) && readiness.forbiddenOperations.includes('read /payments/{paymentId}'), 'forbidden paymentId read missing', readiness);

const { response: statusResponse, payload: status } = await getJson('/api/payments/status?orderId=cliplot-runtime-readiness');
assert(statusResponse.status === 200 && status.success, 'payment status request failed', {
  httpStatus: statusResponse.status,
  status: status.status,
});
assert(['payment_status_guarded_no_persistence', 'payment_status_snapshot_not_available', 'payment_status_snapshot_temporarily_unavailable', 'payment_status_snapshot_read'].includes(status.status), 'payment status runtime response unexpected', status);
assert(status.storageRead === false, 'payment status storage read unexpectedly enabled', status);
assert(status.providerCall === false, 'payment status reported provider call', status);
assert(status.mutation === false, 'payment status reported mutation', status);
assert(status.persistence === false, 'payment status reported persistence', status);

const { response: paymentIdResponse, payload: paymentIdOnlyStatus } = await getJson('/api/payments/status?paymentId=cliplot-runtime-readiness-payment');
assert([200, 400].includes(paymentIdResponse.status), 'paymentId-only status returned unexpected http status', {
  httpStatus: paymentIdResponse.status,
  status: paymentIdOnlyStatus.status,
});
if (approved) {
  assert(readiness.runtimeReadEnabled === true, 'approved runtime read not enabled', readiness);
  assert(readiness.paymentsSnapshotReadEnabled === true, 'approved snapshot read not enabled', readiness);
  assert(readiness.customerStatusRuntimeRead === true, 'approved customer runtime flag missing', readiness);
  assert(readiness.paymentStatusSnapshotRead === true, 'approved snapshot runtime flag missing', readiness);
  assert(readiness.statusRuntimeApprovalPresent === true, 'approved runtime approval missing', readiness);
  assert(status.runtimeReadEnabled === true, 'approved payment status runtime read disabled', status);
  assert(status.paymentsSnapshotReadEnabled === true, 'approved payment status snapshot read disabled', status);
  assert(paymentIdResponse.status === 400, 'approved paymentId-only request should be rejected', paymentIdOnlyStatus);
  assert(paymentIdOnlyStatus.status === 'payment_status_order_id_required_for_snapshot_read', 'approved paymentId-only status unexpected', paymentIdOnlyStatus);
  assert(paymentIdOnlyStatus.forbiddenEndpoint === '/payments/{paymentId}', 'approved paymentId-only forbidden endpoint missing', paymentIdOnlyStatus);
} else {
  assert(readiness.runtimeReadEnabled === false, 'blocked runtime read unexpectedly enabled', readiness);
  assert(readiness.paymentsSnapshotReadEnabled === false, 'blocked snapshot read unexpectedly enabled', readiness);
  assert(status.status === 'payment_status_guarded_no_persistence', 'blocked payment status should remain guarded', status);
  assert(status.passiveSnapshotAdapter?.active === false, 'blocked passive snapshot adapter unexpectedly active', status);
  assert(paymentIdOnlyStatus.status === 'payment_status_guarded_no_persistence', 'blocked paymentId-only request should remain guarded', paymentIdOnlyStatus);
}
assert(paymentIdOnlyStatus.providerCall === false, 'paymentId-only request reported provider call', paymentIdOnlyStatus);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  readinessStatus: readiness.status,
  paymentStatus: status.status,
  paymentIdOnlyStatus: paymentIdOnlyStatus.status,
  runtimeReadEnabled: readiness.runtimeReadEnabled,
  paymentsSnapshotReadEnabled: readiness.paymentsSnapshotReadEnabled,
  storageRead: readiness.storageRead,
  callbackPersistence: readiness.callbackPersistence,
  forbiddenEndpoint: readiness.readContract.forbiddenEndpoint,
  blockerCount: readiness.blockers.length,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
}, null, 2));
