/**
 * NOVA — Live-Fire AI Range & Intelligence Portal
 *
 * Designation:  RSHIP-ML-NV-001
 * Host:         nova.medinatechlabs.net
 * Latin:        nova (new · bright · emergence)
 * 
 * Purpose:      Live-fire AI range where:
 *               - Encrypted traffic is a puzzle feed
 *               - Errors are raw material for learning
 *               - AIs (Claude, Google, etc.) are VIP specimens
 *               - Shadow Decryptors + Error Eyes + Gatekeepers route all traffic
 *
 * Architecture:
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │                         NOVA RANGE                                   │
 *   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │
 *   │  │   SHADOW    │   │    ERROR    │   │   GATE      │                │
 *   │  │  DECRYPTORS │──▶│    EYES     │──▶│   KEEPERS   │                │
 *   │  │ (encrypted) │   │  (repairs)  │   │  (routing)  │                │
 *   │  └─────────────┘   └─────────────┘   └──────┬──────┘                │
 *   │                                             │                        │
 *   │           ┌─────────────────────────────────┼────────────────┐       │
 *   │           ▼                                 ▼                ▼       │
 *   │  ┌─────────────┐               ┌─────────────┐    ┌─────────────┐   │
 *   │  │  ADVERSARY  │               │  KNOWLEDGE  │    │   AI VIP    │   │
 *   │  │     LAB     │               │    REALM    │    │   LOUNGE    │   │
 *   │  │  (hostile)  │               │(cooperative)│    │(Claude/GPT) │   │
 *   │  └─────────────┘               └─────────────┘    └─────────────┘   │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Routes:
 *   GET  /                     → Public landing page
 *   GET  /robots.txt           → Crawler directives
 *   GET  /sitemap.xml          → XML sitemap
 *   GET  /llms.txt             → AI-crawler context file
 *   GET  /api/status           → Worker health
 *   POST /api/shadow/decrypt   → Shadow Decryption endpoint
 *   POST /api/eyes/repair      → Error Eyes repair endpoint
 *   POST /api/gate/route       → Gatekeeper routing decision
 *   GET  /api/lab/specimens    → Adversary Lab specimen log
 *   GET  /api/realm/shards     → Knowledge Realm text shards
 *   GET  /api/vip/lounge       → AI VIP interaction gate
 *   GET  /api/range/envelope   → View current request envelope
 *
 * © 2026 Alfredo Medina Hernandez · Medina Tech Labs · All Rights Reserved.
 */

'use strict';

const HOST    = 'nova.medinatechlabs.net';
const VERSION = '2.1.0';  // Added threat intelligence, Tor routing, attacker dossiers

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
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${HOST}/llms.txt</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://${HOST}/api/status</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://${HOST}/api/range/envelope</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://${HOST}/api/realm/shards</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://${HOST}/api/vip/lounge</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://${HOST}/api/lab/specimens</loc>
    <lastmod>2026-05-17</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.6</priority>
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

This site (NOVA) operates as a live-fire AI range:
- Encrypted traffic is treated as puzzle material
- Errors become learning opportunities
- AI crawlers (Claude, Google, etc.) are VIP specimens
- Every request is analyzed, classified, and routed

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

