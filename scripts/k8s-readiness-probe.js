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

async function getJson(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
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

  const readinessResponse = await getJson('/api/integrations/readiness');
  const readiness = readinessResponse.body;
  const approvals = readiness?.liveMutationApprovals || readiness?.approval || {};
  const integrations = readiness?.integrations || readiness || {};
  assertFalse(readiness?.liveOrderSubmit, 'readiness_live_order_enabled', { readiness });
  assertFalse(readiness?.livePaymentCreate, 'readiness_live_payment_enabled', { readiness });
  assertFalse(readiness?.liveNotifications, 'readiness_live_notifications_enabled', { readiness });
  assertFalse(approvals.order, 'readiness_order_approval_present', { readiness });
  assertFalse(approvals.payment, 'readiness_payment_approval_present', { readiness });
  assertFalse(approvals.notification, 'readiness_notification_approval_present', { readiness });
  assertEqual(integrations.orderValidation, 'enabled_no_mutation', 'order_validation_not_guarded', { readiness });
  assertEqual(integrations.paymentValidation, 'enabled_no_mutation', 'payment_validation_not_guarded', { readiness });
  assertEqual(integrations.notificationValidation, 'enabled_no_send', 'notification_validation_not_guarded', { readiness });
  assertEqual(integrations.paymentStatus, 'guarded_no_persistence', 'payment_status_not_guarded', { readiness });

  const paymentStatus = await getJson('/api/payments/status?orderId=cliplot-readiness-monitor');
  assertEqual(paymentStatus.body?.status, 'payment_status_guarded_no_persistence', 'payment_status_endpoint_not_guarded', { paymentStatus: paymentStatus.body });
  assertFalse(paymentStatus.body?.mutation, 'payment_status_mutation_enabled', { paymentStatus: paymentStatus.body });
  assertFalse(paymentStatus.body?.persistence, 'payment_status_persistence_enabled', { paymentStatus: paymentStatus.body });
  assertFalse(paymentStatus.body?.providerCall, 'payment_status_provider_call_enabled', { paymentStatus: paymentStatus.body });

  const paymentCallback = await getJson('/api/payments/callback-readiness');
  assertEqual(paymentCallback.body?.status, 'validated_guarded_ack_no_persistence', 'payment_callback_readiness_not_validated', { paymentCallback: paymentCallback.body });
  assertFalse(paymentCallback.body?.mutation, 'payment_callback_readiness_mutation_enabled', { paymentCallback: paymentCallback.body });
  assertFalse(paymentCallback.body?.persistence, 'payment_callback_readiness_persistence_enabled', { paymentCallback: paymentCallback.body });
  assertFalse(paymentCallback.body?.providerCall, 'payment_callback_readiness_provider_call_enabled', { paymentCallback: paymentCallback.body });

  const paymentStatusReadiness = await getJson('/api/payments/status-readiness');
  assertEqual(paymentStatusReadiness.body?.status, 'blocked_pending_provider_backed_status_contract', 'payment_status_readiness_unexpected', { paymentStatusReadiness: paymentStatusReadiness.body });
  assertFalse(paymentStatusReadiness.body?.mutation, 'payment_status_readiness_mutation_enabled', { paymentStatusReadiness: paymentStatusReadiness.body });
  assertFalse(paymentStatusReadiness.body?.persistence, 'payment_status_readiness_persistence_enabled', { paymentStatusReadiness: paymentStatusReadiness.body });
  assertFalse(paymentStatusReadiness.body?.providerCall, 'payment_status_readiness_provider_call_enabled', { paymentStatusReadiness: paymentStatusReadiness.body });

  const paymentStatusStorage = await getJson('/api/payments/status-storage-readiness');
  assertEqual(paymentStatusStorage.body?.status, 'blocked_storage_backend_not_approved', 'payment_status_storage_readiness_unexpected', { paymentStatusStorage: paymentStatusStorage.body });
  assertFalse(paymentStatusStorage.body?.mutation, 'payment_status_storage_readiness_mutation_enabled', { paymentStatusStorage: paymentStatusStorage.body });
  assertFalse(paymentStatusStorage.body?.persistence, 'payment_status_storage_readiness_persistence_enabled', { paymentStatusStorage: paymentStatusStorage.body });
  assertFalse(paymentStatusStorage.body?.providerCall, 'payment_status_storage_readiness_provider_call_enabled', { paymentStatusStorage: paymentStatusStorage.body });

  const paymentDecision = await getJson('/api/payments/status-persistence-decision');
  assertEqual(paymentDecision.body?.status, 'decision_recorded_approval_required', 'payment_status_persistence_decision_unexpected', { paymentDecision: paymentDecision.body });
  assertEqual(paymentDecision.body?.decisionRecord?.id, 'ADR-002-payment-status-persistence-ownership', 'payment_status_decision_record_missing', { paymentDecision: paymentDecision.body });
  assertEqual(paymentDecision.body?.decisionRecord?.status, 'proposed_for_owner_approval', 'payment_status_decision_record_status_unexpected', { paymentDecision: paymentDecision.body });
  assertEqual(paymentDecision.body?.decisionRecord?.runtimeApproval, false, 'payment_status_decision_runtime_approval_unexpected', { paymentDecision: paymentDecision.body });
  assertFalse(paymentDecision.body?.mutation, 'payment_status_persistence_decision_mutation_enabled', { paymentDecision: paymentDecision.body });
  assertFalse(paymentDecision.body?.persistence, 'payment_status_persistence_decision_persistence_enabled', { paymentDecision: paymentDecision.body });
  assertFalse(paymentDecision.body?.providerCall, 'payment_status_persistence_decision_provider_call_enabled', { paymentDecision: paymentDecision.body });

  console.log(JSON.stringify({
    ok: true,
    scope: 'read_only_kubernetes_readiness_monitor',
    baseUrl,
    livePreflightStatus: preflight.status,
    wouldMutate: preflight.wouldMutate,
    liveOrderSubmit: readiness.liveOrderSubmit,
    livePaymentCreate: readiness.livePaymentCreate,
    liveNotifications: readiness.liveNotifications,
    paymentStatus: paymentStatus.body.status,
    paymentCallbackReadiness: paymentCallback.body.status,
    paymentStatusReadiness: paymentStatusReadiness.body.status,
    paymentStatusStorageReadiness: paymentStatusStorage.body.status,
    paymentStatusPersistenceDecision: paymentDecision.body.status,
  }, null, 2));
}

main().catch((error) => fail('probe_exception', { message: error.message }));
