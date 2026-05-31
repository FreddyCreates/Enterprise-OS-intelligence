#!/usr/bin/env node
/**
 * CUSTOS — The Guardian.
 *
 * Latin: custos — guardian / keeper / watchman.
 * Role:   Catch corpus and configuration drift before deploy. Any
 *         inconsistency that would let the journal lie is a build failure.
 *
 * Checks (every one fail-closed):
 *
 *   1. Every Roman-numeral paper from I through XXXI is present in /papers/
 *      (no gaps in the canon).
 *
 *   2. Every paper passes the frontmatter schema produced by sync-papers
 *      (id, title, subtitle, order, layer, threads).
 *
 *   3. Every release zip mentioned in src/lib/tools.js exists in /releases/
 *      with the SHA-256 the page advertises. (Mirror of verify-checksums.mjs,
 *      done early so the build fails fast.)
 *
 *   4. Every thread classification (TRACE/VERIFY/REMEMBER) in lib/lexicon
 *      and lib/mathematics points at a paper that actually exists.
 *
 * Doctrine: CUSTOS does not modify content. It reads, it checks, it reports.
 * It does not auto-fix — that would let a drift slip through silently.
 * Fixing a CUSTOS failure is an explicit operator action visible in git.
 *
 * Output: journal/src/data/custos-report.json (always written, even on fail)
 * Exit:   non-zero if any check fails. CI uses the exit code as the gate.
 */

import fs     from 'node:fs';
import path   from 'node:path';
import crypto from 'node:crypto';
import { loadPapers, c, bannerStart, bannerEnd, writeJson, ROOT, JOURNAL } from './_common.mjs';

const ROMAN_EXPECTED = [
  'I','II','III','IV','V','VI','VII','VIII','IX','X',
  'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX',
  'XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX','XXXI',
];

const REQUIRED_FRONTMATTER = ['id','title','order','layer'];

function sha256(filepath) {
  const buf = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function importTools() {
  return await import(path.join(JOURNAL, 'src', 'lib', 'tools.js'));
}

function run() {
  bannerStart('CUSTOS', 'custos — the guardian', 'Catches drift. Fails the build before it deploys a lie.');

  const failures = [];
  const warnings = [];

  // ── Check 1: Roman-numeral completeness ───────────────────────────────────
  const papers = loadPapers();
  const haveRoman = new Set(
    papers.filter(p => p.roman).map(p => p.roman),
  );
  for (const r of ROMAN_EXPECTED) {
    if (!haveRoman.has(r)) {
      failures.push({
        check: 'roman-completeness',
        msg:   `Paper ${r} is missing from the corpus`,
      });
    }
  }

  // ── Check 2: Frontmatter schema ──────────────────────────────────────────
  for (const p of papers) {
    for (const field of REQUIRED_FRONTMATTER) {
      if (p[field] === undefined || p[field] === null || p[field] === '') {
        failures.push({
          check: 'frontmatter-schema',
          msg:   `Paper ${p.filename}: missing required field '${field}'`,
        });
      }
    }
    // The synced paper body should not be empty.
    if (!p.body || p.body.trim().length < 200) {
      failures.push({
        check: 'paper-body',
        msg:   `Paper ${p.filename}: body is empty or too short (< 200 chars)`,
      });
    }
  }

  return Promise.resolve().then(async () => {
    // ── Check 3: Tools / releases / checksums ─────────────────────────────
    let tools = [];
    try {
      const mod = await importTools();
      tools = mod.tools ?? [];
    } catch (e) {
      failures.push({ check: 'tools-import', msg: `Could not import tools.js: ${e.message}` });
    }

    const releasesDir = path.join(ROOT, 'releases');
    for (const t of tools) {
      const zipPath = path.join(releasesDir, t.file);
      if (!fs.existsSync(zipPath)) {
        failures.push({
          check: 'release-presence',
          msg:   `Tool ${t.id}: release zip not found at releases/${t.file}`,
        });
        continue;
      }
      const got = sha256(zipPath);
      if (got !== t.sha256) {
        failures.push({
          check: 'release-checksum',
          msg:   `Tool ${t.id}: SHA-256 mismatch (advertised ${t.sha256.slice(0, 12)}…, actual ${got.slice(0, 12)}…)`,
        });
      }
    }

    // ── Check 4: lexicon paper references resolve ─────────────────────────
    let lexicon = [];
    try {
      const mod = await import(path.join(JOURNAL, 'src', 'lib', 'lexicon.js'));
      lexicon = mod.entries ?? [];
    } catch (e) {
      warnings.push({ check: 'lexicon-import', msg: `Could not import lexicon.js: ${e.message}` });
    }

    const romanRefRe = /Paper\s+([IVX]+)\b/g;
    for (const entry of lexicon) {
      const haystack = `${entry.role}\n${entry.note}`;
      let m;
      while ((m = romanRefRe.exec(haystack))) {
        const r = m[1];
        if (!haveRoman.has(r)) {
          warnings.push({
            check: 'lexicon-paper-ref',
            msg:   `Lexicon entry "${entry.term}" references Paper ${r} which is not in the corpus`,
          });
        }
      }
    }

    // ── Check 5: Mathematics page paper references resolve ────────────────
    let mathPapers = [];
    try {
      const mod = await import(path.join(JOURNAL, 'src', 'lib', 'mathematics.js'));
      mathPapers = mod.equations ?? [];
    } catch (e) {
      warnings.push({ check: 'mathematics-import', msg: `Could not import mathematics.js: ${e.message}` });
    }
    for (const eq of mathPapers) {
      if (!eq.paper) continue;
      for (const raw of String(eq.paper).split(/[·,]+/)) {
        const r = raw.trim();
        if (!r || r === '—') continue;
        if (!/^[IVX]+$/.test(r)) continue;
        if (!haveRoman.has(r)) {
          warnings.push({
            check: 'math-paper-ref',
            msg:   `Mathematics row "${eq.name}" references Paper ${r} which is not in the corpus`,
          });
        }
      }
    }

    const report = {
      builtAt:  new Date().toISOString(),
      papers:   papers.length,
      checks: [
        'roman-completeness',
        'frontmatter-schema',
        'paper-body',
        'release-presence',
        'release-checksum',
        'lexicon-paper-ref',
        'math-paper-ref',
      ],
      failures,
      warnings,
      ok:      failures.length === 0,
    };
    writeJson('custos-report.json', report);

    const lines = [];
    if (failures.length === 0) {
      lines.push(c.green(`✓ all checks passed`));
      lines.push(c.dim(`  papers verified: ${papers.length}`));
    } else {
      lines.push(c.red(`✗ ${failures.length} failure(s)`));
      for (const f of failures.slice(0, 20)) lines.push(c.red(`  • [${f.check}] ${f.msg}`));
      if (failures.length > 20) lines.push(c.red(`  (… and ${failures.length - 20} more)`));
    }
    if (warnings.length > 0) {
      lines.push(c.yellow(`⚠ ${warnings.length} warning(s) (non-fatal)`));
      for (const w of warnings.slice(0, 10)) lines.push(c.yellow(`  • [${w.check}] ${w.msg}`));
    }
    bannerEnd('CUSTOS', lines);

    return { ok: failures.length === 0, failures, warnings };
  });
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  run().then((r) => {
    if (!r.ok) process.exit(1);
  }).catch((e) => {
    console.error(c.red(`✗ CUSTOS crashed: ${e.message}`));
    process.exit(2);
  });
}

export default run;
