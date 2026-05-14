#!/usr/bin/env node
/**
 * ARBITER — The Judge.
 *
 * Latin: arbiter — judge, adjudicator, the one whose verdict settles.
 * Role:   Aggregate the council's output into a single manifest of the
 *         build. Record SHA-256 of every artefact, the sanitiser pass,
 *         CUSTOS verdict, and the precise input the build acted on.
 *         The manifest powers /audit/ — the journal's public CHRONO.
 *
 * Doctrine: ARBITER's manifest is the journal's tamper-evident history.
 * Every release deploys a new manifest. Hashes are computed on the actual
 * bytes of every file shipped. If a file changes silently, the hash
 * changes; the audit page shows it. Real, by construction.
 *
 * ARBITER runs LAST in the council. By the time it executes:
 *   • SCRIBA, LUMEN, CUSTOS, MAGISTER have all produced their JSONs
 *   • FABRICOR has written plain-text, OG cards, JSON API
 *   • NUNTIUS has written feeds, sitemap, robots.txt
 *
 * ARBITER reads everything it sees in journal/public/ and journal/src/data/
 * and builds an authoritative manifest.
 *
 * Output:
 *   journal/src/data/manifest.json   (consumed by /audit/ at build time)
 *   journal/public/manifest.json     (publicly fetchable by anyone)
 *
 * Exit code: 0 always — ARBITER reports; it does not gate. CUSTOS already
 * gated the build before ARBITER runs.
 */

import fs     from 'node:fs';
import path   from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

import { c, bannerStart, bannerEnd, writeJson, JOURNAL, DATA, ROOT } from './_common.mjs';

const PUBLIC = path.join(JOURNAL, 'public');

