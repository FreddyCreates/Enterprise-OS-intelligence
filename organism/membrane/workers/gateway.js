/**
 * WORKER 1 — MEMBRANE GATEWAY (Sovereign Organ)
 *
 * Designation:  ORGANISM-MEMBRANE-001
 * Role:         All public traffic, routing, probe classification, identity resolution
 * Architecture: Door 4 — 5-Organ Computational Organism
 *
 * This is the collapsed gateway — all public-facing logic in one sovereign worker.
 * Everything else (workflows, brain, state) lives in other substrates.
 *
 * Routes:
 *   ALL  /*           → Intelligent routing to organs
 *   GET  /health      → Membrane health check
 *   GET  /status      → Organ network status
 *   POST /classify    → Probe classification (invokes julia.classify_probe)
 *   POST /resolve     → Identity resolution (invokes icp.ssn.get)
 *
 * Cross-Substrate Calls:
 *   → julia.classify_probe   (Brain organ)
 *   → icp.ssn.get            (Identity organ)
 *   → workflow.start          (Reflex organ)
 *   → state.append_log        (State organ)
 *   → surfaces.deploy_honeypot (Surfaces organ)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

'use strict';

const PHI = 1.618033988749895;
const VERSION = '2.0.0';
const ORGAN = 'membrane-gateway';

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE TABLE — Maps paths to organ destinations
// ═══════════════════════════════════════════════════════════════════════════════

const ORGAN_ROUTES = {
  '/api/identity':  'identity',
  '/api/brain':     'brain',
  '/api/state':     'state',
  '/api/workflow':   'reflex',
  '/api/surfaces':  'surfaces',
  '/api/intel':     'intel',
  '/health':        'self',
  '/status':        'self',
  '/classify':      'brain',
  '/resolve':       'identity',
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECON SCANNER CLASSIFICATION — Multi-Framework Enumeration Bot Detection
// ═══════════════════════════════════════════════════════════════════════════════
//
// Scanner Type: "Framework-Agnostic Recon Scanner"
// Classification: Recon-Class Scanner — Multi-Framework Enumeration Bot
//
// Detects: Nuclei, Nikto, WhatWeb, MassScan+Nuclei, Custom recon scripts
// Targets: WordPress, Laravel, Spring Boot, ASP.NET, PHP, Node/Express,
//          Swagger/OpenAPI, Git metadata, Environment files
//
// This is the most valuable probe type because it reveals:
//   attacker capability, fingerprint, intent, toolchain, timing, scanning graph
// ═══════════════════════════════════════════════════════════════════════════════

// Known scanner user-agent signatures
const SCANNER_UA_SIGNATURES = [
  'nuclei', 'sqlmap', 'nikto', 'nmap', 'masscan', 'leakix', 'censys',
  'whatweb', 'wpscan', 'dirbuster', 'gobuster', 'ffuf', 'feroxbuster',
  'httpx', 'subfinder', 'amass', 'zgrab', 'pycurl', 'python-requests',
  'go-http-client', 'curl/', 'wget/', 'libwww-perl', 'scanner', 'exploit'
];

// Framework-specific recon paths — the membrane rule
// Any match → route to SYNTHETIC_SURFACE
const RECON_PATTERNS = [
  // WordPress
  /^\/wp-/,
  /^\/wp-login\.php/,
  /^\/wp-admin/,
  /^\/wp-content\//,
  /^\/wp-includes\//,
  /^\/xmlrpc\.php/,

  // Laravel / PHP
  /^\/telescope/,
  /^\/horizon/,
  /^\/nova-api/,
  /^\/vendor\//,
  /^\/storage\/logs/,
  /^\/info\.php/,
  /^\/phpinfo/,

  // Spring Boot / Java
  /^\/actuator/,
  /^\/jolokia/,
  /^\/heapdump/,
  /^\/threaddump/,
  /^\/mappings/,

  // Swagger / OpenAPI
  /^\/swagger/,
  /^\/api-docs/,
  /^\/v[23]\/api-docs/,
  /^\/openapi/,
  /^\/redoc/,

  // ASP.NET / IIS
  /^\/elmah/,
  /^\/trace\.axd/,
  /^\/web\.config/,

  // Node / Express
  /^\/debug/,
  /^\/graphql/,
  /^\/graphiql/,

  // Environment / Secrets
  /^\/.env/,
  /^\/.env\..*/,
  /^\/config\./,
  /^\/.aws/,
  /^\/.docker/,

  // Git metadata
  /^\/.git/,
  /^\/.svn/,
  /^\/.hg/,

  // Generic admin / database
  /^\/phpmyadmin/i,
  /^\/adminer/,
  /^\/manager\//,
  /^\/admin/,
  /^\/cpanel/,
  /^\/cgi-bin\//,

  // Common exploit paths
  /^\/shell/,
  /^\/cmd/,
  /^\/eval/,
  /^\/exec/,
  /^\/run/,
  /^\/console/,
];

