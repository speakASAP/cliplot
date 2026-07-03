#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const baseUrl = normalizeBaseUrl(process.argv[2] || process.env.CLIPLOT_LIVE_OPERATOR_BASE_URL || 'https://cliplot.alfares.cz');
const namespace = process.env.NAMESPACE || 'statex-apps';
const deployment = process.env.CLIPLOT_DEPLOYMENT || 'cliplot';
const target = process.env.CLIPLOT_LIVE_OPERATOR_TARGET || 'full-checkout';
const executeRequested = process.argv.includes('--execute') && process.env.CLIPLOT_LIVE_OPERATOR_EXECUTE === 'true';
const executeConfirm = process.env.CLIPLOT_LIVE_OPERATOR_CONFIRM || '';

const defaults = {
  operatorId: 'codex-goal10',
  orderApprovalId: 'CLIPLOT-GOAL10-ORDER-20260703T195836Z-E3B82F9F',
  paymentApprovalId: 'CLIPLOT-GOAL10-PAYMENT-20260703T195836Z-4271570F',
  notificationApprovalId: 'CLIPLOT-GOAL10-NOTIFY-20260703T195836Z-AFED6F8C',
  orderWarehouseSmokeApprovalId: 'CLIPLOT-GOAL10-OWH-20260703T195836Z-A612AA60',
  liveCheckoutWindow: '2026-07-03T19:58:36Z/PT30M',
  paymentCreateWindow: '2026-07-03T19:58:36Z/PT30M',
  notificationSendWindow: '2026-07-03T19:58:36Z/PT30M',
  orderIdempotencyKey: 'cliplot-goal10-order-D65D60A6',
  paymentIdempotencyKey: 'cliplot-goal10-payment-1EF3A6D2',
  notificationIdempotencyKey: 'cliplot-goal10-notification-30D78D6B',
};

const cfg = {
  operatorId: env('CLIPLOT_LIVE_OPERATOR_ID', defaults.operatorId),
  orderApprovalId: env('CLIPLOT_LIVE_ORDER_APPROVAL_ID', defaults.orderApprovalId),
  paymentApprovalId: env('CLIPLOT_LIVE_PAYMENT_APPROVAL_ID', defaults.paymentApprovalId),
  notificationApprovalId: env('CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID', defaults.notificationApprovalId),
  orderWarehouseSmokeApprovalId: env('CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID', defaults.orderWarehouseSmokeApprovalId),
  liveCheckoutWindow: env('CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW', defaults.liveCheckoutWindow),
  paymentCreateWindow: env('CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW', defaults.paymentCreateWindow),
  notificationSendWindow: env('CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW', defaults.notificationSendWindow),
  orderIdempotencyKey: env('CLIPLOT_ORDER_IDEMPOTENCY_KEY', defaults.orderIdempotencyKey),
  paymentIdempotencyKey: env('CLIPLOT_PAYMENT_IDEMPOTENCY_KEY', defaults.paymentIdempotencyKey),
  notificationIdempotencyKey: env('CLIPLOT_NOTIFICATION_IDEMPOTENCY_KEY', defaults.notificationIdempotencyKey),
  duplicateCheck: env('CLIPLOT_DUPLICATE_CHECK', 'IDEMPOTENCY_KEYS_NOT_USED'),
};

const liveFlagNames = [
  'ENABLE_LIVE_ORDER_SUBMIT',
  'ENABLE_LIVE_PAYMENT_CREATE',
  'ENABLE_LIVE_NOTIFICATIONS',
  'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
];

const metadataOverrideNames = [
  'CLIPLOT_LIVE_ORDER_APPROVAL_ID',
  'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
  'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
  'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID',
  'CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW',
  'CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW',
  'CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW',
  'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_WINDOW',
];

let cleanupArmed = false;

function env(name, fallback) {
  const value = String(process.env[name] || '').trim();
  return value || fallback;
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function fail(reason, evidence = {}) {
  if (cleanupArmed) {
    const error = new Error(reason);
    error.evidence = evidence;
    throw error;
  }
  console.error(JSON.stringify({ ok: false, reason, ...evidence }, null, 2));
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
    ...options,
  });
  if (result.status !== 0) {
    fail('command_failed', {
      command: [command, ...args].join(' '),
      status: result.status,
      stdout: (result.stdout || '').slice(0, 2000),
      stderr: (result.stderr || '').slice(0, 2000),
    });
  }
  return result.stdout || '';
}

