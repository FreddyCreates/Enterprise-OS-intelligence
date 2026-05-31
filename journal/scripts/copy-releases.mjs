#!/usr/bin/env node
/**
 * copy-releases.mjs — copy /releases/ into dist/releases/ after astro build.
 *
 * Keeps the zips out of the journal source tree (no binary tracking),
 * but ensures the deployed site serves them at /releases/*.zip.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL   = path.resolve(__dirname, '..');
const ROOT      = path.resolve(JOURNAL, '..');
const SRC       = path.join(ROOT,    'releases');
const DEST      = path.join(JOURNAL, 'dist', 'releases');

if (!fs.existsSync(SRC)) {
  console.error(`✗ source releases dir not found: ${SRC}`);
  process.exit(1);
}

fs.mkdirSync(DEST, { recursive: true });

for (const f of fs.readdirSync(SRC)) {
  const from = path.join(SRC,  f);
  const to   = path.join(DEST, f);
  fs.copyFileSync(from, to);
  console.log(`  ✓ ${f}`);
}

console.log(`✓ releases copied → dist/releases/`);
