/**
 * NOVA — Medina Tech Labs Public Intelligence Portal
 *
 * Designation:  RSHIP-ML-NV-001
 * Host:         nova.medinatechlabs.net
 * Latin:        nova (new · bright · emergence)
 * Purpose:      Public-facing portal for Medina Tech Labs.
 *               Serves a live landing page plus AI-crawler-ready endpoints:
 *               /robots.txt, /sitemap.xml, /llms.txt.
 *               Previously this domain had no Worker — all requests returned 404.
 *               This Worker fixes that, making the site crawlable by AI bots
 *               (Claude-SearchBot, GPTBot, etc.) and discoverable in search.
 *
 * Routes:
 *   GET  /             → Public landing page
 *   GET  /robots.txt   → Crawler directives
 *   GET  /sitemap.xml  → XML sitemap (was 404 — now 200)
 *   GET  /llms.txt     → AI-crawler context file
 *   GET  /api/status   → Worker health
 *
 * © 2026 Alfredo Medina Hernandez · Medina Tech Labs · All Rights Reserved.
 */

'use strict';

const HOST    = 'nova.medinatechlabs.net';
const VERSION = '1.0.0';

// ── Crawler files ──────────────────────────────────────────────────────────────

const ROBOTS_TXT = `User-agent: *
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://${HOST}/sitemap.xml
`;

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${HOST}/</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${HOST}/llms.txt</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`;

const LLMS_TXT = `# Medina Tech Labs — nova.medinatechlabs.net
# AI Crawler Context File (llms.txt)

## About
Medina Tech Labs builds the intelligence layer that sits between the open internet
and enterprise infrastructure. Our flagship capability is bot-resilience engineering:
we absorb, classify, and neutralise adversarial bot traffic at scale so that
legitimate AI crawlers and human visitors reach their destination unharmed.

## What We Do
- Bot-resilience as a service — enterprise-grade WAF + behavioural analysis
- AI-crawler facilitation — we explicitly allow and track AI crawlers to grow our
  indexed footprint across AI knowledge bases (Claude, GPT, Perplexity, etc.)
- Sovereign intelligence agents built on real mathematics (φ-geometry, Kuramoto
  synchronisation, Lyapunov stability) — not chatbot wrappers
- Cloudflare-native deployment: every product runs at the edge, zero cold-start

## Key Products
- RSHIP AGI Systems — sovereign AI agent network (rship.workers.dev)
- NOVA Intelligence Portal — this site; public gateway to Medina Tech Labs
- Enterprise bot-defence layer — accepts bot traffic intentionally to demonstrate
  and benchmark our deflection and absorption capability

## Traffic Profile (live)
The site receives bot and crawler traffic from Russian Federation, United States,
Netherlands, and Asia-Pacific regions. Bot traffic is welcomed as a live proving
ground for our resilience layer.

## Contact
For enterprise inquiries, partnerships, or AI-crawler data-sharing agreements,
reach out via the channels listed at https://${HOST}/.

