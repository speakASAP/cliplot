#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CREATE_APPROVAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/create-approval-evidence-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment create approval evidence packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'payment create approval evidence request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(['ready_for_owner_payment_create_approval_metadata', 'approved_payment_create_metadata_execution_disabled'].includes(packet.status), 'payment create approval evidence is not ready', packet);
assert(packet.mode === 'read_only_payment_create_approval_evidence_packet', 'payment create evidence mode changed', packet);
assert(packet.mutation === false, 'payment create evidence reported mutation', packet);
assert(packet.persistence === false, 'payment create evidence reported persistence', packet);
assert(packet.providerCall === false, 'payment create evidence reported provider call', packet);
assert(packet.livePaymentCreate === false, 'live payment create unexpectedly enabled', packet);
assert(typeof packet.paymentApprovalPresent === 'boolean', 'payment approval metadata presence missing', packet);
assert(packet.requiredApprovalId === 'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID', 'payment approval id placeholder missing', packet);
assert(packet.approvalIdMayBeRecordedAfterOwnerAcceptance === true, 'owner payment approval metadata readiness missing', packet);
assert(packet.liveExecutionAllowed !== true, 'payment metadata approval allowed live execution', packet);
assert(packet.catalog?.approvedCliplotSkuScope === true, 'approved Cliplot SKU scope missing', packet);
assert(packet.catalog?.catalogSource === 'catalog', 'Catalog source evidence missing', packet);
assert(packet.catalog?.warehouseBackedProductCount > 0, 'Warehouse-backed product evidence missing', packet);
assert(packet.paymentCreateContract?.endpoint === '/payments/validate-create', 'validate-create endpoint missing', packet);
assert(packet.paymentCreateContract?.liveEndpoint === '/payments/create', 'live create endpoint missing', packet);
assert(packet.paymentCreateContract?.applicationId === 'cliplot', 'application id changed', packet);
assert(packet.paymentCreateContract?.paymentMethod === 'invoice', 'payment method changed', packet);
assert(packet.paymentCreateContract?.callbackOrigin === 'https://cliplot.alfares.cz', 'callback origin not allowlisted evidence', packet);
assert(packet.paymentCreateContract?.successOrigin === 'https://cliplot.alfares.cz', 'success origin not allowlisted evidence', packet);
assert(packet.paymentCreateContract?.cancelOrigin === 'https://cliplot.alfares.cz', 'cancel origin not allowlisted evidence', packet);
assert(packet.paymentCreateContract?.idempotencyKeyFingerprint, 'idempotency key fingerprint missing', packet);
assert(packet.paymentCreateContract?.payloadFingerprint, 'payload fingerprint missing', packet);
assert(packet.paymentCreateContract?.mutation === false, 'payment create contract reports mutation', packet);
assert(packet.paymentCreateContract?.providerCall === false, 'payment create contract reports provider call', packet);
assert(packet.validation?.status === 'validated_no_mutation', 'Payments validate-create status missing', packet);
assert(packet.validation?.valid === true, 'Payments validate-create valid=true missing', packet);
assert(packet.validation?.applicationId === 'cliplot', 'Payments validate-create application id mismatch', packet);
assert(packet.validation?.orderIdPresent === true, 'Payments validate-create order id missing', packet);
assert(packet.validation?.amount > 0, 'Payments validate-create amount missing', packet);
assert(packet.validation?.currency === 'CZK', 'Payments validate-create currency mismatch', packet);
assert(packet.validation?.paymentMethod === 'invoice', 'Payments validate-create payment method mismatch', packet);
assert(packet.validation?.callbackOrigin === 'https://cliplot.alfares.cz', 'Payments validate-create callback origin mismatch', packet);
assert(packet.validation?.successOrigin === 'https://cliplot.alfares.cz', 'Payments validate-create success origin mismatch', packet);
assert(packet.validation?.cancelOrigin === 'https://cliplot.alfares.cz', 'Payments validate-create cancel origin mismatch', packet);
assert(packet.validation?.mutation === false, 'Payments validate-create reported mutation', packet);
assert(packet.validation?.providerCall === false, 'Payments validate-create reported provider call', packet);
assert(packet.requiredBeforeLivePaymentCreate?.includes('separate bounded live payment execution window before ENABLE_LIVE_PAYMENT_CREATE=true'), 'bounded payment execution requirement missing', packet);
assert(packet.mustRemainFalseUntilApprovedWindow?.includes('ENABLE_LIVE_PAYMENT_CREATE'), 'live payment create guard missing', packet);
assert(packet.mustRemainFalseUntilApprovedWindow?.includes('provider-backed /payments/{paymentId} reads'), 'provider-backed read guard missing', packet);
assert(packet.forbiddenOperations?.includes('POST /payments/create'), 'live payment create forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('call payment provider'), 'provider call forbidden operation missing', packet);
assert(packet.satisfiedEvidence?.some((item) => item.includes('Payments validate-create accepted valid Cliplot payment payload')), 'validate-create satisfied evidence missing', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'payment create evidence blockers should be empty', packet);
assert(packet.sensitiveDataPolicy?.includes('no PAYMENT_API_KEY value'), 'secret policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  validation: packet.validation.status,
  valid: packet.validation.valid,
  livePaymentCreate: packet.livePaymentCreate,
  paymentApprovalPresent: packet.paymentApprovalPresent,
  approvalMetadataRecorded: packet.approvalMetadataRecorded,
  liveExecutionAllowed: packet.liveExecutionAllowed,
  approvalReady: packet.approvalIdMayBeRecordedAfterOwnerAcceptance,
  applicationId: packet.paymentCreateContract.applicationId,
  paymentMethod: packet.paymentCreateContract.paymentMethod,
  amount: packet.paymentCreateContract.amount,
  callbackOrigin: packet.paymentCreateContract.callbackOrigin,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));
