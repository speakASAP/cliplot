#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_ACTIVATION_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const packetResponse = await fetch(new URL('/api/checkout/approval-packet', baseUrl));
const packet = await packetResponse.json();
assert(packetResponse.status === 200 && packet.success, 'approval packet unavailable', {
  httpStatus: packetResponse.status,
  status: packet.status,
});

const preflight = packet.liveCheckoutPreflight || {};
assert(preflight.status === 'blocked', 'live activation gate is not blocked', preflight);
assert(preflight.wouldMutate === false, 'live activation gate would mutate', preflight);
assert(preflight.mutationPlan?.wouldCreateOrder === false, 'live activation would create order', preflight);
assert(preflight.mutationPlan?.wouldReserveWarehouse === false, 'live activation would reserve Warehouse stock', preflight);
assert(preflight.mutationPlan?.wouldCreatePayment === false, 'live activation would create payment', preflight);
assert(preflight.mutationPlan?.wouldSendNotification === false, 'live activation would send notification in guarded deployment', preflight);
assert(preflight.liveFlags?.order === false && preflight.liveFlags?.payment === false && preflight.liveFlags?.notification === false, 'live flags are not all false', preflight.liveFlags || {});
assert(preflight.approvals?.order === true, 'order approval metadata should be present after controlled smoke evidence', preflight.approvals || {});
assert(preflight.approvals?.payment === false && preflight.approvals?.notification === false, 'payment/notification approval IDs are unexpectedly present', preflight.approvals || {});
assert(Array.isArray(packet.requiredApprovalIds) && packet.requiredApprovalIds.includes('CLIPLOT_LIVE_ORDER_APPROVAL_ID'), 'order approval ID name is missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_PAYMENT_APPROVAL_ID'), 'payment approval ID name is missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID'), 'notification approval ID name is missing', packet);
assert(Array.isArray(packet.missing) && packet.missing.length >= 3, 'activation blockers are missing', packet);


async function evaluateLocalPreflight(env) {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    "import { liveCheckoutPreflight } from './src/integrations.js'; console.log(JSON.stringify(liveCheckoutPreflight()));",
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  return JSON.parse(result.stdout);
}

const partialCases = [
  {
    name: 'order_only_with_all_approvals',
    env: {
      ENABLE_LIVE_ORDER_SUBMIT: 'true',
      ENABLE_LIVE_PAYMENT_CREATE: 'false',
      ENABLE_LIVE_NOTIFICATIONS: 'false',
      CLIPLOT_LIVE_ORDER_APPROVAL_ID: 'approval-order',
      CLIPLOT_LIVE_PAYMENT_APPROVAL_ID: 'approval-payment',
      CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID: 'approval-notification',
      ENABLE_ORDER_CREATE_VALIDATION: 'true',
      ENABLE_PAYMENT_CREATE_VALIDATION: 'true',
      ENABLE_NOTIFICATION_VALIDATION: 'true',
      ORDERS_SERVICE_TOKEN: 'orders-token-present',
      WAREHOUSE_SERVICE_TOKEN: 'warehouse-token-present',
      PAYMENT_API_KEY: 'payment-key-present',
      PAYMENT_WEBHOOK_API_KEY: 'webhook-key-present',
      NOTIFICATIONS_SERVICE_TOKEN: 'notification-token-present',
    },
  },
  {
    name: 'order_and_payment_without_notification_flag',
    env: {
      ENABLE_LIVE_ORDER_SUBMIT: 'true',
      ENABLE_LIVE_PAYMENT_CREATE: 'true',
      ENABLE_LIVE_NOTIFICATIONS: 'false',
      CLIPLOT_LIVE_ORDER_APPROVAL_ID: 'approval-order',
      CLIPLOT_LIVE_PAYMENT_APPROVAL_ID: 'approval-payment',
      CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID: 'approval-notification',
      ENABLE_ORDER_CREATE_VALIDATION: 'true',
      ENABLE_PAYMENT_CREATE_VALIDATION: 'true',
      ENABLE_NOTIFICATION_VALIDATION: 'true',
      ORDERS_SERVICE_TOKEN: 'orders-token-present',
      WAREHOUSE_SERVICE_TOKEN: 'warehouse-token-present',
      PAYMENT_API_KEY: 'payment-key-present',
      PAYMENT_WEBHOOK_API_KEY: 'webhook-key-present',
      NOTIFICATIONS_SERVICE_TOKEN: 'notification-token-present',
    },
  },
  {
    name: 'all_flags_with_all_approvals',
    expectedReady: true,
    env: {
      ENABLE_LIVE_ORDER_SUBMIT: 'true',
      ENABLE_LIVE_PAYMENT_CREATE: 'true',
      ENABLE_LIVE_NOTIFICATIONS: 'true',
      CLIPLOT_LIVE_ORDER_APPROVAL_ID: 'approval-order',
      CLIPLOT_LIVE_PAYMENT_APPROVAL_ID: 'approval-payment',
      CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID: 'approval-notification',
      ENABLE_ORDER_CREATE_VALIDATION: 'true',
      ENABLE_PAYMENT_CREATE_VALIDATION: 'true',
      ENABLE_NOTIFICATION_VALIDATION: 'true',
      ORDERS_SERVICE_TOKEN: 'orders-token-present',
      WAREHOUSE_SERVICE_TOKEN: 'warehouse-token-present',
      PAYMENT_API_KEY: 'payment-key-present',
      PAYMENT_WEBHOOK_API_KEY: 'webhook-key-present',
      NOTIFICATIONS_SERVICE_TOKEN: 'notification-token-present',
    },
  },
];

