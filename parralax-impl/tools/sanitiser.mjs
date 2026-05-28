#!/usr/bin/env node
/**
 * MUNDATOR COGNITUS — finance-extended.
 *
 * Same two-pass design as journal/tools/doc-sanitizer.js, with additional
 * patterns specific to PARRALAX:
 *
 *   - Wallet addresses (EVM, Bitcoin, Solana, Cosmos, Tron, Algorand)
 *   - Exchange API keys (heuristic; known shapes for major venues)
 *   - Broker account identifiers
 *   - Mnemonic seed phrases (12 / 18 / 24 BIP-39 words)
 *
 * Files allowed to contain pattern instances (because they are templates,
 * not secrets):
 *
 *   - .env.example       (only with empty values; values are checked)
 *   - tests/(slash-star-star)/*.test.ts  (test fixtures may use placeholder addresses)
 *
 * Anywhere else, a match means the file fails sanitisation and the build
 * does not proceed.
 *
 * Usage:
 *   node tools/sanitiser.mjs <path>            # PASS 1 — detect + report
 *   node tools/sanitiser.mjs <path> --verify   # PASS 2 — strict, exit non-zero on any match
 */

import fs   from 'node:fs';
import path from 'node:path';

const VERIFY  = process.argv.includes('--verify');
const TARGETS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ROOTS   = TARGETS.length > 0 ? TARGETS : ['.'];

