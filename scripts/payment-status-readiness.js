#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_READINESS_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-readiness', baseUrl));
const text = await response.text();
let readiness = null;
try {
  readiness = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status readiness returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && readiness.success, 'payment status readiness request failed', {
  httpStatus: response.status,
  status: readiness.status,
});
assert(readiness.status === 'blocked_pending_provider_backed_status_contract', 'payment status readiness should remain provider-read blocked', readiness);
assert(readiness.mutation === false, 'payment status readiness reported mutation', readiness);
assert(readiness.persistence === false, 'payment status readiness reported persistence', readiness);
assert(readiness.providerCall === false, 'payment status readiness reported provider call', readiness);
assert(readiness.currentStatusContract?.status === 'payment_status_guarded_no_persistence', 'current payment status contract changed', readiness);
assert(readiness.currentStatusContract?.providerCall === false, 'current payment status would call provider', readiness);
assert(readiness.callbackReadiness?.status === 'validated_guarded_ack_no_persistence', 'callback readiness is not validated', readiness);
assert(readiness.callbackReadiness?.customerSafePaymentStatus?.code === 'payment_received', 'callback customer-safe status mapping missing', readiness);
assert(readiness.readScopeReadiness?.status === 'validated_payments_read_scope_no_mutation', 'payment read-scope readiness is not validated', readiness);
assert(readiness.readScopeReadiness?.scopeValidated === true, 'payments:read scope evidence missing', readiness);
assert(readiness.readScopeReadiness?.mutation === false, 'payment read-scope readiness reported mutation', readiness);
assert(readiness.readScopeReadiness?.persistence === false, 'payment read-scope readiness reported persistence', readiness);
assert(readiness.readScopeReadiness?.providerCall === false, 'payment read-scope readiness reported provider call', readiness);
assert(readiness.currentStatusContract?.customerSafePaymentStatus?.code === 'payment_status_unknown', 'current unknown status fallback missing', readiness);
assert(readiness.customerSafeStatusContract?.authoritative === false, 'customer-safe status contract should be non-authoritative', readiness);
assert(readiness.customerSafeStatusContract?.source === 'static_customer_safe_mapping', 'customer-safe status source missing', readiness);
assert(readiness.customerSafeStatusContract?.labelsLocale === 'cs-CZ', 'customer-safe status locale missing', readiness);
assert(readiness.customerSafeStatusContract?.fallback?.code === 'payment_status_unknown', 'customer-safe fallback missing', readiness);
assert(Array.isArray(readiness.customerSafeStatusContract?.sourceStatuses) && readiness.customerSafeStatusContract.sourceStatuses.includes('completed'), 'customer-safe source statuses missing', readiness);
assert(readiness.customerSafeStatusContract?.values?.failed === 'Platba se nezdařila', 'customer-safe failed label changed', readiness);
assert(readiness.customerSafeStatusContract?.values?.cancelled === 'Platba byla zrušena', 'customer-safe cancelled label changed', readiness);
assert(readiness.customerSafeStatusContract?.values?.refunded === 'Platba byla vrácena', 'customer-safe refunded label changed', readiness);
assert(readiness.futureProviderBackedRead?.paymentsEndpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'future payment read endpoint missing', readiness);
assert(readiness.futureProviderBackedRead?.requiredScope === 'payments:read', 'future payment read scope missing', readiness);
assert(readiness.futureProviderBackedRead?.providerRefreshRisk === 'db_snapshot_endpoint_no_provider_refresh', 'provider refresh risk missing', readiness);
assert(readiness.futureProviderBackedRead?.supportsPaymentIdRead === false, 'payment id read support should remain false for passive Cliplot reads', readiness);
assert(readiness.futureProviderBackedRead?.supportsOrderIdRead === true, 'order id read support missing', readiness);
assert(readiness.mappingContract?.authoritative === false, 'mapping contract should be non-authoritative', readiness);
assert(readiness.mappingContract?.source === 'approved_persistence_contract_required', 'mapping contract source missing', readiness);
assert(readiness.mappingContract?.proposedFields?.includes('externalOrderId'), 'mapping externalOrderId missing', readiness);
assert(readiness.mappingContract?.proposedFields?.includes('paymentId'), 'mapping paymentId missing', readiness);
assert(readiness.mappingContract?.persistence === false, 'mapping contract unexpectedly persists', readiness);
assert(Array.isArray(readiness.blockers), 'payment status blockers missing', readiness);
assert(!readiness.blockers.some((item) => item.includes('payments:read scope')), 'payments:read scope blocker should be closed after runtime evidence', readiness);
assert(readiness.blockers.some((item) => item.includes('owner approval')), 'payment status owner approval blocker missing', readiness);
assert(Array.isArray(readiness.sensitiveDataPolicy) && readiness.sensitiveDataPolicy.includes('no provider call'), 'sensitive data policy missing', readiness);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: readiness.status,
  livePaymentCreate: readiness.livePaymentCreate,
  currentStatus: readiness.currentStatusContract.status,
  callbackReadiness: readiness.callbackReadiness.status,
  readScopeReadiness: readiness.readScopeReadiness.status,
  scopeValidated: readiness.readScopeReadiness.scopeValidated,
  customerSafePaymentStatus: readiness.callbackReadiness.customerSafePaymentStatus,
  customerSafeSource: readiness.customerSafeStatusContract.source,
  customerSafeSourceStatuses: readiness.customerSafeStatusContract.sourceStatuses,
  customerSafeValues: readiness.customerSafeStatusContract.values,
  futureEndpoint: readiness.futureProviderBackedRead.paymentsEndpoint,
  requiredScope: readiness.futureProviderBackedRead.requiredScope,
  providerRefreshRisk: readiness.futureProviderBackedRead.providerRefreshRisk,
  mappingFields: readiness.mappingContract.proposedFields,
  blockerCount: readiness.blockers.length,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
}, null, 2));
