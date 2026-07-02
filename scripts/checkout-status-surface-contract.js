#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_CUSTOMER_STATUS_SURFACE_BASE_URL || 'http://127.0.0.1:8080';

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

async function getText(path) {
  const response = await fetch(new URL(path, baseUrl));
  const text = await response.text();
  return { response, text };
}

const { response, payload: readiness } = await getJson('/api/checkout/status-surface-contract');
assert(response.status === 200 && readiness.success, 'checkout status surface contract request failed', {
  httpStatus: response.status,
  status: readiness.status,
});
assert(readiness.status === 'guarded_customer_status_surface_contract', 'customer status surface contract is not guarded', readiness);
assert(readiness.mutation === false, 'customer status surface reported mutation', readiness);
assert(readiness.persistence === false, 'customer status surface reported persistence', readiness);
assert(readiness.providerCall === false, 'customer status surface reported provider call', readiness);
assert(readiness.runtimeReadEnabled === false, 'customer status runtime read unexpectedly enabled', readiness);
assert(readiness.paymentsSnapshotReadEnabled === false, 'payments snapshot read unexpectedly enabled', readiness);
assert(readiness.storageRead === false, 'storage read unexpectedly enabled', readiness);
assert(readiness.authoritativeOrderStatus === false, 'customer status surface became authoritative for orders', readiness);
assert(readiness.authoritativePaymentStatus === false, 'customer status surface became authoritative for payments', readiness);
assert(Array.isArray(readiness.routes) && readiness.routes.includes('/objednavka/stav'), 'status route missing', readiness);
assert(readiness.currentSurface?.source === 'browser_local_checkout_snapshot', 'current status source changed', readiness);
assert(readiness.currentSurface?.storesProviderStatus === false, 'status surface stores provider status', readiness);
assert(readiness.currentSurface?.storesOrderTruth === false, 'status surface stores order truth', readiness);
assert(readiness.currentSurface?.storesPaymentTruth === false, 'status surface stores payment truth', readiness);
assert(readiness.currentPaymentStatusContract?.status === 'payment_status_guarded_no_persistence', 'payment status contract changed', readiness);
assert(readiness.currentPaymentStatusContract?.mutation === false, 'payment status contract reported mutation', readiness);
assert(readiness.currentPaymentStatusContract?.persistence === false, 'payment status contract reported persistence', readiness);
assert(readiness.currentPaymentStatusContract?.providerCall === false, 'payment status contract reported provider call', readiness);
assert(readiness.futureSnapshotReadApproval?.status === 'approval_required_passive_payments_snapshot_read', 'snapshot-read approval is not required', readiness);
assert(readiness.futureSnapshotReadApproval?.runtimeReadEnabled === false, 'snapshot-read runtime unexpectedly enabled', readiness);
assert(readiness.futureSnapshotReadApproval?.readEndpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'future snapshot read endpoint changed', readiness);
assert(readiness.futureSnapshotReadApproval?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', readiness);
assert(readiness.customerSafeStatusContract?.labelsLocale === 'cs-CZ', 'customer-safe status locale missing', readiness);
assert(Array.isArray(readiness.forbiddenClaimsBeforeApproval) && readiness.forbiddenClaimsBeforeApproval.includes('paid'), 'forbidden claims missing', readiness);
assert(Array.isArray(readiness.allowedCurrentClaims) && readiness.allowedCurrentClaims.includes('Čeká na kontrolu'), 'allowed guarded copy missing', readiness);
assert(Array.isArray(readiness.blockers) && readiness.blockers.some((item) => item.includes('owner approval')), 'owner approval blocker missing', readiness);
assert(readiness.blockers.some((item) => item.includes('customer-safe status copy approval')), 'customer-safe copy approval blocker missing', readiness);
assert(readiness.blockers.some((item) => item.includes('runtime rollout plan')), 'runtime rollout blocker missing', readiness);
assert(readiness.blockers.some((item) => item.includes('DB-only by-order-id route')), 'DB-only route blocker missing', readiness);
assert(readiness.blockers.some((item) => item.includes('callback persistence/replay policy')), 'callback replay blocker missing', readiness);
assert(readiness.blockers.some((item) => item.includes('order/payment status mapping ownership')), 'mapping ownership blocker missing', readiness);
assert(Array.isArray(readiness.sensitiveDataPolicy) && readiness.sensitiveDataPolicy.includes('no customer PII in readiness output'), 'sensitive data policy missing', readiness);

const statusRoutes = ['/objednavka/stav', '/checkout/success', '/checkout/cancelled'];
for (const route of statusRoutes) {
  const { response: pageResponse, text } = await getText(`${route}?externalOrderId=cliplot-status-surface-readiness`);
  assert(pageResponse.status === 200 && text.includes('Cliplot'), `status route ${route} did not render shell`, {
    httpStatus: pageResponse.status,
  });
}

const { response: appResponse, text: appJs } = await getText('/app.js?v=20260702-status-fetch');
assert(appResponse.status === 200, 'app.js unavailable', { httpStatus: appResponse.status });
assert(appJs.includes('Čeká na kontrolu'), 'guarded status label missing from frontend', {});
assert(appJs.includes('Platba se zatím nespustila'), 'guarded payment copy missing from frontend', {});
assert(appJs.includes('Zboží zatím není rezervované'), 'guarded reservation copy missing from frontend', {});
assert(appJs.includes('/api/payments/status?orderId='), 'status page payment status fetch missing from frontend', {});
assert(appJs.includes('data-payment-status-panel'), 'payment status panel binding missing from frontend', {});
assert(appJs.includes('payload.runtimeReadEnabled !== true'), 'guarded runtime-read condition missing from frontend', {});
assert(appJs.includes('Platbu ani rezervaci zatím nepotvrzujeme'), 'guarded no-confirmation copy missing from frontend', {});

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: readiness.status,
  routes: readiness.routes,
  currentDataSource: readiness.currentSurface.source,
  paymentStatusContract: readiness.currentPaymentStatusContract.status,
  snapshotReadApproval: readiness.futureSnapshotReadApproval.status,
  runtimeReadEnabled: readiness.runtimeReadEnabled,
  paymentsSnapshotReadEnabled: readiness.paymentsSnapshotReadEnabled,
  storageRead: readiness.storageRead,
  authoritativeOrderStatus: readiness.authoritativeOrderStatus,
  authoritativePaymentStatus: readiness.authoritativePaymentStatus,
  blockerCount: readiness.blockers.length,
  mutation: readiness.mutation,
  persistence: readiness.persistence,
  providerCall: readiness.providerCall,
}, null, 2));
