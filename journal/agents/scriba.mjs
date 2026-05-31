#!/usr/bin/env node
/**
 * SCRIBA — The Scribe.
 *
 * Latin: scriba — one who writes / records / indexes.
 * Role:   Read every sanitised paper. Compute a TF-IDF vector per paper.
 *         Write a compact JSON index that the journal's /search/ page
 *         (and LUMEN) can consume.
 *
 * Determinism: SCRIBA runs over the synced /src/content/papers/ — its
 * output depends only on the corpus + this file. Same input, same output.
 *
 * Doctrine: SCRIBA produces metadata about sanitised content. It does not
 * generate text. It does not store visitor queries. It runs at build time
 * only. Source-linked by construction (every term in the index points at
 * paper IDs that resolve to /papers/<id>).
 *
 * Output: journal/src/data/search-index.json
 */

import { loadPapers, tokenize, termFreq, c, bannerStart, bannerEnd, writeJson } from './_common.mjs';

const MAX_TERMS_PER_DOC = 240;
const MIN_DF            = 1;
const MIN_TOKEN_LEN     = 3;

function run() {
  bannerStart('SCRIBA', 'scriba — the scribe', 'Indexes the canon. Builds the search backbone.');

  const papers = loadPapers();
  const N = papers.length;

  // ── Per-doc tokens + TF ───────────────────────────────────────────────────
  const docs = [];
  for (const p of papers) {
    const tokens = tokenize(p.title + '\n' + p.subtitle + '\n' + p.body);
    docs.push({
      id:       p.id,
      roman:    p.roman ?? null,
      title:    p.title,
      subtitle: p.subtitle,
      layer:    p.layer ?? null,
      threads:  p.threads ?? [],
      tokenCount: tokens.length,
      tf:       termFreq(tokens),
    });
  }

  // ── Document frequency ────────────────────────────────────────────────────
  const df = new Map();
  for (const d of docs) {
    for (const term of d.tf.keys()) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  // ── IDF & vocabulary ─────────────────────────────────────────────────────
  // idf(t) = ln( (N + 1) / (df + 1) ) + 1   (smoothed)
  const vocab = [];
  const idf   = {};
  for (const [term, count] of df) {
    if (count < MIN_DF) continue;
    if (term.length < MIN_TOKEN_LEN) continue;
    vocab.push(term);
    idf[term] = Math.log((N + 1) / (count + 1)) + 1;
  }
  vocab.sort();
  const termToIdx = new Map(vocab.map((t, i) => [t, i]));

  // ── Per-doc TF-IDF vector (sparse, top-N terms) ──────────────────────────
  const docVectors = docs.map((d) => {
    const max = d.tf.size > 0 ? Math.max(...d.tf.values()) : 1;
    const scored = [];
    for (const [term, tf] of d.tf) {
      const idfV = idf[term];
      if (idfV === undefined) continue;
      // Normalised tf-idf, augmented frequency (Salton-Buckley).
      const tfNorm = 0.5 + 0.5 * (tf / max);
      scored.push([term, tfNorm * idfV]);
    }
    scored.sort((a, b) => b[1] - a[1]);
    const top = scored.slice(0, MAX_TERMS_PER_DOC);

    // Cosine-normalise the kept vector.
    const norm = Math.sqrt(top.reduce((a, [, v]) => a + v * v, 0)) || 1;
    const sparse = {};
    for (const [t, v] of top) {
      sparse[termToIdx.get(t)] = +(v / norm).toFixed(6);
    }
    return {
      id:       d.id,
      roman:    d.roman,
      title:    d.title,
      subtitle: d.subtitle,
      layer:    d.layer,
      threads:  d.threads,
      vec:      sparse,
    };
  });

  // ── Emit ──────────────────────────────────────────────────────────────────
  // Index format:
  //   vocab: ["term", ...]                      (sorted)
  //   idf:   { term: number, ... }              (parallel to vocab; small)
  //   docs:  [ { id, roman, title, subtitle, layer, threads, vec }, ... ]
  //
  // Client uses `vocab` to map query tokens to indices, then sums idf-weighted
  // contributions against each doc.vec for ranking. Doc count is small enough
  // (~34) that the whole index ships compressed easily.
  const out = {
    builtAt: new Date().toISOString(),
    n:       N,
    vocabSize: vocab.length,
    vocab,
    idf,
    docs:    docVectors,
  };

  const dest = writeJson('search-index.json', out);

  bannerEnd('SCRIBA', [
    c.green(`✓ indexed ${N} papers`),
    c.dim(`  vocabulary: ${vocab.length} terms`),
    c.dim(`  per-doc keep: top ${MAX_TERMS_PER_DOC} by tf-idf`),
    c.dim(`  wrote ${dest.replace(process.cwd() + '/', '')}`),
  ]);

  return { ok: true, n: N, vocab: vocab.length, docs: docVectors };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  try { run(); }
  catch (e) {
    console.error(c.red(`✗ SCRIBA failed: ${e.message}`));
    process.exit(1);
  }
}

export default run;
