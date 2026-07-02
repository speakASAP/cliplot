#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CALLBACK_READINESS_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/callback-readiness', baseUrl));
const text = await response.text();
let readiness = null;
try {
  readiness = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment callback readiness returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && readiness.success, 'payment callback readiness request failed', {
  httpStatus: response.status,
  status: readiness.status,
});
assert(readiness.status === 'validated_guarded_ack_no_persistence', 'payment callback readiness is not validated', readiness);
assert(readiness.keyPresent === true, 'payment webhook key is not present', readiness);
assert(readiness.callbackAccepted === true, 'synthetic guarded callback was not accepted', readiness);
assert(readiness.callbackHttpStatus === 202, 'synthetic guarded callback returned unexpected HTTP status', readiness);
assert(readiness.callbackStatus === 'payment_callback_received_guarded', 'synthetic guarded callback status changed', readiness);
assert(readiness.mutation === false, 'payment callback readiness reported mutation', readiness);
assert(readiness.persistence === false, 'payment callback readiness reported persistence', readiness);
assert(readiness.providerCall === false, 'payment callback readiness reported provider call', readiness);
assert(readiness.callbackState?.orderStatus === 'not_updated_guarded', 'callback readiness order state changed', readiness);
assert(Array.isArray(readiness.sensitiveDataPolicy) && readiness.sensitiveDataPolicy.includes('no webhook key value'), 'sensitive data policy missing', readiness);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: readiness.status,
  keyPresent: readiness.keyPresent,
  callbackAccepted: readiness.callbackAccepted,
  callbackHttpStatus: readiness.callbackHttpStatus,
  callbackStatus: readiness.callbackStatus,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
  orderStatus: readiness.callbackState.orderStatus,
}, null, 2));