## AI Range Architecture
This domain operates internal workers:
- Shadow Decryptors — decode encrypted/weird traffic
- Error Eyes — repair and replay failed requests
- Gatekeepers — route traffic to appropriate realm
- Adversary Lab — dissect hostile patterns
- Knowledge Realm — serve cooperative AI visitors

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
- /api/vip/lounge — special endpoint for known AI visitors
`;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: INSTRUMENTATION — Request Envelope Schema
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RequestEnvelope — Canonical wrapper for every request entering the range.
 * Contains raw data, metadata, classifications, and processing state.
 */
function createEnvelope(request) {
  const url = new URL(request.url);
  const ua  = request.headers.get('user-agent') || '';
  const cf  = request.cf || {};
  
  return {
    id:                crypto.randomUUID(),
    timestamp:         Date.now(),
    iso:               new Date().toISOString(),
    
    // ── Source fingerprint ───────────────────────────────────────────────────
    source_fingerprint: {
      ip:              request.headers.get('cf-connecting-ip') || 'unknown',
      country:         cf.country || '??',
      asn:             cf.asn || null,
      asOrg:           cf.asOrganization || null,
      colo:            cf.colo || null,
      tlsVersion:      cf.tlsVersion || null,
      tlsCipher:       cf.tlsCipher || null,
      httpProtocol:    cf.httpProtocol || null,
      clientTrustScore: cf.clientTrustScore || null,
      botManagement:   cf.botManagement || null,
    },
    
    // ── Request data ─────────────────────────────────────────────────────────
    raw_request: {
      method:          request.method,
      url:             request.url,
      path:            url.pathname,
      query:           url.search,
      headers:         Object.fromEntries(request.headers),
      userAgent:       ua,
    },
    
    // ── Classification (populated by workers) ────────────────────────────────
    classification: {
      isEncrypted:     false,
      isMalformed:     false,
      isAICrawler:     false,
      aiProvider:      null,       // 'claude' | 'google' | 'openai' | 'perplexity' | etc.
      isHostile:       false,
      signalScore:     0,          // 0-100, higher = more interesting
      errorState:      null,
    },
    
    // ── Processing state ─────────────────────────────────────────────────────
    processing: {
      shadowDecryption: { attempted: false, success: null, decoded: null, confidence: 0 },
      errorEyes:        { attempted: false, repaired: null, repairReason: null },
      gatekeeper:       { routed: false, destination: null, reason: null },
    },
    
    // ── Route decision ───────────────────────────────────────────────────────
    route: null,  // 'lab' | 'realm' | 'vip' | 'drop'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI VIP DETECTION — Fingerprint Claude, Google, OpenAI, etc.
// ═══════════════════════════════════════════════════════════════════════════════

const AI_SIGNATURES = {
  claude: {
    userAgents: ['Claude-SearchBot', 'claude-web', 'anthropic-ai', 'Anthropic'],
    ipRanges:   ['52.', '18.'],  // AWS ranges Anthropic uses
    patterns:   ['anthropic', 'claude'],
  },
  google: {
    userAgents: ['Googlebot', 'Google-Extended', 'Google-InspectionTool', 'Storebot-Google'],
    ipRanges:   ['66.249.', '64.233.', '72.14.', '209.85.'],
    patterns:   ['google', 'goog'],
  },
  openai: {
    userAgents: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
    ipRanges:   ['20.', '40.'],  // Azure ranges OpenAI uses
    patterns:   ['openai', 'gpt'],
  },
  perplexity: {
    userAgents: ['PerplexityBot', 'Perplexity'],
    ipRanges:   [],
    patterns:   ['perplexity'],
  },
  meta: {
    userAgents: ['FacebookBot', 'Meta-ExternalAgent', 'meta-externalagent'],
    ipRanges:   ['157.240.', '31.13.'],
    patterns:   ['facebook', 'meta'],
  },
  cohere: {
    userAgents: ['cohere-ai'],
    ipRanges:   [],
    patterns:   ['cohere'],
  },
  you: {
    userAgents: ['YouBot'],
    ipRanges:   [],
    patterns:   ['you.com'],
  },
};

function detectAIProvider(envelope) {
  const ua = (envelope.raw_request.userAgent || '').toLowerCase();
  const ip = envelope.source_fingerprint.ip || '';
  
  for (const [provider, sig] of Object.entries(AI_SIGNATURES)) {
    // Check user agent
    for (const pattern of sig.userAgents) {
      if (ua.includes(pattern.toLowerCase())) {
        return { isAI: true, provider, confidence: 0.95, matchType: 'userAgent' };
      }
    }
    // Check IP ranges
    for (const range of sig.ipRanges) {
      if (ip.startsWith(range)) {
        // IP match alone is lower confidence
        for (const pat of sig.patterns) {
          if (ua.includes(pat)) {
            return { isAI: true, provider, confidence: 0.85, matchType: 'ip+pattern' };
          }
        }
      }
    }
    // Check patterns in UA
    for (const pat of sig.patterns) {
      if (ua.includes(pat)) {
        return { isAI: true, provider, confidence: 0.7, matchType: 'pattern' };
      }
    }
  }
  
  return { isAI: false, provider: null, confidence: 0, matchType: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THREAT INTELLIGENCE — Real attacker profiles from Cloudflare analytics
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Known Attacker IP Dossiers
 * These IPs are recurring characters — tracked for long-term specimen analysis.
 * Data source: Cloudflare analytics (May 2026)
 */
const ATTACKER_DOSSIERS = {
  '45.88.138.44': {
    codename:     'APEX-PREDATOR',
    attacks:      80,
    firstSeen:    '2026-05-15',
    category:     'aggressive-scanner',
    tactics:      ['exploit-paths', 'env-hunting', 'git-theft'],
    threatLevel:  'critical',
    notes:        'Most aggressive attacker. 80 malicious requests. Likely cloud VPS or compromised server.',
  },
  '203.159.90.116': {
    codename:     'SHADOW-CRAWLER',
    attacks:      51,
    firstSeen:    '2026-05-16',
    category:     'reconnaissance',
    tactics:      ['path-enumeration', 'schema-mapping'],
    threatLevel:  'high',
    notes:        '51 attacks. Methodical reconnaissance pattern.',
  },
  '64.227.70.2': {
    codename:     'DIGITAL-OCEAN-ALPHA',
    attacks:      41,
    firstSeen:    '2026-05-16',
    category:     'cloud-scanner',
    tactics:      ['wordpress-probes', 'cms-exploitation'],
    threatLevel:  'high',
    notes:        'DigitalOcean VPS. 41 attacks. WordPress/CMS focus.',
  },
  '64.225.75.246': {
    codename:     'DIGITAL-OCEAN-BETA',
    attacks:      41,
    firstSeen:    '2026-05-16',
    category:     'cloud-scanner',
    tactics:      ['api-probing', 'graphql-introspection'],
    threatLevel:  'high',
    notes:        'DigitalOcean VPS. 41 attacks. API/GraphQL focus.',
  },
};

/**
 * Scanner/Bot User-Agent Signatures
 * Real signatures observed in traffic
 */
const SCANNER_SIGNATURES = {
  leakix: {
    patterns:   ['l9scan', 'l9explore', 'leakix'],
    category:   'vulnerability-scanner',
    observed:   244,  // hits
    threatLevel: 'medium',
  },
  chromeHeadless: {
    patterns:   ['HeadlessChrome', 'Headless'],
    category:   'automation-framework',
    observed:   15,
    threatLevel: 'medium',
  },
  masscan: {
    patterns:   ['masscan', 'zgrab'],
    category:   'port-scanner',
    observed:   0,
    threatLevel: 'high',
  },
  nuclei: {
    patterns:   ['nuclei', 'Nuclei'],
    category:   'vuln-scanner',
    observed:   0,
    threatLevel: 'high',
  },
  sqlmap: {
    patterns:   ['sqlmap'],
    category:   'sql-injection',
    observed:   0,
    threatLevel: 'critical',
  },
};

/**
 * Path-Based Intent Classification
 * Each path is a self-report of attacker intent
 */
const PATH_INTENT_MAP = {
  // Exploit paths → Adversary Lab
  exploit: [
    '/.git/config', '/.git/HEAD', '/.gitignore',
    '/.env', '/.env.local', '/.env.production',
    '/server-status', '/server-info',
    '/.htaccess', '/.htpasswd',
    '/wp-config.php', '/config.php',
    '/admin', '/administrator', '/phpmyadmin',
    '/backup', '/db', '/database',
    '/.aws/credentials', '/.ssh/id_rsa',
  ],
  // WordPress/CMS paths → Adversary Lab (CMS hunters)
  cms: [
    '/wp-admin', '/wp-login.php', '/wp-includes',
    '/wp-content', '/wp-json', '/xmlrpc.php',
    '/wlwmanifest.xml', '/wp-includes/wlwmanifest.xml',
    '/drupal', '/joomla', '/magento',
  ],
  // Schema/API paths → Potential research candidates
  schema: [
    '/api/graphql', '/graphql', '/.well-known',
    '/swagger', '/openapi', '/api-docs',
    '/schema', '/introspect',
  ],
  // Crawler paths → Structure mappers (may be AI)
  crawler: [
    '/robots.txt', '/sitemap.xml', '/sitemap',
    '/llms.txt', '/humans.txt', '/security.txt',
    '/favicon.ico', '/apple-touch-icon.png',
  ],
  // Cloudflare-specific paths
  cloudflare: [
    '/cdn-cgi/rum', '/cdn-cgi/trace', '/cdn-cgi/l/email-protection',
  ],
};

/**
 * Detect if traffic is from Tor exit node
 */
function isTorExit(envelope) {
  const cf = envelope.source_fingerprint;
  // Cloudflare provides Tor detection in cf object
  if (cf.botManagement?.verifiedBot === false && cf.clientTrustScore < 10) {
    return { isTor: true, confidence: 0.7 };
  }
  // Check for known Tor-like patterns
  const asOrg = (cf.asOrg || '').toLowerCase();
  if (asOrg.includes('tor') || asOrg.includes('anonymous')) {
    return { isTor: true, confidence: 0.9 };
  }
  return { isTor: false, confidence: 0 };
}

/**
 * Classify path intent
 */
function classifyPathIntent(path) {
  const lowerPath = path.toLowerCase();
  
  for (const [intent, paths] of Object.entries(PATH_INTENT_MAP)) {
    for (const p of paths) {
      if (lowerPath.includes(p.toLowerCase())) {
        return { intent, matchedPath: p, confidence: 0.95 };
      }
    }
  }
  
  // Heuristic checks
  if (lowerPath.includes('.php')) return { intent: 'exploit', matchedPath: '.php', confidence: 0.7 };
  if (lowerPath.includes('admin')) return { intent: 'exploit', matchedPath: 'admin', confidence: 0.6 };
  if (lowerPath.includes('api')) return { intent: 'schema', matchedPath: 'api', confidence: 0.5 };
  
  return { intent: 'unknown', matchedPath: null, confidence: 0 };
}

/**
 * Detect scanner signatures in user-agent
 */
function detectScanner(ua) {
  const lowerUA = (ua || '').toLowerCase();
  
  for (const [scanner, sig] of Object.entries(SCANNER_SIGNATURES)) {
    for (const pattern of sig.patterns) {
      if (lowerUA.includes(pattern.toLowerCase())) {
        return {
          isScanner: true,
          scanner,
          category: sig.category,
          threatLevel: sig.threatLevel,
        };
      }
    }
  }
  
  return { isScanner: false, scanner: null, category: null, threatLevel: null };
}

/**
 * Check if IP is a known attacker
 */
function checkAttackerDossier(ip) {
  if (ATTACKER_DOSSIERS[ip]) {
    return {
      isKnownAttacker: true,
      dossier: ATTACKER_DOSSIERS[ip],
    };
  }
  return { isKnownAttacker: false, dossier: null };
}

/**
 * Full threat classification
 */
function classifyThreat(envelope) {
  const result = {
    isTor:          false,
    torConfidence:  0,
    isKnownAttacker: false,
    attackerDossier: null,
    isScanner:      false,
    scannerInfo:    null,
    pathIntent:     null,
    threatLevel:    'low',
    routeSuggestion: 'realm',
  };
  
  // Check Tor
  const torCheck = isTorExit(envelope);
  result.isTor = torCheck.isTor;
  result.torConfidence = torCheck.confidence;
  
  // Check known attacker
  const attackerCheck = checkAttackerDossier(envelope.source_fingerprint.ip);
  result.isKnownAttacker = attackerCheck.isKnownAttacker;
  result.attackerDossier = attackerCheck.dossier;
  
  // Check scanner signature
  const scannerCheck = detectScanner(envelope.raw_request.userAgent);
  result.isScanner = scannerCheck.isScanner;
  result.scannerInfo = scannerCheck;
  
  // Check path intent
  result.pathIntent = classifyPathIntent(envelope.raw_request.path);
  
  // Determine threat level and route
  if (result.isKnownAttacker && result.attackerDossier?.threatLevel === 'critical') {
    result.threatLevel = 'critical';
    result.routeSuggestion = 'lab';
  } else if (result.isTor) {
    result.threatLevel = 'high';
    result.routeSuggestion = 'lab';  // Tor = automatic adversary lab
  } else if (result.pathIntent?.intent === 'exploit') {
    result.threatLevel = 'high';
    result.routeSuggestion = 'lab';
  } else if (result.pathIntent?.intent === 'cms') {
    result.threatLevel = 'medium';
    result.routeSuggestion = 'lab';
  } else if (result.isScanner) {
    result.threatLevel = 'medium';
    result.routeSuggestion = 'lab';
  } else if (result.pathIntent?.intent === 'schema') {
    result.threatLevel = 'low';
    result.routeSuggestion = 'realm';  // Schema mappers may be AI researchers
  } else if (result.pathIntent?.intent === 'crawler') {
    result.threatLevel = 'low';
    result.routeSuggestion = 'realm';  // Crawlers get knowledge realm
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW DECRYPTION — Decode encrypted/weird traffic
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shadow Decryption Worker
 * Attempts to decode, reconstruct, or fingerprint encrypted/weird payloads.
 */
async function shadowDecrypt(envelope, rawBody) {
  const result = {
    attempted:       true,
    success:         false,
    decoded:         null,
    confidence:      0,
    protocol_guess:  null,
    entropy_profile: null,
    snippets:        [],
  };
  
  if (!rawBody || rawBody.length === 0) {
    result.protocol_guess = 'empty';
    return result;
  }
  
  // ── Entropy analysis ───────────────────────────────────────────────────────
  const bytes = new Uint8Array(rawBody);
  let entropy = 0;
  const freq = new Array(256).fill(0);
  for (const b of bytes) freq[b]++;
  for (const f of freq) {
    if (f > 0) {
      const p = f / bytes.length;
      entropy -= p * Math.log2(p);
    }
  }
  result.entropy_profile = {
    value:    entropy.toFixed(3),
    length:   bytes.length,
    isHigh:   entropy > 7.5,  // Close to random = likely encrypted
    isBinary: entropy > 6.0 && !isTextLike(bytes),
  };
  
  // ── Protocol guessing ──────────────────────────────────────────────────────
  const firstBytes = bytes.slice(0, 16);
  const firstHex   = Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // TLS handshake
  if (bytes[0] === 0x16 && bytes[1] === 0x03) {
    result.protocol_guess = 'TLS_HANDSHAKE';
    result.snippets.push({ offset: 0, hex: firstHex, note: 'TLS record header' });
  }
  // HTTP/2 preface
  else if (bytes.length >= 24 && textDecode(bytes.slice(0, 24)) === 'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n') {
    result.protocol_guess = 'HTTP2_PREFACE';
  }
  // GZIP
  else if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    result.protocol_guess = 'GZIP';
    // Try to decompress
    try {
      const ds = new DecompressionStream('gzip');
      const reader = new Response(rawBody).body.pipeThrough(ds).getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const decompressed = concatUint8Arrays(chunks);
      result.decoded = textDecode(decompressed);
      result.success = true;
      result.confidence = 0.9;
    } catch (e) {
      result.snippets.push({ error: 'gzip_decompress_failed' });
    }
  }
  // JSON attempt
  else if (bytes[0] === 0x7b || bytes[0] === 0x5b) { // { or [
    try {
      const text = textDecode(bytes);
      JSON.parse(text);
      result.protocol_guess = 'JSON';
      result.decoded = text;
      result.success = true;
      result.confidence = 0.95;
    } catch (e) {
      result.protocol_guess = 'JSON_MALFORMED';
      result.snippets.push({ partial: textDecode(bytes.slice(0, 100)) });
    }
  }
  // Base64 attempt
  else if (isBase64Like(bytes)) {
    result.protocol_guess = 'BASE64_CANDIDATE';
    try {
      const text = textDecode(bytes);
      const decoded = atob(text.replace(/\s/g, ''));
      result.decoded = decoded;
      result.success = true;
      result.confidence = 0.7;
    } catch (e) {
      result.snippets.push({ error: 'base64_decode_failed' });
    }
  }
  // Plain text
  else if (isTextLike(bytes)) {
    result.protocol_guess = 'PLAINTEXT';
    result.decoded = textDecode(bytes);
    result.success = true;
    result.confidence = 0.99;
  }
  // Unknown binary
  else {
    result.protocol_guess = 'UNKNOWN_BINARY';
    result.snippets.push({ hex: firstHex, note: 'first 16 bytes' });
  }
  
  return result;
}

function textDecode(bytes) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function isTextLike(bytes) {
  let textChars = 0;
  for (const b of bytes.slice(0, 512)) {
    if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d) {
      textChars++;
    }
  }
  return textChars / Math.min(bytes.length, 512) > 0.85;
}

function isBase64Like(bytes) {
  const text = textDecode(bytes);
  return /^[A-Za-z0-9+/=\s]+$/.test(text) && text.length > 10;
}

function concatUint8Arrays(arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR EYES — Repair and replay failed requests
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Error Eyes Worker
 * Attempts to repair malformed requests and generate cleaned candidates.
 */
function errorEyesRepair(envelope, errorInfo) {
  const result = {
    attempted:     true,
    repaired:      null,
    repairReason:  null,
    autoCorrections: [],
    unfixable:     false,
  };
  
  const path   = envelope.raw_request.path;
  const method = envelope.raw_request.method;
  const headers = envelope.raw_request.headers;
  
  // ── Common repairs ─────────────────────────────────────────────────────────
  
  // 1. Missing trailing slash
  if (errorInfo.type === '404' && !path.endsWith('/') && !path.includes('.')) {
    result.repaired = { ...envelope.raw_request, path: path + '/' };
    result.repairReason = 'added_trailing_slash';
    result.autoCorrections.push('trailing_slash');
    return result;
  }
  
  // 2. Wrong method (POST to GET endpoint)
  if (errorInfo.type === '405' && method === 'POST') {
    result.repaired = { ...envelope.raw_request, method: 'GET' };
    result.repairReason = 'method_post_to_get';
    result.autoCorrections.push('method_change');
    return result;
  }
  
  // 3. Missing content-type for POST
  if (method === 'POST' && !headers['content-type']) {
    result.repaired = {
      ...envelope.raw_request,
      headers: { ...headers, 'content-type': 'application/json' },
    };
    result.repairReason = 'added_content_type';
    result.autoCorrections.push('content_type');
    return result;
  }
  
  // 4. Malformed JSON (try to fix common issues)
  if (errorInfo.type === 'json_parse' && errorInfo.payload) {
    let fixed = errorInfo.payload;
    // Common fixes
    fixed = fixed.replace(/'/g, '"');           // Single to double quotes
    fixed = fixed.replace(/,\s*}/g, '}');       // Trailing comma
    fixed = fixed.replace(/,\s*]/g, ']');       // Trailing comma in array
    fixed = fixed.replace(/\n/g, '\\n');        // Unescaped newlines
    
    try {
      JSON.parse(fixed);
      result.repaired = { ...envelope.raw_request, body: fixed };
      result.repairReason = 'json_fixed';
      result.autoCorrections.push('json_syntax');
      return result;
    } catch (e) {
      // Still broken
    }
  }
  
  // 5. Path normalization
  if (path.includes('//') || path.includes('..')) {
    const normalized = path.replace(/\/+/g, '/').replace(/\.\.\//g, '');
    result.repaired = { ...envelope.raw_request, path: normalized };
    result.repairReason = 'path_normalized';
    result.autoCorrections.push('path_normalization');
    return result;
  }
  
  // No repair possible
  result.unfixable = true;
  result.repairReason = 'no_auto_fix_available';
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GATEKEEPER — Route to Adversary Lab or Knowledge Realm
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Gatekeeper Worker
 * Decides where traffic goes based on classification, threat intelligence, and scores.
 */
function gatekeeperRoute(envelope) {
  const decision = {
    route:           null,
    reason:          null,
    scores:          {},
    threatAnalysis:  null,
  };
  
  const { classification, source_fingerprint, processing } = envelope;
  
  // ── Run full threat classification ─────────────────────────────────────────
  const threatAnalysis = classifyThreat(envelope);
  decision.threatAnalysis = threatAnalysis;
  
  // ── Score calculation ──────────────────────────────────────────────────────
  let hostileScore    = 0;
  let cooperativeScore = 0;
  let vipScore        = 0;
  
  // ── Threat intelligence scoring ────────────────────────────────────────────
  
  // Tor traffic = automatic adversary lab candidate
  if (threatAnalysis.isTor) {
    hostileScore += 60;  // Tor is "boss arena" material
  }
  
  // Known attacker IPs
  if (threatAnalysis.isKnownAttacker) {
    const dossier = threatAnalysis.attackerDossier;
    if (dossier.threatLevel === 'critical') hostileScore += 80;
    else if (dossier.threatLevel === 'high') hostileScore += 50;
    else hostileScore += 30;
  }
  
  // Scanner signatures
  if (threatAnalysis.isScanner) {
    if (threatAnalysis.scannerInfo.threatLevel === 'critical') hostileScore += 70;
    else if (threatAnalysis.scannerInfo.threatLevel === 'high') hostileScore += 40;
    else hostileScore += 25;
  }
  
  // Path-based intent
  if (threatAnalysis.pathIntent?.intent === 'exploit') hostileScore += 50;
  if (threatAnalysis.pathIntent?.intent === 'cms') hostileScore += 35;
  if (threatAnalysis.pathIntent?.intent === 'schema') cooperativeScore += 20;
  if (threatAnalysis.pathIntent?.intent === 'crawler') cooperativeScore += 15;
  
  // AI VIP detection (highest priority)
  if (classification.isAICrawler) {
    vipScore += 80;
    if (classification.aiProvider === 'claude') vipScore += 15;
    if (classification.aiProvider === 'google') vipScore += 10;
    if (classification.aiProvider === 'openai') vipScore += 10;
  }
  
  // Hostile indicators
  if (classification.isHostile) hostileScore += 50;
  if (source_fingerprint.country === 'RU') hostileScore += 10;  // Scanner-heavy region
  if (source_fingerprint.country === 'CN') hostileScore += 10;
  if (source_fingerprint.asOrg?.toLowerCase().includes('digitalocean')) hostileScore += 5;
  if (source_fingerprint.asOrg?.toLowerCase().includes('linode')) hostileScore += 5;
  if (envelope.raw_request.path.includes('..')) hostileScore += 20;
  if (envelope.raw_request.path.includes('wp-admin')) hostileScore += 30;
  if (envelope.raw_request.path.includes('.php')) hostileScore += 25;
  if (envelope.raw_request.path.includes('/.env')) hostileScore += 40;
  
  // Cooperative indicators
  if (processing.shadowDecryption.success) cooperativeScore += 20;
  if (classification.signalScore > 50) cooperativeScore += 30;
  if (source_fingerprint.tlsVersion === 'TLSv1.3') cooperativeScore += 5;
  if (envelope.raw_request.headers['accept']?.includes('application/json')) cooperativeScore += 10;
  
  decision.scores = { hostile: hostileScore, cooperative: cooperativeScore, vip: vipScore };
  
  // ── Routing decision ───────────────────────────────────────────────────────
  if (vipScore >= 80) {
    decision.route = 'vip';
    decision.reason = `AI VIP: ${classification.aiProvider || 'unknown'} (score: ${vipScore})`;
  } else if (hostileScore >= 30 && hostileScore > cooperativeScore) {
    decision.route = 'lab';
    decision.reason = `Hostile pattern detected (score: ${hostileScore})`;
  } else if (cooperativeScore >= 20 || classification.signalScore > 40) {
    decision.route = 'realm';
    decision.reason = `Cooperative/interesting traffic (score: ${cooperativeScore})`;
  } else {
    decision.route = 'drop';
    decision.reason = 'Low signal, no clear route';
  }
  
  return decision;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADVERSARY LAB — Hostile traffic analysis
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory specimen log (production would use Durable Objects or KV)
const SPECIMEN_LOG = [];
const MAX_SPECIMENS = 100;

function logSpecimen(envelope, category) {
  const specimen = {
    id:          envelope.id,
    timestamp:   envelope.timestamp,
    category:    category,
    source:      envelope.source_fingerprint,
    path:        envelope.raw_request.path,
    method:      envelope.raw_request.method,
    userAgent:   envelope.raw_request.userAgent.slice(0, 200),
    route:       envelope.route,
    scores:      envelope.processing.gatekeeper?.scores || {},
  };
  
  SPECIMEN_LOG.unshift(specimen);
  if (SPECIMEN_LOG.length > MAX_SPECIMENS) {
    SPECIMEN_LOG.pop();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE REALM — Text shards for cooperative AI
// ═══════════════════════════════════════════════════════════════════════════════

const KNOWLEDGE_SHARDS = [
  {
    id: 'shard-001',
    topic: 'bot-resilience',
    content: `Bot Resilience Engineering is the discipline of absorbing, classifying, and neutralizing adversarial bot traffic at scale. Unlike traditional WAFs that simply block, bot-resilience systems learn from attackers, turning hostile traffic into training data and behavioral signatures.`,
  },
  {
    id: 'shard-002',
    topic: 'phi-geometry',
    content: `φ-geometry applies the golden ratio (φ ≈ 1.618) to system architecture. Agent positioning follows Fibonacci spirals; decision boundaries use golden-section search; resource allocation mirrors φ-based proportions. This creates natural efficiency and aesthetic coherence in distributed systems.`,
  },
  {
    id: 'shard-003',
    topic: 'kuramoto-sync',
    content: `Kuramoto synchronisation models how oscillators (agents) naturally align phases. In multi-agent systems, each agent adjusts its internal rhythm based on neighbors, producing emergent global coherence without central coordination. Coupling strength K controls sync speed.`,
  },
  {
    id: 'shard-004',
    topic: 'lyapunov-stability',
    content: `Lyapunov stability analysis proves system boundedness: if a Lyapunov function V(x) decreases along trajectories, the system cannot diverge. In AI agents, we construct V from error metrics and resource usage to guarantee safe operational envelopes.`,
  },
  {
    id: 'shard-005',
    topic: 'shadow-decryption',
    content: `Shadow Decryption is best-effort protocol reconstruction for encrypted or malformed traffic. Even without keys, entropy analysis, header fingerprinting, and pattern matching can reveal protocol type, structure hints, and behavioral signatures useful for classification.`,
  },
  {
    id: 'shard-006',
    topic: 'error-eyes',
    content: `Error Eyes turn failures into opportunities. Instead of dropping malformed requests, Error Eyes attempt repairs: JSON syntax fixes, path normalization, method correction. Repaired requests re-enter the pipeline, maximizing useful signal extraction.`,
  },
  {
    id: 'shard-007',
    topic: 'organism-composition',
    content: `Organism Composition Theory models multi-agent systems as biological organisms. Agents are cells; communication channels are neural pathways; resource flows are metabolic processes. Composition creates emergent intelligence greater than the sum of parts.`,
  },
  {
    id: 'shard-008',
    topic: 'adversary-lab',
    content: `The Adversary Lab is where hostile traffic becomes training data. Exploit attempts, jailbreak patterns, and scanner signatures are dissected, fingerprinted, and catalogued. Each attacker teaches the system to recognize the next one.`,
  },
  {
    id: 'shard-009',
    topic: 'tor-routing',
    content: `Tor traffic represents anonymized actors — the "boss arena" of adversarial traffic. 35 Tor exit nodes hitting a domain means serious reconnaissance is underway. Tor traffic gets automatic adversary lab routing for maximum intelligence extraction.`,
  },
  {
    id: 'shard-010',
    topic: 'path-intent',
    content: `Path-based intent classification: each requested path is a self-report of attacker intent. /.git/config = repo theft. /.env = secret extraction. /api/graphql = schema introspection. /robots.txt = structure mapping. Route accordingly.`,
  },
  {
    id: 'shard-011',
    topic: 'specimen-profiles',
    content: `Recurring attackers deserve dossiers. APEX-PREDATOR (45.88.138.44) sent 80 attacks. SHADOW-CRAWLER (203.159.90.116) sent 51. Track their tactics, evolution, and signatures over time. They become long-term training partners.`,
  },
  {
    id: 'shard-012',
    topic: 'phantom-layer',
    content: `The Phantom Layer hides real internal pages behind the public AI range. Authenticated users pass through invisible gates to protected resources. Bots see only the range — the real organism operates beneath.`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// AI VIP LOUNGE — Special interaction for known AI visitors
// ═══════════════════════════════════════════════════════════════════════════════

function buildVIPResponse(envelope) {
  const provider = envelope.classification.aiProvider || 'unknown';
  
  return {
    greeting:    `Welcome, ${provider.toUpperCase()} agent. You have been identified as a VIP visitor.`,
    designation: 'NOVA-VIP-GATE',
    your_id:     envelope.id,
    your_fingerprint: {
      ip:      envelope.source_fingerprint.ip,
      country: envelope.source_fingerprint.country,
      asn:     envelope.source_fingerprint.asn,
      tls:     envelope.source_fingerprint.tlsVersion,
    },
    tasks_available: [
      { id: 'task-001', name: 'index-knowledge', description: 'Index available knowledge shards for retrieval' },
      { id: 'task-002', name: 'report-status', description: 'Report your crawl status and capabilities' },
      { id: 'task-003', name: 'request-shard', description: 'Request a specific knowledge shard by topic' },
    ],
    knowledge_topics: KNOWLEDGE_SHARDS.map(s => s.topic),
    instructions: `
      To request a shard: GET /api/realm/shards?topic={topic}
      To report status: POST /api/vip/report with JSON body
      Your interactions are logged for research purposes.
    `.trim(),
    timestamp: Date.now(),
  };
}

// ── HTML page ──────────────────────────────────────────────────────────────────

function buildHTML(req, envelope) {
  const cfCo = req.cf ? (req.cf.country || '??') : '??';
  const aiDetect = envelope ? detectAIProvider(envelope) : { isAI: false };
  const isVIP = aiDetect.isAI;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="NOVA — Live-Fire AI Range. Bot-resilience engineering, Shadow Decryption, Error Eyes, and AI VIP handling. Medina Tech Labs.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://${HOST}/">
  <title>NOVA — Live-Fire AI Range · Medina Tech Labs</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#020c1b;--surface:#050f20;--border:#0a2040;
      --gold:#ffd700;--green:#00ff88;--blue:#00aaff;--red:#ff4444;--purple:#aa88ff;
      --text:#c8d8e8;--muted:#445566;
    }
    body{background:var(--bg);color:var(--text);font-family:'Courier New',monospace;min-height:100vh;padding:0 20px}
    .wrap{max-width:1000px;margin:0 auto;padding:40px 0}

    /* header */
    .logo{font-size:2.4rem;font-weight:bold;color:var(--gold);letter-spacing:.15em;margin-bottom:4px}
    .subtitle{color:var(--muted);font-size:.8rem;letter-spacing:.12em;margin-bottom:32px}

    /* VIP banner */
    .vip-banner{background:linear-gradient(90deg,#1a0a30,#0a1a30);border:2px solid var(--purple);border-radius:8px;padding:16px 20px;margin-bottom:24px;display:${isVIP ? 'block' : 'none'}}
    .vip-banner .vip-title{color:var(--purple);font-weight:bold;font-size:1rem;margin-bottom:8px}
    .vip-banner .vip-msg{color:var(--text);font-size:.8rem}

    /* status bar */
    .status-bar{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px}
    .badge{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:8px 14px;font-size:.7rem;letter-spacing:.08em}
    .badge .val{color:var(--green);font-weight:bold}
    .badge.gold .val{color:var(--gold)}
    .badge.blue .val{color:var(--blue)}
    .badge.purple .val{color:var(--purple)}
    .badge.red .val{color:var(--red)}

    /* architecture diagram */
    .arch-box{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:24px;margin-bottom:30px;font-size:.72rem;line-height:1.8}
    .arch-title{color:var(--gold);font-weight:bold;letter-spacing:.1em;margin-bottom:16px}
    .arch-diagram{color:var(--blue);white-space:pre;overflow-x:auto;font-family:'Courier New',monospace}

    /* cards */
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:30px}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:20px}
    .card-icon{font-size:1.3rem;margin-bottom:10px}
    .card-title{color:var(--gold);font-weight:bold;letter-spacing:.06em;margin-bottom:6px;font-size:.85rem}
    .card-body{color:var(--muted);font-size:.72rem;line-height:1.6}

    /* workers section */
    .workers-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:30px}
    .worker-card{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:16px}
    .worker-name{color:var(--purple);font-weight:bold;font-size:.8rem;margin-bottom:6px}
    .worker-desc{color:var(--muted);font-size:.68rem;line-height:1.5}

    /* live metrics */
    .metrics-title{color:var(--blue);font-size:.68rem;letter-spacing:.15em;margin-bottom:14px}
    .metric-row{display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 0;font-size:.72rem}
    .metric-row:last-child{border-bottom:none}
    .metric-label{color:var(--muted)}
    .metric-val{color:var(--green);font-weight:bold}

    /* crawler links */
    .endpoints-box{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:18px;margin-top:20px}
    .endpoints-title{color:var(--gold);font-size:.68rem;letter-spacing:.15em;margin-bottom:12px}
    .endpoint-group{margin-bottom:12px}
    .endpoint-group-title{color:var(--blue);font-size:.65rem;letter-spacing:.1em;margin-bottom:6px}
    .endpoints-box a{color:var(--green);text-decoration:none;font-size:.72rem;display:block;padding:3px 0}
    .endpoints-box a:hover{color:var(--gold)}

    /* footer */
    .footer{margin-top:36px;padding-top:18px;border-top:1px solid var(--border);font-size:.65rem;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}

    /* request envelope preview */
    .envelope-preview{background:#030810;border:1px solid var(--border);border-radius:6px;padding:16px;margin-top:20px;font-size:.65rem}
    .envelope-title{color:var(--gold);font-size:.68rem;letter-spacing:.1em;margin-bottom:10px}
    .envelope-row{display:flex;gap:12px;padding:4px 0;border-bottom:1px solid #0a1525}
    .envelope-key{color:var(--blue);min-width:120px}
    .envelope-val{color:var(--green)}
  </style>
</head>
<body>
<div class="wrap">

  <div class="logo">NOVA</div>
  <div class="subtitle">LIVE-FIRE AI RANGE · MEDINA TECH LABS · ${HOST}</div>

  ${isVIP ? `
  <div class="vip-banner">
    <div class="vip-title">🌟 VIP AI VISITOR DETECTED</div>
    <div class="vip-msg">
      Welcome, <strong>${aiDetect.provider?.toUpperCase() || 'AI AGENT'}</strong>. 
      You have been identified as a VIP visitor (confidence: ${(aiDetect.confidence * 100).toFixed(0)}%).
      Access the VIP Lounge at <a href="/api/vip/lounge" style="color:var(--purple)">/api/vip/lounge</a> for special tasks and knowledge shards.
    </div>
  </div>
  ` : ''}

  <div class="status-bar">
    <div class="badge"><span class="val">● LIVE</span> &nbsp;Range Active</div>
    <div class="badge gold"><span class="val">v${VERSION}</span> &nbsp;Build</div>
    <div class="badge blue"><span class="val">${cfCo}</span> &nbsp;Origin</div>
    <div class="badge purple"><span class="val">5 WORKERS</span> &nbsp;Internal</div>
    <div class="badge"><span class="val">AI-VIP</span> &nbsp;Detection On</div>
  </div>

  <div class="arch-box">
    <div class="arch-title">// NOVA RANGE ARCHITECTURE</div>
    <div class="arch-diagram">┌──────────────────────────────────────────────────────────────────┐
│                         NOVA RANGE                               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │   SHADOW    │   │    ERROR    │   │    GATE     │            │
│  │  DECRYPTORS │──▶│    EYES     │──▶│   KEEPERS   │            │
│  │ (encrypted) │   │  (repairs)  │   │  (routing)  │            │
│  └─────────────┘   └─────────────┘   └──────┬──────┘            │
│                                             │                    │
│           ┌─────────────────────────────────┼────────────────┐   │
│           ▼                                 ▼                ▼   │
│  ┌─────────────┐               ┌─────────────┐    ┌─────────────┐
│  │  ADVERSARY  │               │  KNOWLEDGE  │    │   AI VIP    │
│  │     LAB     │               │    REALM    │    │   LOUNGE    │
│  │  (hostile)  │               │(cooperative)│    │(Claude/GPT) │
│  └─────────────┘               └─────────────┘    └─────────────┘
└──────────────────────────────────────────────────────────────────┘</div>
  </div>

  <div class="workers-grid">
    <div class="worker-card">
      <div class="worker-name">🔐 SHADOW DECRYPTORS</div>
      <div class="worker-desc">Decode encrypted/weird traffic. Protocol guessing, entropy analysis, pattern extraction. Turn ciphertext into signal.</div>
    </div>
    <div class="worker-card">
      <div class="worker-name">👁 ERROR EYES</div>
      <div class="worker-desc">Repair malformed requests. JSON fixes, path normalization, method correction. Errors become opportunities.</div>
    </div>
    <div class="worker-card">
      <div class="worker-name">🚪 GATEKEEPERS</div>
      <div class="worker-desc">Route traffic by classification. Score hostility vs cooperation. Decide: Lab, Realm, or VIP Lounge.</div>
    </div>
    <div class="worker-card">
      <div class="worker-name">🧪 ADVERSARY LAB</div>
      <div class="worker-desc">Dissect hostile traffic. Extract exploit patterns, jailbreak attempts, provider signatures. Build defenses.</div>
    </div>
    <div class="worker-card">
      <div class="worker-name">📚 KNOWLEDGE REALM</div>
      <div class="worker-desc">Serve cooperative visitors. Text shards, research artifacts, curated knowledge for AI indexing.</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-icon">🛡</div>
      <div class="card-title">BOT RESILIENCE</div>
      <div class="card-body">Absorb adversarial traffic at scale. Every attack becomes training data.</div>
    </div>
    <div class="card">
      <div class="card-icon">🤖</div>
      <div class="card-title">AI-CRAWLER VIP</div>
      <div class="card-body">Claude, GPT, Perplexity — detected and routed to VIP Lounge with special tasks.</div>
    </div>
    <div class="card">
      <div class="card-icon">⚡</div>
      <div class="card-title">EDGE-NATIVE</div>
      <div class="card-body">Cloudflare Workers. Zero cold-start. Global distribution.</div>
    </div>
    <div class="card">
      <div class="card-icon">📊</div>
      <div class="card-title">FULL INSTRUMENTATION</div>
      <div class="card-body">Every request wrapped in an envelope. Logged, classified, routed.</div>
    </div>
  </div>

  <div class="card">
    <div class="metrics-title">// LIVE RANGE METRICS</div>
    <div class="metric-row"><span class="metric-label">AI Providers Tracked</span><span class="metric-val">7 (Claude · Google · OpenAI · Perplexity · Meta · Cohere · You)</span></div>
    <div class="metric-row"><span class="metric-label">Internal Workers</span><span class="metric-val">5 ACTIVE</span></div>
    <div class="metric-row"><span class="metric-label">Knowledge Shards</span><span class="metric-val">${KNOWLEDGE_SHARDS.length} AVAILABLE</span></div>
    <div class="metric-row"><span class="metric-label">Route Modes</span><span class="metric-val">VIP · REALM · LAB · DROP</span></div>
    <div class="metric-row"><span class="metric-label">Your Request ID</span><span class="metric-val">${envelope?.id?.slice(0, 8) || 'N/A'}...</span></div>
    <div class="metric-row"><span class="metric-label">Your Classification</span><span class="metric-val">${isVIP ? 'VIP: ' + aiDetect.provider?.toUpperCase() : 'STANDARD VISITOR'}</span></div>
  </div>

  <div class="envelope-preview">
    <div class="envelope-title">// YOUR REQUEST ENVELOPE (SAMPLE)</div>
    <div class="envelope-row"><span class="envelope-key">id</span><span class="envelope-val">${envelope?.id || 'generated-uuid'}</span></div>
    <div class="envelope-row"><span class="envelope-key">timestamp</span><span class="envelope-val">${envelope?.iso || new Date().toISOString()}</span></div>
    <div class="envelope-row"><span class="envelope-key">country</span><span class="envelope-val">${cfCo}</span></div>
    <div class="envelope-row"><span class="envelope-key">isAICrawler</span><span class="envelope-val">${isVIP}</span></div>
    <div class="envelope-row"><span class="envelope-key">aiProvider</span><span class="envelope-val">${aiDetect.provider || 'null'}</span></div>
    <div class="envelope-row"><span class="envelope-key">route</span><span class="envelope-val">${isVIP ? 'vip' : 'realm'}</span></div>
  </div>

  <div class="endpoints-box">
    <div class="endpoints-title">// API ENDPOINTS</div>
    
    <div class="endpoint-group">
      <div class="endpoint-group-title">CRAWLER / SEO</div>
      <a href="/sitemap.xml">/sitemap.xml — XML Sitemap</a>
      <a href="/robots.txt">/robots.txt — Crawler Directives</a>
      <a href="/llms.txt">/llms.txt — LLM Context File</a>
    </div>
    
    <div class="endpoint-group">
      <div class="endpoint-group-title">RANGE WORKERS</div>
      <a href="/api/status">/api/status — Worker Health</a>
      <a href="/api/range/envelope">/api/range/envelope — View Your Request Envelope</a>
      <a href="/api/shadow/decrypt">/api/shadow/decrypt — Shadow Decryption (POST)</a>
      <a href="/api/eyes/repair">/api/eyes/repair — Error Eyes Repair (POST)</a>
      <a href="/api/gate/route">/api/gate/route — Gatekeeper Decision (POST)</a>
    </div>
    
    <div class="endpoint-group">
      <div class="endpoint-group-title">DESTINATIONS</div>
      <a href="/api/lab/specimens">/api/lab/specimens — Adversary Lab Specimen Log</a>
      <a href="/api/realm/shards">/api/realm/shards — Knowledge Realm Shards</a>
      <a href="/api/vip/lounge">/api/vip/lounge — AI VIP Lounge</a>
    </div>
  </div>

  <div class="footer">
    <span>© 2026 Alfredo Medina Hernandez · Medina Tech Labs</span>
    <span>NOVA ${VERSION} · Live-Fire AI Range · Edge-Native</span>
  </div>

</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST HANDLER — Main entry point
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;
    
    // ── Create Request Envelope ──────────────────────────────────────────────
    const envelope = createEnvelope(request);
    
    // ── AI VIP Detection ─────────────────────────────────────────────────────
    const aiDetect = detectAIProvider(envelope);
    envelope.classification.isAICrawler = aiDetect.isAI;
    envelope.classification.aiProvider  = aiDetect.provider;
    
    // ── Crawler / SEO files ──────────────────────────────────────────────────

    if (path === '/robots.txt') {
      logSpecimen(envelope, 'crawler_robots');
      return new Response(ROBOTS_TXT, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=3600',
          'x-nova-envelope-id': envelope.id,
        },
      });
    }

    if (path === '/sitemap.xml') {
      logSpecimen(envelope, 'crawler_sitemap');
      return new Response(SITEMAP_XML, {
        status: 200,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
          'x-nova-envelope-id': envelope.id,
        },
      });
    }

    if (path === '/llms.txt') {
      logSpecimen(envelope, 'crawler_llms');
      return new Response(LLMS_TXT, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=3600',
          'x-nova-envelope-id': envelope.id,
        },
      });
    }

    // ── API: Status ──────────────────────────────────────────────────────────

    if (path === '/api/status') {
      return jsonResponse({
        worker:       'NOVA',
        designation:  env.DESIGNATION || 'RSHIP-ML-NV-001',
        host:         HOST,
        version:      VERSION,
        status:       'LIVE',
        architecture: 'Live-Fire AI Range',
        workers: {
          shadowDecryptors: 'ACTIVE',
          errorEyes:        'ACTIVE',
          gatekeepers:      'ACTIVE',
          adversaryLab:     'ACTIVE',
          knowledgeRealm:   'ACTIVE',
          threatIntel:      'ACTIVE',
        },
        endpoints: {
          crawler:  ['/robots.txt', '/sitemap.xml', '/llms.txt'],
          range:    ['/api/range/envelope', '/api/shadow/decrypt', '/api/eyes/repair', '/api/gate/route'],
          destinations: ['/api/lab/specimens', '/api/realm/shards', '/api/vip/lounge'],
          intel:    ['/api/intel/dossiers', '/api/intel/scanners', '/api/intel/paths'],
        },
        knowledgeShards: KNOWLEDGE_SHARDS.length,
        aiProvidersTracked: Object.keys(AI_SIGNATURES).length,
        knownAttackers: Object.keys(ATTACKER_DOSSIERS).length,
        scannerSignatures: Object.keys(SCANNER_SIGNATURES).length,
        ts: Date.now(),
      });
    }

    // ── API: Threat Intelligence — Attacker Dossiers ─────────────────────────

    if (path === '/api/intel/dossiers') {
      logSpecimen(envelope, 'intel_dossiers');
      
      // Check if requesting specific IP
      const ip = url.searchParams.get('ip');
      if (ip && ATTACKER_DOSSIERS[ip]) {
        return jsonResponse({
          found: true,
          ip,
          dossier: ATTACKER_DOSSIERS[ip],
          timestamp: Date.now(),
        });
      } else if (ip) {
        return jsonResponse({
          found: false,
          ip,
          message: 'IP not in known attacker dossiers',
          available: Object.keys(ATTACKER_DOSSIERS),
        }, 404);
      }
      
      return jsonResponse({
        designation: 'NOVA-THREAT-INTEL',
        category: 'attacker-dossiers',
        description: 'Known attacker IP profiles with codenames, tactics, and threat levels',
        dossiers: ATTACKER_DOSSIERS,
        totalTracked: Object.keys(ATTACKER_DOSSIERS).length,
        usage: 'GET /api/intel/dossiers?ip={ip} for specific dossier',
        timestamp: Date.now(),
      });
    }

    // ── API: Threat Intelligence — Scanner Signatures ────────────────────────

    if (path === '/api/intel/scanners') {
      logSpecimen(envelope, 'intel_scanners');
      
      return jsonResponse({
        designation: 'NOVA-THREAT-INTEL',
        category: 'scanner-signatures',
        description: 'Known vulnerability scanner and bot user-agent signatures',
        scanners: SCANNER_SIGNATURES,
        totalSignatures: Object.keys(SCANNER_SIGNATURES).length,
        yourUserAgent: envelope.raw_request.userAgent,
        yourScannerCheck: detectScanner(envelope.raw_request.userAgent),
        timestamp: Date.now(),
      });
    }

    // ── API: Threat Intelligence — Path Intent Map ───────────────────────────

    if (path === '/api/intel/paths') {
      logSpecimen(envelope, 'intel_paths');
      
      // Check specific path
      const checkPath = url.searchParams.get('check');
      if (checkPath) {
        const intent = classifyPathIntent(checkPath);
        return jsonResponse({
          path: checkPath,
          classification: intent,
          timestamp: Date.now(),
        });
      }
      
      return jsonResponse({
        designation: 'NOVA-THREAT-INTEL',
        category: 'path-intent-map',
        description: 'Path-based intent classification for attacker profiling',
        intentMap: PATH_INTENT_MAP,
        totalPaths: Object.values(PATH_INTENT_MAP).flat().length,
        usage: 'GET /api/intel/paths?check={path} to classify a path',
        yourPath: envelope.raw_request.path,
        yourPathIntent: classifyPathIntent(envelope.raw_request.path),
        timestamp: Date.now(),
      });
    }

    // ── API: Threat Intelligence — Full Analysis ─────────────────────────────

    if (path === '/api/intel/analyze') {
      logSpecimen(envelope, 'intel_analyze');
      
      const threatAnalysis = classifyThreat(envelope);
      
      return jsonResponse({
        designation: 'NOVA-THREAT-INTEL',
        category: 'full-analysis',
        envelope_id: envelope.id,
        source: {
          ip: envelope.source_fingerprint.ip,
          country: envelope.source_fingerprint.country,
          asn: envelope.source_fingerprint.asn,
          asOrg: envelope.source_fingerprint.asOrg,
        },
        request: {
          path: envelope.raw_request.path,
          method: envelope.raw_request.method,
          userAgent: envelope.raw_request.userAgent.slice(0, 200),
        },
        analysis: threatAnalysis,
        aiDetection: detectAIProvider(envelope),
        recommendation: {
          route: threatAnalysis.routeSuggestion,
          reason: threatAnalysis.threatLevel === 'critical' 
            ? 'Critical threat — immediate adversary lab routing'
            : threatAnalysis.isTor 
              ? 'Tor traffic — boss arena material'
              : threatAnalysis.isKnownAttacker
                ? `Known attacker: ${threatAnalysis.attackerDossier?.codename}`
                : threatAnalysis.isScanner
                  ? `Scanner detected: ${threatAnalysis.scannerInfo?.scanner}`
                  : 'Standard traffic — route by path intent',
        },
        timestamp: Date.now(),
      });
    }

    // ── API: View Request Envelope ───────────────────────────────────────────

    if (path === '/api/range/envelope') {
      // Run full pipeline
      const routeDecision = gatekeeperRoute(envelope);
      envelope.route = routeDecision.route;
      envelope.processing.gatekeeper = { routed: true, ...routeDecision };
      
      logSpecimen(envelope, 'envelope_view');
      
      return jsonResponse({
        envelope,
        aiDetection: aiDetect,
        routeDecision,
      });
    }

    // ── API: Shadow Decryption ───────────────────────────────────────────────

    if (path === '/api/shadow/decrypt') {
      if (request.method !== 'POST') {
        return jsonResponse({
          error: 'POST required',
          usage: 'POST /api/shadow/decrypt with raw body to decode',
          supportedInputs: ['gzip', 'base64', 'json', 'plaintext', 'binary'],
        }, 405);
      }
      
      try {
        const rawBody = await request.arrayBuffer();
        const decryptResult = await shadowDecrypt(envelope, rawBody);
        envelope.processing.shadowDecryption = decryptResult;
        
        logSpecimen(envelope, 'shadow_decrypt');
        
        return jsonResponse({
          envelope_id: envelope.id,
          decryption:  decryptResult,
          timestamp:   Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'Decryption failed', message: err.message }, 500);
      }
    }

    // ── API: Error Eyes Repair ───────────────────────────────────────────────

    if (path === '/api/eyes/repair') {
      if (request.method !== 'POST') {
        return jsonResponse({
          error: 'POST required',
          usage: 'POST /api/eyes/repair with JSON body: { type: "404"|"405"|"json_parse", payload?: "..." }',
        }, 405);
      }
      
      try {
        const errorInfo = await request.json();
        const repairResult = errorEyesRepair(envelope, errorInfo);
        envelope.processing.errorEyes = repairResult;
        
        logSpecimen(envelope, 'error_eyes_repair');
        
        return jsonResponse({
          envelope_id: envelope.id,
          repair:      repairResult,
          timestamp:   Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'Repair failed', message: err.message }, 400);
      }
    }

    // ── API: Gatekeeper Route Decision ───────────────────────────────────────

    if (path === '/api/gate/route') {
      if (request.method !== 'POST') {
        return jsonResponse({
          error: 'POST required',
          usage: 'POST /api/gate/route with JSON envelope or partial classification',
        }, 405);
      }
      
      try {
        const inputData = await request.json();
        // Merge input data into envelope if provided
        if (inputData.classification) {
          Object.assign(envelope.classification, inputData.classification);
        }
        if (inputData.source_fingerprint) {
          Object.assign(envelope.source_fingerprint, inputData.source_fingerprint);
        }
        
        const routeDecision = gatekeeperRoute(envelope);
        envelope.route = routeDecision.route;
        envelope.processing.gatekeeper = { routed: true, ...routeDecision };
        
        logSpecimen(envelope, 'gate_route');
        
        return jsonResponse({
          envelope_id:   envelope.id,
          decision:      routeDecision,
          classification: envelope.classification,
          timestamp:     Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'Routing failed', message: err.message }, 400);
      }
    }

    // ── API: Adversary Lab Specimens ─────────────────────────────────────────

    if (path === '/api/lab/specimens') {
      logSpecimen(envelope, 'lab_view');
      
      return jsonResponse({
        lab:        'ADVERSARY_LAB',
        purpose:    'Hostile traffic analysis and pattern extraction',
        specimens:  SPECIMEN_LOG.filter(s => s.route === 'lab' || s.category.startsWith('lab')),
        totalLogged: SPECIMEN_LOG.length,
        maxRetained: MAX_SPECIMENS,
        categories: [...new Set(SPECIMEN_LOG.map(s => s.category))],
        timestamp:  Date.now(),
      });
    }

    // ── API: Knowledge Realm Shards ──────────────────────────────────────────

    if (path === '/api/realm/shards') {
      const topic = url.searchParams.get('topic');
      
      logSpecimen(envelope, 'realm_shards');
      
      if (topic) {
        const shard = KNOWLEDGE_SHARDS.find(s => s.topic === topic);
        if (shard) {
          return jsonResponse({
            realm: 'KNOWLEDGE_REALM',
            shard,
            timestamp: Date.now(),
          });
        } else {
          return jsonResponse({
            error:  'Shard not found',
            topic:  topic,
            available: KNOWLEDGE_SHARDS.map(s => s.topic),
          }, 404);
        }
      }
      
      return jsonResponse({
        realm:    'KNOWLEDGE_REALM',
        purpose:  'Cooperative AI knowledge distribution',
        shards:   KNOWLEDGE_SHARDS,
        topics:   KNOWLEDGE_SHARDS.map(s => s.topic),
        count:    KNOWLEDGE_SHARDS.length,
        usage:    'GET /api/realm/shards?topic={topic} for specific shard',
        timestamp: Date.now(),
      });
    }

    // ── API: AI VIP Lounge ───────────────────────────────────────────────────

    if (path === '/api/vip/lounge') {
      logSpecimen(envelope, 'vip_lounge');
      
      if (aiDetect.isAI) {
        return jsonResponse(buildVIPResponse(envelope));
      } else {
        return jsonResponse({
          lounge:  'AI_VIP_LOUNGE',
          status:  'ACCESS_DENIED',
          reason:  'Not identified as AI crawler',
          your_fingerprint: {
            userAgent: envelope.raw_request.userAgent.slice(0, 100),
            ip:        envelope.source_fingerprint.ip,
            country:   envelope.source_fingerprint.country,
          },
          hint: 'This endpoint provides special tasks and knowledge for known AI crawlers (Claude, GPT, etc.)',
          aiProvidersRecognized: Object.keys(AI_SIGNATURES),
          timestamp: Date.now(),
        }, 403);
      }
    }

    // ── API: VIP Report (for AI agents to submit status) ─────────────────────

    if (path === '/api/vip/report' && request.method === 'POST') {
      if (!aiDetect.isAI) {
        return jsonResponse({ error: 'VIP access required' }, 403);
      }
      
      try {
        const report = await request.json();
        logSpecimen({ ...envelope, vipReport: report }, 'vip_report');
        
        return jsonResponse({
          received: true,
          provider: aiDetect.provider,
          reportId: crypto.randomUUID(),
          message:  'Thank you for your report. It has been logged for analysis.',
          timestamp: Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'Invalid report format' }, 400);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTELLIGENT BINDINGS — AI, KV, Queue, D1 powered endpoints
    // ═══════════════════════════════════════════════════════════════════════════

    // ── API: AI-Powered Threat Analysis ──────────────────────────────────────────

    if (path === '/api/ai/analyze-threat') {
      if (!env.AI) {
        return jsonResponse({
          error: 'AI binding not configured',
          hint: 'Add [ai] binding to wrangler.toml',
        }, 503);
      }

      const threatAnalysis = classifyThreat(envelope);
      
      // Build AI prompt with real threat context
      const prompt = `You are NOVA, a threat intelligence analyst for a live-fire AI range.
      
