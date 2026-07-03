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
  assertEqual(integrations.paymentStatus, 'approved_read_only_snapshot', 'payment_status_not_approved_read_only', { readiness });

  const paymentStatus = await getJson('/api/payments/status?orderId=cliplot-readiness-monitor');
  if (!['payment_status_snapshot_not_available', 'payment_status_snapshot_temporarily_unavailable', 'payment_status_snapshot_read'].includes(paymentStatus.body?.status)) fail('payment_status_endpoint_not_approved_read_only', { paymentStatus: paymentStatus.body });
  assertFalse(paymentStatus.body?.mutation, 'payment_status_mutation_enabled', { paymentStatus: paymentStatus.body });
  assertFalse(paymentStatus.body?.persistence, 'payment_status_persistence_enabled', { paymentStatus: paymentStatus.body });
  assertFalse(paymentStatus.body?.providerCall, 'payment_status_provider_call_enabled', { paymentStatus: paymentStatus.body });
  assertEqual(paymentStatus.body?.runtimeReadEnabled, true, 'payment_status_runtime_read_not_enabled', { paymentStatus: paymentStatus.body });
  assertEqual(paymentStatus.body?.paymentsSnapshotReadEnabled, true, 'payment_status_snapshot_read_not_enabled', { paymentStatus: paymentStatus.body });

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

  const paymentStatusReadiness = await getJson('/api/payments/status-readiness');
  assertEqual(paymentStatusReadiness.body?.status, 'ready_for_approved_payment_status_runtime_read', 'payment_status_readiness_unexpected', { paymentStatusReadiness: paymentStatusReadiness.body });
  assertFalse(paymentStatusReadiness.body?.mutation, 'payment_status_readiness_mutation_enabled', { paymentStatusReadiness: paymentStatusReadiness.body });
  assertFalse(paymentStatusReadiness.body?.persistence, 'payment_status_readiness_persistence_enabled', { paymentStatusReadiness: paymentStatusReadiness.body });
  assertFalse(paymentStatusReadiness.body?.providerCall, 'payment_status_readiness_provider_call_enabled', { paymentStatusReadiness: paymentStatusReadiness.body });

  const paymentStatusStorage = await getJson('/api/payments/status-storage-readiness');
  assertEqual(paymentStatusStorage.body?.status, 'approved_payment_status_storage_metadata_execution_disabled', 'payment_status_storage_readiness_unexpected', { paymentStatusStorage: paymentStatusStorage.body });
  assertEqual(paymentStatusStorage.body?.callbackContract?.currentPersistence, false, 'payment_status_storage_callback_persistence_enabled', { paymentStatusStorage: paymentStatusStorage.body });
  assertEqual(paymentStatusStorage.body?.readContract?.currentPersistence, false, 'payment_status_storage_current_status_persistence_enabled', { paymentStatusStorage: paymentStatusStorage.body });
  assertFalse(paymentStatusStorage.body?.mutation, 'payment_status_storage_readiness_mutation_enabled', { paymentStatusStorage: paymentStatusStorage.body });
  assertFalse(paymentStatusStorage.body?.persistence, 'payment_status_storage_readiness_persistence_enabled', { paymentStatusStorage: paymentStatusStorage.body });
  assertFalse(paymentStatusStorage.body?.providerCall, 'payment_status_storage_readiness_provider_call_enabled', { paymentStatusStorage: paymentStatusStorage.body });

  const paymentDecision = await getJson('/api/payments/status-persistence-decision');
  assertEqual(paymentDecision.body?.status, 'approved_payment_status_persistence_decision_metadata_execution_disabled', 'payment_status_persistence_decision_unexpected', { paymentDecision: paymentDecision.body });
  assertEqual(paymentDecision.body?.decisionRecord?.id, 'ADR-002-payment-status-persistence-ownership', 'payment_status_decision_record_missing', { paymentDecision: paymentDecision.body });
  assertEqual(paymentDecision.body?.decisionRecord?.status, 'owner_approved_shared_payments_source_of_truth', 'payment_status_decision_record_status_unexpected', { paymentDecision: paymentDecision.body });
  assertEqual(paymentDecision.body?.currentReadiness?.callbackPersistence, false, 'payment_status_decision_callback_persistence_enabled', { paymentDecision: paymentDecision.body });
  assertEqual(paymentDecision.body?.currentReadiness?.currentStatusPersistence, false, 'payment_status_decision_current_status_persistence_enabled', { paymentDecision: paymentDecision.body });
  assertFalse(paymentDecision.body?.mutation, 'payment_status_persistence_decision_mutation_enabled', { paymentDecision: paymentDecision.body });
  assertFalse(paymentDecision.body?.persistence, 'payment_status_persistence_decision_persistence_enabled', { paymentDecision: paymentDecision.body });
  assertFalse(paymentDecision.body?.providerCall, 'payment_status_persistence_decision_provider_call_enabled', { paymentDecision: paymentDecision.body });

  const paymentMapping = await getJson('/api/payments/status-mapping-ownership');
  assertEqual(paymentMapping.body?.status, 'approved_order_payment_status_mapping_ownership', 'payment_status_mapping_ownership_unexpected', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.decisionRecord?.id, 'ADR-006-order-payment-status-mapping-ownership', 'payment_status_mapping_decision_record_missing', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.ownership?.orders?.owner, 'orders-microservice', 'payment_status_mapping_orders_owner_missing', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.ownership?.orders?.authoritative, true, 'payment_status_mapping_orders_authoritative_missing', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.ownership?.payments?.owner, 'payments-microservice', 'payment_status_mapping_payments_owner_missing', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.ownership?.payments?.authoritative, true, 'payment_status_mapping_payments_authoritative_missing', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.ownership?.cliplot?.authoritative, false, 'payment_status_mapping_cliplot_authoritative', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.runtimeReadEnabled, true, 'payment_status_mapping_runtime_not_enabled', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.paymentsSnapshotReadEnabled, true, 'payment_status_mapping_snapshot_not_enabled', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.storageRead, false, 'payment_status_mapping_storage_read_enabled', { paymentMapping: paymentMapping.body });
  assertEqual(paymentMapping.body?.callbackPersistence, false, 'payment_status_mapping_callback_persistence_enabled', { paymentMapping: paymentMapping.body });
  assertFalse(paymentMapping.body?.mutation, 'payment_status_mapping_mutation_enabled', { paymentMapping: paymentMapping.body });
  assertFalse(paymentMapping.body?.persistence, 'payment_status_mapping_persistence_enabled', { paymentMapping: paymentMapping.body });
  assertFalse(paymentMapping.body?.providerCall, 'payment_status_mapping_provider_call_enabled', { paymentMapping: paymentMapping.body });

  const snapshotReadApproval = await getJson('/api/payments/status-snapshot-read-approval-packet');
  assertEqual(snapshotReadApproval.body?.status, 'approved_passive_payments_snapshot_read', 'payment_status_snapshot_read_approval_unexpected', { snapshotReadApproval: snapshotReadApproval.body });
  assertEqual(snapshotReadApproval.body?.runtimeReadEnabled, true, 'payment_status_snapshot_read_runtime_not_enabled', { snapshotReadApproval: snapshotReadApproval.body });
  assertEqual(snapshotReadApproval.body?.readContract?.endpoint, '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'payment_status_snapshot_read_endpoint_unexpected', { snapshotReadApproval: snapshotReadApproval.body });
  assertFalse(snapshotReadApproval.body?.mutation, 'payment_status_snapshot_read_approval_mutation_enabled', { snapshotReadApproval: snapshotReadApproval.body });
  assertFalse(snapshotReadApproval.body?.persistence, 'payment_status_snapshot_read_approval_persistence_enabled', { snapshotReadApproval: snapshotReadApproval.body });
  assertFalse(snapshotReadApproval.body?.providerCall, 'payment_status_snapshot_read_approval_provider_call_enabled', { snapshotReadApproval: snapshotReadApproval.body });

  const statusRuntimeReadiness = await getJson('/api/payments/status-runtime-readiness');
  assertEqual(statusRuntimeReadiness.body?.status, 'ready_for_approved_payments_snapshot_runtime_read', 'payment_status_runtime_readiness_unexpected', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertEqual(statusRuntimeReadiness.body?.runtimeReadEnabled, true, 'payment_status_runtime_readiness_runtime_not_enabled', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertEqual(statusRuntimeReadiness.body?.paymentsSnapshotReadEnabled, true, 'payment_status_runtime_readiness_snapshot_not_enabled', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertEqual(statusRuntimeReadiness.body?.storageRead, false, 'payment_status_runtime_readiness_storage_read_enabled', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertEqual(statusRuntimeReadiness.body?.callbackPersistence, false, 'payment_status_runtime_readiness_callback_persistence_enabled', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertFalse(statusRuntimeReadiness.body?.mutation, 'payment_status_runtime_readiness_mutation_enabled', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertFalse(statusRuntimeReadiness.body?.persistence, 'payment_status_runtime_readiness_persistence_enabled', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertFalse(statusRuntimeReadiness.body?.providerCall, 'payment_status_runtime_readiness_provider_call_enabled', { statusRuntimeReadiness: statusRuntimeReadiness.body });
  assertEqual(statusRuntimeReadiness.body?.readContract?.forbiddenEndpoint, '/payments/{paymentId}', 'payment_status_runtime_readiness_forbidden_endpoint_missing', { statusRuntimeReadiness: statusRuntimeReadiness.body });

  const checkoutStatusSurface = await getJson('/api/checkout/status-surface-contract');
  assertEqual(checkoutStatusSurface.body?.status, 'approved_read_only_customer_status_surface_contract', 'checkout_status_surface_unexpected', { checkoutStatusSurface: checkoutStatusSurface.body });
  assertEqual(checkoutStatusSurface.body?.runtimeReadEnabled, true, 'checkout_status_surface_runtime_read_not_enabled', { checkoutStatusSurface: checkoutStatusSurface.body });
  assertEqual(checkoutStatusSurface.body?.paymentsSnapshotReadEnabled, true, 'checkout_status_surface_snapshot_read_not_enabled', { checkoutStatusSurface: checkoutStatusSurface.body });
  assertEqual(checkoutStatusSurface.body?.storageRead, false, 'checkout_status_surface_storage_read_enabled', { checkoutStatusSurface: checkoutStatusSurface.body });
  assertFalse(checkoutStatusSurface.body?.mutation, 'checkout_status_surface_mutation_enabled', { checkoutStatusSurface: checkoutStatusSurface.body });
  assertFalse(checkoutStatusSurface.body?.persistence, 'checkout_status_surface_persistence_enabled', { checkoutStatusSurface: checkoutStatusSurface.body });
  assertFalse(checkoutStatusSurface.body?.providerCall, 'checkout_status_surface_provider_call_enabled', { checkoutStatusSurface: checkoutStatusSurface.body });

  const customerStatusRollout = await getJson('/api/checkout/customer-status-runtime-rollout-plan');
  assertEqual(customerStatusRollout.body?.status, 'approved_read_only_customer_status_runtime_rollout', 'customer_status_rollout_unexpected', { customerStatusRollout: customerStatusRollout.body });
  assertEqual(customerStatusRollout.body?.runtimeReadEnabled, true, 'customer_status_rollout_runtime_read_not_enabled', { customerStatusRollout: customerStatusRollout.body });
  assertEqual(customerStatusRollout.body?.paymentsSnapshotReadEnabled, true, 'customer_status_rollout_snapshot_read_not_enabled', { customerStatusRollout: customerStatusRollout.body });
  assertEqual(customerStatusRollout.body?.storageRead, false, 'customer_status_rollout_storage_read_enabled', { customerStatusRollout: customerStatusRollout.body });
  assertFalse(customerStatusRollout.body?.mutation, 'customer_status_rollout_mutation_enabled', { customerStatusRollout: customerStatusRollout.body });
  assertFalse(customerStatusRollout.body?.persistence, 'customer_status_rollout_persistence_enabled', { customerStatusRollout: customerStatusRollout.body });
  assertFalse(customerStatusRollout.body?.providerCall, 'customer_status_rollout_provider_call_enabled', { customerStatusRollout: customerStatusRollout.body });

  const customerStatusActivation = await getJson('/api/checkout/customer-status-runtime-activation-gate');
  assertEqual(customerStatusActivation.body?.status, 'ready_for_approved_read_only_customer_status_runtime', 'customer_status_activation_unexpected', { customerStatusActivation: customerStatusActivation.body });
  assertEqual(customerStatusActivation.body?.runtimeReadEnabled, true, 'customer_status_activation_runtime_read_not_enabled', { customerStatusActivation: customerStatusActivation.body });
  assertEqual(customerStatusActivation.body?.paymentsSnapshotReadEnabled, true, 'customer_status_activation_snapshot_read_not_enabled', { customerStatusActivation: customerStatusActivation.body });
  assertEqual(customerStatusActivation.body?.storageRead, false, 'customer_status_activation_storage_read_enabled', { customerStatusActivation: customerStatusActivation.body });
  assertEqual(customerStatusActivation.body?.callbackPersistence, false, 'customer_status_activation_callback_persistence_enabled', { customerStatusActivation: customerStatusActivation.body });
  assertEqual(customerStatusActivation.body?.wouldReadPaymentsSnapshot, true, 'customer_status_activation_would_not_read_snapshot', { customerStatusActivation: customerStatusActivation.body });
  assertEqual(customerStatusActivation.body?.wouldRenderRuntimeCustomerStatus, true, 'customer_status_activation_would_not_render_runtime_status', { customerStatusActivation: customerStatusActivation.body });
  assertFalse(customerStatusActivation.body?.wouldMutate, 'customer_status_activation_mutation_enabled', { customerStatusActivation: customerStatusActivation.body });
  assertFalse(customerStatusActivation.body?.persistence, 'customer_status_activation_persistence_enabled', { customerStatusActivation: customerStatusActivation.body });
  assertFalse(customerStatusActivation.body?.providerCall, 'customer_status_activation_provider_call_enabled', { customerStatusActivation: customerStatusActivation.body });
  assertEqual(customerStatusActivation.body?.approvedReadContract?.forbiddenEndpoint, '/payments/{paymentId}', 'customer_status_activation_forbidden_endpoint_missing', { customerStatusActivation: customerStatusActivation.body });

  const customerStatusApproval = await getJson('/api/checkout/customer-status-approval-evidence-packet');
  assertEqual(customerStatusApproval.body?.status, 'approved_customer_status_runtime_evidence_packet', 'customer_status_approval_evidence_unexpected', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.baselineGuarded, true, 'customer_status_approval_baseline_not_guarded', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.runtimeReadEnabled, true, 'customer_status_approval_runtime_read_not_enabled', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.paymentsSnapshotReadEnabled, true, 'customer_status_approval_snapshot_read_not_enabled', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.storageRead, false, 'customer_status_approval_storage_read_enabled', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.callbackPersistence, false, 'customer_status_approval_callback_persistence_enabled', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.wouldReadPaymentsSnapshot, true, 'customer_status_approval_would_not_read_snapshot', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.wouldRenderRuntimeCustomerStatus, true, 'customer_status_approval_would_not_render_runtime_status', { customerStatusApproval: customerStatusApproval.body });
  assertFalse(customerStatusApproval.body?.mutation, 'customer_status_approval_mutation_enabled', { customerStatusApproval: customerStatusApproval.body });
  assertFalse(customerStatusApproval.body?.persistence, 'customer_status_approval_persistence_enabled', { customerStatusApproval: customerStatusApproval.body });
  assertFalse(customerStatusApproval.body?.providerCall, 'customer_status_approval_provider_call_enabled', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.approvedReadContract?.forbiddenEndpoint, '/payments/{paymentId}', 'customer_status_approval_forbidden_endpoint_missing', { customerStatusApproval: customerStatusApproval.body });
  assertEqual(customerStatusApproval.body?.approvalRequest?.requiredApprovalId, 'CLIPLOT_STATUS_RUNTIME_APPROVAL_ID', 'customer_status_approval_id_missing', { customerStatusApproval: customerStatusApproval.body });

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
    paymentStatus: paymentStatus.body.status,
    paymentCallbackReadiness: paymentCallback.body.status,
    paymentCallbackReplayPolicy: callbackPolicy.body.status,
    paymentStatusReadiness: paymentStatusReadiness.body.status,
    paymentStatusStorageReadiness: paymentStatusStorage.body.status,
    paymentStatusPersistenceDecision: paymentDecision.body.status,
    paymentStatusMappingOwnership: paymentMapping.body.status,
    paymentStatusSnapshotReadApproval: snapshotReadApproval.body.status,
    paymentStatusRuntimeReadiness: statusRuntimeReadiness.body.status,
    checkoutStatusSurface: checkoutStatusSurface.body.status,
    customerStatusRollout: customerStatusRollout.body.status,
    customerStatusActivation: customerStatusActivation.body.status,
    customerStatusApprovalEvidence: customerStatusApproval.body.status,
  }, null, 2));
}

main().catch((error) => fail('probe_exception', { message: error.message }));
