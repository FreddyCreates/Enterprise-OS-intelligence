#!/usr/bin/env node
/**
 * sync-papers.mjs — bring sanitized papers into the journal's content collection.
 *
 * Source of truth: /papers/*.md and /papers/arxiv/*.md (canonical).
 * Destination:     journal/src/content/papers/*.md (gitignored, regenerated).
 *
 * For each paper:
 *   1. Read the canonical markdown.
 *   2. Parse the header (Roman numeral, Latin title, English subtitle, abstract).
 *   3. Emit a new file with Astro frontmatter prepended.
 *
 * The sanitizer is run separately (npm run verify) against the destination —
 * if any paper survived contains sensitive patterns, the build fails closed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL    = path.resolve(__dirname, '..');
const ROOT       = path.resolve(JOURNAL, '..');
const SRC_DIRS   = [
  path.join(ROOT, 'papers'),
  path.join(ROOT, 'papers', 'arxiv'),
];
const DEST       = path.join(JOURNAL, 'src', 'content', 'papers');

const ROMAN_ORDER = [
  'I','II','III','IV','V','VI','VII','VIII','IX','X',
  'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX',
  'XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX','XXXI',
];

function romanValue(r) {
  const idx = ROMAN_ORDER.indexOf(r);
  return idx === -1 ? 999 : idx + 1;
}

// Three-thread classification — pinned in the plan (v2 § 4 § II).
const THREADS = {
  TRACE:    new Set(['XX', 'IX', 'XXIII', 'XXV']),
  VERIFY:   new Set(['XXI', 'XXIV', 'XXX']),
  REMEMBER: new Set(['XXII', 'XVIII']),
};

// Layer classification.
const LAYERS = {
  Laws:      new Set(['V', 'VIII', 'XX', 'XXI', 'XXII', 'III', 'IV', 'IX']),
  Proposals: new Set(['X', 'XV']),
  Live:      new Set(['XXIII', 'XXIV', 'XXV', 'XXVI', 'XXIX', 'XXX', 'XXXI']),
};

function classifyLayer(roman) {
  if (LAYERS.Laws.has(roman))      return 'Laws';
  if (LAYERS.Proposals.has(roman)) return 'Proposals';
  if (LAYERS.Live.has(roman))      return 'Live';
  return 'Architecture';
}

function classifyThreads(roman) {
  const t = [];
  for (const [name, set] of Object.entries(THREADS)) {
    if (set.has(roman)) t.push(name);
  }
  return t;
}

function parsePaper(filepath) {
  const raw  = fs.readFileSync(filepath, 'utf8');
  const base = path.basename(filepath, '.md');

  // Roman numeral from filename prefix (e.g. "XXIV-ANTE-MEDIUS-POST" → "XXIV")
  // arxiv prefix is "CS-..." — those get an arxiv flag instead.
  let roman = null;
  let arxiv = false;
  const m = base.match(/^([IVX]+)-/);
  if (m) {
    roman = m[1];
  } else if (base.startsWith('CS-')) {
    arxiv = true;
  }

  const lines = raw.split('\n');
  const title    = (lines[0] || '').replace(/^#\s*/, '').trim();
  const subtitle = (lines[1] || '').replace(/^#+\s*/, '').trim();

  // Abstract: between "## Abstract" and next "##".
  let abstract = '';
  const absStart = lines.findIndex(l => /^##\s+Abstract/.test(l));
  if (absStart !== -1) {
    const abs = [];
    for (let i = absStart + 1; i < lines.length; i++) {
      if (/^##\s+/.test(lines[i])) break;
      abs.push(lines[i]);
    }
    abstract = abs.join('\n').trim();
  }

  // ID for URL: lowercase, hyphenated, no roman prefix variant.
  const id = base.toLowerCase();

  return {
    id,
    roman,
    arxiv,
    title,
    subtitle,
    abstract,
    body: raw,
    order: roman ? romanValue(roman) : 1000 + base.charCodeAt(0),
    layer: roman ? classifyLayer(roman) : 'ArXiv',
    threads: roman ? classifyThreads(roman) : [],
  };
}

function emit(paper) {
  const fm = {
    id:       paper.id,
    roman:    paper.roman,
    arxiv:    paper.arxiv,
    title:    paper.title,
    subtitle: paper.subtitle,
    order:    paper.order,
    layer:    paper.layer,
    threads:  paper.threads,
  };

  const yaml = [
    '---',
    Object.entries(fm).map(([k, v]) => {
      if (v === null || v === undefined) return `${k}: null`;
      if (Array.isArray(v)) return `${k}: [${v.map(x => JSON.stringify(x)).join(', ')}]`;
      if (typeof v === 'boolean' || typeof v === 'number') return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(String(v))}`;
    }).join('\n'),
    'description: ' + JSON.stringify(paper.abstract.slice(0, 280).replace(/\s+/g, ' ')),
    '---',
    '',
    paper.body,
  ].join('\n');

  const dest = path.join(DEST, `${paper.id}.md`);
  fs.writeFileSync(dest, yaml, 'utf8');
}

function main() {
  fs.mkdirSync(DEST, { recursive: true });

  // Clean previous synced files (keep .gitkeep)
  for (const f of fs.readdirSync(DEST)) {
    if (f.endsWith('.md')) fs.unlinkSync(path.join(DEST, f));
  }

  const papers = [];
  for (const dir of SRC_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const p = parsePaper(path.join(dir, entry.name));
      papers.push(p);
      emit(p);
    }
  }

  papers.sort((a, b) => a.order - b.order);

  console.log(`✓ synced ${papers.length} papers → src/content/papers/`);
  for (const p of papers) {
    const tag = p.arxiv ? 'arxiv' : (p.roman ?? '???');
    console.log(`  ${tag.padEnd(6)} ${p.title}`);
  }
}

main();
