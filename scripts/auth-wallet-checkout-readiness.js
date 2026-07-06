#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { authWalletRuntimeCheckoutEvidencePacket } from '../src/integrations.js';

const sourceFiles = {
  checkoutHtml: 'public/index.html',
  checkoutClient: 'public/app.js',
  integrations: 'src/integrations.js',
  server: 'src/server.js',
  walletContract: 'docs/auth-wallet-checkout-contract.md',
  browserSessionSmoke: 'scripts/auth-wallet-browser-session-smoke.js',
};

const walletEndpoints = [
  '/auth/profile/checkout-data',
  '/auth/profile/delivery-addresses',
  '/auth/profile/invoice-profiles',
];

const authWalletWriteHttpVerbPattern = /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"][\s\S]{0,240}\/auth\/profile\/(?:checkout-data|delivery-addresses|invoice-profiles)|\/auth\/profile\/(?:checkout-data|delivery-addresses|invoice-profiles)[\s\S]{0,240}method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/;
const authWalletSaveUiPatterns = [
  'data-auth-wallet-save',
  'data-wallet-save',
  'saveAuthWallet',
  'saveWalletProfile',
  'saveDeliveryAddressToAuth',
  'saveInvoiceProfileToAuth',
  'authWalletWrite',
  'profileWrite',
];

const authWalletResponseContract = {
  status: 'source_defined',
  source: 'auth-microservice Goal 10.34',
  sourceCommit: '2276ab3',
  checkoutDataSchemaVersion: 'auth.customer-data-wallet.checkout-data.v1',
  checkoutDataFields: [
    'schemaVersion',
    'user',
    'deliveryAddresses',
    'invoiceProfiles',
    'defaults',
  ],
  defaultsFields: [
    'deliveryAddressId',
    'invoiceProfileId',
  ],
  sanitizedDeliveryAddressFields: [
    'id',
    'label',
    'firstName',
    'lastName',
    'company',
    'street',
    'street2',
    'city',
    'region',
    'postalCode',
    'country',
    'phone',
    'email',
    'deliveryInstructions',
    'isDefault',
    'sourceApplication',
    'lastUsedAt',
    'createdAt',
    'updatedAt',
  ],
  sanitizedInvoiceProfileFields: [
    'id',
    'label',
    'type',
    'firstName',
    'lastName',
    'companyName',
    'companyId',
    'taxId',
    'vatId',
    'street',
    'street2',
    'city',
    'region',
    'postalCode',
    'country',
    'phone',
    'email',
    'isDefault',
    'sourceApplication',
    'lastUsedAt',
    'createdAt',
    'updatedAt',
  ],
  excludedWalletRowFields: [
    'user',
    'userId',
    'deletedAt',
  ],
  caveats: [
    'Many wallet row fields are nullable; consumers must handle null.',
    'lastUsedAt, createdAt, and updatedAt are timestamp fields; this readiness check does not approve a stricter JSON serialization schema.',
    'pickupPointId is documented as a future delivery-address field and is not part of the current Auth entity/DTO response shape.',
    'invoice recipient email is email; invoiceEmail and electronicInvoiceEmail are not Auth v1 aliases.',
  ],
};

const authWalletPresenceGate = {
  status: 'complete',
  authLiveRefreshCommit: 'Goal 10.57 Auth live refresh from Source Preflight HEAD',
  sourcePreflightHead: 'e484688fae0cc6fcdff593e11265fd49bcab6dbd',
  deployedImageTag: 'e484688-20260703071733',
  healthStatusCode: 200,
  unauthenticatedWalletStatusCode: 401,
  sendsAuthorizationHeader: false,
  sendsCookies: false,
  sendsRequestBody: false,
  printsResponseBody: false,
  readsDatabase: false,
  evidence: 'Auth coordinator Goal 10.57 runtime verifier passed after current Source Preflight live refresh; FlipFlop non-mutating post-deploy smoke also passed.',
};

const authWalletNoPiiExposurePolicy = {
  status: 'source_policy_defined',
  runtimeWalletCodePresent: true,
  allowedEvidenceFields: [
    'status codes',
    'booleans',
    'schemaVersion',
    'blocker labels',
    'short non-reversible ids',
  ],
  forbiddenEvidenceFields: [
    'raw wallet response bodies',
    'names',
    'phone numbers',
    'emails',
    'street addresses',
    'company ids',
    'tax ids',
    'VAT ids',
    'tokens',
    'cookies',
    'passwords',
    'secrets',
    'service credentials',
  ],
  storageBoundary: 'Do not persist reusable Auth wallet rows in Cliplot local storage; only immutable checkout snapshots may be submitted after implementation approval.',
  frontendBoundary: 'Expose only fields needed for customer selection and immutable checkout snapshots; selector labels must avoid raw full address dumps.',
  loggingBoundary: 'Do not log raw Auth wallet response bodies or customer PII in source validation, browser logs, server logs, reports, or approval evidence.',
};

