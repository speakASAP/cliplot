#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const sourceFiles = {
  checkoutHtml: 'public/index.html',
  checkoutClient: 'public/app.js',
  integrations: 'src/integrations.js',
  server: 'src/server.js',
  walletContract: 'docs/auth-wallet-checkout-contract.md',
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
  authLiveRefreshCommit: 'Goal 10.42 Auth current Source Preflight live refresh',
  sourcePreflightHead: '548df583bff50057c79c4c6705e6a379f4d1b63b',
  deployedImageTag: '548df58-20260703051411',
  healthStatusCode: 200,
  unauthenticatedWalletStatusCode: 401,
  sendsAuthorizationHeader: false,
  sendsCookies: false,
  sendsRequestBody: false,
  printsResponseBody: false,
  readsDatabase: false,
  evidence: 'Auth coordinator Goal 10.42 runtime verifier passed after current Source Preflight live refresh; FlipFlop non-mutating post-deploy smoke also passed.',
};

const authWalletNoPiiExposurePolicy = {
  status: 'source_policy_defined',
  runtimeWalletCodePresent: false,
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

const blockers = [
  '[MISSING: owner approval for Cliplot checkout wallet selector behavior]',
  '[MISSING: authenticated browser session implementation and approved synthetic runtime evidence for wallet reads]',
  '[MISSING: no-PII logging/frontend exposure implementation evidence for future runtime wallet code]',
  '[MISSING: approved runtime Cliplot field mapping implementation from Auth wallet rows to checkout/order snapshots]',
  '[MISSING: approved Cliplot guest fallback implementation evidence when Auth wallet reads are unavailable]',
];

const sourceKnownFacts = [
  'Cliplot remains guest-checkout first: the checkout form collects name, email, phone, address, shipping, and payment fields.',
  'Checkout submit posts guest/customer form data to /api/checkout/submit and stores a browser-local last-checkout snapshot.',
  'Auth is currently only a hosted login/register link surface; no Auth wallet endpoint integration is present.',
  'Guarded checkout still returns service_identity_required before live order/payment/Warehouse mutation.',
  'Runtime manifests point at Auth but do not enable wallet integration.',
  'Auth source-defines checkout-data schemaVersion as auth.customer-data-wallet.checkout-data.v1.',
  'Auth source-defines checkout-data top-level fields, defaults fields, and sanitized delivery/invoice wallet row field names.',
  'Cliplot source-defines the no-PII wallet exposure policy; runtime wallet code is still absent and implementation evidence remains gated.',
  'Cliplot source-verifies pure Auth wallet row mapping into immutable checkout snapshots without wallet ids or Auth ownership fields.',
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
  'Status: source-only; dependency-gated',
  'Selector Behavior',
  'Authenticated Session Handoff',
  'PII And Logging Constraints',
  'Field Mapping',
  'Guest Fallback',
  'Default Auth entries may prefill the checkout only before the customer edits',
  'Manual edits must override wallet defaults for the current checkout snapshot',
  'Wallet reads must use a synthetic or real authenticated Auth bearer only in',
  'memory for the request window',
  'Do not log raw Auth wallet response bodies',
  'Do not persist reusable Auth wallet rows in Cliplot local storage',
  'Evidence may contain booleans, status codes, schema version, blocker labels',
  'Selector labels must avoid raw full address dumps',
  'Source-Only No-PII Evidence Policy',
  'Forbidden evidence',
  'future runtime wallet code',
  'Source-Only Wallet Mapping Acceptance Criteria',
  'Pure mapping helpers',
  'invoice recipient email is `email`',
  'Delivery address mapping to the checkout snapshot',
  'Invoice profile mapping to the checkout snapshot',
  'The checkout submit path remains `/api/checkout/submit` and must receive',
  'resolved immutable snapshots, not Auth wallet ids',
  'Runtime integration remains blocked until selector behavior, browser-session',
  'handling, no-PII implementation evidence, field mapping, and guest fallback',
]);
const runtimeWalletReferences = Object.values(sources)
  .filter(({ path }) => path !== sourceFiles.walletContract)
  .flatMap(({ path, contents }) => walletEndpoints
    .filter((endpoint) => contents.includes(endpoint))
    .map((endpoint) => ({ path, endpoint })));

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
    && authWalletNoPiiExposurePolicy.runtimeWalletCodePresent === false,
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
    walletContract: hasWalletContract,
  },
  runtimeWalletIntegrationPresent: false,
  requiredWalletEndpoints: walletEndpoints,
  authWalletResponseContract,
  authWalletPresenceGate,
  authWalletNoPiiExposurePolicy,
  sourceOnlyWalletMappingEvidence,
  sourceKnownFacts,
  blockers,
  next: 'Keep Cliplot checkout wallet integration blocked until selector behavior, browser session, runtime no-PII evidence, field mapping, and guest fallback approvals are available.',
}, null, 2));
