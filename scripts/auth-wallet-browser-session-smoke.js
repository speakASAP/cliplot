#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_AUTH_WALLET_SMOKE_BASE_URL || 'http://127.0.0.1:8080';

const approvedEndpoints = [
  '/auth/profile/checkout-data',
  '/auth/profile/delivery-addresses',
  '/auth/profile/invoice-profiles',
];

const forbiddenMarkers = [
  'Bearer ',
  'eyJ',
  'sk_live',
  'sk_test',
  'whsec_',
  'refresh_token=',
  'access_token=',
  'password=',
  'cookie=',
  '@example.',
];

function approvalMetadata() {
  return {
    approvalIdPresent: Boolean(process.env.CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID),
    approvalIdLength: process.env.CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID?.length || 0,
    syntheticBearerPresent: Boolean(process.env.AUTH_WALLET_SYNTHETIC_BEARER),
    liveFlagEnabled: process.env.ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE === 'true',
  };
}

function sanitizeStatus(status) {
  if (status === 200) return 'wallet_read_authorized';
  if (status === 401) return 'wallet_read_unauthenticated';
  if (status === 403) return 'wallet_read_forbidden';
  if (status >= 500) return 'wallet_read_server_error';
  return 'wallet_read_unexpected_status';
}

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

function approvalIdLooksNonSecret(value) {
  return typeof value === 'string'
    && /^CLIPLOT-AUTH-WALLET-SMOKE-[A-Z0-9-]{6,80}$/.test(value)
    && !/(token|secret|password|bearer|cookie|jwt)/i.test(value);
}

function assertSanitized(payload) {
  const serialized = JSON.stringify(payload);
  for (const marker of forbiddenMarkers) {
    assert(!serialized.toLowerCase().includes(marker.toLowerCase()), `sensitive marker leaked: ${marker}`, {
      marker,
    });
  }
}

async function fetchWalletStatus(endpoint, bearer) {
  assert(approvedEndpoints.includes(endpoint), 'wallet endpoint outside approved read scope', { endpoint });
  const response = await fetch(new URL(endpoint, baseUrl), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${bearer}`,
    },
  });
  const schemaVersion = response.status === 200
    ? String((await response.clone().json().catch(() => ({}))).schemaVersion || 'missing')
    : 'not_read';

  return {
    endpointLabel: endpoint.replace('/auth/profile/', 'auth_profile_'),
    statusCode: response.status,
    statusLabel: sanitizeStatus(response.status),
    schemaVersion,
    bodyPrinted: false,
    tokenPrinted: false,
    customerDataPrinted: false,
  };
}

const gate = approvalMetadata();

if (!gate.liveFlagEnabled) {
  const blocked = {
    ok: true,
    status: 'approval_required_auth_wallet_browser_session_smoke',
    mode: 'guarded_synthetic_browser_session_wallet_read_evidence',
    liveExecutionAllowed: false,
    mutation: false,
    persistence: false,
    providerCall: false,
    checkoutSubmit: false,
    authWalletMutation: false,
    paymentCreation: false,
    warehouseReservation: false,
    notificationSend: false,
    databaseMutation: false,
    kubernetesMutation: false,
    vaultUsage: false,
    allowedEndpointLabels: approvedEndpoints.map((endpoint) => endpoint.replace('/auth/profile/', 'auth_profile_')),
    approvalMetadata: gate,
    blockers: [
      'missing_ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE_true',
      'missing_owner_approved_synthetic_browser_session_or_bearer',
      'missing_non_secret_CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID',
    ],
    liveCommandShape: 'ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE=true CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID=CLIPLOT-AUTH-WALLET-SMOKE-<ID> AUTH_WALLET_SYNTHETIC_BEARER=<approved synthetic bearer> npm run smoke:auth-wallet-browser-session -- <base-url>',
  };
  assertSanitized(blocked);
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(0);
}

assert(approvalIdLooksNonSecret(process.env.CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID), 'missing or unsafe non-secret approval id', {
  approvalMetadata: gate,
});
assert(typeof process.env.AUTH_WALLET_SYNTHETIC_BEARER === 'string' && process.env.AUTH_WALLET_SYNTHETIC_BEARER.length > 20, 'missing approved synthetic bearer for runtime evidence window', {
  approvalMetadata: gate,
});
assert(!process.env.AUTH_WALLET_SYNTHETIC_COOKIE, 'cookie-based wallet smoke is forbidden; use an approved in-memory synthetic bearer only', {
  approvalMetadata: gate,
});

const results = [];
for (const endpoint of approvedEndpoints) {
  results.push(await fetchWalletStatus(endpoint, process.env.AUTH_WALLET_SYNTHETIC_BEARER));
}

const evidence = {
  ok: true,
  status: 'sanitized_auth_wallet_browser_session_smoke_recorded',
  mode: 'guarded_synthetic_browser_session_wallet_read_evidence',
  baseUrl,
  mutation: false,
  persistence: false,
  checkoutSubmit: false,
  authWalletMutation: false,
  paymentCreation: false,
  warehouseReservation: false,
  notificationSend: false,
  databaseMutation: false,
  kubernetesMutation: false,
  vaultUsage: false,
  endpointCount: results.length,
  results,
};

assert(results.every((result) => result.bodyPrinted === false && result.tokenPrinted === false && result.customerDataPrinted === false), 'wallet smoke evidence is not sanitized', {
  results,
});
assertSanitized(evidence);
console.log(JSON.stringify(evidence, null, 2));