function sha256(filepath) {
  const buf = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// Recursively list files under a directory, returning {rel, abs, size, sha}.
function inventory(root, prefix = '') {
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const abs = path.join(root, entry.name);
    const rel = (prefix ? prefix + '/' : '') + entry.name;
    if (entry.isDirectory()) {
      out.push(...inventory(abs, rel));
    } else if (entry.isFile()) {
      // Skip the manifest itself (we're about to write it).
      if (rel.endsWith('manifest.json')) continue;
      out.push({
        rel,
        size: fs.statSync(abs).size,
        sha256: sha256(abs),
      });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

function safeGit(args) {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim();
  } catch { return null; }
}

function readOptional(file) {
  const full = path.join(DATA, file);
  if (!fs.existsSync(full)) return null;
  try { return JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch { return null; }
}

function run() {
  bannerStart('ARBITER', 'arbiter — the judge', 'Aggregates the council. Builds the manifest. Powers /audit/.');

  // ── 1. Read council outputs ───────────────────────────────────────────────
  const scriba   = readOptional('search-index.json');
  const lumen    = readOptional('paper-graph.json');
  const custos   = readOptional('custos-report.json');
  const magister = readOptional('magister-report.json');

  // ── 2. Inventory the public surface ──────────────────────────────────────
  // Public files = everything that will ship to dist/.
  const publicFiles = inventory(PUBLIC);

  // Group by surface for readability in /audit/.
  const groups = {
    feeds:    publicFiles.filter(f => /^(rss\.xml|feed\.xml|sitemap\.xml|robots\.txt)$/.test(f.rel)),
    og:       publicFiles.filter(f => f.rel.startsWith('og/')),
    txt:      publicFiles.filter(f => f.rel.startsWith('papers/') && f.rel.endsWith('.txt')),
    api:      publicFiles.filter(f => f.rel.startsWith('api/')),
    other:    publicFiles.filter(f =>
      !/^(rss\.xml|feed\.xml|sitemap\.xml|robots\.txt)$/.test(f.rel) &&
      !f.rel.startsWith('og/') &&
      !(f.rel.startsWith('papers/') && f.rel.endsWith('.txt')) &&
      !f.rel.startsWith('api/'),
    ),
  };

  // ── 3. Git context (for traceability) ────────────────────────────────────
  const git = {
    commit:  safeGit('rev-parse HEAD'),
    branch:  safeGit('rev-parse --abbrev-ref HEAD'),
    short:   safeGit('rev-parse --short=12 HEAD'),
    isDirty: safeGit('status --porcelain') !== '',
  };

  // ── 4. Council summary ───────────────────────────────────────────────────
  const councilSummary = {
    scriba: scriba ? {
      builtAt:    scriba.builtAt,
      papers:     scriba.n,
      vocabSize:  scriba.vocabSize,
    } : null,
    lumen: lumen ? {
      builtAt: lumen.builtAt,
      stats:   lumen.stats,
    } : null,
    custos: custos ? {
      builtAt:  custos.builtAt,
      ok:       custos.ok,
      failures: custos.failures?.length ?? 0,
      warnings: custos.warnings?.length ?? 0,
      checks:   custos.checks,
    } : null,
    magister: magister ? {
      builtAt:    magister.builtAt,
      candidates: magister.candidates?.length ?? 0,
      lexiconSize: magister.lexiconSize ?? null,
    } : null,
  };

  // ── 5. Compute aggregate hash of the entire public surface ───────────────
  const surfaceHash = crypto
    .createHash('sha256')
    .update(publicFiles.map(f => `${f.rel}:${f.sha256}`).join('\n'))
    .digest('hex');

  // ── 6. The manifest ──────────────────────────────────────────────────────
  const manifest = {
    builtAt:        new Date().toISOString(),
    journal:        {
      name: '@medina/journal',
      site: process.env.JOURNAL_SITE_URL || 'https://journal-medina.pages.dev',
    },
    git,
    council:        councilSummary,
    surfaceHash,
    counts: {
      feeds:  groups.feeds.length,
      og:     groups.og.length,
      txt:    groups.txt.length,
      api:    groups.api.length,
      other:  groups.other.length,
      total:  publicFiles.length,
    },
    sizes: {
      feeds: groups.feeds.reduce((s, f) => s + f.size, 0),
      og:    groups.og.reduce((s, f) => s + f.size, 0),
      txt:   groups.txt.reduce((s, f) => s + f.size, 0),
      api:   groups.api.reduce((s, f) => s + f.size, 0),
      other: groups.other.reduce((s, f) => s + f.size, 0),
    },
    files: {
      feeds: groups.feeds,
      og:    groups.og,
      txt:   groups.txt,
      api:   groups.api,
      other: groups.other,
    },
    doctrine: {
      sanitiser:    'Mundator Cognitus PASS 2 strict verify',
      gate:         'CUSTOS — fail-closed before astro build',
      authorship:   'Every paper authored by Alfredo Medina Hernandez. No AI-generated commentary.',
      data:         'No visitor data collected. No queries logged. Static index ships with the page.',
      priorArt:     'April 2026',
    },
  };

  // Write twice: once to src/data/ (for /audit/ at build time), once to
  // public/ (for any external consumer to fetch).
  writeJson('manifest.json', manifest);
  fs.writeFileSync(path.join(PUBLIC, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const lines = [
    c.green(`✓ manifest written for ${publicFiles.length} public artefact(s)`),
    c.dim(`  surface SHA-256: ${surfaceHash.slice(0, 16)}…`),
    c.dim(`  git: ${git.short || 'no-git'} (${git.branch || '?'})${git.isDirty ? ' [dirty]' : ''}`),
    c.dim(`  feeds: ${manifest.counts.feeds} · og: ${manifest.counts.og} · txt: ${manifest.counts.txt} · api: ${manifest.counts.api} · other: ${manifest.counts.other}`),
    c.dim(`  total bytes: ${(publicFiles.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1)} KB`),
  ];
  if (custos && !custos.ok) lines.push(c.red(`  ⚠ CUSTOS reported ${custos.failures.length} failure(s) — see custos-report.json`));
  bannerEnd('ARBITER', lines);

  return { ok: true };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  try { run(); }
  catch (e) {
    console.error(c.red(`✗ ARBITER failed: ${e.stack || e.message}`));
    process.exit(1);
  }
}

export default run;