function parseWindow(value) {
  const match = String(value || '').match(/^(.+)\/PT(\d+)M$/);
  if (!match) return { valid: false, reason: 'invalid_window_format' };
  const start = new Date(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(start.getTime()) || !Number.isFinite(minutes) || minutes <= 0) {
    return { valid: false, reason: 'invalid_window_value' };
  }
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  const now = new Date();
  return {
    valid: true,
    start: start.toISOString(),
    end: end.toISOString(),
    now: now.toISOString(),
    active: now >= start && now <= end,
  };
}

async function fetchJson(path, init = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    fail('non_json_runtime_response', { path, httpStatus: response.status, bodyPreview: text.slice(0, 300) });
  }
  return { httpStatus: response.status, payload };
}

function getRunningPodName() {
  const raw = run('kubectl', [
    '-n', namespace,
    'get', 'pod',
    '-l', `app=${deployment}`,
    '--field-selector=status.phase=Running',
    '-o', 'json',
  ]);
  const parsed = JSON.parse(raw);
  const pods = (parsed.items || [])
    .filter((pod) => !pod.metadata?.deletionTimestamp)
    .filter((pod) => (pod.status?.conditions || []).some((condition) => condition.type === 'Ready' && condition.status === 'True'))
    .sort((a, b) => String(a.metadata?.creationTimestamp || '').localeCompare(String(b.metadata?.creationTimestamp || '')));
  const selected = pods[pods.length - 1];
  if (!selected?.metadata?.name) fail('no_ready_running_cliplot_pod', { namespace, deployment });
  return selected.metadata.name;
}

function readLiveFlagsFromPod() {
  const pod = getRunningPodName();
  const script = `for (const k of ${JSON.stringify(liveFlagNames)}) console.log(k + '=' + process.env[k]);`;
  const stdout = run('kubectl', ['-n', namespace, 'exec', pod, '--', 'node', '-e', script]);
  const flags = {};
  for (const line of stdout.trim().split(/\n+/).filter(Boolean)) {
    const [key, value] = line.split('=');
    flags[key] = value;
  }
  return { pod, flags };
}

function assertAllFlagsFalse(label, evidence) {
  const open = liveFlagNames.filter((name) => evidence.flags[name] !== 'false');
  if (open.length > 0) fail(`${label}_live_flags_not_false`, { open, flags: evidence.flags, pod: evidence.pod });
}

function kubectlSetEnv(assignments) {
  run('kubectl', ['-n', namespace, 'set', 'env', `deployment/${deployment}`, ...assignments]);
  run('kubectl', ['-n', namespace, 'rollout', 'status', `deployment/${deployment}`, '--timeout=240s']);
}

function openAssignments() {
  return [
    'ENABLE_LIVE_ORDER_SUBMIT=true',
    'ENABLE_LIVE_PAYMENT_CREATE=true',
    'ENABLE_LIVE_NOTIFICATIONS=true',
    'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true',
    `CLIPLOT_LIVE_ORDER_APPROVAL_ID=${cfg.orderApprovalId}`,
    `CLIPLOT_LIVE_PAYMENT_APPROVAL_ID=${cfg.paymentApprovalId}`,
    `CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID=${cfg.notificationApprovalId}`,
    `CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID=${cfg.orderWarehouseSmokeApprovalId}`,
    `CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW=${cfg.liveCheckoutWindow}`,
    `CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW=${cfg.paymentCreateWindow}`,
    `CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW=${cfg.notificationSendWindow}`,
    `CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_WINDOW=${cfg.liveCheckoutWindow}`,
  ];
}

function restoreAssignments() {
  return [
    'ENABLE_LIVE_ORDER_SUBMIT=false',
    'ENABLE_LIVE_PAYMENT_CREATE=false',
    'ENABLE_LIVE_NOTIFICATIONS=false',
    'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false',
    ...metadataOverrideNames.map((name) => `${name}-`),
  ];
}