const matrix = [];
for (const testCase of partialCases) {
  const simulated = await evaluateLocalPreflight(testCase.env);
  if (testCase.expectedReady) {
    assert(simulated.status === 'ready_for_approved_live_mutation', `approved activation case ${testCase.name} is not ready`, simulated);
    assert(simulated.wouldMutate === true, `approved activation case ${testCase.name} would not mutate`, simulated);
    assert(simulated.mutationPlan?.wouldCreateOrder === true, `approved activation case ${testCase.name} would not create order`, simulated);
    assert(simulated.mutationPlan?.wouldReserveWarehouse === true, `approved activation case ${testCase.name} would not reserve Warehouse stock`, simulated);
    assert(simulated.mutationPlan?.wouldCreatePayment === true, `approved activation case ${testCase.name} would not create payment`, simulated);
    assert(simulated.mutationPlan?.wouldSendNotification === true, `approved activation case ${testCase.name} would not send notification`, simulated);
  } else {
    assert(simulated.status === 'blocked', `partial activation case ${testCase.name} is not blocked`, simulated);
    assert(simulated.wouldMutate === false, `partial activation case ${testCase.name} would mutate`, simulated);
    assert(simulated.mutationPlan?.wouldCreateOrder === false, `partial activation case ${testCase.name} would create order`, simulated);
    assert(simulated.mutationPlan?.wouldReserveWarehouse === false, `partial activation case ${testCase.name} would reserve Warehouse stock`, simulated);
    assert(simulated.mutationPlan?.wouldCreatePayment === false, `partial activation case ${testCase.name} would create payment`, simulated);
    assert(simulated.mutationPlan?.wouldSendNotification === false, `partial activation case ${testCase.name} would send notification`, simulated);
  }
  matrix.push({
    name: testCase.name,
    status: simulated.status,
    wouldMutate: simulated.wouldMutate,
    mutationPlan: simulated.mutationPlan,
    missingCount: simulated.missing?.length || 0,
  });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  livePreflight: preflight.status,
  wouldMutate: preflight.wouldMutate,
  mutationPlan: preflight.mutationPlan,
  liveFlags: preflight.liveFlags,
  approvals: preflight.approvals,
  requiredApprovalIds: packet.requiredApprovalIds,
  missingCount: packet.missing.length,
  partialActivationMatrix: matrix,
}, null, 2));
