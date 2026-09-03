#!/usr/bin/env node
/**
 * Verifies the credential self-reporter wiring for this repo.
 *
 * Two things are checked, and the second is the one that matters:
 *
 *   1. The classification rule behaves per the contract. The shared module has
 *      its own tests; this re-asserts the three-way rule at the point of use,
 *      because collapsing `indeterminate` into `rejected` is the single failure
 *      that would make Phase 2 fire an alert for a receiver outage.
 *
 *   2. The vendored module is present in `dist/`. The nest-cli asset entry is
 *      easy to omit and nothing catches it: a source-resolving test suite passes
 *      either way, and the failure appears only as MODULE_NOT_FOUND in a running
 *      pod. So this requires the BUILT file, not the source one.
 *
 * Contract: monitoring-microservice/docs/CREDENTIAL_SELF_REPORT_CONTRACT.md
 * Plan:     auth-microservice/docs/SERVICE_CREDENTIAL_PROBER_PLAN.md (Task A)
 *
 * Usage: node scripts/verify-credential-self-report.js
 *        (run after `npm run build` for the dist check to be meaningful)
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const failures = [];

function check(name, fn) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`  FAIL  ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// --- 1. the vendored source exists and is CommonJS -------------------------

const vendorSource = path.join(root, 'src/vendor/credential-reporter.cjs');

check('vendored module present in src', () => {
  assert(fs.existsSync(vendorSource), `missing ${vendorSource}`);
});

check('vendored module is CommonJS, not ESM', () => {
  const text = fs.readFileSync(vendorSource, 'utf8');
  // `export` at the top level throws `Unexpected token 'export'` under
  // require() in NestJS's CJS build. shared/packages/consent is ESM; this
  // package deliberately is not.
  assert(!/^\s*export\s/m.test(text), 'contains a top-level `export` statement');
  assert(/module\.exports/.test(text), 'no module.exports found');
});

// --- 2. the classification rule ---------------------------------------------

const reporter = require(vendorSource);

check('2xx classifies accepted', () => {
  assert(reporter.classifyStatus(200) === 'accepted', '200 was not accepted');
  assert(reporter.classifyStatus(204) === 'accepted', '204 was not accepted');
});

check('401 and 403 classify rejected', () => {
  assert(reporter.classifyStatus(401) === 'rejected', '401 was not rejected');
  assert(reporter.classifyStatus(403) === 'rejected', '403 was not rejected');
});

check('everything else classifies indeterminate', () => {
  // A receiver being down is a health problem HealthWatcher already owns.
  // Reporting it as `rejected` would double-report one incident.
  for (const status of [404, 500, 502, 503, null, undefined]) {
    assert(
      reporter.classifyStatus(status) === 'indeterminate',
      `${status} was not indeterminate`,
    );
  }
});

check('expiry decodes without verifying, and refuses garbage', () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  const token = `x.${payload}.y`;
  assert(
    reporter.readTokenExpiry(token) === new Date(exp * 1000).toISOString(),
    'did not decode a well-formed exp',
  );
  // Never send a guess: an absent expiry reconciles as "not reported", but a
  // fabricated one is worse than nothing because Phase 2 may alert on it.
  assert(reporter.readTokenExpiry('not-a-jwt') === undefined, 'guessed at a malformed token');
  assert(reporter.readTokenExpiry('') === undefined, 'guessed at an empty token');
});

// --- 3. this repo's wiring ---------------------------------------------------

check('probes role-scoped routes, never /health', () => {
  const text = fs.readFileSync(path.join(root, 'src/credential-self-reporter.js'), 'utf8');
  assert(
    text.includes('/api/orders/customer/lifecycle'),
    'does not probe the customer lifecycle route',
  );
  // /health answers 200 with no credential at all, so a probe against it can
  // never fail - it would report `accepted` for an empty token.
  assert(!/url:.*\/api\/health/.test(text), 'probes /api/health, which cannot fail');
});

check('principal matches auth exactly', () => {
  const text = fs.readFileSync(path.join(root, 'src/credential-self-reporter.js'), 'utf8');
  for (const p of [
    'svc-cliplot--orders-microservice@internal.alfares.cz',
  ]) {
    // Accept either quote style: repos differ, and the string is what matters.
    assert(
      text.includes(`'${p}'`) || text.includes(`"${p}"`),
      `principal ${p} does not match the address auth lists`,
    );
  }
});

check('ingest token does not reuse NOTIFICATION_SERVICE_TOKEN', () => {
  const text = fs.readFileSync(path.join(root, 'src/credential-self-reporter.js'), 'utf8');
  // This service already sets NOTIFICATION_SERVICE_TOKEN to its
  // notifications-service credential, verified distinct from monitoring's
  // ingest value. Reusing the name would send the wrong token to the guard.
  assert(
    text.includes('CREDENTIAL_INGEST_TOKEN'),
    'does not read the ingest credential from CREDENTIAL_INGEST_TOKEN',
  );
  assert(
    !/process\.env\.NOTIFICATION_SERVICE_TOKEN/.test(text),
    'reads NOTIFICATION_SERVICE_TOKEN, which holds a different credential here',
  );
});

check('the ESM entry can load the CommonJS module', () => {
  // This package is "type": "module" and the shared reporter is CommonJS, so
  // the bridge is createRequire. A bare import would throw at boot.
  const text = fs.readFileSync(path.join(root, 'src/credential-self-reporter.js'), 'utf8');
  assert(text.includes('createRequire'), 'does not use createRequire to load the CJS module');
  assert(
    !/^\s*import .*vendor\/credential-reporter/m.test(text),
    'imports the CJS module directly, which throws under ESM',
  );
});

check('the vendored module ships (src is copied verbatim)', () => {
  // There is no build step: the Dockerfile copies src/ as-is, so the vendored
  // file reaches the image without a postbuild copy. Assert it is there.
  const p = path.join(root, 'src/vendor/credential-reporter.cjs');
  assert(fs.existsSync(p), `missing ${p}`);
  assert(typeof require(p).reportCredential === 'function', 'module does not export reportCredential');
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall credential self-report checks passed');
