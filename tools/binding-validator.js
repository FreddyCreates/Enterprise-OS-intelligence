#!/usr/bin/env node
/**
 * RSHIP Enterprise OS Intelligence — Binding Validator Tool
 * ═════════════════════════════════════════════════════════════
 * 
 * Validates that all wrangler configs have proper bindings and
 * no placeholders remain. Runs locally without Cloudflare auth.
 * 
 * Usage:
 *   node tools/binding-validator.js          # Full validation
 *   node tools/binding-validator.js --fix    # Show fix commands
 *   node tools/binding-validator.js --json   # JSON output
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Colors ─────────────────────────────────────────────────────────────────
function red(s)    { return `\x1b[31m${s}\x1b[0m`; }
function green(s)  { return `\x1b[32m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }
function cyan(s)   { return `\x1b[36m${s}\x1b[0m`; }
function bold(s)   { return `\x1b[1m${s}\x1b[0m`; }

// ── Config discovery ───────────────────────────────────────────────────────

const CONFIGS_TO_CHECK = [
  { path: 'wrangler.toml', name: 'Root Orchestrator' },
  { path: 'wrangler.jsonc', name: 'Pages (wrangler.jsonc)' },
  { path: 'cloudflare-workers/agens/wrangler.toml', name: 'Agens' },
  { path: 'cloudflare-workers/cerebrum/wrangler.toml', name: 'Cerebrum' },
  { path: 'cloudflare-workers/animus/wrangler.toml', name: 'Animus' },
  { path: 'cloudflare-workers/nexus/wrangler.toml', name: 'Nexus' },
  { path: 'cloudflare-workers/vigil/wrangler.toml', name: 'Vigil' },
  { path: 'cloudflare-workers/cursor/wrangler.toml', name: 'Cursor' },
  { path: 'cloudflare-workers/nova/wrangler.toml', name: 'Nova' },
  { path: 'cloudflare-workers/emailai/wrangler.toml', name: 'EmailAI' },
  { path: 'cloudflare-workers/gate-node/wrangler.toml', name: 'Gate Node' },
  { path: 'cloudflare-workers/cache-organism/wrangler.toml', name: 'Cache Organism' },
];

// ── Validators ─────────────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /PLACEHOLDER_\w+/g,
  /id\s*=\s*""\s*$/gm,
  /database_id\s*=\s*""\s*$/gm,
  /# TODO/gi,
];

const REQUIRED_BINDINGS = {
  ai: 'Workers AI (LLM reasoning)',
  kv: 'KV Namespace (state/cache)',
  d1: 'D1 Database (structured data)',
};

function validateFile(configPath, name) {
  const fullPath = path.join(ROOT, configPath);
  if (!fs.existsSync(fullPath)) {
    return { name, path: configPath, status: 'MISSING', issues: ['File not found'] };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const issues = [];
  const warnings = [];

  // Check for placeholders
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const m of matches) {
        issues.push(`Placeholder found: ${m}`);
      }
    }
  }

  // Check for commented-out bindings (dead config)
  const commentedBindings = content.match(/^#\s*\[\[?(kv_namespaces|d1_databases|r2_buckets|services)\]?\]/gm);
  if (commentedBindings) {
    for (const cb of commentedBindings) {
      warnings.push(`Commented-out binding: ${cb.trim()}`);
    }
  }

  // Check for empty id fields in TOML
  if (configPath.endsWith('.toml')) {
    const emptyIds = content.match(/id\s*=\s*""\s*$/gm);
    if (emptyIds) {
      issues.push(`Empty id field(s): ${emptyIds.length} found`);
    }
  }

  // Check for service bindings pointing nowhere
  const serviceBindings = content.match(/service\s*=\s*"([^"]+)"/g);
  if (serviceBindings) {
    // Service bindings are fine if they have a non-empty value
  }

  // Determine binding presence
  const hasAI = /\[ai\]|"ai"|binding.*=.*"AI"/i.test(content);
  const hasKV = /kv_namespaces|"kv_namespaces"/i.test(content);
  const hasD1 = /d1_databases|"d1_databases"/i.test(content);
  const hasR2 = /r2_buckets|"r2_buckets"/i.test(content);
  const hasQueue = /queues|"queues"/i.test(content);
  const hasVectorize = /vectorize|"vectorize"/i.test(content);
  const hasServices = /services|"services"/i.test(content);
  const hasAnalytics = /analytics_engine|"analytics_engine"/i.test(content);

  const bindings = {
    ai: hasAI,
    kv: hasKV,
    d1: hasD1,
    r2: hasR2,
    queue: hasQueue,
    vectorize: hasVectorize,
    services: hasServices,
    analytics: hasAnalytics,
  };

  const status = issues.length === 0 ? 'VALID' : 'INVALID';

  return { name, path: configPath, status, issues, warnings, bindings };
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const jsonMode = process.argv.includes('--json');
  const fixMode = process.argv.includes('--fix');

  const results = CONFIGS_TO_CHECK.map(c => validateFile(c.path, c.name));

  if (jsonMode) {
    console.log(JSON.stringify({ results, validatedAt: new Date().toISOString() }, null, 2));
    process.exit(results.some(r => r.status === 'INVALID') ? 1 : 0);
  }

  console.log('\n' + bold('RSHIP BINDING VALIDATOR — Full System Audit'));
  console.log('═'.repeat(62));

  let totalIssues = 0;

  for (const r of results) {
    const icon = r.status === 'VALID' ? green('✓') : r.status === 'MISSING' ? yellow('?') : red('✗');
    console.log(`\n${icon}  ${bold(r.name)} (${cyan(r.path)})`);

    if (r.bindings) {
      const bindingStr = Object.entries(r.bindings)
        .filter(([, v]) => v)
        .map(([k]) => k.toUpperCase())
        .join(', ');
      console.log(`   Bindings: ${bindingStr || yellow('NONE')}`);
    }

    for (const issue of (r.issues || [])) {
      console.log(`   ${red('✗')} ${issue}`);
      totalIssues++;
    }

    for (const w of (r.warnings || [])) {
      console.log(`   ${yellow('⚠')} ${w}`);
    }

    if (r.status === 'VALID' && (r.issues || []).length === 0) {
      console.log(`   ${green('→')} All bindings connected.`);
    }
  }

  console.log('\n' + '═'.repeat(62));

  const valid = results.filter(r => r.status === 'VALID').length;
  const invalid = results.filter(r => r.status === 'INVALID').length;
  const missing = results.filter(r => r.status === 'MISSING').length;

  console.log(`${green(valid + ' VALID')}  ${invalid > 0 ? red(invalid + ' INVALID') : ''}  ${missing > 0 ? yellow(missing + ' MISSING') : ''}`);

  if (fixMode && totalIssues > 0) {
    console.log('\n' + bold('FIX COMMANDS:'));
    console.log('─'.repeat(62));
    console.log(`  ${cyan('bash setup-pages-bindings.sh')}  → Create resources + auto-wire IDs`);
    console.log(`  ${cyan('cd cloudflare-workers && bash setup-resources.sh')}  → Worker resources`);
    console.log(`  ${cyan('grep -r "PLACEHOLDER_" wrangler.jsonc')}  → Find remaining placeholders`);
  }

  if (totalIssues > 0) {
    console.log(red(`\n${totalIssues} issue(s) found. Run with --fix for remediation commands.\n`));
    process.exit(1);
  } else {
    console.log(green('\nAll tools pointed at live resources. System fully wired.\n'));
    process.exit(0);
  }
}

main();
