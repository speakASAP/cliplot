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
assert(['blocked_storage_backend_not_approved', 'approved_payment_status_storage_metadata_execution_disabled'].includes(readiness.status), 'storage readiness status unexpected', readiness);
assert(readiness.mutation === false, 'storage readiness reported mutation', readiness);
assert(readiness.persistence === false, 'storage readiness reported persistence', readiness);
assert(readiness.providerCall === false, 'storage readiness reported provider call', readiness);
assert(readiness.storage?.configured === false, 'storage backend unexpectedly configured', readiness);
if ('cliplotLocalStorageApproved' in (readiness.storage || {})) {
  assert(readiness.storage.cliplotLocalStorageApproved === false, 'Cliplot-local storage unexpectedly approved', readiness);
}
assert(readiness.storage?.liveWritesEnabled === false, 'storage writes unexpectedly enabled', readiness);
assert(readiness.storage?.liveReadsEnabled === false, 'storage reads unexpectedly enabled', readiness);
assert(['approved_persistence_contract_required', 'payments_db_snapshot_read_model_approved'].includes(readiness.mappingContract?.source), 'mapping contract source missing', readiness);
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
assert(['validated_payments_read_scope_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(readiness.readContract?.readScopeStatus), 'payment read-scope readiness missing from storage contract', readiness);
assert(readiness.readContract?.scopeValidated === true, 'payment read scope is not validated in storage contract', readiness);
assert(Array.isArray(readiness.blockers), 'storage blockers missing', readiness);
assert(!readiness.blockers.some((item) => item.includes('payments:read scope')), 'payments:read scope blocker should be closed after runtime evidence', readiness);
if (readiness.storage?.ownershipApproved === true) {
  assert(readiness.storage?.ownershipApprovalIdFingerprint, 'storage ownership approval fingerprint missing', readiness);
  assert(readiness.satisfiedEvidence?.some((item) => item.includes('approved storage ownership decision selects Payments DB snapshot read model')), 'approved storage ownership evidence missing', readiness);
  assert(!readiness.blockers.some((item) => item.startsWith('[DONE:')), 'satisfied storage evidence should not be counted as blockers', readiness);
  assert(!readiness.blockers.some((item) => item.includes('decision whether persistence belongs')), 'stale storage ownership decision blocker present', readiness);
  if (readiness.status === 'approved_payment_status_storage_metadata_execution_disabled') {
    assert(readiness.storage?.metadataApprovalComplete === true, 'storage metadata approval evidence missing', readiness);
    assert(readiness.blockers.length === 0, 'storage metadata approval should clear blockers', readiness);
  } else {
    assert(readiness.blockers.some((item) => item.includes('callback persistence storage backend approval') || item.includes('callback persistence rollout plan') || item.includes('live status writes')), 'callback/live storage blocker missing', readiness);
  }
} else {
  assert(readiness.blockers.some((item) => item.includes('CLIPLOT_PAYMENT_STORAGE_OWNERSHIP_APPROVAL_ID') || item.includes('decision whether persistence belongs')), 'storage ownership blocker missing', readiness);
}
assert(Array.isArray(readiness.sensitiveDataPolicy) && readiness.sensitiveDataPolicy.includes('no storage write'), 'sensitive data policy missing', readiness);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: readiness.status,
  storageConfigured: readiness.storage.configured,
  storageOwnershipApproved: readiness.storage.ownershipApproved,
  schemaVersion: readiness.schemaContract.schemaVersion,
  mappingFields: readiness.mappingContract.proposedFields,
  uniqueKeys: readiness.schemaContract.uniqueKeys,
  allowedPaymentStatuses: readiness.schemaContract.allowedPaymentStatuses,
  callbackPersistence: readiness.callbackContract.currentPersistence,
  currentStatusPersistence: readiness.readContract.currentPersistence,
  providerRefreshRisk: readiness.readContract.providerRefreshRisk,
  readScopeStatus: readiness.readContract.readScopeStatus,
  scopeValidated: readiness.readContract.scopeValidated,
  blockerCount: readiness.blockers.length,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
}, null, 2));
