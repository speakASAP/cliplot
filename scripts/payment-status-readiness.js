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
assert(readiness.futureProviderBackedRead?.paymentsEndpoint === '/payments/{paymentId}', 'future payment read endpoint missing', readiness);
assert(readiness.futureProviderBackedRead?.requiredScope === 'payments:read', 'future payment read scope missing', readiness);
assert(readiness.futureProviderBackedRead?.providerRefreshRisk === 'stripe_card_pending_reads_may_call_provider', 'provider refresh risk missing', readiness);
assert(readiness.futureProviderBackedRead?.supportsPaymentIdRead === true, 'payment id read support missing', readiness);
assert(readiness.futureProviderBackedRead?.supportsOrderIdRead === false, 'order id read support should remain false', readiness);
assert(Array.isArray(readiness.blockers) && readiness.blockers.length >= 4, 'payment status blockers missing', readiness);
assert(Array.isArray(readiness.sensitiveDataPolicy) && readiness.sensitiveDataPolicy.includes('no provider call'), 'sensitive data policy missing', readiness);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: readiness.status,
  livePaymentCreate: readiness.livePaymentCreate,
  currentStatus: readiness.currentStatusContract.status,
  callbackReadiness: readiness.callbackReadiness.status,
  futureEndpoint: readiness.futureProviderBackedRead.paymentsEndpoint,
  requiredScope: readiness.futureProviderBackedRead.requiredScope,
  providerRefreshRisk: readiness.futureProviderBackedRead.providerRefreshRisk,
  blockerCount: readiness.blockers.length,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
}, null, 2));
