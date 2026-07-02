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
assert(readiness.status === 'blocked_payments_snapshot_runtime_read', 'runtime snapshot read should remain blocked before approval', readiness);
assert(readiness.runtimeReadEnabled === false, 'runtime read unexpectedly enabled', readiness);
assert(readiness.paymentsSnapshotReadEnabled === false, 'payments snapshot read unexpectedly enabled', readiness);
assert(readiness.storageRead === false, 'storage read unexpectedly enabled', readiness);
assert(readiness.callbackPersistence === false, 'callback persistence unexpectedly enabled', readiness);
assert(readiness.providerCall === false, 'runtime readiness reported provider call', readiness);
assert(readiness.mutation === false, 'runtime readiness reported mutation', readiness);
assert(readiness.persistence === false, 'runtime readiness reported persistence', readiness);
assert(readiness.customerStatusRuntimeRead === false, 'customer status runtime flag unexpectedly enabled', readiness);
assert(readiness.paymentStatusSnapshotRead === false, 'payment snapshot runtime flag unexpectedly enabled', readiness);
assert(readiness.statusRuntimeApprovalPresent === false, 'status runtime approval unexpectedly present', readiness);
assert(readiness.readContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'snapshot endpoint changed', readiness);
assert(readiness.readContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', readiness);
assert(readiness.readContract?.providerCall === false, 'read contract would call provider', readiness);
assert(Array.isArray(readiness.forbiddenOperations) && readiness.forbiddenOperations.includes('read /payments/{paymentId}'), 'forbidden paymentId read missing', readiness);
assert(Array.isArray(readiness.blockers) && readiness.blockers.some((item) => item.includes('CLIPLOT_STATUS_RUNTIME_APPROVAL_ID')), 'approval blocker missing', readiness);

const { response: statusResponse, payload: status } = await getJson('/api/payments/status?orderId=cliplot-runtime-readiness');
assert(statusResponse.status === 200 && status.success, 'guarded payment status request failed', {
  httpStatus: statusResponse.status,
  status: status.status,
});
assert(status.status === 'payment_status_guarded_no_persistence', 'payment status should remain guarded before approval', status);
assert(status.runtimeReadEnabled === false, 'payment status runtime read unexpectedly enabled', status);
assert(status.paymentsSnapshotReadEnabled === false, 'payment status snapshot read unexpectedly enabled', status);
assert(status.storageRead === false, 'payment status storage read unexpectedly enabled', status);
assert(status.providerCall === false, 'payment status reported provider call', status);
assert(status.mutation === false, 'payment status reported mutation', status);
assert(status.persistence === false, 'payment status reported persistence', status);
assert(status.passiveSnapshotAdapter?.configured === true, 'passive snapshot adapter metadata missing', status);
assert(status.passiveSnapshotAdapter?.active === false, 'passive snapshot adapter unexpectedly active', status);
assert(status.passiveSnapshotAdapter?.forbiddenEndpoint === '/payments/{paymentId}', 'passive adapter forbidden endpoint missing', status);

const { response: paymentIdResponse, payload: paymentIdOnlyStatus } = await getJson('/api/payments/status?paymentId=cliplot-runtime-readiness-payment');
assert(paymentIdResponse.status === 200 && paymentIdOnlyStatus.success, 'paymentId-only guarded status request failed', {
  httpStatus: paymentIdResponse.status,
  status: paymentIdOnlyStatus.status,
});
assert(paymentIdOnlyStatus.status === 'payment_status_guarded_no_persistence', 'paymentId-only request should not call provider-refresh endpoint', paymentIdOnlyStatus);
assert(paymentIdOnlyStatus.passiveSnapshotAdapter?.active === false, 'paymentId-only request unexpectedly activated snapshot adapter', paymentIdOnlyStatus);
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
  adapterConfigured: status.passiveSnapshotAdapter.configured,
  adapterActive: status.passiveSnapshotAdapter.active,
  forbiddenEndpoint: readiness.readContract.forbiddenEndpoint,
  blockerCount: readiness.blockers.length,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
}, null, 2));
