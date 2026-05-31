#!/usr/bin/env node
/**
 * MAGISTER — The Teacher.
 *
 * Latin: magister — teacher / master of an art.
 * Role:   Read every paper. Find Latin / Greek terms used by the author
 *         that are not yet in the journal's lexicon. Report them as
 *         candidate lexicon entries for the operator (Alfredo) to either
 *         add or reject. Advisory, never fatal.
 *
 * Heuristic: a term counts as a candidate if EITHER
 *   (a) it is written in ALL-CAPS Latin form (≥ 4 letters, found via the
 *       "## TITLE" or bold-Latin convention used throughout the corpus); OR
 *   (b) it appears italicised in the body (e.g. *ante omnia*).
 *
 * MAGISTER then filters against the lexicon to find what's MISSING.
 *
 * Doctrine: MAGISTER never adds anything to the lexicon. It surfaces
 * candidates. The operator decides what enters the canon. Doctrine § 8.7
 * ("No AI-generated commentary on the papers") is honored: MAGISTER does
 * not invent definitions. It reports usage counts and source citations.
 *
 * Output: journal/src/data/magister-report.json
 *         (advisory only — never fails the build)
 */

import { loadPapers, c, bannerStart, bannerEnd, writeJson, JOURNAL } from './_common.mjs';
import path from 'node:path';

// All-caps Latin token rules:
//   - Length ≥ 4
//   - Letters only (basic Latin alphabet + maybe digraphs)
//   - Tokenised against the surrounding text
const ALLCAPS_RE = /\b([A-Z]{4,}(?:[ ·][A-Z]{2,}){0,4})\b/g;

// Italicised Latin: *word word word* up to ~4 words.
// Excludes plain English emphasis like *no* or *very*.
const ITALIC_RE  = /\*([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s]{3,40})\*/g;

// Words we never want to flag as Latin (common English caps + filler).
const STOPCAPS = new Set([
  // Filler
  'THE','AND','BUT','FOR','NOR','YET','SO','WITH','FROM','INTO','UPON',
  'NNS','SNS','ICP','SDK','HTML','HTTP','HTTPS','JSON','CSV','YAML','API',
  'AGI','AI','OS','TX','USA','PHI','SHA','UTC','EDT','PDT','WASM','HKDF',
  'AES','GCM','BLAKE','HMAC','PR','PDF','SVG','PNG','JPG','URL','CDN',
  'MCGR','RSHIP','ICX','CPL','CPP','CPX','CXL','PHX','PROT',
  // Series headers
  'SOVEREIGN INTELLIGENCE RESEARCH',
  // Vendor / proper nouns excluded by doctrine (papers reference them,
  // the journal's public lexicon does not):
  'DFINITY','PRIMORDIUM','MERIDIAN','ORO','EFFECTTRACE',
  // Pre-existing lexicon terms (the importer normalises both with and
  // without "·"; listing the dotted forms here belt-and-braces):
  'ANTE','MEDIUS','POST','ANTE·MEDIUS·POST',
]);

// Roman-numeral detector — used to drop "XXII", "XIII", "VIII" candidates
// from the report. Real Latin words won't collide with this pattern at
// length ≥ 4.
const ROMAN_NUMERAL_RE = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

async function loadLexicon() {
  const mod = await import(path.join(JOURNAL, 'src', 'lib', 'lexicon.js'));
  return new Set(
    (mod.entries ?? []).flatMap(e => {
      const parts = e.term.split(/\s*·\s*/);
      return [e.term.toUpperCase(), ...parts.map(p => p.trim().toUpperCase())];
    }),
  );
}

async function run() {
  bannerStart('MAGISTER', 'magister — the teacher', 'Surfaces Latin/Greek terms used in the papers but not yet in the lexicon.');

  const papers = loadPapers();
  const known  = await loadLexicon();

  // term → { count, sources: [ {paper, snippet} ] }
  const candidates = new Map();

  function bump(term, paperId, snippet) {
    const u = term.toUpperCase();
    if (u.length < 4) return;
    if (STOPCAPS.has(u)) return;
    if (known.has(u))   return;
    if (ROMAN_NUMERAL_RE.test(u)) return;
    if (!candidates.has(u)) candidates.set(u, { count: 0, sources: [] });
    const slot = candidates.get(u);
    slot.count++;
    if (slot.sources.length < 3) {
      slot.sources.push({ paper: paperId, snippet: snippet.slice(0, 120) });
    }
  }

  for (const p of papers) {
    let m;
    ALLCAPS_RE.lastIndex = 0;
    while ((m = ALLCAPS_RE.exec(p.body))) {
      // Snippet around match.
      const start = Math.max(0, m.index - 40);
      const end   = Math.min(p.body.length, m.index + m[0].length + 60);
      const snippet = p.body.slice(start, end).replace(/\s+/g, ' ').trim();
      // Skip if the entire match is inside a code fence (handled by tokenize
      // upstream); rough check here: surrounded by backticks.
      if (/`[^`]*$/.test(p.body.slice(0, m.index))) continue;
      bump(m[1], p.id, snippet);
    }

    ITALIC_RE.lastIndex = 0;
    while ((m = ITALIC_RE.exec(p.body))) {
      const phrase = m[1].trim();
      // Must look "Latin-ish": end in a, ae, us, um, is, e — coarse but useful.
      if (!/(?:a|ae|us|um|is|e|orum|arum|ius|ius|amus|atis|ant|ent|unt|os|as|i|o)\b/i.test(phrase)) continue;
      if (phrase.split(/\s+/).length > 4) continue;
      const start = Math.max(0, m.index - 40);
      const end   = Math.min(p.body.length, m.index + m[0].length + 60);
      const snippet = p.body.slice(start, end).replace(/\s+/g, ' ').trim();
      bump(phrase, p.id, snippet);
    }
  }

  // Rank: by count desc, then alpha.
  const ranked = [...candidates.entries()]
    .map(([term, info]) => ({ term, count: info.count, sources: info.sources }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));

  const out = {
    builtAt: new Date().toISOString(),
    papers:  papers.length,
    lexiconSize: known.size,
    candidates: ranked,
    note: 'MAGISTER is advisory. The lexicon is curated by Alfredo. These are surfaced candidates only, never auto-added.',
  };

  writeJson('magister-report.json', out);

  // Show top 8 in build output — enough to give a flavour, not enough to be noisy.
  const top = ranked.slice(0, 8);
  const lines = [];
  if (ranked.length === 0) {
    lines.push(c.green(`✓ no new candidate terms — lexicon is complete against the current corpus`));
  } else {
    lines.push(c.cyan(`◯ ${ranked.length} candidate term(s) found (advisory, build continues)`));
    for (const r of top) {
      lines.push(c.dim(`  • ${r.term.padEnd(22)} ×${r.count}  ${r.sources[0]?.paper ?? ''}`));
    }
    if (ranked.length > 8) lines.push(c.dim(`  (… and ${ranked.length - 8} more in magister-report.json)`));
  }
  bannerEnd('MAGISTER', lines);

  return { ok: true, candidates: ranked.length };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  run().catch((e) => {
    console.error(c.red(`✗ MAGISTER failed: ${e.message}`));
    process.exit(1);
  });
}

export default run;
