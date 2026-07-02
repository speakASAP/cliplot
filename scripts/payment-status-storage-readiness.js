#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_STORAGE_READINESS_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-storage-readiness', baseUrl));
const text = await response.text();
let readiness = null;
try {
  readiness = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status storage readiness returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && readiness.success, 'payment status storage readiness request failed', {
  httpStatus: response.status,
  status: readiness.status,
});
assert(readiness.status === 'blocked_storage_backend_not_approved', 'storage readiness should remain blocked', readiness);
assert(readiness.mutation === false, 'storage readiness reported mutation', readiness);
assert(readiness.persistence === false, 'storage readiness reported persistence', readiness);
assert(readiness.providerCall === false, 'storage readiness reported provider call', readiness);
assert(readiness.storage?.configured === false, 'storage backend unexpectedly configured', readiness);
assert(readiness.storage?.liveWritesEnabled === false, 'storage writes unexpectedly enabled', readiness);
assert(readiness.storage?.liveReadsEnabled === false, 'storage reads unexpectedly enabled', readiness);
assert(readiness.mappingContract?.source === 'approved_persistence_contract_required', 'mapping contract source missing', readiness);
assert(readiness.mappingContract?.proposedFields?.includes('paymentCreateIdempotencyKey'), 'payment idempotency mapping missing', readiness);
assert(readiness.mappingContract?.persistence === false, 'mapping contract unexpectedly persists', readiness);
assert(readiness.schemaContract?.schemaVersion === 'cliplot.payment_status.v1', 'storage schema version missing', readiness);
assert(readiness.schemaContract?.requiredFields?.includes('externalOrderId'), 'externalOrderId field missing', readiness);
assert(readiness.schemaContract?.requiredFields?.includes('paymentId'), 'paymentId field missing', readiness);
assert(readiness.schemaContract?.uniqueKeys?.includes('externalOrderId'), 'externalOrderId uniqueness missing', readiness);
assert(readiness.schemaContract?.uniqueKeys?.includes('paymentId'), 'paymentId uniqueness missing', readiness);
assert(readiness.schemaContract?.allowedPaymentStatuses?.includes('processing'), 'payment status enum incomplete', readiness);
assert(readiness.schemaContract?.customerSafeStatusContract?.source === 'static_customer_safe_mapping', 'customer-safe status contract missing', readiness);
assert(readiness.callbackContract?.currentPersistence === false, 'callback persistence unexpectedly enabled', readiness);
assert(readiness.readContract?.currentPersistence === false, 'status read persistence unexpectedly enabled', readiness);
assert(readiness.readContract?.providerRefreshRisk === 'db_snapshot_endpoint_no_provider_refresh', 'provider refresh risk missing', readiness);
assert(Array.isArray(readiness.blockers) && readiness.blockers.some((item) => item.includes('payments:read scope')), 'storage runtime scope blocker missing', readiness);
assert(Array.isArray(readiness.sensitiveDataPolicy) && readiness.sensitiveDataPolicy.includes('no storage write'), 'sensitive data policy missing', readiness);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: readiness.status,
  storageConfigured: readiness.storage.configured,
  schemaVersion: readiness.schemaContract.schemaVersion,
  mappingFields: readiness.mappingContract.proposedFields,
  uniqueKeys: readiness.schemaContract.uniqueKeys,
  allowedPaymentStatuses: readiness.schemaContract.allowedPaymentStatuses,
  callbackPersistence: readiness.callbackContract.currentPersistence,
  currentStatusPersistence: readiness.readContract.currentPersistence,
  providerRefreshRisk: readiness.readContract.providerRefreshRisk,
  blockerCount: readiness.blockers.length,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
}, null, 2));
