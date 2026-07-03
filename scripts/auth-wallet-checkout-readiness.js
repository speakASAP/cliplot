#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const sourceFiles = {
  checkoutHtml: 'public/index.html',
  checkoutClient: 'public/app.js',
  integrations: 'src/integrations.js',
  server: 'src/server.js',
};

const walletEndpoints = [
  '/auth/profile/checkout-data',
  '/auth/profile/delivery-addresses',
  '/auth/profile/invoice-profiles',
];

const authWalletResponseContract = {
  status: 'source_defined',
  source: 'auth-microservice Goal 10.34',
  sourceCommit: '2276ab3',
  checkoutDataSchemaVersion: 'auth.customer-data-wallet.checkout-data.v1',
};

const authWalletPresenceGate = {
  status: 'complete',
  sourcePreflightHead: '2871a6f345f7d33aeaaa2f41350d67a6b50c1d7d',
  healthStatusCode: 200,
  unauthenticatedWalletStatusCode: 401,
  sendsAuthorizationHeader: false,
  sendsCookies: false,
  sendsRequestBody: false,
  printsResponseBody: false,
  readsDatabase: false,
  evidence: 'Auth coordinator Goal 10.25 runtime verifier passed after live SQL/deploy.',
};

const blockers = [
  '[MISSING: owner approval for Cliplot checkout wallet selector behavior]',
  '[MISSING: authenticated browser session contract for wallet reads]',
  '[MISSING: no-PII logging and frontend exposure review for wallet data]',
  '[UNKNOWN: exact Auth wallet response fields, delivery address response shape, and invoice profile response shape]',
];

const sourceKnownFacts = [
  'Cliplot remains guest-checkout first: the checkout form collects name, email, phone, address, shipping, and payment fields.',
  'Checkout submit posts guest/customer form data to /api/checkout/submit and stores a browser-local last-checkout snapshot.',
  'Auth is currently only a hosted login/register link surface; no Auth wallet endpoint integration is present.',
  'Guarded checkout still returns service_identity_required before live order/payment/Warehouse mutation.',
  'Runtime manifests point at Auth but do not enable wallet integration.',
  'Auth source-defines checkout-data schemaVersion as auth.customer-data-wallet.checkout-data.v1.',
];

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

async function readSources() {
  const entries = await Promise.all(
    Object.entries(sourceFiles).map(async ([key, path]) => [key, path, await readFile(path, 'utf8')]),
  );
  return Object.fromEntries(entries.map(([key, path, contents]) => [key, { path, contents }]));
}

function includesAll(contents, snippets) {
  return snippets.every((snippet) => contents.includes(snippet));
}

const sources = await readSources();
const checkoutHtml = sources.checkoutHtml.contents;
const checkoutClient = sources.checkoutClient.contents;
const integrations = sources.integrations.contents;
const server = sources.server.contents;

const hasCheckoutForm = includesAll(checkoutHtml, [
  'id="checkoutForm"',
  'name="name"',
  'name="email"',
  'name="phone"',
  'name="address"',
  'name="shipping"',
  'name="payment"',
]);
const hasCartReview = includesAll(checkoutClient, [
  'cartEntries()',
  'renderCheckoutReview()',
  "fetch('/api/checkout/submit'",
  'saveLastCheckout(',
]);
const hasBackendCustomerNormalization = includesAll(integrations, [
  'customer.name',
  'customer.email',
  'customer.phone',
  'customer.address',
  'normalizeCheckoutChoice',
]);
const hasAuthLinkOnlySurface = includesAll(server, [
  "url.pathname === '/api/auth/links'",
  'authLinks()',
]);
const runtimeWalletReferences = Object.values(sources)
  .flatMap(({ path, contents }) => walletEndpoints
    .filter((endpoint) => contents.includes(endpoint))
    .map((endpoint) => ({ path, endpoint })));

assert(hasCheckoutForm, 'checkout form customer fields missing', { file: sourceFiles.checkoutHtml });
assert(hasCartReview, 'cart review/submit surface missing', { file: sourceFiles.checkoutClient });
assert(hasBackendCustomerNormalization, 'backend customer normalization missing', { file: sourceFiles.integrations });
assert(hasAuthLinkOnlySurface, 'hosted Auth link surface missing', { file: sourceFiles.server });
assert(
  authWalletResponseContract.checkoutDataSchemaVersion === 'auth.customer-data-wallet.checkout-data.v1',
  'Auth wallet checkout-data schema version is not source-defined',
  { authWalletResponseContract },
);
assert(runtimeWalletReferences.length === 0, 'runtime wallet endpoint integration exists before dependency gates are cleared', {
  runtimeWalletReferences,
  blockers,
});

console.log(JSON.stringify({
  ok: true,
  status: 'dependency_gated_auth_wallet_checkout_readiness',
  mode: 'source_only_no_live_calls',
  mutation: false,
  persistence: false,
  providerCall: false,
  deployRequired: false,
  inspectedFiles: Object.values(sourceFiles),
  surfaces: {
    checkoutForm: hasCheckoutForm,
    cartReviewAndSubmit: hasCartReview,
    backendCustomerNormalization: hasBackendCustomerNormalization,
    hostedAuthLinks: hasAuthLinkOnlySurface,
  },
  runtimeWalletIntegrationPresent: false,
  requiredWalletEndpoints: walletEndpoints,
  authWalletResponseContract,
  authWalletPresenceGate,
  sourceKnownFacts,
  blockers,
  next: 'Keep Cliplot checkout wallet integration blocked until selector behavior, browser session, PII exposure, response-shape, field mapping, and guest fallback approvals are available.',
}, null, 2));