function fullCheckoutRequestBody() {
  return {
    confirm: 'LIVE_CHECKOUT_EXECUTION_WINDOW',
    executionWindow: cfg.liveCheckoutWindow,
    orderIdempotencyKey: cfg.orderIdempotencyKey,
    paymentIdempotencyKey: cfg.paymentIdempotencyKey,
    notificationIdempotencyKey: cfg.notificationIdempotencyKey,
    duplicateCheck: cfg.duplicateCheck,
    rollbackPlan: 'ORDER_WAREHOUSE_PAYMENT_NOTIFICATION_ROLLBACK_OWNERS_ASSIGNED',
    validationPlan: 'EXACTLY_ONE_ORDER_PAYMENT_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEYS',
    approvedBy: cfg.operatorId,
    reasonCode: 'CLIPLOT_GOAL10_BOUNDED_LIVE_CHECKOUT',
    externalOrderId: `cliplot-goal10-full-${cfg.orderIdempotencyKey.slice(-8).toLowerCase()}`,
  };
}

function orderWarehouseSmokeRequestBody() {
  return {
    confirm: 'CREATE_REPLAY_CANCEL',
    approvalId: cfg.orderWarehouseSmokeApprovalId,
    approvedBy: cfg.operatorId,
    reasonCode: 'CLIPLOT_GOAL10_ORDER_WAREHOUSE_CREATE_REPLAY_CANCEL',
    externalOrderId: `cliplot-goal10-owh-${cfg.orderIdempotencyKey.slice(-8).toLowerCase()}`,
  };
}

function requestForTarget() {
  if (target === 'full-checkout') {
    return {
      path: '/api/checkout/live-bounded-executor',
      body: fullCheckoutRequestBody(),
      expectedStatus: 201,
    };
  }
  if (target === 'order-warehouse-smoke') {
    return {
      path: '/api/checkout/live-order-warehouse-smoke-executor',
      body: orderWarehouseSmokeRequestBody(),
      expectedStatus: 201,
    };
  }
  fail('unsupported_operator_target', { target, supportedTargets: ['full-checkout', 'order-warehouse-smoke'] });
}

function summarizeBody(body) {
  return {
    success: body?.success === true,
    status: body?.status || null,
    mode: body?.mode || null,
    mutation: body?.mutation === true,
    persistence: body?.persistence === true,
    providerCall: body?.providerCall === true,
    liveExecutionAllowed: body?.liveExecutionAllowed === true,
    orderCreated: body?.orderCreated === true,
    warehouseReserved: body?.warehouseReserved === true,
    paymentCreated: body?.paymentCreated === true,
    notificationSent: body?.notificationSent === true,
    orderId: body?.orderId || null,
    cleanupSuccess: body?.cleanup?.success === true,
    finalOrderStatus: body?.cleanup?.orderReadback?.status || body?.evidence?.orderReadback?.status || null,
    activeReservationCountAfterCleanup: body?.cleanup?.afterCancelReservation?.activeReservationCount
      ?? body?.evidence?.afterCancelReservation?.activeReservationCount
      ?? null,
    paymentStatus: body?.evidence?.payment?.status || null,
    notificationStatus: body?.evidence?.notification?.status || null,
    blockers: Array.isArray(body?.blockers) ? body.blockers : [],
    sensitiveDataPolicy: body?.sensitiveDataPolicy || [],
  };
}

function safeRequestFingerprint(body) {
  return {
    confirm: body.confirm,
    executionWindow: body.executionWindow || null,
    duplicateCheck: body.duplicateCheck || null,
    rollbackPlan: body.rollbackPlan || null,
    validationPlan: body.validationPlan || null,
    approvedBy: body.approvedBy || null,
    reasonCode: body.reasonCode || null,
    externalOrderId: body.externalOrderId || null,
    idempotencyKeySuffixes: {
      order: cfg.orderIdempotencyKey.slice(-8),
      payment: cfg.paymentIdempotencyKey.slice(-8),
      notification: cfg.notificationIdempotencyKey.slice(-8),
    },
  };
}

