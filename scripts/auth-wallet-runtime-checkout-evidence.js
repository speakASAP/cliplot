#!/usr/bin/env node
import { authWalletRuntimeCheckoutEvidencePacket } from '../src/integrations.js';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const packet = await authWalletRuntimeCheckoutEvidencePacket();

assert(packet.success === true, 'auth wallet runtime checkout evidence packet failed', packet);
assert(packet.status === 'auth_wallet_runtime_checkout_evidence_recorded_no_live_calls', 'runtime checkout evidence status mismatch', packet);
assert(packet.mode === 'guarded_auth_wallet_runtime_checkout_evidence', 'runtime checkout evidence mode mismatch', packet);
assert(packet.mutation === false, 'runtime checkout evidence reports mutation', packet);
assert(packet.persistence === false, 'runtime checkout evidence reports persistence', packet);
assert(packet.providerCall === false, 'runtime checkout evidence reports provider call', packet);
assert(packet.authWalletFetch === false, 'runtime checkout evidence fetched Auth wallet data', packet);
assert(packet.authWalletMutation === false, 'runtime checkout evidence mutated Auth wallet data', packet);
assert(packet.checkoutSubmit === false, 'runtime checkout evidence submitted checkout', packet);
assert(packet.orderCreated === false, 'runtime checkout evidence created an order', packet);
assert(packet.paymentCreated === false, 'runtime checkout evidence created a payment', packet);
assert(packet.warehouseReserved === false, 'runtime checkout evidence reserved Warehouse stock', packet);
assert(packet.notificationSent === false, 'runtime checkout evidence sent notification', packet);
assert(packet.databaseMutation === false, 'runtime checkout evidence mutated database state', packet);
assert(packet.kubernetesMutation === false, 'runtime checkout evidence mutated Kubernetes', packet);
assert(packet.vaultMutation === false, 'runtime checkout evidence mutated Vault', packet);
assert(packet.liveExecutionAllowed === false, 'runtime checkout evidence allows live execution', packet);
assert(packet.browserSessionRead === false, 'runtime checkout evidence read browser session/token contents', packet);
assert(packet.selectorEvidence?.selectorHelpersImplemented === true, 'selector helpers missing', packet);
assert(packet.selectorEvidence?.defaultPrefillBeforeManualEdit === true, 'default prefill behavior missing', packet);
assert(packet.selectorEvidence?.manualEditWins === true, 'manual override behavior missing', packet);
assert(packet.selectorEvidence?.manualGuestFallbackAvailable === true, 'manual guest fallback missing', packet);
assert(packet.selectorEvidence?.manualFallbackClearsWalletReferences === true, 'manual fallback does not clear wallet references', packet);
assert(packet.selectorEvidence?.customerSafeLabels === true, 'selector labels are not customer safe', packet);
assert(packet.selectorEvidence?.rawFullAddressDump === false, 'selector label exposes raw address dump', packet);
assert(packet.selectorEvidence?.walletIdOutput === false, 'selector label exposes wallet id', packet);
assert(packet.selectorEvidence?.authSubjectOutput === false, 'selector label exposes Auth subject', packet);
assert(packet.mappingEvidence?.excludedWalletFieldsProtected === true, 'wallet/system fields are present in checkout snapshots', packet);
assert(packet.mappingEvidence?.walletReferenceSubmitted === false, 'mapping submits wallet references', packet);
assert(packet.mappingEvidence?.authOwnershipFieldSubmitted === false, 'mapping submits Auth ownership fields', packet);
assert(packet.mappingEvidence?.invoiceRecipientEmailField === 'email', 'invoice recipient email mapping changed', packet);
assert(Array.isArray(packet.mappingEvidence?.rejectedInvoiceEmailAliases) && packet.mappingEvidence.rejectedInvoiceEmailAliases.includes('invoiceEmail'), 'legacy invoice email alias guard missing', packet);
assert(packet.noPiiEvidence?.sanitizedEvidenceOnly === true, 'no-PII evidence not sanitized', packet);
assert(packet.noPiiEvidence?.rawWalletBodyPrinted === false, 'raw wallet body printed', packet);
assert(packet.noPiiEvidence?.tokenPrinted === false, 'token printed', packet);
assert(packet.noPiiEvidence?.cookiePrinted === false, 'cookie printed', packet);
assert(packet.noPiiEvidence?.customerPiiPrinted === false, 'customer PII printed', packet);
assert(packet.noPiiEvidence?.browserLocalStorageWalletRows === false, 'wallet rows persisted in browser local storage', packet);
assert(packet.noPiiEvidence?.checkoutSubmitPathChanged === false, 'checkout submit path changed', packet);
assert(packet.noPiiEvidence?.forbiddenFixtureValueOutput === true, 'forbidden fixture value reached evidence output', packet);
assert(packet.guestFallbackEvidence?.checkoutSubmitPath === '/api/checkout/submit', 'checkout submit path mismatch', packet);
assert(Array.isArray(packet.guestFallbackEvidence?.fallbackCases) && packet.guestFallbackEvidence.fallbackCases.length === 6, 'guest fallback cases incomplete', packet);
assert(packet.guestFallbackEvidence.fallbackCases.every((item) => item.manualCheckoutAvailable === true && item.cartPreserved === true && item.checkoutSubmit === false && item.authWalletMutation === false), 'guest fallback case violates manual/cart/no-mutation policy', packet);
assert(Array.isArray(packet.executionBlockers) && packet.executionBlockers.length === 0, 'runtime checkout evidence has execution blockers', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of [
  'Bearer ',
  'eyJ',
  'cookie=',
  'password=',
  'secret=',
  'NOT_OUTPUT',
  'delivery-not-output',
  'invoice-not-output',
  'legacy-invoice-not-output',
  'legacy-electronic-not-output',
  'delivery-row-not-output',
  'invoice-row-not-output',
  'user-not-output',
]) {
  assert(!serialized.includes(forbidden), `sensitive or fixture marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  status: packet.status,
  mode: packet.mode,
  selectorHelpersImplemented: packet.selectorEvidence.selectorHelpersImplemented,
  customerSafeLabels: packet.selectorEvidence.customerSafeLabels,
  excludedWalletFieldsProtected: packet.mappingEvidence.excludedWalletFieldsProtected,
  noPiiEvidence: packet.noPiiEvidence.status,
  guestFallbackCases: packet.guestFallbackEvidence.fallbackCases.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
  authWalletFetch: packet.authWalletFetch,
  checkoutSubmit: packet.checkoutSubmit,
}, null, 2));
