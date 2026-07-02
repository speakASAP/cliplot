#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_READ_SCOPE_READINESS_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/read-scope-readiness', baseUrl));
const text = await response.text();
let readiness = null;
try {
  readiness = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment read-scope readiness returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && readiness.success, 'payment read-scope readiness request failed', {
  httpStatus: response.status,
  status: readiness.status,
});
assert(readiness.status === 'validated_payments_read_scope_no_mutation', 'payments:read scope is not validated', readiness);
assert(readiness.keyPresent === true, 'payment API key presence was not confirmed', readiness);
assert(readiness.scopeValidated === true, 'payments:read scope validation missing', readiness);
assert(readiness.routeValidated === true, 'Payments snapshot route validation missing', readiness);
assert(readiness.requiredScope === 'payments:read', 'required scope changed', readiness);
assert(readiness.httpStatus === 404, 'read-scope probe should use synthetic missing order 404', readiness);
assert(['PAYMENT_STATUS_SNAPSHOT_NOT_FOUND', 'Not Found'].includes(String(readiness.observedErrorCode)), 'unexpected read-scope probe error code', readiness);
assert(readiness.mutation === false, 'read-scope probe reported mutation', readiness);
assert(readiness.persistence === false, 'read-scope probe reported persistence', readiness);
assert(readiness.providerCall === false, 'read-scope probe reported provider call', readiness);
assert(readiness.databaseRead === true, 'read-scope probe should document DB-only missing-order lookup', readiness);
assert(Array.isArray(readiness.sensitiveDataPolicy) && readiness.sensitiveDataPolicy.includes('no payment API key value'), 'secret safety policy missing', readiness);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: readiness.status,
  endpoint: readiness.endpoint,
  requiredScope: readiness.requiredScope,
  keyPresent: readiness.keyPresent,
  scopeValidated: readiness.scopeValidated,
  routeValidated: readiness.routeValidated,
  httpStatus: readiness.httpStatus,
  observedErrorCode: readiness.observedErrorCode,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
  databaseRead: readiness.databaseRead,
  secretPrinted: false,
}, null, 2));