async function preflight() {
  const flags = readLiveFlagsFromPod();
  assertAllFlagsFalse('preflight', flags);
  const evidence = await fetchJson('/api/checkout/live-execution-evidence-packet');
  const liveFlagsClosed = evidence.payload?.liveFlagsClosed === true;
  const liveExecutionAllowed = evidence.payload?.liveExecutionAllowed === false;
  if (!liveFlagsClosed || !liveExecutionAllowed) {
    fail('preflight_runtime_packet_not_closed', {
      httpStatus: evidence.httpStatus,
      status: evidence.payload?.status,
      liveFlagsClosed,
      liveExecutionAllowed: evidence.payload?.liveExecutionAllowed,
      mutation: evidence.payload?.mutation,
      providerCall: evidence.payload?.providerCall,
      persistence: evidence.payload?.persistence,
    });
  }
  return {
    pod: flags.pod,
    flags: flags.flags,
    evidencePacketStatus: evidence.payload?.status,
    liveExecutionAllowed: evidence.payload?.liveExecutionAllowed,
  };
}

function assertExecuteGate(windowState) {
  if (!executeRequested) {
    fail('dry_run_only_execute_gate_missing', {
      requiredArg: '--execute',
      requiredEnv: 'CLIPLOT_LIVE_OPERATOR_EXECUTE=true',
      requiredConfirmEnv: 'CLIPLOT_LIVE_OPERATOR_CONFIRM=CLIPLOT_GOAL10_BOUNDED_LIVE_EXECUTE',
    });
  }
  if (executeConfirm !== 'CLIPLOT_GOAL10_BOUNDED_LIVE_EXECUTE') {
    fail('execute_confirm_env_missing');
  }
  if (!windowState.valid || !windowState.active) {
    fail('approved_window_not_active', { window: windowState });
  }
}

async function main() {
  const windowState = parseWindow(cfg.liveCheckoutWindow);
  const request = requestForTarget();
  const initial = await preflight();

  if (!executeRequested) {
    console.log(JSON.stringify({
      ok: true,
      mode: 'dry_run',
      target,
      baseUrl,
      namespace,
      deployment,
      window: windowState,
      preflight: initial,
      wouldOpenOnlyFlags: liveFlagNames,
      wouldPatchNonSecretMetadata: metadataOverrideNames,
      endpoint: request.path,
      request: safeRequestFingerprint(request.body),
      liveSideEffectOccurred: false,
      next: 'Set CLIPLOT_LIVE_OPERATOR_EXECUTE=true, CLIPLOT_LIVE_OPERATOR_CONFIRM=CLIPLOT_GOAL10_BOUNDED_LIVE_EXECUTE, and pass --execute inside the approved window.',
    }, null, 2));
    return;
  }

  assertExecuteGate(windowState);

  let postResult = null;
  let restoreEvidence = null;
  let cleanupError = null;
  try {
    cleanupArmed = true;
    kubectlSetEnv(openAssignments());
    const opened = readLiveFlagsFromPod();
    const notOpen = liveFlagNames.filter((name) => opened.flags[name] !== 'true');
    if (notOpen.length > 0) fail('live_flags_not_open_after_patch', { notOpen, flags: opened.flags, pod: opened.pod });

    const response = await fetchJson(request.path, {
      method: 'POST',
      body: JSON.stringify(request.body),
    });
    postResult = {
      httpStatus: response.httpStatus,
      evidence: summarizeBody(response.payload),
    };
  } finally {
    try {
      kubectlSetEnv(restoreAssignments());
      restoreEvidence = readLiveFlagsFromPod();
    } catch (error) {
      cleanupError = {
        name: error?.name || 'Error',
        message: error?.message || 'cleanup_failed',
      };
    } finally {
      cleanupArmed = false;
    }
  }

  if (!restoreEvidence) fail('restore_evidence_missing', { cleanupError });
  assertAllFlagsFalse('restore', restoreEvidence);

  const accepted = postResult?.httpStatus === request.expectedStatus && postResult?.evidence?.success === true;
  console.log(JSON.stringify({
    ok: accepted,
    mode: 'execute',
    target,
    baseUrl,
    namespace,
    deployment,
    window: windowState,
    endpoint: request.path,
    request: safeRequestFingerprint(request.body),
    result: postResult,
    liveSideEffectOccurred: postResult?.evidence?.mutation === true,
    restoration: {
      cleanupError,
      pod: restoreEvidence.pod,
      flags: restoreEvidence.flags,
      allLiveFlagsFalse: true,
    },
  }, null, 2));

  if (!accepted) process.exit(1);
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    reason: 'operator_script_failed',
    name: error?.name || 'Error',
    message: error?.message || 'unknown_error',
    evidence: error?.evidence || {},
  }, null, 2));
  process.exit(1);
});
