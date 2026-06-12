#!/usr/bin/env node
/**
 * RSHIP Enterprise OS Intelligence — Deploy Verification Tool
 * ═════════════════════════════════════════════════════════════════
 * 
 * Post-deployment verification. Hits live endpoints to confirm
 * all workers are responding and bindings are active.
 * 
 * Usage:
 *   node tools/deploy-verify.js                          # Default domain
 *   node tools/deploy-verify.js --domain=your.domain     # Custom domain
 *   node tools/deploy-verify.js --local                  # Local dev (localhost:8787)
 */

const VERSION = '1.0.0';

// ── Config ─────────────────────────────────────────────────────────────────

const DEFAULT_DOMAIN = 'enterprisentelligence.pages.dev';

function getDomain() {
  const domainArg = process.argv.find(a => a.startsWith('--domain='));
  if (domainArg) return domainArg.split('=')[1];
  if (process.argv.includes('--local')) return 'localhost:8787';
  return DEFAULT_DOMAIN;
}

function getProtocol() {
  return process.argv.includes('--local') ? 'http' : 'https';
}

// ── Colors ─────────────────────────────────────────────────────────────────
function red(s)    { return `\x1b[31m${s}\x1b[0m`; }
function green(s)  { return `\x1b[32m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }
function cyan(s)   { return `\x1b[36m${s}\x1b[0m`; }
function bold(s)   { return `\x1b[1m${s}\x1b[0m`; }

// ── Endpoints to verify ────────────────────────────────────────────────────

const ENDPOINTS = [
  { path: '/',              name: 'Landing Page',         expect: 200, type: 'html' },
  { path: '/api',           name: 'API Status',           expect: 200, type: 'json' },
  { path: '/api/health',    name: 'API Health',           expect: 200, type: 'json' },
  { path: '/api/cache/stats', name: 'Cache Stats',        expect: 200, type: 'json' },
  { path: '/api/cerebrum/status', name: 'Cerebrum',       expect: [200, 503], type: 'json' },
  { path: '/api/agens/catalog',   name: 'Agens',          expect: [200, 503], type: 'json' },
  { path: '/api/nova/status',     name: 'Nova',           expect: [200, 503], type: 'json' },
  { path: '/api/emailai/',        name: 'EmailAI Mesh',   expect: [200, 503], type: 'json' },
];

// ── Verification ───────────────────────────────────────────────────────────

async function verifyEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint.path}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RSHIP-Deploy-Verify/1.0' },
    });
    clearTimeout(timeout);

    const latency = Date.now() - start;
    const expectedStatuses = Array.isArray(endpoint.expect) ? endpoint.expect : [endpoint.expect];
    const statusOk = expectedStatuses.includes(response.status);

    // Check organism headers (proof middleware is active)
    const hasOrganismHeader = response.headers.get('x-cache-organism') !== null;

    let body = null;
    try {
      if (endpoint.type === 'json') {
        body = await response.json();
      }
    } catch { /* non-json response */ }

    return {
      ...endpoint,
      url,
      status: response.status,
      latency,
      ok: statusOk,
      hasOrganismHeader,
      bindingsActive: body?.bindings ? Object.values(body.bindings).some(v => v === true) : null,
    };
  } catch (e) {
    return {
      ...endpoint,
      url,
      status: 0,
      latency: Date.now() - start,
      ok: false,
      error: e.name === 'AbortError' ? 'TIMEOUT (10s)' : e.message,
    };
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const domain = getDomain();
  const protocol = getProtocol();
  const baseUrl = `${protocol}://${domain}`;

  console.log('\n' + bold('RSHIP DEPLOY VERIFICATION'));
  console.log('═'.repeat(62));
  console.log(`  Target: ${cyan(baseUrl)}`);
  console.log(`  Endpoints: ${ENDPOINTS.length}`);
  console.log('═'.repeat(62));

  const results = [];
  for (const endpoint of ENDPOINTS) {
    const result = await verifyEndpoint(baseUrl, endpoint);
    results.push(result);

    const icon = result.ok ? green('✓') : red('✗');
    const latencyStr = result.latency ? `${result.latency}ms` : '—';
    const organismStr = result.hasOrganismHeader ? green('●') : yellow('○');

    console.log(`  ${icon} ${result.name.padEnd(20)} ${String(result.status).padEnd(4)} ${latencyStr.padEnd(8)} ${organismStr} ${result.error ? red(result.error) : ''}`);
  }

  console.log('\n' + '═'.repeat(62));

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const withOrganism = results.filter(r => r.hasOrganismHeader).length;

  console.log(`  Results: ${green(passed + ' passed')}${failed > 0 ? '  ' + red(failed + ' failed') : ''}`);
  console.log(`  Organism middleware: ${withOrganism}/${results.length} responses have X-Cache-Organism header`);

  // Check if bindings are reporting active
  const apiResult = results.find(r => r.path === '/api');
  if (apiResult?.bindingsActive) {
    console.log(`  Bindings: ${green('ACTIVE')} (API reports bound services)`);
  } else if (apiResult?.bindingsActive === false) {
    console.log(`  Bindings: ${yellow('INACTIVE')} (API reports no bound services — run setup-pages-bindings.sh)`);
  }

  console.log('');

  if (failed > 0) {
    console.log(red('Deploy verification FAILED — some endpoints are not responding.\n'));
    process.exit(1);
  } else {
    console.log(green('Deploy verification PASSED — all tools pointed and responding.\n'));
    process.exit(0);
  }
}

main();
