#!/usr/bin/env node
/**
 * LUMEN — The Light.
 *
 * Latin: lumen — light.
 * Role:   Illuminate the connections between papers. For each paper, find:
 *           • Related by content (top-K cosine on SCRIBA vectors)
 *           • Cited by name in this paper (regex: "Paper XXI", "see XXIV",
 *             plus Latin paper titles like AURUM, STIGMERGY, etc.)
 *           • In the same thread (TRACE / VERIFY / REMEMBER)
 *
 * Doctrine: LUMEN's edges are computed from real text. No fabricated edges.
 * The "related by content" edges are sourced (you can see WHY two papers
 * link by reading both). The "cited" edges are explicit references in the
 * source text. The thread edges come from the plan-pinned classification.
 *
 * Output: journal/src/data/paper-graph.json
 */

import fs   from 'node:fs';
import path from 'node:path';
import { loadPapers, tokenize, termFreq, cosine, c, bannerStart, bannerEnd, writeJson, DATA } from './_common.mjs';

const TOP_K_RELATED = 5;
const MIN_SIM       = 0.06;  // hide edges below this — keeps the graph honest

// ── Citation patterns ───────────────────────────────────────────────────────
//
// We scan each paper body for explicit references to other papers. Two shapes:
//
//   (a) "Paper XXI", "Paper IV", "Papers V and VIII"  — Roman-numeral form
//   (b) Bare Latin titles: AURUM, STIGMERGY, QUORUM, ANTE·MEDIUS·POST, etc.
//
// Pattern (b) must use exact paper TITLE matches to stay grounded. We don't
// guess — we only count references that match a known paper title.

const ROMAN_RE = /\bPapers?\s+([IVX]+(?:\s*(?:,|and|&)\s*[IVX]+)*)\b/g;

function expandRomanList(matchText) {
  return matchText
    .split(/\s*(?:,|and|&)\s*/g)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
}

function run() {
  bannerStart('LUMEN', 'lumen — the light', 'Maps the connections. Builds the paper graph.');

  // ── Load SCRIBA's index ──────────────────────────────────────────────────
  const indexPath = path.join(DATA, 'search-index.json');
  if (!fs.existsSync(indexPath)) {
    throw new Error('SCRIBA index not found — run SCRIBA before LUMEN.');
  }
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  // Convert each doc's sparse vec back to a Map<termIdx, weight> for cosine().
  const vectors = new Map();
  for (const d of index.docs) {
    const m = new Map();
    for (const [k, v] of Object.entries(d.vec)) m.set(Number(k), v);
    vectors.set(d.id, m);
  }

  // ── Reload paper bodies for citation extraction ──────────────────────────
  const papers = loadPapers();
  const byRoman = new Map();
  const byTitle = new Map();   // upper-case title → paper id
  for (const p of papers) {
    if (p.roman) byRoman.set(p.roman, p);
    // Use the paper's Latin title (first heading) for citation matching.
    if (p.title) {
      const norm = p.title.toUpperCase().replace(/[·.,]+/g, '').replace(/\s+/g, ' ').trim();
      byTitle.set(norm, p.id);
      // Also a single-word alias: e.g. "AURUM" from "AURUM"
      const firstWord = norm.split(/\s+/)[0];
      if (firstWord.length >= 4 && !byTitle.has(firstWord)) byTitle.set(firstWord, p.id);
    }
  }

  const edges = []; // {from, to, type, weight?}

  for (const p of papers) {
    // ── related-by-content (cosine over SCRIBA vectors) ───────────────────
    if (vectors.has(p.id)) {
      const me = vectors.get(p.id);
      const scored = [];
      for (const q of papers) {
        if (q.id === p.id) continue;
        if (!vectors.has(q.id)) continue;
        const s = cosine(me, vectors.get(q.id));
        if (s >= MIN_SIM) scored.push({ id: q.id, s });
      }
      scored.sort((a, b) => b.s - a.s);
      for (const r of scored.slice(0, TOP_K_RELATED)) {
        edges.push({ from: p.id, to: r.id, type: 'related', weight: +r.s.toFixed(3) });
      }
    }

    // ── cited (Roman-numeral references) ─────────────────────────────────
    const cited = new Set();
    let m;
    const body = p.body;

    ROMAN_RE.lastIndex = 0;
    while ((m = ROMAN_RE.exec(body))) {
      for (const num of expandRomanList(m[1])) {
        const target = byRoman.get(num);
        if (target && target.id !== p.id) cited.add(target.id);
      }
    }

    // ── cited (bare Latin title match) ────────────────────────────────────
    for (const [title, targetId] of byTitle) {
      if (targetId === p.id) continue;
      if (title.length < 5) continue;
      const re = new RegExp(`\\b${title.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`);
      if (re.test(body)) cited.add(targetId);
    }

    for (const to of cited) {
      edges.push({ from: p.id, to, type: 'cited' });
    }

    // ── same-thread edges ─────────────────────────────────────────────────
    if (Array.isArray(p.threads) && p.threads.length > 0) {
      for (const t of p.threads) {
        for (const q of papers) {
          if (q.id === p.id) continue;
          if (Array.isArray(q.threads) && q.threads.includes(t)) {
            edges.push({ from: p.id, to: q.id, type: 'thread', thread: t });
          }
        }
      }
    }
  }

  // Group edges by source paper for fast lookup by the journal pages.
  const byPaper = {};
  for (const p of papers) {
    byPaper[p.id] = { related: [], cited: [], thread: {} };
  }
  for (const e of edges) {
    const bucket = byPaper[e.from];
    if (!bucket) continue;
    if (e.type === 'related') {
      bucket.related.push({ id: e.to, weight: e.weight });
    } else if (e.type === 'cited') {
      if (!bucket.cited.includes(e.to)) bucket.cited.push(e.to);
    } else if (e.type === 'thread') {
      const arr = bucket.thread[e.thread] ?? (bucket.thread[e.thread] = []);
      if (!arr.includes(e.to)) arr.push(e.to);
    }
  }

  // Stats
  const totalRelated = edges.filter(e => e.type === 'related').length;
  const totalCited   = edges.filter(e => e.type === 'cited').length;
  const totalThread  = edges.filter(e => e.type === 'thread').length;

  // Lookup table: id → roman/title/subtitle for client-side rendering.
  const lookup = {};
  for (const p of papers) {
    lookup[p.id] = {
      roman:    p.roman,
      title:    p.title,
      subtitle: p.subtitle,
      layer:    p.layer,
      threads:  p.threads,
      arxiv:    p.arxiv ?? false,
    };
  }

  const out = {
    builtAt: new Date().toISOString(),
    stats: { related: totalRelated, cited: totalCited, thread: totalThread, papers: papers.length },
    lookup,
    byPaper,
  };

  const dest = writeJson('paper-graph.json', out);

  bannerEnd('LUMEN', [
    c.green(`✓ ${totalRelated} related-by-content edges (top ${TOP_K_RELATED} per paper, min sim ${MIN_SIM})`),
    c.green(`✓ ${totalCited} citation edges (explicit references)`),
    c.green(`✓ ${totalThread} thread edges (TRACE/VERIFY/REMEMBER classification)`),
    c.dim(`  wrote ${dest.replace(process.cwd() + '/', '')}`),
  ]);

  return { ok: true, edges: edges.length };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  try { run(); }
  catch (e) {
    console.error(c.red(`✗ LUMEN failed: ${e.message}`));
    process.exit(1);
  }
}

export default run;