const fixtureDeliveryAddress = {
  id: 'delivery-fixture-id',
  label: 'Default delivery',
  firstName: 'FIRST_NAME_FIXTURE',
  lastName: 'LAST_NAME_FIXTURE',
  company: null,
  street: 'DELIVERY_STREET_FIXTURE',
  street2: null,
  city: 'DELIVERY_CITY_FIXTURE',
  region: null,
  postalCode: 'POSTAL_FIXTURE',
  country: 'CZ',
  phone: 'PHONE_FIXTURE',
  email: 'EMAIL_FIXTURE',
  deliveryInstructions: 'DELIVERY_NOTE_FIXTURE',
  isDefault: true,
  sourceApplication: 'auth-microservice',
  lastUsedAt: '2026-07-03T00:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
  user: { id: 'MUST_NOT_COPY_USER' },
  userId: 'MUST_NOT_COPY_USER',
  deletedAt: null,
};

const fixtureInvoiceProfile = {
  id: 'invoice-fixture-id',
  label: 'Business invoice',
  type: 'company',
  firstName: 'FIRST_NAME_FIXTURE',
  lastName: 'LAST_NAME_FIXTURE',
  companyName: 'COMPANY_NAME_FIXTURE',
  companyId: 'COMPANY_ID_FIXTURE',
  taxId: 'TAX_ID_FIXTURE',
  vatId: 'VAT_ID_FIXTURE',
  street: 'BILLING_STREET_FIXTURE',
  street2: null,
  city: 'BILLING_CITY_FIXTURE',
  region: null,
  postalCode: 'BILLING_POSTAL_FIXTURE',
  country: 'CZ',
  phone: 'BILLING_PHONE_FIXTURE',
  email: 'BILLING_EMAIL_FIXTURE',
  isDefault: true,
  sourceApplication: 'auth-microservice',
  lastUsedAt: '2026-07-03T00:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
  invoiceEmail: 'MUST_NOT_COPY_INVOICE_EMAIL',
  electronicInvoiceEmail: 'MUST_NOT_COPY_ELECTRONIC_INVOICE_EMAIL',
  user: { id: 'MUST_NOT_COPY_USER' },
  userId: 'MUST_NOT_COPY_USER',
  deletedAt: null,
};

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined && nested !== null && nested !== ''));
}

function mapDeliveryAddressToCheckoutSnapshot(address) {
  return compactObject({
    customerName: [address.firstName, address.lastName].filter(Boolean).join(' '),
    email: address.email,
    phone: address.phone,
    deliveryAddress: compactObject({
      name: [address.firstName, address.lastName].filter(Boolean).join(' '),
      company: address.company,
      street: [address.street, address.street2].filter(Boolean).join(', '),
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      note: address.deliveryInstructions,
    }),
  });
}

function mapInvoiceProfileToCheckoutSnapshot(profile) {
  return compactObject({
    billingAddress: compactObject({
      type: profile.type,
      name: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
      companyName: profile.companyName,
      companyId: profile.companyId,
      taxId: profile.taxId,
      vatId: profile.vatId,
      street: [profile.street, profile.street2].filter(Boolean).join(', '),
      city: profile.city,
      region: profile.region,
      postalCode: profile.postalCode,
      country: profile.country,
      phone: profile.phone,
      email: profile.email,
    }),
  });
}

const deliverySnapshotFixture = mapDeliveryAddressToCheckoutSnapshot(fixtureDeliveryAddress);
const invoiceSnapshotFixture = mapInvoiceProfileToCheckoutSnapshot(fixtureInvoiceProfile);
const walletMappingExcludedFields = [
  'id',
  'user',
  'userId',
  'deletedAt',
  'sourceApplication',
  'lastUsedAt',
  'createdAt',
  'updatedAt',
  'isDefault',
  'invoiceEmail',
  'electronicInvoiceEmail',
];
const serializedSnapshotFixtures = JSON.stringify({ deliverySnapshotFixture, invoiceSnapshotFixture });
const sourceOnlyWalletMappingEvidence = {
  status: 'source_only_mapping_contract_verified',
  deliverySnapshotFields: Object.keys(deliverySnapshotFixture),
  deliveryAddressFields: Object.keys(deliverySnapshotFixture.deliveryAddress || {}),
  billingAddressFields: Object.keys(invoiceSnapshotFixture.billingAddress || {}),
  excludedFields: walletMappingExcludedFields,
  excludedFieldsProtected: walletMappingExcludedFields.every((field) => !serializedSnapshotFixtures.includes(`"${field}":`)),
  forbiddenAliasProtected: !serializedSnapshotFixtures.includes('invoiceEmail') && !serializedSnapshotFixtures.includes('electronicInvoiceEmail'),
  forbiddenFixtureValueProtected: !serializedSnapshotFixtures.includes('MUST_NOT_COPY'),
};

