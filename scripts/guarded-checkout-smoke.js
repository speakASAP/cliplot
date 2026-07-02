#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_SMOKE_BASE_URL || 'http://127.0.0.1:8080';

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

const { response: productResponse, payload: productPayload } = await getJson('/api/products');
assert(productResponse.status === 200 && productPayload.success, 'products request failed', {
  httpStatus: productResponse.status,
});
const product = (productPayload.items || []).find((item) => item.warehouseId);
assert(product, 'no warehouse-backed product available for guarded checkout smoke', {
  productCount: (productPayload.items || []).length,
});

const externalOrderId = `cliplot-smoke-${Date.now()}`;
const checkoutBody = {
  externalOrderId,
  customer: {
    name: 'Smoke Test',
    email: 'smoke-test@cliplot.invalid',
    phone: '+420000000000',
    address: 'Testovaci 1, Praha',
    shipping: 'Balikovna',
    payment: 'invoice',
  },
  items: [{ product, quantity: 1 }],
  total: Number(product.price || 0),
};

const { response: checkoutResponse, payload: checkout } = await postJson('/api/checkout/submit', checkoutBody);
assert(checkoutResponse.status === 202, 'guarded checkout did not return HTTP 202', {
  httpStatus: checkoutResponse.status,
  status: checkout.status,
});
assert(checkout.success === true && checkout.status === 'service_identity_required', 'guarded checkout status changed', {
  status: checkout.status,
});
assert(checkout.checkoutIntent?.externalOrderId === externalOrderId, 'checkout intent was not preserved', {
  expected: externalOrderId,
  actual: checkout.checkoutIntent?.externalOrderId,
});
assert(checkout.orderValidation?.status === 'validated_no_mutation', 'order validation is not no-mutation', checkout.orderValidation || {});
assert(checkout.paymentValidation?.status === 'validated_no_mutation', 'payment validation is not no-mutation', checkout.paymentValidation || {});
assert(checkout.notificationValidation?.status === 'validated_no_send', 'notification validation is not no-send', checkout.notificationValidation || {});
assert(checkout.warehouseReservationReadiness?.status === 'validated_no_mutation', 'warehouse readiness is not no-mutation', checkout.warehouseReservationReadiness || {});
assert(checkout.orderValidation?.orderCreated === false && checkout.orderValidation?.warehouseMutation === false, 'order validation reported mutation', checkout.orderValidation || {});
assert(checkout.paymentValidation?.mutation === false && checkout.paymentValidation?.providerCall === false, 'payment validation reported mutation', checkout.paymentValidation || {});
assert(checkout.notificationValidation?.notificationSent === false, 'notification validation reported send', checkout.notificationValidation || {});

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  productId: product.id,
  warehouseId: product.warehouseId,
  checkoutHttpStatus: checkoutResponse.status,
  checkoutStatus: checkout.status,
  externalOrderId: checkout.checkoutIntent.externalOrderId,
  orderValidation: checkout.orderValidation.status,
  paymentValidation: checkout.paymentValidation.status,
  notificationValidation: checkout.notificationValidation.status,
  warehouseReservationReadiness: checkout.warehouseReservationReadiness.status,
  mutation: false,
}, null, 2));