const c = {
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

// ── Patterns ────────────────────────────────────────────────────────────────
const PATTERNS = [
  {
    name: 'EVM_WALLET',
    re:   /\b0x[a-fA-F0-9]{40}\b/g,
    severity: 'high',
  },
  {
    name: 'BITCOIN_WALLET',
    re:   /\b(?:bc1[ac-hj-np-z02-9]{6,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g,
    severity: 'high',
  },
  {
    name: 'SOLANA_WALLET',
    // Solana addresses are base58, 32 bytes -> 43-44 chars. Heuristic.
    re:   /\b[1-9A-HJ-NP-Za-km-z]{43,44}\b/g,
    severity: 'medium',     // collides with some hashes; manual review on match
  },
  {
    name: 'COSMOS_WALLET',
    re:   /\bcosmos1[ac-hj-np-z02-9]{38}\b/g,
    severity: 'high',
  },
  {
    name: 'TRON_WALLET',
    re:   /\bT[A-HJ-NP-Za-km-z1-9]{33}\b/g,
    severity: 'medium',
  },
  {
    name: 'API_KEY_INLINE',
    // 'key' / 'secret' / 'token' / 'password' = "...32+ chars..."
    re:   /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{20,}['"]/gi,
    severity: 'high',
  },
  {
    name: 'PEM_KEY',
    re:   /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
    severity: 'high',
  },
  {
    name: 'MNEMONIC_PHRASE',
    // BIP-39 word lists are 12/18/24 words; this heuristic flags 12+
    // consecutive lowercase short words separated by single spaces.
    re:   /\b(?:[a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/g,
    severity: 'high',
  },
  {
    name: 'BINANCE_API_KEY',
    re:   /\b[A-Za-z0-9]{64}\b/g,
    severity: 'low',        // collides with sha256; manual review
  },
];

// ── Files that may contain template strings ────────────────────────────────
const ALLOWLIST = [
  /(?:^|\/)\.env\.example$/,
  /(?:^|\/)tests\/.+\.test\.ts$/,
  /(?:^|\/)tools\/sanitiser\.mjs$/,    // this file references the patterns
  /(?:^|\/)SECURITY\.md$/,             // documents the patterns
  /(?:^|\/)EXTRACTION\.md$/,           // mentions example commands
];

// ── Skip directories ────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.cache']);

// ── Walk ────────────────────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stat = fs.statSync(dir);
  if (stat.isFile()) return [dir];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

function isAllowlisted(rel) {
  return ALLOWLIST.some((re) => re.test(rel));
}

function isTextlikeFile(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  return [
    '.md', '.txt', '.json', '.yaml', '.yml', '.toml',
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.html', '.css', '.svg', '.xml',
    '.sh', '.bash', '.mo', '.rs', '.go', '.py',
    '.env', '.example', '.lock',
  ].includes(ext) || filepath.endsWith('.env.example');
}

function scanFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const findings = [];

  for (const p of PATTERNS) {
    // Reset regex state for global patterns.
    p.re.lastIndex = 0;
    const matches = content.match(new RegExp(p.re.source, p.re.flags)) ?? [];
    if (matches.length > 0) {
      findings.push({
        pattern:  p.name,
        severity: p.severity,
        count:    matches.length,
        sample:   matches[0].slice(0, 60),
      });
    }
  }

  // Special check for .env.example: file is allowed to mention KEY names,
  // but assignments must be either empty or one of the allowlisted
  // non-secret defaults (URLs, declared enums, relative paths).
  if (/(?:^|\/)\.env\.example$/.test(filepath)) {
    const offenders = [];
    for (const raw of content.split('\n')) {
      // Strip trailing inline comments (everything after '#' preceded by space).
      const noComment = raw.replace(/\s+#.*$/, '').trim();
      if (!noComment || noComment.startsWith('#')) continue;
      // Allow KEY= (empty value).
      if (/^[A-Z_][A-Z0-9_]*=$/.test(noComment)) continue;
      // Allow KEY=https?:// URL constants (non-secret defaults).
      if (/^[A-Z_][A-Z0-9_]*=https?:\/\//.test(noComment)) continue;
      // Allow a small enumerated set of known non-secret default values.
      if (/^[A-Z_][A-Z0-9_]*=(?:sqlite|local|d1|icp-public-gateway|yubikey|ledger|trezor)$/.test(noComment)) continue;
      // Allow relative-path defaults like ./chrono.db
      if (/^[A-Z_][A-Z0-9_]*=\.\//.test(noComment)) continue;
      offenders.push(noComment);
    }
    if (offenders.length > 0) {
      findings.push({
        pattern: 'ENV_EXAMPLE_VALUE_LEAK',
        severity: 'high',
        count: offenders.length,
        sample: offenders[0],
      });
    }
  }

  return findings;
}

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
  console.log('');
  console.log(c.bold(`MUNDATOR COGNITUS — finance-extended  (${VERIFY ? 'PASS 2 strict verify' : 'PASS 1 detect'})`));
  console.log(c.dim('─'.repeat(64)));

  const files = [];
  for (const root of ROOTS) {
    for (const f of walk(root)) {
      if (!isTextlikeFile(f)) continue;
      files.push(path.resolve(f));
    }
  }
  const cwd = process.cwd();

  let exitCode = 0;
  let scanned  = 0;
  let flagged  = 0;

  for (const file of files) {
    const rel = path.relative(cwd, file);
    if (isAllowlisted(rel)) {
      // Still run a stripped check on allowlisted files; only ENV_EXAMPLE_VALUE_LEAK
      // counts on .env.example.
      if (/(?:^|\/)\.env\.example$/.test(rel)) {
        const findings = scanFile(file).filter((f) => f.pattern === 'ENV_EXAMPLE_VALUE_LEAK');
        if (findings.length > 0) {
          flagged++;
          exitCode = 1;
          console.log(c.red(`✗ ${rel}`));
          for (const f of findings) {
            console.log(c.red(`    [${f.pattern}] ×${f.count} — sample: ${f.sample}`));
          }
        }
      }
      scanned++;
      continue;
    }
    scanned++;
    const findings = scanFile(file).filter((f) => f.severity !== 'low');   // low-severity = manual review only
    if (findings.length === 0) continue;
    flagged++;
    if (VERIFY) exitCode = 1;
    console.log(c.red(`✗ ${rel}`));
    for (const f of findings) {
      console.log(c.red(`    [${f.pattern}] severity=${f.severity} ×${f.count} — sample: ${f.sample}`));
    }
  }

  console.log(c.dim('─'.repeat(64)));
  console.log(`${c.green(scanned + ' scanned')}  ${flagged > 0 ? c.red(flagged + ' flagged') : c.green('0 flagged')}`);
  if (exitCode !== 0) {
    console.log(c.red('Sanitiser refused to validate. Remove the offending content before committing.'));
  } else {
    console.log(c.green('Clean.'));
  }
  process.exit(exitCode);
}

main();
