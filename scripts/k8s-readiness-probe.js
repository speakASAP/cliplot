#!/usr/bin/env node
const baseUrl = normalizeBaseUrl(
  process.argv[2] || process.env.CLIPLOT_READINESS_BASE_URL || 'http://cliplot:8080',
);

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function fail(reason, evidence = {}) {
  console.error(JSON.stringify({ ok: false, reason, ...evidence }, null, 2));
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries transport errors (ECONNREFUSED while the target has no ready endpoint)
// and 5xx only. Readiness assertions are evaluated by the caller and never retried
// here -- a genuine "not ready" result must surface on the first pass.
const RETRY_DELAYS_MS = [0, 5000, 10000, 20000, 30000, 45000];

async function fetchWithRetry(url, options) {
  let lastError;
  for (let i = 0; i < RETRY_DELAYS_MS.length; i += 1) {
    const isLast = i === RETRY_DELAYS_MS.length - 1;
    if (RETRY_DELAYS_MS[i] > 0) await sleep(RETRY_DELAYS_MS[i]);
    try {
      const response = await fetch(url, options);
      if (response.status >= 500 && !isLast) {
        lastError = new Error(`upstream returned ${response.status}`);
      } else {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (isLast) break;
    }
    console.error(`attempt ${i + 1}/${RETRY_DELAYS_MS.length} failed: ${lastError.message}; retrying`);
  }
  throw lastError;
}

async function getJson(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'user-agent': 'cliplot-readiness-monitor/1.0',
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    fail('non_json_response', { url, status: response.status, body: text.slice(0, 500) });
  }
  if (!response.ok) {
    fail('http_status_not_ok', { url, status: response.status, body });
  }
  return { status: response.status, body };
}

function assertEqual(actual, expected, reason, evidence = {}) {
  if (actual !== expected) {
    fail(reason, { actual, expected, ...evidence });
  }
}

function assertFalse(value, reason, evidence = {}) {
  if (value !== false) {
    fail(reason, { actual: value, expected: false, ...evidence });
  }
}

async function main() {
  const health = await getJson('/health');
  assertEqual(health.body?.status, 'ok', 'health_not_ok', { health: health.body });

  const preflightResponse = await getJson('/api/checkout/live-preflight');
  const preflight = preflightResponse.body?.liveCheckoutPreflight || preflightResponse.body;
  assertEqual(preflight?.status, 'blocked', 'live_preflight_not_blocked', { preflight: preflightResponse.body });
  assertFalse(preflight?.wouldMutate, 'live_preflight_would_mutate', { preflight: preflightResponse.body });
  assertFalse(preflight?.mutationPlan?.wouldCreateOrder, 'live_preflight_would_create_order', { preflight: preflightResponse.body });
  assertFalse(preflight?.mutationPlan?.wouldReserveWarehouse, 'live_preflight_would_reserve_warehouse', { preflight: preflightResponse.body });
  assertFalse(preflight?.mutationPlan?.wouldCreatePayment, 'live_preflight_would_create_payment', { preflight: preflightResponse.body });
  assertFalse(preflight?.mutationPlan?.wouldSendNotification, 'live_preflight_would_send_notification', { preflight: preflightResponse.body });

  const productFilter = await getJson('/api/products/filter-readiness');
  if (!['approval_required_catalog_product_filter_rule', 'approved_cliplot_product_filter_scope'].includes(productFilter.body?.status)) fail('product_filter_readiness_unexpected', { productFilter: productFilter.body });
  assertEqual(productFilter.body?.catalogSource, 'catalog', 'product_filter_catalog_source_unexpected', { productFilter: productFilter.body });
  assertFalse(productFilter.body?.mutation, 'product_filter_mutation_enabled', { productFilter: productFilter.body });
  assertFalse(productFilter.body?.persistence, 'product_filter_persistence_enabled', { productFilter: productFilter.body });
  assertFalse(productFilter.body?.providerCall, 'product_filter_provider_call_enabled', { productFilter: productFilter.body });

  const readinessResponse = await getJson('/api/integrations/readiness');
  const readiness = readinessResponse.body;
  const approvals = readiness?.liveMutationApprovals || readiness?.approval || {};
  const integrations = readiness?.integrations || readiness || {};
  assertFalse(readiness?.liveOrderSubmit, 'readiness_live_order_enabled', { readiness });
  assertFalse(readiness?.livePaymentCreate, 'readiness_live_payment_enabled', { readiness });
  assertFalse(readiness?.liveNotifications, 'readiness_live_notifications_enabled', { readiness });
  assertEqual(approvals.order, true, 'readiness_order_approval_metadata_missing', { readiness });
  assertEqual(typeof approvals.payment, 'boolean', 'readiness_payment_approval_metadata_state_missing', { readiness });
  assertEqual(typeof approvals.notification, 'boolean', 'readiness_notification_approval_metadata_state_missing', { readiness });
  assertEqual(integrations.orderValidation, 'enabled_no_mutation', 'order_validation_not_guarded', { readiness });
  assertEqual(integrations.paymentValidation, 'enabled_no_mutation', 'payment_validation_not_guarded', { readiness });
  assertEqual(integrations.notificationValidation, 'enabled_no_send', 'notification_validation_not_guarded', { readiness });

  const paymentCallback = await getJson('/api/payments/callback-readiness');
  assertEqual(paymentCallback.body?.status, 'validated_guarded_ack_no_persistence', 'payment_callback_readiness_not_validated', { paymentCallback: paymentCallback.body });
  assertFalse(paymentCallback.body?.mutation, 'payment_callback_readiness_mutation_enabled', { paymentCallback: paymentCallback.body });
  assertFalse(paymentCallback.body?.persistence, 'payment_callback_readiness_persistence_enabled', { paymentCallback: paymentCallback.body });
  assertFalse(paymentCallback.body?.providerCall, 'payment_callback_readiness_provider_call_enabled', { paymentCallback: paymentCallback.body });

  const callbackPolicy = await getJson('/api/payments/callback-replay-policy');
  if (!['approval_required_callback_replay_policy', 'approved_callback_replay_policy_metadata_execution_disabled'].includes(callbackPolicy.body?.status)) {
    fail('payment_callback_replay_policy_unexpected', { callbackPolicy: callbackPolicy.body });
  }
  assertEqual(callbackPolicy.body?.callbackPersistence, false, 'payment_callback_policy_persistence_enabled', { callbackPolicy: callbackPolicy.body });
  assertEqual(callbackPolicy.body?.callbackReplayEnabled, false, 'payment_callback_policy_replay_enabled', { callbackPolicy: callbackPolicy.body });
  assertFalse(callbackPolicy.body?.mutation, 'payment_callback_policy_mutation_enabled', { callbackPolicy: callbackPolicy.body });
  assertFalse(callbackPolicy.body?.persistence, 'payment_callback_policy_persistence_field_enabled', { callbackPolicy: callbackPolicy.body });
  assertFalse(callbackPolicy.body?.providerCall, 'payment_callback_policy_provider_call_enabled', { callbackPolicy: callbackPolicy.body });

  console.log(JSON.stringify({
    ok: true,
    scope: 'read_only_kubernetes_readiness_monitor',
    baseUrl,
    productFilterReadiness: productFilter.body.status,
    livePreflightStatus: preflight.status,
    wouldMutate: preflight.wouldMutate,
    liveOrderSubmit: readiness.liveOrderSubmit,
    livePaymentCreate: readiness.livePaymentCreate,
    liveNotifications: readiness.liveNotifications,
    paymentCallbackReadiness: paymentCallback.body.status,
    paymentCallbackReplayPolicy: callbackPolicy.body.status,
  }, null, 2));
}

main().catch((error) => fail('probe_exception', { message: error.message }));