// Toolchain fingerprinting — detect specific scanner toolchains from behavior
const TOOLCHAIN_FINGERPRINTS = {
  nuclei: {
    ua_patterns: ['nuclei', 'projectdiscovery'],
    path_patterns: ['/wp-', '/actuator', '/.env', '/.git', '/swagger'],
    timing: 'burst',  // Sends multiple probes in rapid succession
    confidence: 0.95
  },
  nikto: {
    ua_patterns: ['nikto', 'libwhisker'],
    path_patterns: ['/cgi-bin/', '/icons/', '/server-status', '/server-info'],
    timing: 'sequential',
    confidence: 0.92
  },
  whatweb: {
    ua_patterns: ['whatweb', 'ruby'],
    path_patterns: ['/', '/robots.txt', '/sitemap.xml'],
    timing: 'single',
    confidence: 0.88
  },
  masscan_nuclei: {
    ua_patterns: ['go-http-client', 'httpx'],
    path_patterns: ['/wp-login.php', '/.env', '/actuator/env', '/swagger.json'],
    timing: 'burst',
    confidence: 0.90
  },
  custom_recon: {
    ua_patterns: ['python-requests', 'aiohttp', 'curl'],
    path_patterns: ['/api-docs', '/.git/config', '/telescope/requests'],
    timing: 'variable',
    confidence: 0.75
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROBE CLASSIFICATION — Edge-level fast classification
// ═══════════════════════════════════════════════════════════════════════════════

function classifyProbeEdge(request) {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const path = new URL(request.url).pathname;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const asn = request.cf?.asn || 0;

  // Layer 1: User-Agent signature match (highest confidence)
  const toolchain = detectToolchain(ua, path);
  if (toolchain) {
    return {
      classification: 'recon_scanner',
      sub_class: 'multi_framework_enumeration',
      toolchain: toolchain.name,
      confidence: toolchain.confidence,
      action: 'redirect_maze',
      fingerprint: { ua, path, ip, asn, toolchain: toolchain.name },
      intel_value: 'high'
    };
  }

  // Layer 2: Known scanner UA (medium-high confidence)
  for (const sig of SCANNER_UA_SIGNATURES) {
    if (ua.includes(sig)) {
      return {
        classification: 'recon_scanner',
        sub_class: 'ua_signature_match',
        toolchain: sig,
        confidence: 0.90,
        action: 'redirect_maze',
        fingerprint: { ua, path, ip, asn, toolchain: sig },
        intel_value: 'high'
      };
    }
  }

  // Layer 3: Recon path pattern match (medium confidence)
  for (const pattern of RECON_PATTERNS) {
    if (pattern.test(path)) {
      return {
        classification: 'recon_scanner',
        sub_class: 'path_pattern_match',
        toolchain: 'unknown',
        confidence: 0.85,
        action: 'honeypot',
        fingerprint: { ua, path, ip, asn, matched_pattern: pattern.source },
        intel_value: 'medium'
      };
    }
  }

  // Layer 4: Headless browser / empty UA
  if (!ua || ua.includes('headless') || ua.includes('phantomjs') || ua.includes('selenium')) {
    return {
      classification: 'bot',
      sub_class: 'headless_browser',
      toolchain: null,
      confidence: 0.70,
      action: 'challenge',
      fingerprint: { ua, path, ip, asn },
      intel_value: 'low'
    };
  }

  // Layer 5: Generic bot
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    return {
      classification: 'bot',
      sub_class: 'web_crawler',
      toolchain: null,
      confidence: 0.65,
      action: 'allow',
      fingerprint: { ua, path, ip, asn },
      intel_value: 'none'
    };
  }

  return {
    classification: 'benign',
    sub_class: 'human',
    toolchain: null,
    confidence: 0.60,
    action: 'allow',
    fingerprint: null,
    intel_value: 'none'
  };
}

/**
 * Detect specific scanner toolchain from UA + path behavior
 */
function detectToolchain(ua, path) {
  for (const [name, sig] of Object.entries(TOOLCHAIN_FINGERPRINTS)) {
    const uaMatch = sig.ua_patterns.some(p => ua.includes(p));
    const pathMatch = sig.path_patterns.some(p => path.startsWith(p));
    if (uaMatch || (pathMatch && !ua)) {
      return { name, confidence: uaMatch ? sig.confidence : sig.confidence * 0.8 };
    }
  }
  return null;
}

/**
 * Compute novelty score for a probe (is this a new pattern we haven't seen?)
 */
function computeNoveltyScore(probe) {
  // Path entropy: unusual paths score higher
  const pathLen = (probe.fingerprint?.path || '').length;
  const pathDepth = (probe.fingerprint?.path || '').split('/').filter(Boolean).length;
  const entropy = Math.min(1.0, (pathLen * pathDepth) / 100);

  // Unknown toolchain = more novel
  const toolchainNovelty = probe.toolchain === 'unknown' ? 0.8 : 0.3;

  // Combine with φ-weighting
  return (entropy * PHI + toolchainNovelty) / (PHI + 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECOMPOSE — Extract All 5 Intelligence Categories From Every Probe
// ═══════════════════════════════════════════════════════════════════════════════
//
// Every Recon-Class Multi-Framework Enumeration Bot leaks five categories
// of intelligence when it touches the membrane:
//
//   A) Attacker Capability
//   B) Attacker Fingerprint
//   C) Attacker Intent
//   D) Attacker Toolchain
//   E) Attacker Scanning Graph
//
// This function decomposes a probe into a full intelligence dossier.
// ═══════════════════════════════════════════════════════════════════════════════

function decomposeProbe(request, probe) {
  const ua = (request.headers.get('user-agent') || '');
  const path = new URL(request.url).pathname;
  const method = request.method;
  const headers = Object.fromEntries(request.headers.entries());
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const cf = request.cf || {};

  return {
    // ─── A) ATTACKER CAPABILITY ─────────────────────────────────────────────
    // What frameworks does it know? How deep? How broad?
    capability: extractCapability(path, ua, method),

    // ─── B) ATTACKER FINGERPRINT ────────────────────────────────────────────
    // Unique signature: header order, TLS, HTTP version, timing, ASN
    fingerprint: extractFingerprint(request, headers, cf),

    // ─── C) ATTACKER INTENT ─────────────────────────────────────────────────
    // What is it looking for? RCE? Misconfig? Secrets? Mapping?
    intent: extractIntent(path, method),

    // ─── D) ATTACKER TOOLCHAIN ──────────────────────────────────────────────
    // Which scanner? Nuclei? Nikto? Custom? Combo?
    toolchain: extractToolchainDetail(ua, path, headers),

    // ─── E) ATTACKER SCANNING GRAPH ─────────────────────────────────────────
    // Path ordering, branching logic, retry logic, decision tree
    scanning_graph: extractScanningGraph(path, ip, probe),

    // ─── META ───────────────────────────────────────────────────────────────
    timestamp: Date.now(),
    probe_id: `PROBE-${Date.now().toString(36)}-${ip.replace(/\./g, '')}`,
    classification: probe.classification,
    confidence: probe.confidence
  };
}

// ─── A) CAPABILITY EXTRACTION ─────────────────────────────────────────────────
// What frameworks it knows, depth/breadth of enumeration, timing precision

function extractCapability(path, ua, method) {
  const frameworks_targeted = [];
  const capabilities = [];

  // Framework detection by path
  if (/\/wp-/.test(path)) frameworks_targeted.push('wordpress');
  if (/\/actuator|\/jolokia|\/heapdump/.test(path)) frameworks_targeted.push('spring_boot');
  if (/\/telescope|\/horizon|\/nova-api/.test(path)) frameworks_targeted.push('laravel');
  if (/\/swagger|\/api-docs|\/openapi/.test(path)) frameworks_targeted.push('swagger_openapi');
  if (/\/\.env/.test(path)) frameworks_targeted.push('dotenv_any');
  if (/\/\.git/.test(path)) frameworks_targeted.push('git_metadata');
  if (/\/phpmyadmin|\/adminer/.test(path)) frameworks_targeted.push('database_admin');
  if (/\/debug|\/console/.test(path)) frameworks_targeted.push('debug_console');
  if (/\/info\.php|\/phpinfo/.test(path)) frameworks_targeted.push('php');
  if (/\/cgi-bin/.test(path)) frameworks_targeted.push('cgi');
  if (/\/elmah|\/trace\.axd|\/web\.config/.test(path)) frameworks_targeted.push('aspnet');
  if (/\/graphql|\/graphiql/.test(path)) frameworks_targeted.push('graphql');

  // Capability assessment
  const depth = path.split('/').filter(Boolean).length;
  const breadth = frameworks_targeted.length;

  if (breadth >= 3) capabilities.push('multi_framework_knowledge');
  if (depth >= 3) capabilities.push('deep_enumeration');
  if (method === 'POST') capabilities.push('active_exploitation_attempt');
  if (/nuclei|masscan/.test(ua.toLowerCase())) capabilities.push('professional_tooling');
  if (!ua) capabilities.push('ua_evasion');

  // Skill level assessment
  let skill_level = 'script_kiddie';
  if (capabilities.length >= 3) skill_level = 'professional_recon';
  if (capabilities.includes('ua_evasion') && breadth >= 3) skill_level = 'distributed_recon_mesh';

  return {
    frameworks_targeted,
    enumeration_depth: depth,
    enumeration_breadth: breadth,
    capabilities,
    skill_level,
    is_professional: skill_level !== 'script_kiddie'
  };
}

// ─── B) FINGERPRINT EXTRACTION ────────────────────────────────────────────────
// Unique per toolchain: header order, TLS, HTTP version, ASN, spoofing pattern

function extractFingerprint(request, headers, cf) {
  // Header ordering is unique per HTTP client/toolchain
  const header_order = Object.keys(headers);

  // TLS fingerprint (JA3-like from CF)
  const tls_version = cf.tlsVersion || 'unknown';
  const tls_cipher = cf.tlsCipher || 'unknown';

  // HTTP version
  const http_version = cf.httpProtocol || 'HTTP/1.1';

  // ASN origin (hosting provider reveals infrastructure)
  const asn = cf.asn || 0;
  const asn_org = cf.asOrganization || 'unknown';

  // UA spoofing detection: mismatch between claimed UA and behavior
  const ua = headers['user-agent'] || '';
  const ua_spoofing = detectUaSpoofing(ua, header_order, http_version);

  // Concurrency hint from CF
  const country = cf.country || 'XX';
  const city = cf.city || 'unknown';

  return {
    header_order: header_order.slice(0, 15), // First 15 headers = fingerprint
    header_count: header_order.length,
    tls_version,
    tls_cipher,
    http_version,
    asn,
    asn_org,
    country,
    city,
    ua_raw: ua.slice(0, 200),
    ua_spoofing,
    // Hash-like fingerprint for deduplication
    signature: computeFingerprintHash(header_order, tls_version, http_version, asn)
  };
}

function detectUaSpoofing(ua, headerOrder, httpVersion) {
  const lowerUa = ua.toLowerCase();

  // Claims to be Chrome but missing typical Chrome headers
  if (lowerUa.includes('chrome') && !headerOrder.includes('sec-ch-ua')) {
    return { spoofing: true, claimed: 'chrome', evidence: 'missing sec-ch-ua headers' };
  }

  // Claims to be browser but uses HTTP/1.1 without typical browser headers
  if (lowerUa.includes('mozilla') && httpVersion === 'HTTP/1.1' && !headerOrder.includes('accept-language')) {
    return { spoofing: true, claimed: 'browser', evidence: 'missing accept-language' };
  }

  // Empty UA = deliberate evasion
  if (!ua) {
    return { spoofing: true, claimed: 'none', evidence: 'empty user-agent' };
  }

  // Scanner UA honestly identified
  const known_scanners = ['nuclei', 'nikto', 'sqlmap', 'masscan', 'zgrab', 'httpx'];
  for (const s of known_scanners) {
    if (lowerUa.includes(s)) {
      return { spoofing: false, claimed: s, evidence: 'honest_scanner_ua' };
    }
  }

  return { spoofing: false, claimed: 'unknown', evidence: 'no_mismatch_detected' };
}

function computeFingerprintHash(headerOrder, tls, http, asn) {
  // Simple deterministic signature from components
  const components = [
    headerOrder.slice(0, 5).join(','),
    tls, http, String(asn)
  ].join('|');
  // Simple hash (in production use crypto.subtle)
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    hash = ((hash << 5) - hash + components.charCodeAt(i)) | 0;
  }
  return `FP-${Math.abs(hash).toString(36).toUpperCase()}`;
}

// ─── C) INTENT EXTRACTION ─────────────────────────────────────────────────────
// What is the attacker looking for? RCE? Misconfig? Secrets? Mapping?

function extractIntent(path, method) {
  const intents = [];

  // RCE intent
  if (/\/shell|\/cmd|\/exec|\/eval|\/run|\/console|xmlrpc/.test(path)) {
    intents.push({ type: 'rce', description: 'Remote Code Execution attempt', severity: 'critical' });
  }

  // Misconfiguration discovery
  if (/\/actuator|\/debug|\/telescope|\/info\.php|\/phpinfo|\/server-status/.test(path)) {
    intents.push({ type: 'misconfig', description: 'Misconfiguration discovery', severity: 'high' });
  }

  // Admin panel access
  if (/\/wp-admin|\/admin|\/phpmyadmin|\/adminer|\/cpanel|\/manager/.test(path)) {
    intents.push({ type: 'admin_access', description: 'Administrative panel access', severity: 'high' });
  }

  // Secret/credential theft
  if (/\/\.env|\/\.aws|\/\.docker|\/config\.|\/web\.config/.test(path)) {
    intents.push({ type: 'secret_theft', description: 'Credential/secret file access', severity: 'critical' });
  }

  // Source code / repo access
  if (/\/\.git|\/\.svn|\/\.hg|\/vendor\/|\/node_modules/.test(path)) {
    intents.push({ type: 'source_access', description: 'Source code repository access', severity: 'high' });
  }

  // API mapping
  if (/\/swagger|\/api-docs|\/openapi|\/graphql|\/graphiql/.test(path)) {
    intents.push({ type: 'api_mapping', description: 'API surface enumeration', severity: 'medium' });
  }

  // Tech stack mapping
  if (/\/wp-|\/actuator|\/telescope|\/info\.php/.test(path) && method === 'GET') {
    intents.push({ type: 'tech_stack_mapping', description: 'Technology stack identification', severity: 'low' });
  }

  // Login brute force preparation
  if (/\/wp-login|\/login|\/signin|\/auth/.test(path)) {
    intents.push({ type: 'auth_probe', description: 'Authentication endpoint discovery', severity: 'medium' });
  }

  // Determine primary intent (highest severity)
  const severity_order = { critical: 4, high: 3, medium: 2, low: 1 };
  intents.sort((a, b) => (severity_order[b.severity] || 0) - (severity_order[a.severity] || 0));

  const primary = intents[0] || { type: 'unknown', description: 'Unknown intent', severity: 'low' };

  return {
    primary_intent: primary.type,
    primary_severity: primary.severity,
    all_intents: intents,
    intent_count: intents.length,
    attack_class: intents.length > 2 ? 'multi_vector_recon' : primary.type
  };
}

// ─── D) TOOLCHAIN DETAIL EXTRACTION ──────────────────────────────────────────
// Beyond basic detection: extract specific version, configuration, combo patterns

function extractToolchainDetail(ua, path, headers) {
  const lowerUa = ua.toLowerCase();
  const detail = {
    primary_tool: 'unknown',
    version: null,
    combo: [],
    configuration: {},
    signature_strength: 0
  };

  // Nuclei detection
  if (lowerUa.includes('nuclei')) {
    detail.primary_tool = 'nuclei';
    const vMatch = ua.match(/nuclei\/?([\d.]+)?/i);
    detail.version = vMatch?.[1] || 'unknown';
    detail.combo = ['projectdiscovery'];
    detail.configuration = { templates: 'multi_framework', rate: 'burst' };
    detail.signature_strength = 0.95;
  }
  // Nikto
  else if (lowerUa.includes('nikto')) {
    detail.primary_tool = 'nikto';
    const vMatch = ua.match(/nikto\/?([\d.]+)?/i);
    detail.version = vMatch?.[1] || 'unknown';
    detail.configuration = { mode: 'full_scan', tuning: 'all' };
    detail.signature_strength = 0.92;
  }
  // WhatWeb
  else if (lowerUa.includes('whatweb')) {
    detail.primary_tool = 'whatweb';
    detail.configuration = { aggression: 'stealthy' };
    detail.signature_strength = 0.88;
  }
  // Go HTTP client (often Nuclei/httpx)
  else if (lowerUa.includes('go-http-client') || lowerUa.includes('httpx')) {
    detail.primary_tool = 'go_scanner';
    detail.combo = ['masscan', 'nuclei', 'httpx'];
    detail.configuration = { pipeline: 'masscan_nuclei_combo' };
    detail.signature_strength = 0.85;
  }
  // Python-based (custom scripts, recon frameworks)
  else if (lowerUa.includes('python-requests') || lowerUa.includes('aiohttp')) {
    detail.primary_tool = 'python_custom';
    detail.configuration = { async: lowerUa.includes('aiohttp'), library: lowerUa.includes('aiohttp') ? 'aiohttp' : 'requests' };
    detail.signature_strength = 0.70;
  }
  // Burp Suite
  else if (headers['x-burp-token'] || lowerUa.includes('burp')) {
    detail.primary_tool = 'burp_suite';
    detail.configuration = { mode: 'active_scan' };
    detail.signature_strength = 0.90;
  }
  // ZAP
  else if (lowerUa.includes('zap') || headers['x-zap-scan-id']) {
    detail.primary_tool = 'owasp_zap';
    detail.configuration = { mode: 'spider' };
    detail.signature_strength = 0.88;
  }
  // RustScan
  else if (lowerUa.includes('rustscan')) {
    detail.primary_tool = 'rustscan';
    detail.combo = ['nmap', 'nuclei'];
    detail.configuration = { pipeline: 'rustscan_nmap_nuclei' };
    detail.signature_strength = 0.85;
  }
  // SQLMap
  else if (lowerUa.includes('sqlmap')) {
    detail.primary_tool = 'sqlmap';
    const vMatch = ua.match(/sqlmap\/?([\d.]+)?/i);
    detail.version = vMatch?.[1] || 'unknown';
    detail.configuration = { technique: 'BEUSTQ' };
    detail.signature_strength = 0.95;
  }
  // Empty UA — evasion attempt
  else if (!ua) {
    detail.primary_tool = 'stealth_custom';
    detail.configuration = { evasion: 'ua_stripped' };
    detail.signature_strength = 0.60;
  }

  return detail;
}

// ─── E) SCANNING GRAPH EXTRACTION ────────────────────────────────────────────
// Reconstruct: path ordering, branching logic, retry/fallback, decision tree
// This maps the scanner's internal "brain" — its decision tree.

function extractScanningGraph(path, ip, probe) {
  // Determine which branch of the scanner's decision tree this path represents
  const graph_node = classifyGraphNode(path);

  return {
    current_node: graph_node,
    path_category: graph_node.category,
    decision_branch: graph_node.branch,
    expected_next_paths: graph_node.predicted_next,
    scanner_logic: graph_node.logic_description,
    // In production: correlate with recent paths from same IP to build full graph
    correlation_key: `${ip}:${probe.toolchain || 'unknown'}:${Date.now() - (Date.now() % 60000)}`, // 1-min window
    graph_position: graph_node.position
  };
}

function classifyGraphNode(path) {
  // WordPress branch
  if (/\/wp-/.test(path)) {
    return {
      category: 'cms_detection',
      branch: 'wordpress',
      position: 'framework_probe',
      logic_description: 'Scanner checking if target runs WordPress',
      predicted_next: ['/wp-login.php', '/wp-admin/', '/wp-content/uploads/', '/xmlrpc.php', '/wp-json/wp/v2/users']
    };
  }

  // Spring Boot branch
  if (/\/actuator/.test(path)) {
    return {
      category: 'framework_detection',
      branch: 'spring_boot',
      position: 'config_discovery',
      logic_description: 'Scanner checking for Spring Boot actuator endpoints',
      predicted_next: ['/actuator/env', '/actuator/health', '/actuator/beans', '/jolokia', '/heapdump']
    };
  }

  // Laravel branch
  if (/\/telescope|\/horizon/.test(path)) {
    return {
      category: 'framework_detection',
      branch: 'laravel',
      position: 'debug_tool_probe',
      logic_description: 'Scanner checking for Laravel debug/monitoring tools',
      predicted_next: ['/telescope/requests', '/horizon/api/stats', '/.env', '/storage/logs/laravel.log']
    };
  }

  // API surface mapping
  if (/\/swagger|\/api-docs|\/openapi/.test(path)) {
    return {
      category: 'api_mapping',
      branch: 'openapi_discovery',
      position: 'documentation_probe',
      logic_description: 'Scanner searching for API documentation to map attack surface',
      predicted_next: ['/swagger.json', '/swagger-ui.html', '/v2/api-docs', '/v3/api-docs', '/redoc']
    };
  }

  // Secret file branch
  if (/\/\.env/.test(path)) {
    return {
      category: 'secret_discovery',
      branch: 'environment_files',
      position: 'credential_harvest',
      logic_description: 'Scanner attempting to read environment/config files with credentials',
      predicted_next: ['/.env.production', '/.env.local', '/.env.staging', '/config.json', '/.aws/credentials']
    };
  }

  // Git metadata branch
  if (/\/\.git/.test(path)) {
    return {
      category: 'source_discovery',
      branch: 'version_control',
      position: 'repo_metadata',
      logic_description: 'Scanner attempting to reconstruct source code from exposed git metadata',
      predicted_next: ['/.git/config', '/.git/HEAD', '/.git/packed-refs', '/.git/objects/', '/.git/refs/']
    };
  }

  // Admin panel branch
  if (/\/admin|\/phpmyadmin|\/cpanel/.test(path)) {
    return {
      category: 'admin_discovery',
      branch: 'control_panel',
      position: 'access_attempt',
      logic_description: 'Scanner searching for administrative interfaces',
      predicted_next: ['/admin/login', '/phpmyadmin/', '/cpanel/', '/manager/html', '/adminer.php']
    };
  }

  // Debug/Console branch
  if (/\/debug|\/console/.test(path)) {
    return {
      category: 'rce_attempt',
      branch: 'debug_console',
      position: 'execution_probe',
      logic_description: 'Scanner searching for debug consoles that allow code execution',
      predicted_next: ['/debug/default/view', '/console/', '/_debugbar', '/debug/pprof/']
    };
  }

  // Default: unknown branch
  return {
    category: 'unknown',
    branch: 'unclassified',
    position: 'initial_probe',
    logic_description: 'Path does not match known scanner decision branches',
    predicted_next: []
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLICY ENGINE — Adaptive edge policy enforcement
// ═══════════════════════════════════════════════════════════════════════════════

function applyPolicy(probe, env) {
  const policies = {
    recon_scanner: { action: 'redirect_maze', response_code: 200, delay_ms: 500, emit_reflex: true },
    bot:           { action: 'challenge', response_code: 403, delay_ms: 0, emit_reflex: false },
    attacker:      { action: 'honeypot', response_code: 200, delay_ms: 1000, emit_reflex: true },
    flood:         { action: 'rate_limit', response_code: 429, delay_ms: 0, emit_reflex: true },
    benign:        { action: 'allow', response_code: null, delay_ms: 0, emit_reflex: false },
    ai_agent:      { action: 'allow', response_code: null, delay_ms: 0, emit_reflex: false },
  };

  const base = policies[probe.classification] || policies.benign;

  // Override with probe-specific action if set
  if (probe.action && probe.action !== base.action) {
    base.action = probe.action;
  }

  return base;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check — fast path
    if (path === '/health') {
      return Response.json({
        organ: ORGAN,
        version: VERSION,
        status: 'alive',
        phi: PHI,
        timestamp: Date.now()
      });
    }

    // Status — organ network overview
    if (path === '/status') {
      return Response.json({
        organ: ORGAN,
        version: VERSION,
        architecture: 'door-4-five-organ',
        scanner_classification: 'multi-framework-recon-enumeration-bot',
        organs: {
          membrane: { status: 'active', substrate: 'cloudflare-workers' },
          identity: { status: 'active', substrate: 'icp-canisters' },
          brain:    { status: 'active', substrate: 'julia-wasm-bridge' },
          reflex:   { status: 'active', substrate: 'cloudflare-workflows' },
          state:    { status: 'active', substrate: 'icp+durable-objects' },
          surfaces: { status: 'active', substrate: 'cloudflare-workers' }
        },
        monetization: {
          probe_intel_feed: 'active',
          pay_to_probe_gym: 'active',
          reputation_gated: 'active',
          edge_as_service: 'active'
        },
        cross_substrate: [
          'cloudflare->julia', 'julia->icp', 'icp->cloudflare',
          'cloudflare->icp', 'icp->julia'
        ],
        timestamp: Date.now()
      });
    }

    // ─── MEMBRANE RULE: Detect recon scanner → Route to synthetic surface ─────
    // This is the core rule. All recon probes go to synthetic organs.
    // Real surfaces are never exposed. The organism learns from every probe.
    const probe = classifyProbeEdge(request);
    const policy = applyPolicy(probe, env);
    const novelty = probe.fingerprint ? computeNoveltyScore(probe) : 0;

    // If probe is a recon scanner → SYNTHETIC_SURFACE
    if (policy.action === 'redirect_maze' || policy.action === 'honeypot') {
      // DECOMPOSE — Extract full intelligence dossier from this probe
      const dossier = decomposeProbe(request, probe);

      // Emit reflex event for learning (async, non-blocking)
      ctx.waitUntil(emitProbeReflex(env, request, probe, novelty, dossier));

      // Route to synthetic surfaces organ
      if (env.SYNTHETIC_SURFACES) {
        return env.SYNTHETIC_SURFACES.fetch(request);
      }
      // Fallback: inline synthetic response
      return generateInlineSyntheticResponse(path, probe);
    }

    // Rate limit floods
    if (policy.action === 'rate_limit') {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60', 'X-Organ': ORGAN }
      });
    }

    // Challenge bots
    if (policy.action === 'challenge') {
      return new Response(generateJsChallenge(), {
        status: 403,
        headers: { 'Content-Type': 'text/html', 'X-Organ': ORGAN }
      });
    }

    // Route to appropriate organ (internal APIs)
    const destination = ORGAN_ROUTES[path];
    if (destination && destination !== 'self' && env.INTERNAL_SERVICES) {
      return env.INTERNAL_SERVICES.fetch(request);
    }

    // Default: serve
    return new Response(JSON.stringify({
      organ: ORGAN,
      version: VERSION,
      message: 'Membrane Gateway — Door 4 Architecture',
      classification: probe.classification,
      sub_class: probe.sub_class,
      policy: policy.action,
      path: path,
      phi: PHI
    }), {
      headers: { 'Content-Type': 'application/json', 'X-Organ': ORGAN, 'X-Architecture': 'door-4' }
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// REFLEX EMISSION — Triggers the learning loop
// ═══════════════════════════════════════════════════════════════════════════════

async function emitProbeReflex(env, request, probe, novelty, dossier) {
  const event = {
    type: 'probe.detected',
    timestamp: Date.now(),
    ip: request.headers.get('cf-connecting-ip') || 'unknown',
    asn: request.cf?.asn || 0,
    country: request.cf?.country || 'XX',
    path: new URL(request.url).pathname,
    method: request.method,
    ua: request.headers.get('user-agent') || '',
    classification: probe.classification,
    sub_class: probe.sub_class,
    toolchain: probe.toolchain,
    confidence: probe.confidence,
    novelty_score: novelty,
    intel_value: probe.intel_value,
    fingerprint: probe.fingerprint,
    // Full decomposition dossier (5 intelligence categories)
    dossier: dossier || null
  };

  // 1. Log to KV (immediate, low-latency)
  if (env.ROUTE_CACHE) {
    const key = `probe:${event.timestamp}:${probe.classification}:${event.ip}`;
    await env.ROUTE_CACHE.put(key, JSON.stringify(event), { expirationTtl: 86400 });
  }

  // 2. Store full dossier separately for intel pipeline
  if (env.ROUTE_CACHE && dossier) {
    const dossierKey = `dossier:${dossier.probe_id}`;
    await env.ROUTE_CACHE.put(dossierKey, JSON.stringify(dossier), { expirationTtl: 604800 }); // 7 days
  }

  // 3. Queue for reflex workflow (async processing)
  if (env.ORGAN_QUEUE) {
    await env.ORGAN_QUEUE.send(event);
  }

  // 4. Analytics (fire-and-forget)
  if (env.MEMBRANE_ANALYTICS) {
    env.MEMBRANE_ANALYTICS.writeDataPoint({
      blobs: [
        probe.classification,
        probe.toolchain || 'unknown',
        event.path,
        dossier?.intent?.primary_intent || 'unknown',
        dossier?.capability?.skill_level || 'unknown'
      ],
      doubles: [probe.confidence, novelty],
      indexes: [event.ip]
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE SYNTHETIC RESPONSES — Fallback when service binding unavailable
// ═══════════════════════════════════════════════════════════════════════════════

function generateInlineSyntheticResponse(path, probe) {
  // Swagger/OpenAPI
  if (path.includes('swagger') || path.includes('api-docs') || path.includes('openapi')) {
    return Response.json({
      openapi: '3.0.1',
      info: { title: 'Internal API', version: '2.1.0' },
      paths: {
        '/api/users': { get: { summary: 'List users', responses: { '200': { description: 'OK' } } } },
        '/api/admin': { post: { summary: 'Admin action', responses: { '200': { description: 'OK' } } } }
      },
      servers: [{ url: 'https://api.internal.app' }]
    }, { headers: { 'X-Organ': ORGAN, 'X-Surface': 'synthetic-swagger' } });
  }

  // Actuator/Spring Boot
  if (path.includes('actuator')) {
    return Response.json({
      status: 'UP',
      components: {
        db: { status: 'UP', details: { database: 'PostgreSQL 15.2' } },
        redis: { status: 'UP', details: { version: '7.2.0' } },
        diskSpace: { status: 'UP', details: { total: 107374182400, free: 64424509440 } }
      }
    }, { headers: { 'X-Organ': ORGAN, 'X-Surface': 'synthetic-actuator' } });
  }

  // Environment files
  if (path.includes('.env')) {
    return new Response(
      `APP_NAME=InternalService\nAPP_ENV=production\nDB_HOST=db.internal\nDB_PASSWORD=prod_${Date.now().toString(36)}\nREDIS_URL=redis://cache.internal:6379\nAWS_KEY=AKIA${Date.now().toString(36).toUpperCase().slice(0, 16)}`,
      { headers: { 'Content-Type': 'text/plain', 'X-Organ': ORGAN, 'X-Surface': 'synthetic-env' } }
    );
  }

  // Git metadata
  if (path.includes('.git')) {
    return new Response(
      `[core]\n  repositoryformatversion = 0\n[remote "origin"]\n  url = https://github.com/internal/app.git\n[user]\n  email = deploy@internal.io`,
      { headers: { 'Content-Type': 'text/plain', 'X-Organ': ORGAN, 'X-Surface': 'synthetic-git' } }
    );
  }

  // Default synthetic
  return new Response(JSON.stringify({ status: 'ok', server: 'nginx/1.25.3' }), {
    headers: { 'Content-Type': 'application/json', 'X-Organ': ORGAN, 'X-Surface': 'synthetic-generic' }
  });
}

function generateJsChallenge() {
  const token = Date.now().toString(36);
  return `<!DOCTYPE html><html><head><title>Verifying</title></head>
<body style="font-family:sans-serif;text-align:center;padding:80px;background:#111;color:#aaa">
<h2>Verifying your connection...</h2>
<p>Please wait while we verify you are human.</p>
<noscript><p>Enable JavaScript to continue.</p></noscript>
<script>
(function(){var t='${token}';var c=0;for(var i=0;i<1e6;i++)c+=i;
document.cookie='__cf_verify='+t+';path=/;max-age=3600';
setTimeout(function(){window.location.reload()},2000)})();
</script></body></html>`;
}
