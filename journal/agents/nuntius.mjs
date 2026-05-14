#!/usr/bin/env node
/**
 * NUNTIUS — The Messenger.
 *
 * Latin: nuntius — messenger, announcer, herald.
 * Role:   Emit the journal's outbound discovery surfaces. Crawlers, feed
 *         readers, academic indexers, and humans should all be able to
 *         find every paper without crawling the navigation by hand.
 *
 * Doctrine: NUNTIUS announces what already exists. It does not author.
 * The feed entries are faithful projections of the paper metadata
 * (title, subtitle, abstract excerpt, canonical URL). No description
 * is invented; every text field comes from the sanitised source.
 *
 * Artefacts (all written to journal/public/, served at the site root):
 *
 *   1. /rss.xml       — RSS 2.0 feed of every paper + the canonical pages
 *   2. /feed.xml      — Atom 1.0 alternative for clients that prefer it
 *   3. /sitemap.xml   — Sitemap protocol, all pages, with lastmod = build time
 *   4. /robots.txt    — Allow-all, with sitemap pointer
 *
 * NUNTIUS is announcement, not measurement. It does not record what feeds
 * are pulled, by whom, or how often. The journal stays unsurveilled.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { loadPapers, c, bannerStart, bannerEnd, JOURNAL } from './_common.mjs';

const PUBLIC   = path.join(JOURNAL, 'public');
const SITE_URL = process.env.JOURNAL_SITE_URL || 'https://journal-medina.pages.dev';

function ensure(dirs) { for (const d of dirs) fs.mkdirSync(d, { recursive: true }); }

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(date) {
  return new Date(date).toUTCString();
}
function iso(date) {
  return new Date(date).toISOString();
}

// Top-of-paper excerpt — used as feed description. Same first paragraph
// the visitor sees on the paper detail page.
function excerpt(p) {
  return (p.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 480);
}

function paperCanonicalUrl(p) {
  return `${SITE_URL}/papers/${p.id}`;
}

// ── 1. RSS 2.0 ──────────────────────────────────────────────────────────────

function emitRss(papers, now) {
  const items = papers.map((p) => `
    <item>
      <title>${xmlEscape((p.roman ? `${p.roman} · ` : '') + p.title)}</title>
      <link>${xmlEscape(paperCanonicalUrl(p))}</link>
      <guid isPermaLink="true">${xmlEscape(paperCanonicalUrl(p))}</guid>
      <pubDate>${rfc822(now)}</pubDate>
      <author>noreply@medinatech.example (Alfredo Medina Hernandez)</author>
      <category>${xmlEscape(p.layer ?? 'Paper')}</category>
      ${(p.threads ?? []).map((t) => `<category>${xmlEscape(t.toLowerCase())}</category>`).join('')}
      <description><![CDATA[${p.subtitle}

${excerpt(p)}]]></description>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Journal — Sovereign Intelligence Research</title>
    <link>${xmlEscape(SITE_URL)}</link>
    <description>Thirty-one papers (plus three arxiv preprints) of Sovereign Intelligence Research by Alfredo Medina Hernandez — Medina Tech · Chaos Lab · Dallas, Texas. Prior art established April 2026.</description>
    <language>en</language>
    <generator>NUNTIUS — the messenger</generator>
    <lastBuildDate>${rfc822(now)}</lastBuildDate>
    <atom:link href="${xmlEscape(SITE_URL + '/rss.xml')}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(PUBLIC, 'rss.xml'), rss, 'utf8');
  return rss.length;
}

// ── 2. Atom 1.0 ─────────────────────────────────────────────────────────────

function emitAtom(papers, now) {
  const entries = papers.map((p) => `
  <entry>
    <id>${xmlEscape(paperCanonicalUrl(p))}</id>
    <title>${xmlEscape((p.roman ? `${p.roman} · ` : '') + p.title)}</title>
    <link href="${xmlEscape(paperCanonicalUrl(p))}" rel="alternate" type="text/html"/>
    <link href="${xmlEscape(SITE_URL + `/papers/${p.id}.txt`)}" rel="alternate" type="text/plain"/>
    <updated>${iso(now)}</updated>
    <author><name>Alfredo Medina Hernandez</name></author>
    <category term="${xmlEscape(p.layer ?? 'paper')}"/>
    ${(p.threads ?? []).map((t) => `<category term="${xmlEscape(t.toLowerCase())}"/>`).join('')}
    <summary type="text">${xmlEscape(p.subtitle + ' — ' + excerpt(p))}</summary>
  </entry>`).join('');

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${xmlEscape(SITE_URL + '/feed.xml')}</id>
  <title>The Journal — Sovereign Intelligence Research</title>
  <subtitle>The papers, the mathematics, the lexicon. By Alfredo Medina Hernandez.</subtitle>
  <link href="${xmlEscape(SITE_URL + '/feed.xml')}" rel="self"/>
  <link href="${xmlEscape(SITE_URL)}" rel="alternate"/>
  <updated>${iso(now)}</updated>
  <author><name>Alfredo Medina Hernandez</name></author>
  <rights>© 2026 Alfredo Medina Hernandez · All rights reserved · prior art April 2026</rights>
  <generator>NUNTIUS — the messenger</generator>
  ${entries}
</feed>`;

  fs.writeFileSync(path.join(PUBLIC, 'feed.xml'), atom, 'utf8');
  return atom.length;
}

// ── 3. Sitemap ──────────────────────────────────────────────────────────────

function emitSitemap(papers, now) {
  const canonical = [
    '',
    '/papers',
    '/search',
    '/mathematics',
    '/lexicon',
    '/tools',
    '/schools',
    '/council',
    '/audit',
  ];

  const urls = [
    ...canonical.map((p) => `${SITE_URL}${p}`),
    ...papers.map((p) => paperCanonicalUrl(p)),
    ...papers.map((p) => `${SITE_URL}/papers/${p.id}.txt`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map((u) => `<url><loc>${xmlEscape(u)}</loc><lastmod>${iso(now).slice(0, 10)}</lastmod></url>`).join('\n  ')}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml, 'utf8');
  return urls.length;
}

// ── 4. robots.txt ───────────────────────────────────────────────────────────

function emitRobots() {
  const robots =
    `# The Journal — Sovereign Intelligence Research
# Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas
#
# Public canon. Crawl freely.
# No login. No tracking. No telemetry.
# Every page that exists is in /sitemap.xml.
#
# Announced by NUNTIUS — the journal's messenger agent.

User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(PUBLIC, 'robots.txt'), robots, 'utf8');
}

// ── Main ────────────────────────────────────────────────────────────────────

function run() {
  bannerStart('NUNTIUS', 'nuntius — the messenger', 'Emits the outbound discovery surfaces. Announces what already exists.');
  ensure([PUBLIC]);

  const papers = loadPapers();
  const now    = new Date();

  const rssBytes  = emitRss(papers, now);
  const atomBytes = emitAtom(papers, now);
  const urlCount  = emitSitemap(papers, now);
  emitRobots();

  bannerEnd('NUNTIUS', [
    c.green(`✓ /rss.xml      (${(rssBytes / 1024).toFixed(1)} KB · ${papers.length} items)`),
    c.green(`✓ /feed.xml     (Atom, ${(atomBytes / 1024).toFixed(1)} KB · ${papers.length} entries)`),
    c.green(`✓ /sitemap.xml  (${urlCount} URLs)`),
    c.green(`✓ /robots.txt   (allow-all · sitemap pointer)`),
    c.dim   (`  base URL: ${SITE_URL}   (override with $JOURNAL_SITE_URL)`),
  ]);

  return { ok: true, papers: papers.length };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  try { run(); }
  catch (e) {
    console.error(c.red(`✗ NUNTIUS failed: ${e.message}`));
    process.exit(1);
  }
}

export default run;
