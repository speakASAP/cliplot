#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_NOTIFICATION_SEND_APPROVAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/notifications/send-approval-evidence-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'notification send approval evidence packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'notification send approval evidence request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'ready_for_owner_notification_send_approval_metadata', 'notification send approval evidence is not ready', packet);
assert(packet.mode === 'read_only_notification_send_approval_evidence_packet', 'notification send evidence mode changed', packet);
assert(packet.mutation === false, 'notification evidence reported mutation', packet);
assert(packet.persistence === false, 'notification evidence reported persistence', packet);
assert(packet.providerCall === false, 'notification evidence reported provider call', packet);
assert(packet.notificationSent === false, 'notification evidence reported send', packet);
assert(packet.liveNotifications === false, 'live notifications unexpectedly enabled', packet);
assert(packet.notificationApprovalPresent === false, 'notification approval metadata should remain absent before owner acceptance', packet);
assert(packet.requiredApprovalId === 'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID', 'notification approval id placeholder missing', packet);
assert(packet.approvalIdMayBeRecordedAfterOwnerAcceptance === true, 'owner notification approval metadata readiness missing', packet);
assert(packet.catalog?.approvedCliplotSkuScope === true, 'approved Cliplot SKU scope missing', packet);
assert(packet.catalog?.catalogSource === 'catalog', 'Catalog source evidence missing', packet);
assert(packet.catalog?.warehouseBackedProductCount > 0, 'Warehouse-backed product evidence missing', packet);
assert(packet.notificationContract?.endpoint === '/notifications/validate', 'notification validate endpoint missing', packet);
assert(packet.notificationContract?.liveEndpoint === '/notifications/send', 'notification live send endpoint missing', packet);
assert(packet.notificationContract?.channel === 'email', 'notification channel mismatch', packet);
assert(packet.notificationContract?.type === 'order_confirmation', 'notification type mismatch', packet);
assert(packet.notificationContract?.service === 'cliplot', 'notification service mismatch', packet);
assert(packet.notificationContract?.purpose === 'transactional', 'notification purpose mismatch', packet);
assert(packet.notificationContract?.recipientDomain, 'recipient domain evidence missing', packet);
assert(packet.notificationContract?.subjectFingerprint, 'subject fingerprint missing', packet);
assert(packet.notificationContract?.messageFingerprint, 'message fingerprint missing', packet);
assert(packet.notificationContract?.templateDataFingerprint, 'template data fingerprint missing', packet);
assert(packet.notificationContract?.idempotencyKeyFingerprint, 'idempotency key fingerprint missing', packet);
assert(packet.notificationContract?.mutation === false, 'notification contract reports mutation', packet);
assert(packet.notificationContract?.providerCall === false, 'notification contract reports provider call', packet);
assert(packet.notificationContract?.notificationSent === false, 'notification contract reports send', packet);
assert(packet.validation?.status === 'validated_no_send', 'Notifications validate status missing', packet);
assert(packet.validation?.mutation === false, 'Notifications validate reported mutation', packet);
assert(packet.validation?.notificationSent === false, 'Notifications validate reported send', packet);
assert(packet.validation?.providerCall === false, 'Notifications validate reported provider call', packet);
assert(packet.requiredBeforeLiveNotificationSend?.includes('separate bounded live notification execution window before ENABLE_LIVE_NOTIFICATIONS=true'), 'bounded notification execution requirement missing', packet);
assert(packet.mustRemainFalseUntilApprovedWindow?.includes('ENABLE_LIVE_NOTIFICATIONS'), 'live notification guard missing', packet);
assert(packet.forbiddenOperations?.includes('POST /notifications/send'), 'live notification send forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('send notification'), 'send notification forbidden operation missing', packet);
assert(packet.satisfiedEvidence?.some((item) => item.includes('Notifications validate accepted Cliplot order confirmation payload')), 'notification validate satisfied evidence missing', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'notification send evidence blockers should be empty', packet);
assert(packet.sensitiveDataPolicy?.includes('no raw recipient email'), 'recipient PII policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  validation: packet.validation.status,
  liveNotifications: packet.liveNotifications,
  notificationApprovalPresent: packet.notificationApprovalPresent,
  approvalReady: packet.approvalIdMayBeRecordedAfterOwnerAcceptance,
  channel: packet.notificationContract.channel,
  type: packet.notificationContract.type,
  purpose: packet.notificationContract.purpose,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
  notificationSent: packet.notificationSent,
}, null, 2));