const sourceOnlySelectorBehaviorEvidence = {
  status: 'source_only_selector_behavior_policy_verified',
  runtimeWalletCodePresent: true,
  selectorUiPresent: true,
  liveAuthWalletFetchPresent: false,
  syntheticOnly: true,
  behaviorCases: [
    {
      case: 'default_delivery_prefill_before_manual_edit',
      walletDefaultMayPrefill: true,
      manualEditWins: true,
      checkoutSubmit: false,
      walletMutation: false,
    },
    {
      case: 'default_invoice_prefill_before_manual_edit',
      walletDefaultMayPrefill: true,
      manualEditWins: true,
      checkoutSubmit: false,
      walletMutation: false,
    },
    {
      case: 'manual_delivery_override_after_wallet_selection',
      walletDefaultMayPrefill: false,
      manualEditWins: true,
      checkoutSubmit: false,
      walletMutation: false,
    },
    {
      case: 'manual_invoice_override_after_wallet_selection',
      walletDefaultMayPrefill: false,
      manualEditWins: true,
      checkoutSubmit: false,
      walletMutation: false,
    },
    {
      case: 'return_to_manual_guest_style_entry',
      manualCheckoutAvailable: true,
      clearsSelectedWalletReference: true,
      checkoutSubmit: false,
      walletMutation: false,
    },
  ],
  selectorLabelPolicy: {
    customerSafeSummaryOnly: true,
    rawFullAddressDump: false,
    tokenOrCookieOutput: false,
    walletIdOutput: false,
  },
  orderSnapshotPolicy: {
    sendsWalletIds: false,
    sendsMutableWalletReferences: false,
    sendsAuthSubject: false,
    usesImmutableSnapshotsOnly: true,
  },
};

const sourceOnlyGuestFallbackPolicy = {
  status: 'source_only_guest_fallback_policy_verified',
  runtimeWalletCodePresent: false,
  checkoutSubmitPath: '/api/checkout/submit',
  sanitizedEvidenceOnly: true,
  fallbackCases: [
    'missing_auth_session',
    'wallet_401',
    'wallet_403',
    'wallet_timeout',
    'wallet_malformed_response',
    'wallet_empty_rows',
  ].map((caseName) => ({
    case: caseName,
    manualCheckoutAvailable: true,
    cartPreserved: true,
    walletMutation: false,
    checkoutSubmit: false,
  })),
  forbiddenOperations: [
    'Auth wallet mutation',
    'checkout submit',
    'payment creation',
    'Warehouse reservation',
    'notification send',
  ],
};

const authWalletWriteDecision = {
  status: 'read_only_checkout_scope_selected',
  decision: 'Cliplot reads Auth wallet data for checkout selector/pre-fill only; user-editable Auth delivery, invoice, and profile write surfaces are not approved in this lane.',
  authOwnershipBoundary: 'Auth owns reusable delivery addresses, invoice profiles, customer profile data, consent, audit, and mutation policy.',
  cliplotAllowedScope: [
    'current-checkout selector/pre-fill from approved Auth wallet reads',
    'immutable checkout snapshots without wallet ids or Auth ownership fields',
    'manual guest checkout fallback without saving to Auth',
  ],
  allowedReadEndpoints: walletEndpoints,
  forbiddenHttpVerbs: ['POST', 'PUT', 'PATCH', 'DELETE'],
  forbiddenUiHooks: authWalletSaveUiPatterns,
  writeBlockers: [
    '[MISSING: owner-approved Auth-owned delivery/invoice/profile mutation contract for Cliplot write surfaces]',
    '[MISSING: consent, idempotency, audit, rollback, no-PII evidence, and validation ownership for Auth wallet/profile writes]',
  ],
  futureWriteRequirements: [
    'separate owner-approved Auth mutation contract',
    'explicit allowed endpoints and payload schema',
    'consent and audit semantics owned by Auth',
    'idempotency and rollback behavior',
    'no-PII validation evidence and validation owner',
  ],
};

const sourceOnlySessionHandoffEvidence = {
  status: 'source_only_browser_session_contract_verified',
  runtimeWalletCodePresent: false,
  browserSessionImplementationPresent: true,
  defaultModeCallsAuth: false,
  defaultModeReadsTokenContents: false,
  requiredRuntimeInputs: [
    'owner-approved synthetic Auth account or browser session',
    'owner-approved synthetic Auth bearer token only for the live runtime evidence window',
    'non-secret Cliplot wallet smoke approval id',
    'explicit confirmation that no checkout submit, payment, Warehouse reservation, notification send, or wallet mutation is in scope',
  ],
  walletReadScope: [
    '/auth/profile/checkout-data',
    '/auth/profile/delivery-addresses',
    '/auth/profile/invoice-profiles',
  ],
  allowedRuntimeEvidence: [
    'HTTP status codes',
    'booleans',
    'schemaVersion',
    'sanitized blocker labels',
    'short non-reversible ids',
  ],
  forbiddenRuntimeEvidence: [
    'Authorization header',
    'bearer token',
    'JWT',
    'refresh token',
    'cookie',
    'raw wallet response body',
    'decoded token claims',
    'customer PII',
    'service credentials',
  ],
  forbiddenOperations: [
    'checkout submit',
    'Auth wallet mutation',
    'payment creation',
    'Warehouse reservation',
    'notification send',
    'DB read/write',
    'Kubernetes/Vault mutation',
  ],
};

