#!/usr/bin/env node
/**
 * FABRICOR — The Builder.
 *
 * Latin: fabricor / fabricator — one who builds, fashions, makes.
 * Role:   Produce derivative artefacts from the sanitised canon.
 *
 * Doctrine: FABRICOR transforms — it never generates. Every artefact it
 * writes is a faithful re-projection of content the author wrote. Same
 * words, different surface. No AI-generated commentary. No interpretation.
 *
 * Artefacts produced (all served at build time as static files):
 *
 *   1. /papers/<id>.txt
 *      Plain-text version of each paper — markdown stripped, suitable
 *      for citation, copy-paste, terminal piping.
 *
 *   2. /og/<id>.png  +  /og/<id>.svg
 *      1200×630 social-card per paper. Aurum gold on paper background,
 *      Roman numeral set large, Latin title centred, English subtitle
 *      beneath, motto VIVIT · MEMINIT · DONAT at the foot. Generated as
 *      SVG and rendered to PNG with @resvg/resvg-js for cross-platform
 *      sharing compatibility.
 *
 *   3. /api/papers.json + /api/papers/<id>.json
 *      Public JSON API of the canon for developers and academic indexers.
 *      Source-linked. Versioned by build.
 *
 *   4. /api/lexicon.json
 *      Public JSON of the Latin lexicon.
 *
 *   5. /api/mathematics.json
 *      Public JSON of the mathematics rows.
 *
 * Output paths land in journal/public/ so Astro serves them directly.
 * The agent is idempotent: re-running it produces byte-identical artefacts
 * from the same input.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

import {
  loadPapers, c, bannerStart, bannerEnd, JOURNAL,
} from './_common.mjs';

const PUBLIC   = path.join(JOURNAL, 'public');
const TXT_DIR  = path.join(PUBLIC, 'papers');
const OG_DIR   = path.join(PUBLIC, 'og');
const API_DIR  = path.join(PUBLIC, 'api');

function ensure(dirs) { for (const d of dirs) fs.mkdirSync(d, { recursive: true }); }

// ── 1. Plain text per paper ─────────────────────────────────────────────────

function toPlainText(md) {
  // Strip markdown to a clean reading text.
  return md
    .replace(/```[\s\S]*?```/g, '\n[code block omitted]\n')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*---+\s*$/gm, '────────────')
    .replace(/\|/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function emitPlainText(papers) {
  ensure([TXT_DIR]);
  for (const p of papers) {
    const header = [
      p.title,
      p.subtitle,
      '',
      `Author:      Alfredo Medina Hernandez`,
      `Affiliation: Medina Tech · Chaos Lab · Dallas, Texas`,
      `Series:      Sovereign Intelligence Research${p.roman ? ` — Paper ${p.roman}` : ' — ArXiv preprint'}`,
      `Layer:       ${p.layer ?? 'paper'}`,
      p.threads?.length ? `Threads:     ${p.threads.join(' · ')}` : '',
      `Prior art:   April 2026`,
      '────────────────────────────────────────────────────────────',
      '',
    ].filter(Boolean).join('\n');
    const body = toPlainText(p.body);
    fs.writeFileSync(path.join(TXT_DIR, `${p.id}.txt`), header + body + '\n', 'utf8');
  }
}

// ── 2. OG social-card per paper ─────────────────────────────────────────────

const CARD_W = 1200;
const CARD_H = 630;

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Tiny line-wrap that fits an approximate width.
// (Sized for the system serif at the chosen font-size below.)
function wrapTitle(text, maxChars = 28) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 2);   // never more than 2 title lines
}

function wrapSubtitle(text, maxChars = 56) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 3);   // never more than 3 subtitle lines
}

// 137.5° phyllotaxis dots — decorative background, mathematically grounded.
function phyllotaxisDots(n, cx, cy, scale = 8, maxR = 280) {
  const golden = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.508°
  const out = [];
  for (let i = 1; i <= n; i++) {
    const r = scale * Math.sqrt(i);
    if (r > maxR) break;
    const a = i * golden;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const op = 0.05 + 0.15 * (1 - r / maxR);
    out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#a87d33" opacity="${op.toFixed(3)}"/>`);
  }
  return out.join('');
}

function svgForPaper(p) {
  const titleLines    = wrapTitle(p.title);
  const subtitleLines = p.subtitle ? wrapSubtitle(p.subtitle) : [];
  const roman = p.roman ?? (p.arxiv ? 'ArXiv' : '—');
  const thread = (p.threads && p.threads[0]) ? p.threads[0] : null;

  // Layout positions (φ-spaced):
  //   Top-left:  ROMAN numeral, smallcaps
  //   Center:    Latin title (1–2 lines)
  //   Below:     English subtitle (1–3 lines, muted)
  //   Bottom:    motto + signature
  //   Right:     phyllotaxis spiral

  const titleY    = 250;
  const titleStep = 90;
  const subY      = titleY + titleLines.length * titleStep + 40;
  const subStep   = 38;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#faf8f4"/>
      <stop offset="100%" stop-color="#f3efe6"/>
    </linearGradient>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" fill="url(#paper)"/>
  <rect x="36" y="36" width="${CARD_W - 72}" height="${CARD_H - 72}" fill="none" stroke="#d9d2c3" stroke-width="2"/>

  <!-- phyllotaxis spiral (decorative; mathematically grounded) -->
  ${phyllotaxisDots(900, CARD_W - 230, CARD_H / 2, 9, 280)}

  <!-- Roman numeral / paper marker -->
  <g font-family="Georgia, 'Iowan Old Style', serif" fill="#a87d33">
    <text x="80" y="120" font-size="34" letter-spacing="6">${xmlEscape(p.arxiv ? 'ARXIV PREPRINT' : 'PAPER')}</text>
    <text x="80" y="178" font-size="72" font-weight="700">${xmlEscape(roman)}</text>
  </g>

  <!-- Latin title -->
  <g font-family="Georgia, 'Iowan Old Style', serif" fill="#1a1814">
    ${titleLines.map((t, i) =>
      `<text x="80" y="${titleY + i * titleStep}" font-size="78" font-weight="700" letter-spacing="-0.5">${xmlEscape(t)}</text>`
    ).join('')}
  </g>

  <!-- English subtitle -->
  <g font-family="Georgia, 'Iowan Old Style', serif" fill="#4a443b" font-style="italic">
    ${subtitleLines.map((t, i) =>
      `<text x="80" y="${subY + i * subStep}" font-size="30">${xmlEscape(t)}</text>`
    ).join('')}
  </g>

  <!-- Thread badge (if present) -->
  ${thread ? `<g>
    <rect x="80" y="${CARD_H - 130}" width="${thread.length * 13 + 36}" height="36" rx="18" fill="none" stroke="#a87d33"/>
    <text x="${80 + (thread.length * 13 + 36) / 2}" y="${CARD_H - 105}" font-family="Georgia, 'Iowan Old Style', serif" font-size="18" font-style="italic" fill="#a87d33" text-anchor="middle">${xmlEscape(thread.toLowerCase())}</text>
  </g>` : ''}

  <!-- Motto + signature at bottom -->
  <g font-family="Georgia, 'Iowan Old Style', serif">
    <text x="80" y="${CARD_H - 60}" font-size="22" fill="#a87d33" font-style="italic" letter-spacing="2">VIVIT · MEMINIT · DONAT</text>
    <text x="80" y="${CARD_H - 36}" font-size="16" fill="#6b6359">Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas · The Journal</text>
  </g>
</svg>`;
}

function emitOG(papers) {
  ensure([OG_DIR]);
  let pngCount = 0;
  let pngBytes = 0;
  for (const p of papers) {
    const svg = svgForPaper(p);
    fs.writeFileSync(path.join(OG_DIR, `${p.id}.svg`), svg, 'utf8');

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: CARD_W },
      font:  { loadSystemFonts: true, defaultFontFamily: 'serif' },
    });
    const png = resvg.render().asPng();
    fs.writeFileSync(path.join(OG_DIR, `${p.id}.png`), png);
    pngCount++;
    pngBytes += png.length;
  }
  return { count: pngCount, bytes: pngBytes };
}

// ── 3. JSON API ──────────────────────────────────────────────────────────────

async function importJournalLib(name) {
  return await import(path.join(JOURNAL, 'src', 'lib', name));
}

async function emitJsonApi(papers) {
  ensure([API_DIR, path.join(API_DIR, 'papers')]);

  // /api/papers.json — list view
  const list = papers.map((p) => ({
    id:          p.id,
    roman:       p.roman ?? null,
    arxiv:       p.arxiv ?? false,
    title:       p.title,
    subtitle:    p.subtitle,
    layer:       p.layer,
    threads:     p.threads ?? [],
    url:         `/papers/${p.id}`,
    txt:         `/papers/${p.id}.txt`,
    og:          `/og/${p.id}.png`,
    description: p.description ?? '',
  }));
  fs.writeFileSync(
    path.join(API_DIR, 'papers.json'),
    JSON.stringify({ builtAt: new Date().toISOString(), count: list.length, papers: list }, null, 2),
    'utf8',
  );

  // /api/papers/<id>.json — single paper, includes body
  for (const p of papers) {
    fs.writeFileSync(
      path.join(API_DIR, 'papers', `${p.id}.json`),
      JSON.stringify({
        id:       p.id,
        roman:    p.roman ?? null,
        arxiv:    p.arxiv ?? false,
        title:    p.title,
        subtitle: p.subtitle,
        layer:    p.layer,
        threads:  p.threads ?? [],
        description: p.description ?? '',
        body:     p.body,
        author:   'Alfredo Medina Hernandez',
        affiliation: 'Medina Tech · Chaos Lab · Dallas, Texas',
        priorArt: 'April 2026',
        license:  'See LICENSE in the repository',
      }, null, 2),
      'utf8',
    );
  }

  // /api/lexicon.json
  const lex = await importJournalLib('lexicon.js');
  fs.writeFileSync(
    path.join(API_DIR, 'lexicon.json'),
    JSON.stringify({ builtAt: new Date().toISOString(), count: lex.entries.length, entries: lex.entries }, null, 2),
    'utf8',
  );

  // /api/mathematics.json
  const math = await importJournalLib('mathematics.js');
  fs.writeFileSync(
    path.join(API_DIR, 'mathematics.json'),
    JSON.stringify({ builtAt: new Date().toISOString(), equations: math.equations, closing: math.closing }, null, 2),
    'utf8',
  );

  // /api/tools.json
  const tools = await importJournalLib('tools.js');
  fs.writeFileSync(
    path.join(API_DIR, 'tools.json'),
    JSON.stringify({ builtAt: new Date().toISOString(), tools: tools.tools }, null, 2),
    'utf8',
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

async function run() {
  bannerStart('FABRICOR', 'fabricor — the builder', 'Re-projects sanitised content as derivative artefacts. Never generates.');

  const papers = loadPapers();
  ensure([PUBLIC]);

  // Plain text
  emitPlainText(papers);

  // OG cards
  const og = emitOG(papers);

  // JSON API
  await emitJsonApi(papers);

  bannerEnd('FABRICOR', [
    c.green(`✓ ${papers.length} plain-text exports → /papers/<id>.txt`),
    c.green(`✓ ${og.count} OG social cards (SVG + PNG) → /og/<id>.{svg,png}  (${(og.bytes / 1024).toFixed(0)} KB total PNG)`),
    c.green(`✓ JSON API → /api/papers.json + /api/papers/<id>.json + /api/{lexicon,mathematics,tools}.json`),
  ]);

  return { ok: true, papers: papers.length };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  run().catch((e) => {
    console.error(c.red(`✗ FABRICOR failed: ${e.stack || e.message}`));
    process.exit(1);
  });
}

export default run;