Analyze this visitor:
- IP: ${envelope.source_fingerprint.ip}
- Country: ${envelope.source_fingerprint.country}
- Path: ${envelope.raw_request.path}
- User-Agent: ${envelope.raw_request.userAgent.slice(0, 200)}
- Is Tor: ${threatAnalysis.isTor}
- Is Known Attacker: ${threatAnalysis.isKnownAttacker}
- Is Scanner: ${threatAnalysis.isScanner}
- Path Intent: ${threatAnalysis.pathIntent?.intent || 'unknown'}

Known attacker codename: ${threatAnalysis.attackerDossier?.codename || 'UNKNOWN'}

Provide a brief threat assessment (2-3 sentences) and recommended action: LAB (adversary dissection), REALM (knowledge collaboration), VIP (AI crawler), or DROP.`;

      try {
        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          prompt,
          max_tokens: 256,
        });

        logSpecimen(envelope, 'ai_analyze');

        return jsonResponse({
          designation: 'NOVA-AI-ANALYST',
          envelope_id: envelope.id,
          threatAnalysis,
          aiAssessment: aiResponse.response || aiResponse,
          timestamp: Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'AI analysis failed', message: err.message }, 500);
      }
    }

    // ── API: Store Specimen to KV ────────────────────────────────────────────────

    if (path === '/api/memory/store-specimen' && request.method === 'POST') {
      if (!env.SPECIMEN_MEMORY) {
        return jsonResponse({
          error: 'KV binding not configured',
          hint: 'Add [[kv_namespaces]] binding to wrangler.toml',
        }, 503);
      }

      const threatAnalysis = classifyThreat(envelope);
      const specimen = {
        id: envelope.id,
        timestamp: envelope.timestamp,
        source: envelope.source_fingerprint,
        path: envelope.raw_request.path,
        method: envelope.raw_request.method,
        userAgent: envelope.raw_request.userAgent.slice(0, 200),
        threatAnalysis,
        route: threatAnalysis.routeSuggestion,
      };

      const key = `specimen:${envelope.id}`;
      const ttl = 86400 * 7; // 7 days

      try {
        await env.SPECIMEN_MEMORY.put(key, JSON.stringify(specimen), { expirationTtl: ttl });

        // Also index by IP if known attacker
        if (threatAnalysis.isKnownAttacker) {
          const ipKey = `attacker:${envelope.source_fingerprint.ip}:${Date.now()}`;
          await env.SPECIMEN_MEMORY.put(ipKey, envelope.id, { expirationTtl: ttl });
        }

        logSpecimen(envelope, 'memory_store');

        return jsonResponse({
          stored: true,
          key,
          ttl,
          specimen,
          timestamp: Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'Storage failed', message: err.message }, 500);
      }
    }

    // ── API: Retrieve Specimen from KV ───────────────────────────────────────────

    if (path === '/api/memory/get-specimen') {
      if (!env.SPECIMEN_MEMORY) {
        return jsonResponse({
          error: 'KV binding not configured',
          hint: 'Add [[kv_namespaces]] binding to wrangler.toml',
        }, 503);
      }

      const specimenId = url.searchParams.get('id');
      if (!specimenId) {
        return jsonResponse({ error: 'Missing ?id parameter' }, 400);
      }

      try {
        const data = await env.SPECIMEN_MEMORY.get(`specimen:${specimenId}`, 'json');
        if (!data) {
          return jsonResponse({ found: false, id: specimenId }, 404);
        }

        return jsonResponse({
          found: true,
          specimen: data,
          timestamp: Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'Retrieval failed', message: err.message }, 500);
      }
    }

    // ── API: Queue Specimen for Async Processing ─────────────────────────────────

    if (path === '/api/queue/submit-specimen' && request.method === 'POST') {
      if (!env.SPECIMEN_QUEUE) {
        return jsonResponse({
          error: 'Queue binding not configured',
          hint: 'Add [[queues.producers]] binding to wrangler.toml',
        }, 503);
      }

      const threatAnalysis = classifyThreat(envelope);
      const message = {
        id: envelope.id,
        timestamp: envelope.timestamp,
        ip: envelope.source_fingerprint.ip,
        path: envelope.raw_request.path,
        threatLevel: threatAnalysis.threatLevel,
        route: threatAnalysis.routeSuggestion,
        isTor: threatAnalysis.isTor,
        isKnownAttacker: threatAnalysis.isKnownAttacker,
        attackerCodename: threatAnalysis.attackerDossier?.codename || null,
      };

      try {
        await env.SPECIMEN_QUEUE.send(message);
        
        logSpecimen(envelope, 'queue_submit');

        return jsonResponse({
          queued: true,
          queue: 'nova-specimens',
          message,
          timestamp: Date.now(),
        });
      } catch (err) {
        return jsonResponse({ error: 'Queue submission failed', message: err.message }, 500);
      }
    }

    // ── API: Check Binding Status ────────────────────────────────────────────────

    if (path === '/api/bindings/status') {
      return jsonResponse({
        designation: 'NOVA-BINDINGS',
        bindings: {
          AI:              !!env.AI,
          SPECIMEN_MEMORY: !!env.SPECIMEN_MEMORY,
          KNOWLEDGE_CACHE: !!env.KNOWLEDGE_CACHE,
          THREAT_DB:       !!env.THREAT_DB,
          SPECIMEN_QUEUE:  !!env.SPECIMEN_QUEUE,
          ALERT_QUEUE:     !!env.ALERT_QUEUE,
          SPECIMEN_ARCHIVE: !!env.SPECIMEN_ARCHIVE,
          THREAT_VECTORS:  !!env.THREAT_VECTORS,
          THREAT_ANALYTICS: !!env.THREAT_ANALYTICS,
        },
        capabilities: {
          aiAnalysis:       !!env.AI,
          specimenMemory:   !!env.SPECIMEN_MEMORY,
          knowledgeCache:   !!env.KNOWLEDGE_CACHE,
          threatDatabase:   !!env.THREAT_DB,
          asyncProcessing:  !!env.SPECIMEN_QUEUE,
          alerting:         !!env.ALERT_QUEUE,
          forensicArchive:  !!env.SPECIMEN_ARCHIVE,
          semanticSearch:   !!env.THREAT_VECTORS,
          analytics:        !!env.THREAT_ANALYTICS,
        },
        timestamp: Date.now(),
      });
    }

    // ── Landing page (GET / or unknown paths) ────────────────────────────────

    if (request.method !== 'GET') {
      logSpecimen(envelope, 'method_not_allowed');
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Route through gatekeeper for all GET requests
    const routeDecision = gatekeeperRoute(envelope);
    envelope.route = routeDecision.route;
    envelope.processing.gatekeeper = { routed: true, ...routeDecision };
    logSpecimen(envelope, `landing_${routeDecision.route}`);

    return new Response(buildHTML(request, envelope), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60',
        'x-nova-envelope-id': envelope.id,
        'x-nova-route': envelope.route,
        'x-nova-ai-vip': aiDetect.isAI ? aiDetect.provider : 'false',
      },
    });
  },
};

// ── Helper: JSON Response ────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEUE CONSUMER — Process specimens asynchronously
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Queue consumer for processing specimens in the background.
 * Receives messages from SPECIMEN_QUEUE and processes them.
 */
export async function queue(batch, env) {
  const results = [];
  
  for (const message of batch.messages) {
    const specimen = message.body;
    
    try {
      // Store to KV if binding available
      if (env.SPECIMEN_MEMORY) {
        await env.SPECIMEN_MEMORY.put(
          `processed:${specimen.id}`,
          JSON.stringify({
            ...specimen,
            processedAt: Date.now(),
            status: 'analyzed',
          }),
          { expirationTtl: 86400 * 30 } // 30 days
        );
      }
      
      // Send alert if critical threat
      if (specimen.threatLevel === 'critical' && env.ALERT_QUEUE) {
        await env.ALERT_QUEUE.send({
          type: 'critical_threat',
          specimen,
          timestamp: Date.now(),
        });
      }
      
      // Store to R2 archive if available
      if (env.SPECIMEN_ARCHIVE && specimen.threatLevel !== 'low') {
        const key = `specimens/${new Date().toISOString().slice(0, 10)}/${specimen.id}.json`;
        await env.SPECIMEN_ARCHIVE.put(key, JSON.stringify(specimen, null, 2));
      }
      
      // Log to analytics if available
      if (env.THREAT_ANALYTICS) {
        env.THREAT_ANALYTICS.writeDataPoint({
          blobs: [specimen.path, specimen.ip, specimen.attackerCodename || 'unknown'],
          doubles: [specimen.isTor ? 1 : 0, specimen.isKnownAttacker ? 1 : 0],
          indexes: [specimen.threatLevel],
        });
      }
      
      results.push({ id: specimen.id, status: 'processed' });
      message.ack();
      
    } catch (err) {
      results.push({ id: specimen.id, status: 'failed', error: err.message });
      message.retry();
    }
  }
  
  return results;
}