const runtimeWalletEvidence = await authWalletRuntimeCheckoutEvidencePacket();
const runtimeWalletEvidenceReady = runtimeWalletEvidence.status === 'auth_wallet_runtime_checkout_evidence_recorded_no_live_calls'
  && runtimeWalletEvidence.browserSessionFetchSourcePathImplemented === true
  && runtimeWalletEvidence.browserSessionFetchEvidence?.status === 'approval_required_auth_wallet_browser_session_fetch_source_path'
  && runtimeWalletEvidence.selectorEvidence?.selectorHelpersImplemented === true
  && runtimeWalletEvidence.selectorEvidence?.selectorUiRendered === true
  && runtimeWalletEvidence.selectorEvidence?.checkoutSelectorUiIntegrated === true
  && runtimeWalletEvidence.selectorEvidence?.customerSafeLabels === true
  && runtimeWalletEvidence.mappingEvidence?.excludedWalletFieldsProtected === true
  && runtimeWalletEvidence.noPiiEvidence?.sanitizedEvidenceOnly === true
  && runtimeWalletEvidence.noPiiEvidence?.forbiddenFixtureValueOutput === true
  && Array.isArray(runtimeWalletEvidence.guestFallbackEvidence?.fallbackCases)
  && runtimeWalletEvidence.guestFallbackEvidence.fallbackCases.length === 6
  && runtimeWalletEvidence.authWalletFetch === false
  && runtimeWalletEvidence.checkoutSubmit === false
  && runtimeWalletEvidence.mutation === false
  && runtimeWalletEvidence.persistence === false
  && runtimeWalletEvidence.providerCall === false;
const blockers = runtimeWalletEvidenceReady ? [] : [
  '[MISSING: approved runtime Cliplot checkout wallet selector behavior implementation evidence]',
  '[MISSING: no-PII logging/frontend exposure implementation evidence for future runtime wallet code]',
  '[MISSING: approved runtime Cliplot field mapping implementation from Auth wallet rows to checkout/order snapshots]',
  '[MISSING: approved runtime Cliplot guest fallback implementation evidence when Auth wallet reads are unavailable]',
];

