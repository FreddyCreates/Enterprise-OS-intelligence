#!/usr/bin/env node
/**
 * verify-checksums.mjs — fail-closed checksum verification of the deployed
 * release zips against /releases/CHECKSUMS.sha256.
 *
 * Runs after the journal site is built. If any zip's SHA-256 does not match
 * the recorded checksum, the build fails. The journal does not publish
 * downloads it cannot prove.
 */

import fs     from 'node:fs';
import path   from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL   = path.resolve(__dirname, '..');
const ROOT      = path.resolve(JOURNAL, '..');
const RELEASES  = path.join(ROOT, 'releases');
const CHKFILE   = path.join(RELEASES, 'CHECKSUMS.sha256');
const DIST_REL  = path.join(JOURNAL, 'dist', 'releases');

if (!fs.existsSync(CHKFILE)) {
  console.error(`✗ checksum file not found: ${CHKFILE}`);
  process.exit(1);
}

const expected = new Map();
for (const line of fs.readFileSync(CHKFILE, 'utf8').split('\n')) {
  const m = line.trim().match(/^([a-f0-9]{64})\s+(.+)$/i);
  if (m) expected.set(m[2], m[1].toLowerCase());
}

function sha256(filepath) {
  const buf = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

let failed = 0;
for (const [name, want] of expected.entries()) {
  const distPath = path.join(DIST_REL, name);
  if (!fs.existsSync(distPath)) {
    console.error(`✗ missing in dist/releases: ${name}`);
    failed++;
    continue;
  }
  const got = sha256(distPath);
  if (got !== want) {
    console.error(`✗ CHECKSUM MISMATCH ${name}`);
    console.error(`    expected: ${want}`);
    console.error(`    actual:   ${got}`);
    failed++;
  } else {
    console.log(`  ✓ ${name} sha256 verified`);
  }
}

if (failed > 0) {
  console.error(`\n✗ ${failed} checksum failure(s) — build cannot publish.`);
  process.exit(1);
}

console.log(`\n✓ all ${expected.size} release artifacts verified.`);
