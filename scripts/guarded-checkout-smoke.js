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

async function getText(path) {
  const response = await fetch(new URL(path, baseUrl));
  const text = await response.text();
  return { response, text };
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
assert(productPayload.catalogSource === 'catalog', 'products endpoint is not using authenticated Catalog data', {
  catalogSource: productPayload.catalogSource,
});
const product = (productPayload.items || []).find((item) => item.warehouseId && item.productSource === 'catalog');
assert(product, 'no warehouse-backed product available for guarded checkout smoke', {
  productCount: (productPayload.items || []).length,
});
const { response: readinessResponse, payload: readiness } = await getJson('/api/integrations/readiness');
assert(readinessResponse.status === 200 && readiness.success, 'readiness request failed', {
  httpStatus: readinessResponse.status,
});
assert(readiness.liveCheckoutPreflight?.status === 'blocked' && readiness.liveCheckoutPreflight?.wouldMutate === false, 'live checkout preflight readiness is not blocked', readiness.liveCheckoutPreflight || {});
assert(readiness.liveCheckoutPreflight?.liveFlags?.order === false, 'live order flag unexpectedly enabled', readiness.liveCheckoutPreflight || {});
assert(readiness.liveCheckoutPreflight?.liveFlags?.payment === false, 'live payment flag unexpectedly enabled', readiness.liveCheckoutPreflight || {});
assert(readiness.liveCheckoutPreflight?.liveFlags?.notification === false, 'live notification flag unexpectedly enabled', readiness.liveCheckoutPreflight || {});
const { response: preflightResponse, payload: preflightPayload } = await getJson('/api/checkout/live-preflight');
assert(preflightResponse.status === 200 && preflightPayload.success, 'live preflight endpoint failed', {
  httpStatus: preflightResponse.status,
});
assert(preflightPayload.liveCheckoutPreflight?.status === 'blocked' && preflightPayload.liveCheckoutPreflight?.wouldMutate === false, 'live preflight endpoint is not guarded', preflightPayload.liveCheckoutPreflight || {});
assert(preflightPayload.liveCheckoutPreflight?.mutationPlan?.wouldCreateOrder === false, 'live preflight endpoint would create an order', preflightPayload.liveCheckoutPreflight || {});
assert(preflightPayload.liveCheckoutPreflight?.mutationPlan?.wouldReserveWarehouse === false, 'live preflight endpoint would reserve Warehouse stock', preflightPayload.liveCheckoutPreflight || {});
assert(preflightPayload.liveCheckoutPreflight?.mutationPlan?.wouldCreatePayment === false, 'live preflight endpoint would create a payment', preflightPayload.liveCheckoutPreflight || {});
assert(preflightPayload.liveCheckoutPreflight?.mutationPlan?.wouldSendNotification === false, 'live preflight endpoint would send a notification', preflightPayload.liveCheckoutPreflight || {});
assert(Array.isArray(preflightPayload.liveCheckoutPreflight?.missing) && preflightPayload.liveCheckoutPreflight.missing.length >= 3, 'live preflight endpoint blockers are missing', preflightPayload.liveCheckoutPreflight || {});

const externalOrderId = `cliplot-smoke-${Date.now()}`;
const subtotal = Number(product.price || 0);
const checkoutBody = {
  externalOrderId,
  customer: {
    name: 'Smoke Test',
    email: 'smoke-test@cliplot.invalid',
    phone: '+420000000000',
    address: 'Testovaci 1, Praha',
  },
  shipping: 'balikovna',
  payment: 'invoice',
  pricing: {
    subtotal,
    shippingCost: 69,
    paymentFee: 0,
    total: subtotal + 69,
  },
  items: [{ product, quantity: 1 }],
  total: subtotal + 69,
};

const { response: detailResponse, text: detailHtml } = await getText(`/produkt/${encodeURIComponent(product.id)}`);
assert(detailResponse.status === 200 && detailHtml.includes('/app.js'), 'product detail route did not render static shell', {
  httpStatus: detailResponse.status,
});
const { response: homeResponse, text: homeHtml } = await getText('/');
assert(homeResponse.status === 200 && homeHtml.includes('data-drawer-status'), 'cart drawer status live region is missing', {
  httpStatus: homeResponse.status,
});
const { response: appResponse, text: appJs } = await getText('/app.js?v=20260702-status-fetch');
assert(
  appResponse.status === 200
    && appJs.includes('setDrawer(true)')
    && appJs.includes('je v košíku')
    && appJs.includes('data-remove')
    && appJs.includes('removeFromCart'),
  'add-to-cart and cart edit feedback contract changed',
  { httpStatus: appResponse.status },
);
assert(appJs.includes('/api/payments/status?orderId='), 'checkout status page does not fetch guarded payment status', {});
assert(appJs.includes('data-payment-status-panel'), 'checkout status payment panel binding missing', {});
assert(appJs.includes('Platbu ani rezervaci zatím nepotvrzujeme'), 'checkout status guarded payment/reservation copy missing', {});
assert(appJs.includes('payload.runtimeReadEnabled !== true'), 'checkout status runtime-read guard missing', {});
assert(appJs.includes('Zboží zatím není rezervované a objednávka není zaplacená'), 'checkout status no-paid/no-reservation copy missing', {});

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
assert(checkout.checkoutSummary?.subtotal === subtotal, 'checkout subtotal mismatch', checkout.checkoutSummary || {});
assert(checkout.checkoutSummary?.shipping?.cost === 69, 'checkout shipping cost mismatch', checkout.checkoutSummary || {});
assert(checkout.checkoutSummary?.payment?.fee === 0, 'checkout payment fee mismatch', checkout.checkoutSummary || {});
assert(checkout.checkoutSummary?.total === subtotal + 69, 'checkout total mismatch', checkout.checkoutSummary || {});
assert(checkout.orderPreview?.totals?.shippingCost === 69, 'order preview shipping cost mismatch', checkout.orderPreview?.totals || {});
assert(checkout.orderPreview?.totals?.total === subtotal + 69, 'order preview total mismatch', checkout.orderPreview?.totals || {});
assert(checkout.paymentPreview?.amount === subtotal + 69, 'payment preview amount mismatch', checkout.paymentPreview || {});
assert(checkout.paymentPreview?.paymentMethod === checkout.orderPreview?.payment?.method, 'payment method mismatch', {
  paymentPreview: checkout.paymentPreview?.paymentMethod,
  orderPreview: checkout.orderPreview?.payment?.method,
});
assert(!checkout.order, 'guarded checkout unexpectedly returned a live order object', { order: checkout.order });
assert(!checkout.payment, 'guarded checkout unexpectedly returned a live payment object', { payment: checkout.payment });
assert(checkout.liveMutationApprovals?.order === false, 'order approval unexpectedly enabled', checkout.liveMutationApprovals || {});
assert(checkout.liveMutationApprovals?.payment === false, 'payment approval unexpectedly enabled', checkout.liveMutationApprovals || {});
assert(checkout.liveMutationApprovals?.notification === false, 'notification approval unexpectedly enabled', checkout.liveMutationApprovals || {});
assert(checkout.liveCheckoutPreflight?.status === 'blocked' && checkout.liveCheckoutPreflight?.wouldMutate === false, 'checkout live preflight is not blocked', checkout.liveCheckoutPreflight || {});
assert(checkout.liveCheckoutPreflight?.mutationPlan?.wouldCreateOrder === false, 'checkout live preflight would create an order', checkout.liveCheckoutPreflight || {});
assert(checkout.liveCheckoutPreflight?.mutationPlan?.wouldReserveWarehouse === false, 'checkout live preflight would reserve Warehouse stock', checkout.liveCheckoutPreflight || {});
assert(checkout.liveCheckoutPreflight?.mutationPlan?.wouldCreatePayment === false, 'checkout live preflight would create a payment', checkout.liveCheckoutPreflight || {});
assert(checkout.liveCheckoutPreflight?.mutationPlan?.wouldSendNotification === false, 'checkout live preflight would send a notification', checkout.liveCheckoutPreflight || {});
assert(Array.isArray(checkout.liveCheckoutPreflight?.missing) && checkout.liveCheckoutPreflight.missing.length >= 3, 'checkout live preflight blockers are missing', checkout.liveCheckoutPreflight || {});
assert(checkout.orderValidation?.status === 'validated_no_mutation', 'order validation is not no-mutation', checkout.orderValidation || {});
assert(checkout.paymentValidation?.status === 'validated_no_mutation', 'payment validation is not no-mutation', checkout.paymentValidation || {});
assert(checkout.notificationValidation?.status === 'validated_no_send', 'notification validation is not no-send', checkout.notificationValidation || {});
assert(checkout.warehouseReservationReadiness?.status === 'validated_no_mutation', 'warehouse readiness is not no-mutation', checkout.warehouseReservationReadiness || {});
assert(checkout.orderValidation?.orderCreated === false && checkout.orderValidation?.warehouseMutation === false, 'order validation reported mutation', checkout.orderValidation || {});
assert(checkout.paymentValidation?.mutation === false && checkout.paymentValidation?.providerCall === false, 'payment validation reported mutation', checkout.paymentValidation || {});
assert(checkout.notificationValidation?.notificationSent === false, 'notification validation reported send', checkout.notificationValidation || {});

const { response: statusPage, text: statusHtml } = await getText(`/objednavka/stav?externalOrderId=${encodeURIComponent(externalOrderId)}`);
assert(statusPage.status === 200 && statusHtml.includes('Cliplot'), 'checkout status page did not render static shell', {
  httpStatus: statusPage.status,
});
const { response: successPage, text: successHtml } = await getText(`/checkout/success?externalOrderId=${encodeURIComponent(externalOrderId)}`);
assert(successPage.status === 200 && successHtml.includes('Cliplot'), 'checkout success page did not render static shell', {
  httpStatus: successPage.status,
});
const { response: cancelledPage, text: cancelledHtml } = await getText(`/checkout/cancelled?externalOrderId=${encodeURIComponent(externalOrderId)}`);
assert(cancelledPage.status === 200 && cancelledHtml.includes('Cliplot'), 'checkout cancelled page did not render static shell', {
  httpStatus: cancelledPage.status,
});

const { response: callbackResponse, payload: callbackPayload } = await postJson('/api/payments/callback', {
  paymentId: 'smoke-payment',
  orderId: externalOrderId,
  status: 'completed',
  event: 'payment.completed',
});
assert(callbackResponse.status === 401 && callbackPayload.status === 'payment_callback_unauthorized', 'unauthorized callback contract changed', {
  httpStatus: callbackResponse.status,
  status: callbackPayload.status,
});

const { response: paymentStatusResponse, payload: paymentStatusPayload } = await getJson(`/api/payments/status?orderId=${encodeURIComponent(externalOrderId)}`);
assert(paymentStatusResponse.status === 200 && paymentStatusPayload.status === 'payment_status_guarded_no_persistence', 'payment status contract changed', {
  httpStatus: paymentStatusResponse.status,
  status: paymentStatusPayload.status,
});
assert(paymentStatusPayload.mutation === false && paymentStatusPayload.persistence === false && paymentStatusPayload.providerCall === false, 'payment status is not guarded', paymentStatusPayload);
assert(!paymentStatusPayload.payment && !paymentStatusPayload.order, 'payment status returned live objects', paymentStatusPayload);
const { response: invalidPaymentStatusResponse, payload: invalidPaymentStatusPayload } = await getJson('/api/payments/status?orderId=');
assert(invalidPaymentStatusResponse.status === 400 && invalidPaymentStatusPayload.status === 'payment_status_validation_failed', 'invalid payment status contract changed', {
  httpStatus: invalidPaymentStatusResponse.status,
  status: invalidPaymentStatusPayload.status,
});

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  productId: product.id,
  catalogSource: productPayload.catalogSource,
  productSource: product.productSource,
  detailStatus: detailResponse.status,
  cartFeedbackContract: true,
  cartEditContract: true,
  liveCheckoutPreflight: checkout.liveCheckoutPreflight.status,
  livePreflightEndpoint: preflightPayload.liveCheckoutPreflight.status,
  wouldMutate: checkout.liveCheckoutPreflight.wouldMutate,
  mutationPlan: checkout.liveCheckoutPreflight.mutationPlan,
  warehouseId: product.warehouseId,
  checkoutHttpStatus: checkoutResponse.status,
  checkoutStatus: checkout.status,
  externalOrderId: checkout.checkoutIntent.externalOrderId,
  subtotal: checkout.checkoutSummary.subtotal,
  shippingCost: checkout.checkoutSummary.shipping.cost,
  paymentFee: checkout.checkoutSummary.payment.fee,
  total: checkout.checkoutSummary.total,
  statusPage: statusPage.status,
  callbackUnauthorizedStatus: callbackResponse.status,
  paymentStatusContract: paymentStatusPayload.status,
  orderValidation: checkout.orderValidation.status,
  paymentValidation: checkout.paymentValidation.status,
  notificationValidation: checkout.notificationValidation.status,
  warehouseReservationReadiness: checkout.warehouseReservationReadiness.status,
  mutation: false,
}, null, 2));