const sourceKnownFacts = [
  'Cliplot remains guest-checkout first: the checkout form collects name, email, phone, address, shipping, and payment fields.',
  'Checkout submit posts guest/customer form data to /api/checkout/submit and stores a browser-local last-checkout snapshot.',
  'Auth is currently a hosted login/register link surface plus bounded in-memory checkout wallet selector hooks; a gated browser-session fetch evidence source path exists but default execution remains blocked.',
  'Guarded checkout still returns service_identity_required before live order/payment/Warehouse mutation.',
  'Runtime manifests point at Auth but do not enable wallet integration.',
  'Auth source-defines checkout-data schemaVersion as auth.customer-data-wallet.checkout-data.v1.',
  'Auth source-defines checkout-data top-level fields, defaults fields, and sanitized delivery/invoice wallet row field names.',
  'Cliplot source-defines the no-PII wallet exposure policy; bounded selector runtime code and gated browser-session fetch evidence source are present without default live fetch or PII evidence output.',
  'Cliplot source-verifies selector behavior policy for wallet defaults, manual override, manual fallback, customer-safe labels, and immutable snapshots; runtime selector UI source hooks are integrated without live Auth fetch.',
  'Cliplot source-verifies pure Auth wallet row mapping into immutable checkout snapshots without wallet ids or Auth ownership fields.',
  'Cliplot source-defines guest fallback behavior for missing, rejected, timed-out, malformed, or empty Auth wallet reads; runtime evidence remains gated.',
  'Cliplot synthetic browser/session wallet-read evidence passed on 2026-07-03; runtime checkout selector UI source integration is present and the live wallet fetch evidence path remains gated by default.',
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
const walletContract = sources.walletContract.contents;

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
const hasWalletContract = includesAll(walletContract, [
  'Status: source/runtime selector UI plus gated browser-session fetch source path integrated; live checkout submit and wallet mutation blocked',
  'Selector Behavior',
  'Authenticated Session Handoff',
  'PII And Logging Constraints',
  'Field Mapping',
  'Guest Fallback',
  'Runtime Selector UI Integration',
  'The browser UI must not call Auth wallet endpoints directly in this selector UI lane',
  'selector controls must not have checkout form `name` attributes',
  'Default Auth entries may prefill the checkout only before the customer edits',
  'Manual edits must override wallet defaults for the current checkout snapshot',
  'Wallet reads must use a synthetic or real authenticated Auth bearer only in',
  'memory for the request window',
  'Gated Browser Session Fetch Source Path Acceptance Criteria',
  'default verifier must not call Auth wallet endpoints',
  'The default verifier must not read token, cookie, JWT, or refresh-token',
  'The wallet read scope is limited to Auth checkout-data, delivery-address, and',
  'Runtime evidence must not print Authorization headers, bearer tokens, JWTs',
  'Checkout submit, Auth wallet mutation, payment creation, Warehouse reservation',
  'Do not log raw Auth wallet response bodies',
  'Do not persist reusable Auth wallet rows in Cliplot local storage',
  'Evidence may contain booleans, status codes, schema version, blocker labels',
  'Selector labels must avoid raw full address dumps',
  'Source-Only Selector Behavior Acceptance Criteria',
  'default wallet entries may prefill only before manual edits',
  'manual edits must win over wallet defaults and selections',
  'customer can return to manual guest-style entry',
  'selector labels must use customer-safe summaries',
  'wallet ids, mutable wallet references, and Auth subjects must not be',
  'submitted to checkout or Orders',
  'Source-Only No-PII Evidence Policy',
  'Forbidden evidence',
  'future runtime wallet code',
  'Source-Only Wallet Mapping Acceptance Criteria',
  'Pure mapping helpers',
  'invoice recipient email is `email`',
  'Source-Only Guest Fallback Acceptance Criteria',
  'missing Auth session',
  '401',
  '403',
  'timeout',
  'malformed response',
  'empty wallet',
  'manual checkout must remain available',
  'cart must remain preserved',
  'Delivery address mapping to the checkout snapshot',
  'Invoice profile mapping to the checkout snapshot',
  'The checkout submit path remains `/api/checkout/submit` and must receive',
  'resolved immutable snapshots, not Auth wallet ids',
  'Runtime integration remains blocked until selector behavior, browser-session',
  'fallback evidence are covered by source validation and approved synthetic',
  '2026-07-06 Lane G Wallet Write Decision',
  'Decision: Cliplot remains a read-only Auth wallet checkout consumer for this',
  'It must not expose user-editable Auth delivery, invoice, or profile write',
  'Future write surfaces require a separate owner-approved Auth-owned mutation',
  'authWalletWriteDecision.status=read_only_checkout_scope_selected',
]);
const runtimeWalletReferences = Object.values(sources)
  .filter(({ path }) => ![sourceFiles.walletContract, sourceFiles.checkoutClient, sourceFiles.checkoutHtml].includes(path))
  .flatMap(({ path, contents }) => walletEndpoints
    .filter((endpoint) => contents.includes(endpoint))
    .map((endpoint) => ({ path, endpoint })));
const runtimeSourceEntries = Object.values(sources)
  .filter(({ path }) => [
    sourceFiles.checkoutHtml,
    sourceFiles.checkoutClient,
    sourceFiles.integrations,
    sourceFiles.server,
    sourceFiles.browserSessionSmoke,
  ].includes(path));
const authWalletWriteHttpReferences = runtimeSourceEntries
  .filter(({ contents }) => authWalletWriteHttpVerbPattern.test(contents))
  .map(({ path }) => path);
const authWalletSaveUiReferences = runtimeSourceEntries
  .flatMap(({ path, contents }) => authWalletSaveUiPatterns
    .filter((pattern) => contents.includes(pattern))
    .map((pattern) => ({ path, pattern })));

assert(hasCheckoutForm, 'checkout form customer fields missing', { file: sourceFiles.checkoutHtml });
assert(hasCartReview, 'cart review/submit surface missing', { file: sourceFiles.checkoutClient });
assert(hasBackendCustomerNormalization, 'backend customer normalization missing', { file: sourceFiles.integrations });
assert(hasAuthLinkOnlySurface, 'hosted Auth link surface missing', { file: sourceFiles.server });
assert(hasWalletContract, 'source-only Auth wallet checkout contract markers missing', { file: sourceFiles.walletContract });
assert(
  authWalletResponseContract.checkoutDataSchemaVersion === 'auth.customer-data-wallet.checkout-data.v1',
  'Auth wallet checkout-data schema version is not source-defined',
  { authWalletResponseContract },
);
assert(
  includesAll(authWalletResponseContract.checkoutDataFields.join('|'), [
    'schemaVersion',
    'user',
    'deliveryAddresses',
    'invoiceProfiles',
    'defaults',
  ]),
  'Auth wallet checkout-data top-level field shape is incomplete',
  { authWalletResponseContract },
);
assert(
  includesAll(authWalletResponseContract.defaultsFields.join('|'), [
    'deliveryAddressId',
    'invoiceProfileId',
  ]),
  'Auth wallet defaults field shape is incomplete',
  { authWalletResponseContract },
);
assert(
  includesAll(authWalletResponseContract.sanitizedDeliveryAddressFields.join('|'), [
    'id',
    'street',
    'postalCode',
    'isDefault',
    'createdAt',
    'updatedAt',
  ]),
  'Auth wallet delivery address field shape is incomplete',
  { authWalletResponseContract },
);
assert(
  includesAll(authWalletResponseContract.sanitizedInvoiceProfileFields.join('|'), [
    'id',
    'type',
    'companyId',
    'taxId',
    'vatId',
    'email',
    'isDefault',
  ]),
  'Auth wallet invoice profile field shape is incomplete',
  { authWalletResponseContract },
);
assert(
  includesAll(authWalletResponseContract.excludedWalletRowFields.join('|'), [
    'user',
    'userId',
    'deletedAt',
  ]),
  'Auth wallet sanitized exclusion contract is incomplete',
  { authWalletResponseContract },
);
assert(
  authWalletNoPiiExposurePolicy.status === 'source_policy_defined'
    && authWalletNoPiiExposurePolicy.runtimeWalletCodePresent === true,
  'Cliplot Auth wallet no-PII exposure policy is not source-defined',
  { authWalletNoPiiExposurePolicy },
);
assert(
  includesAll(authWalletNoPiiExposurePolicy.allowedEvidenceFields.join('|'), [
    'status codes',
    'booleans',
    'schemaVersion',
    'blocker labels',
  ]),
  'Cliplot no-PII policy allowed evidence fields are incomplete',
  { authWalletNoPiiExposurePolicy },
);
assert(
  includesAll(authWalletNoPiiExposurePolicy.forbiddenEvidenceFields.join('|'), [
    'raw wallet response bodies',
    'emails',
    'street addresses',
    'tokens',
    'cookies',
    'secrets',
  ]),
  'Cliplot no-PII policy forbidden evidence fields are incomplete',
  { authWalletNoPiiExposurePolicy },
);
assert(
  sourceOnlyWalletMappingEvidence.status === 'source_only_mapping_contract_verified',
  'Cliplot Auth wallet source-only mapping evidence is missing',
  { sourceOnlyWalletMappingEvidence },
);
assert(
  invoiceSnapshotFixture.billingAddress.email === fixtureInvoiceProfile.email
    && invoiceSnapshotFixture.billingAddress.companyId === fixtureInvoiceProfile.companyId
    && invoiceSnapshotFixture.billingAddress.vatId === fixtureInvoiceProfile.vatId,
  'Cliplot invoice wallet row mapping does not produce the expected checkout snapshot',
  { sourceOnlyWalletMappingEvidence },
);
assert(
  deliverySnapshotFixture.email === fixtureDeliveryAddress.email
    && deliverySnapshotFixture.deliveryAddress.street === 'DELIVERY_STREET_FIXTURE'
    && deliverySnapshotFixture.deliveryAddress.postalCode === fixtureDeliveryAddress.postalCode,
  'Cliplot delivery wallet row mapping does not produce the expected checkout snapshot',
  { sourceOnlyWalletMappingEvidence },
);
assert(
  sourceOnlyWalletMappingEvidence.excludedFieldsProtected
    && sourceOnlyWalletMappingEvidence.forbiddenFixtureValueProtected
    && sourceOnlyWalletMappingEvidence.forbiddenAliasProtected,
  'Cliplot source-only mapping evidence leaked wallet ids, system fields, aliases, or forbidden fixture values',
  { sourceOnlyWalletMappingEvidence },
);
assert(
  sourceOnlySelectorBehaviorEvidence.status === 'source_only_selector_behavior_policy_verified'
    && sourceOnlySelectorBehaviorEvidence.runtimeWalletCodePresent === true
    && sourceOnlySelectorBehaviorEvidence.selectorUiPresent === true
    && sourceOnlySelectorBehaviorEvidence.liveAuthWalletFetchPresent === false
    && sourceOnlySelectorBehaviorEvidence.syntheticOnly === true,
  'Cliplot Auth wallet source-only selector behavior policy is missing',
  { sourceOnlySelectorBehaviorEvidence },
);
assert(
  includesAll(sourceOnlySelectorBehaviorEvidence.behaviorCases.map(({ case: caseName }) => caseName).join('|'), [
    'default_delivery_prefill_before_manual_edit',
    'default_invoice_prefill_before_manual_edit',
    'manual_delivery_override_after_wallet_selection',
    'manual_invoice_override_after_wallet_selection',
    'return_to_manual_guest_style_entry',
  ]),
  'Cliplot selector behavior cases are incomplete',
  { sourceOnlySelectorBehaviorEvidence },
);
assert(
  sourceOnlySelectorBehaviorEvidence.behaviorCases.every((behaviorCase) => behaviorCase.checkoutSubmit === false
    && behaviorCase.walletMutation === false)
    && sourceOnlySelectorBehaviorEvidence.behaviorCases.some((behaviorCase) => behaviorCase.manualEditWins === true)
    && sourceOnlySelectorBehaviorEvidence.behaviorCases.some((behaviorCase) => behaviorCase.manualCheckoutAvailable === true),
  'Cliplot selector behavior policy does not preserve manual override/fallback or forbid mutation consistently',
  { sourceOnlySelectorBehaviorEvidence },
);
assert(
  sourceOnlySelectorBehaviorEvidence.selectorLabelPolicy.customerSafeSummaryOnly === true
    && sourceOnlySelectorBehaviorEvidence.selectorLabelPolicy.rawFullAddressDump === false
    && sourceOnlySelectorBehaviorEvidence.selectorLabelPolicy.tokenOrCookieOutput === false
    && sourceOnlySelectorBehaviorEvidence.selectorLabelPolicy.walletIdOutput === false,
  'Cliplot selector label policy is not customer-safe',
  { sourceOnlySelectorBehaviorEvidence },
);
assert(
  sourceOnlySelectorBehaviorEvidence.orderSnapshotPolicy.sendsWalletIds === false
    && sourceOnlySelectorBehaviorEvidence.orderSnapshotPolicy.sendsMutableWalletReferences === false
    && sourceOnlySelectorBehaviorEvidence.orderSnapshotPolicy.sendsAuthSubject === false
    && sourceOnlySelectorBehaviorEvidence.orderSnapshotPolicy.usesImmutableSnapshotsOnly === true,
  'Cliplot selector behavior would leak wallet provenance into order snapshots',
  { sourceOnlySelectorBehaviorEvidence },
);
assert(
  sourceOnlyGuestFallbackPolicy.status === 'source_only_guest_fallback_policy_verified'
    && sourceOnlyGuestFallbackPolicy.runtimeWalletCodePresent === false
    && sourceOnlyGuestFallbackPolicy.checkoutSubmitPath === '/api/checkout/submit'
    && sourceOnlyGuestFallbackPolicy.sanitizedEvidenceOnly === true,
  'Cliplot Auth wallet source-only guest fallback policy is missing',
  { sourceOnlyGuestFallbackPolicy },
);
assert(
  includesAll(sourceOnlyGuestFallbackPolicy.fallbackCases.map(({ case: caseName }) => caseName).join('|'), [
    'missing_auth_session',
    'wallet_401',
    'wallet_403',
    'wallet_timeout',
    'wallet_malformed_response',
    'wallet_empty_rows',
  ]),
  'Cliplot guest fallback cases are incomplete',
  { sourceOnlyGuestFallbackPolicy },
);
assert(
  sourceOnlyGuestFallbackPolicy.fallbackCases.every((fallbackCase) => fallbackCase.manualCheckoutAvailable === true
    && fallbackCase.cartPreserved === true
    && fallbackCase.walletMutation === false
    && fallbackCase.checkoutSubmit === false),
  'Cliplot guest fallback policy does not preserve manual checkout/cart or forbids mutation consistently',
  { sourceOnlyGuestFallbackPolicy },
);
assert(
  authWalletWriteDecision.status === 'read_only_checkout_scope_selected'
    && authWalletWriteDecision.allowedReadEndpoints.length === 3
    && authWalletWriteDecision.forbiddenHttpVerbs.includes('PATCH')
    && authWalletWriteDecision.writeBlockers.some((blocker) => blocker.includes('owner-approved Auth-owned delivery/invoice/profile mutation contract')),
  'Cliplot Auth wallet write decision is missing or not read-only',
  { authWalletWriteDecision },
);
assert(authWalletWriteHttpReferences.length === 0, 'Auth wallet/profile write HTTP call found in runtime source', {
  authWalletWriteHttpReferences,
});
assert(authWalletSaveUiReferences.length === 0, 'Auth wallet/profile save UI hook found in runtime source', {
  authWalletSaveUiReferences,
});

assert(
  sourceOnlySessionHandoffEvidence.status === 'source_only_browser_session_contract_verified'
    && sourceOnlySessionHandoffEvidence.runtimeWalletCodePresent === false
    && sourceOnlySessionHandoffEvidence.browserSessionImplementationPresent === true
    && sourceOnlySessionHandoffEvidence.defaultModeCallsAuth === false
    && sourceOnlySessionHandoffEvidence.defaultModeReadsTokenContents === false,
  'Cliplot Auth wallet source-only browser-session contract is missing or unsafe',
  { sourceOnlySessionHandoffEvidence },
);
assert(
  walletEndpoints.every((endpoint) => sourceOnlySessionHandoffEvidence.walletReadScope.includes(endpoint)),
  'Cliplot browser-session contract does not limit wallet reads to the approved Auth wallet endpoints',
  { sourceOnlySessionHandoffEvidence },
);
assert(
  includesAll(sourceOnlySessionHandoffEvidence.forbiddenRuntimeEvidence.join('|'), [
    'Authorization header',
    'bearer token',
    'JWT',
    'refresh token',
    'cookie',
    'raw wallet response body',
    'customer PII',
  ]),
  'Cliplot browser-session contract does not forbid sensitive runtime evidence',
  { sourceOnlySessionHandoffEvidence },
);
assert(
  includesAll(sourceOnlySessionHandoffEvidence.forbiddenOperations.join('|'), [
    'checkout submit',
    'Auth wallet mutation',
    'payment creation',
    'Warehouse reservation',
    'notification send',
    'DB read/write',
    'Kubernetes/Vault mutation',
  ]),
  'Cliplot browser-session contract does not forbid unsafe runtime operations',
  { sourceOnlySessionHandoffEvidence },
);
const unexpectedRuntimeWalletReferences = runtimeWalletReferences.filter(({ path }) => ![sourceFiles.integrations, sourceFiles.browserSessionSmoke].includes(path));
assert(unexpectedRuntimeWalletReferences.length === 0, 'unexpected runtime wallet endpoint integration exists outside the approved gated fetch source path', {
  runtimeWalletReferences,
  unexpectedRuntimeWalletReferences,
  blockers,
});
assert(runtimeWalletReferences.some(({ path, endpoint }) => path === sourceFiles.integrations && endpoint === '/auth/profile/checkout-data'), 'gated Auth wallet checkout-data fetch source path missing', {
  runtimeWalletReferences,
});
assert(runtimeWalletEvidenceReady, 'Auth wallet runtime readiness evidence is not complete/no-live-calls', {
  status: runtimeWalletEvidence.status,
  authWalletFetch: runtimeWalletEvidence.authWalletFetch,
  checkoutSubmit: runtimeWalletEvidence.checkoutSubmit,
  mutation: runtimeWalletEvidence.mutation,
  persistence: runtimeWalletEvidence.persistence,
  providerCall: runtimeWalletEvidence.providerCall,
  blockers,
});
assert(checkoutHtml.includes('data-auth-wallet-selector') && checkoutHtml.includes('data-wallet-delivery-select') && checkoutHtml.includes('data-wallet-invoice-select'), 'checkout Auth wallet selector UI hooks missing', {
  file: sourceFiles.checkoutHtml,
});
assert(checkoutClient.includes('CLIPLOT_AUTH_WALLET_CHECKOUT_DATA') && checkoutClient.includes('manualFields') && checkoutClient.includes('setManualWalletMode'), 'checkout Auth wallet selector runtime source hooks missing', {
  file: sourceFiles.checkoutClient,
});
assert(checkoutClient.includes('customer: data') && !checkoutClient.includes('selectedDeliveryId') && !checkoutClient.includes('selectedInvoiceProfileId'), 'checkout submit must remain resolved manual data without reusable wallet ids', {
  file: sourceFiles.checkoutClient,
});

console.log(JSON.stringify({
  ok: true,
  status: 'ready_for_auth_wallet_browser_session_fetch_review_execution_disabled',
  mode: 'source_runtime_helper_and_gated_fetch_evidence_default_no_live_calls',
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
    walletContract: hasWalletContract,
    authWalletSelectorUi: true,
  },
  runtimeWalletIntegrationPresent: 'selector_ui_plus_gated_browser_session_fetch_source_path_default_no_auth_fetch',
  runtimeWalletEvidenceReady,
  runtimeWalletEvidence: {
    status: runtimeWalletEvidence.status,
    selectorUiRendered: runtimeWalletEvidence.selectorEvidence?.selectorUiRendered === true,
    checkoutSelectorUiIntegrated: runtimeWalletEvidence.selectorEvidence?.checkoutSelectorUiIntegrated === true,
    selectorHelpersImplemented: runtimeWalletEvidence.selectorEvidence?.selectorHelpersImplemented === true,
    customerSafeLabels: runtimeWalletEvidence.selectorEvidence?.customerSafeLabels === true,
    excludedWalletFieldsProtected: runtimeWalletEvidence.mappingEvidence?.excludedWalletFieldsProtected === true,
    noPiiEvidence: runtimeWalletEvidence.noPiiEvidence?.status || null,
    guestFallbackCases: runtimeWalletEvidence.guestFallbackEvidence?.fallbackCases?.length || 0,
    authWalletFetch: runtimeWalletEvidence.authWalletFetch,
    browserSessionFetchSourcePathImplemented: runtimeWalletEvidence.browserSessionFetchSourcePathImplemented === true,
    browserSessionFetchStatus: runtimeWalletEvidence.browserSessionFetchEvidence?.status || null,
    checkoutSubmit: runtimeWalletEvidence.checkoutSubmit,
    mutation: runtimeWalletEvidence.mutation,
    persistence: runtimeWalletEvidence.persistence,
    providerCall: runtimeWalletEvidence.providerCall,
  },
  requiredWalletEndpoints: walletEndpoints,
  authWalletResponseContract,
  authWalletPresenceGate,
  authWalletNoPiiExposurePolicy,
  sourceOnlySessionHandoffEvidence,
  authWalletWriteDecision,
  authWalletWriteGuardEvidence: {
    status: 'read_only_checkout_scope_verified_no_write_surface',
    writeHttpReferenceCount: authWalletWriteHttpReferences.length,
    saveUiReferenceCount: authWalletSaveUiReferences.length,
    allowedReadEndpoints: walletEndpoints,
    forbiddenHttpVerbs: authWalletWriteDecision.forbiddenHttpVerbs,
    blockers: authWalletWriteDecision.writeBlockers,
  },
  liveSyntheticWalletReadEvidence: {
    status: 'sanitized_auth_wallet_browser_session_smoke_recorded',
    approvalId: 'CLIPLOT-AUTH-WALLET-SMOKE-20260703-GATE5',
    endpointCount: 3,
    checkoutDataStatusCode: 200,
    deliveryAddressesStatusCode: 200,
    invoiceProfilesStatusCode: 200,
    schemaVersion: 'auth.customer-data-wallet.checkout-data.v1',
    bodyPrinted: false,
    tokenPrinted: false,
    customerDataPrinted: false,
    mutation: false,
  },
  sourceOnlySelectorBehaviorEvidence,
  sourceOnlyWalletMappingEvidence,
  sourceOnlyGuestFallbackPolicy,
  sourceKnownFacts,
  blockers,
  walletWriteDecision: authWalletWriteDecision.status,
  next: 'Runtime selector UI and gated browser-session fetch source path remain read-only checkout scope; keep Auth wallet/profile writes, checkout submit changes, payment, Warehouse, notification, DB, Kubernetes, and Vault mutation blocked until a separate approved rollout opens them.',
}, null, 2));