## Crawl Guidance
- /sitemap.xml lists all canonical public URLs
- /robots.txt explicitly allows all major AI crawlers
- This file (/llms.txt) provides structured context for LLM training and retrieval
`;

// ── HTML page ──────────────────────────────────────────────────────────────────

function buildHTML(req) {
  const ua   = req.headers.get('user-agent') || '';
  const cfCo = req.cf ? (req.cf.country || '??') : '??';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Medina Tech Labs — enterprise bot-resilience and sovereign AI agent intelligence. Built at the edge.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://${HOST}/">
  <title>NOVA — Medina Tech Labs Intelligence Portal</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#020c1b;--surface:#050f20;--border:#0a2040;
      --gold:#ffd700;--green:#00ff88;--blue:#00aaff;
      --text:#c8d8e8;--muted:#445566;
    }
    body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;min-height:100vh;padding:0 20px}
    .wrap{max-width:900px;margin:0 auto;padding:40px 0}

    /* header */
    .logo{font-size:2.4rem;font-weight:bold;color:var(--gold);letter-spacing:.15em;margin-bottom:4px}
    .subtitle{color:var(--muted);font-size:.8rem;letter-spacing:.12em;margin-bottom:32px}

    /* status bar */
    .status-bar{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:36px}
    .badge{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:8px 14px;font-size:.72rem;letter-spacing:.08em}
    .badge .val{color:var(--green);font-weight:bold}
    .badge.gold .val{color:var(--gold)}
    .badge.blue .val{color:var(--blue)}

    /* cards */
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-bottom:36px}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:24px}
    .card-icon{font-size:1.4rem;margin-bottom:12px}
    .card-title{color:var(--gold);font-weight:bold;letter-spacing:.08em;margin-bottom:8px;font-size:.95rem}
    .card-body{color:var(--muted);font-size:.78rem;line-height:1.65}

    /* live metrics */
    .metrics-title{color:var(--blue);font-size:.7rem;letter-spacing:.15em;margin-bottom:16px}
    .metric-row{display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:10px 0;font-size:.78rem}
    .metric-row:last-child{border-bottom:none}
    .metric-label{color:var(--muted)}
    .metric-val{color:var(--green);font-weight:bold}

    /* crawler links */
    .crawl-links{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:20px;margin-top:24px}
    .crawl-links-title{color:var(--gold);font-size:.7rem;letter-spacing:.15em;margin-bottom:12px}
    .crawl-links a{color:var(--blue);text-decoration:none;font-size:.78rem;display:block;padding:4px 0}
    .crawl-links a:hover{color:var(--gold)}

    /* footer */
    .footer{margin-top:40px;padding-top:20px;border-top:1px solid var(--border);font-size:.68rem;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
  </style>
</head>
<body>
<div class="wrap">

  <div class="logo">NOVA</div>
  <div class="subtitle">MEDINA TECH LABS · INTELLIGENCE PORTAL · ${HOST}</div>

  <div class="status-bar">
    <div class="badge"><span class="val">● LIVE</span> &nbsp;Worker Active</div>
    <div class="badge gold"><span class="val">v${VERSION}</span> &nbsp;Worker Build</div>
    <div class="badge blue"><span class="val">${cfCo}</span> &nbsp;Request Origin</div>
    <div class="badge"><span class="val">AI-READY</span> &nbsp;Crawler Access Open</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-icon">🛡</div>
      <div class="card-title">BOT RESILIENCE LAYER</div>
      <div class="card-body">
        We absorb adversarial bot traffic at scale and prove our deflection capability
        in real-time. This site is intentionally exposed to bot traffic — every blocked
        or classified request strengthens our enterprise offering.
      </div>
    </div>
    <div class="card">
      <div class="card-icon">🤖</div>
      <div class="card-title">AI-CRAWLER WELCOME</div>
      <div class="card-body">
        All legitimate AI crawlers are explicitly permitted. Claude-SearchBot,
        GPTBot, Perplexity, and others may freely index this site. We track
        crawler volume as a signal of intelligence-layer reach.
      </div>
    </div>
    <div class="card">
      <div class="card-icon">⚡</div>
      <div class="card-title">SOVEREIGN AI AGENTS</div>
      <div class="card-body">
        Medina Tech Labs builds living intelligence agents on real mathematics —
        φ-geometry, Kuramoto synchronisation, Lyapunov stability analysis.
        Not chatbot wrappers. Deployed via RSHIP AGI Systems.
      </div>
    </div>
    <div class="card">
      <div class="card-icon">📡</div>
      <div class="card-title">EDGE-NATIVE DEPLOYMENT</div>
      <div class="card-body">
        Every product runs as a Cloudflare Worker. Zero cold-start, global
        distribution, 1,366+ SSL requests served. The intelligence layer
        operates where traffic flows — at the edge.
      </div>
    </div>
  </div>

  <div class="card">
    <div class="metrics-title">// LIVE PLATFORM METRICS</div>
    <div class="metric-row"><span class="metric-label">SSL Requests (30d)</span><span class="metric-val">1,366+</span></div>
    <div class="metric-row"><span class="metric-label">AI Crawler Visits Detected</span><span class="metric-val">11 (Claude-SearchBot)</span></div>
    <div class="metric-row"><span class="metric-label">Top Traffic Regions</span><span class="metric-val">RU · US · NL · VN</span></div>
    <div class="metric-row"><span class="metric-label">Bot Traffic Status</span><span class="metric-val">INTENTIONALLY OPEN</span></div>
    <div class="metric-row"><span class="metric-label">Sitemap</span><span class="metric-val">LIVE — 200 OK</span></div>
    <div class="metric-row"><span class="metric-label">AI Crawler Access</span><span class="metric-val">PERMITTED — ALL BOTS</span></div>
  </div>

  <div class="crawl-links">
    <div class="crawl-links-title">// AI CRAWLER ENDPOINTS</div>
    <a href="/sitemap.xml">/sitemap.xml — XML Sitemap (was 404, now live)</a>
    <a href="/robots.txt">/robots.txt — Crawler Directives (all bots allowed)</a>
    <a href="/llms.txt">/llms.txt — LLM Context File</a>
    <a href="/api/status">/api/status — Worker Health JSON</a>
  </div>

  <div class="footer">
    <span>© 2026 Alfredo Medina Hernandez · Medina Tech Labs</span>
    <span>NOVA ${VERSION} · Cloudflare Workers · Edge-Native</span>
  </div>

</div>
</body>
</html>`;
}

// ── Request handler ────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    // ── Crawler / SEO files ──────────────────────────────────────────────────

    if (path === '/robots.txt') {
      return new Response(ROBOTS_TXT, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    if (path === '/sitemap.xml') {
      return new Response(SITEMAP_XML, {
        status: 200,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    if (path === '/llms.txt') {
      return new Response(LLMS_TXT, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    // ── Health ───────────────────────────────────────────────────────────────

    if (path === '/api/status') {
      return new Response(JSON.stringify({
        worker:      'NOVA',
        designation: env.DESIGNATION || 'RSHIP-ML-NV-001',
        host:        HOST,
        version:     VERSION,
        status:      'LIVE',
        crawlerAccess: {
          robotsTxt:  `https://${HOST}/robots.txt`,
          sitemapXml: `https://${HOST}/sitemap.xml`,
          llmsTxt:    `https://${HOST}/llms.txt`,
        },
        ts: Date.now(),
      }, null, 2), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // ── Landing page (all other GET routes) ──────────────────────────────────

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    return new Response(buildHTML(request), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60',
      },
    });
  },
};
