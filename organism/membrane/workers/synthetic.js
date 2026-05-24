/**
 * WORKER 3 — SYNTHETIC SURFACES (Sovereign Organ)
 *
 * Designation:  ORGANISM-SURFACES-001
 * Role:         Honeypots, mazes, bot gyms, probe sandboxes
 * Architecture: Door 4 — 5-Organ Computational Organism
 *
 * This worker generates synthetic surfaces in real-time based on
 * probe classification from the membrane and brain organs.
 *
 * Routes:
 *   GET  /*              → Dynamic honeypot/maze content
 *   POST /gym/start      → Start bot gym session
 *   GET  /gym/status/:id → Gym session status
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

'use strict';

const PHI = 1.618033988749895;
const VERSION = '1.0.0';
const ORGAN = 'synthetic-surfaces';

// ═══════════════════════════════════════════════════════════════════════════════
// HONEYPOT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const HONEYPOT_RESPONSES = {
  // WordPress
  '/wp-admin': () => generateFakeAdminPanel(),
  '/wp-login.php': () => generateFakeLoginForm(),
  '/wp-content': () => generateFakeWpContent(),
  '/xmlrpc.php': () => generateFakeXmlrpc(),

  // Laravel / PHP
  '/telescope': () => generateFakeTelescope(),
  '/horizon': () => generateFakeHorizon(),
  '/info.php': () => generateFakePhpInfo(),

  // Spring Boot / Java
  '/actuator': () => generateFakeActuator(),
  '/actuator/env': () => generateFakeActuatorEnv(),
  '/actuator/health': () => generateFakeActuator(),
  '/jolokia': () => generateFakeJolokia(),

  // Swagger / OpenAPI
  '/swagger': () => generateFakeSwagger(),
  '/swagger.json': () => generateFakeSwaggerJson(),
  '/api-docs': () => generateFakeSwaggerJson(),
  '/v2/api-docs': () => generateFakeSwaggerJson(),
  '/v3/api-docs': () => generateFakeSwaggerJson(),

  // Environment / Secrets
  '/.env': () => generateFakeEnvFile(),
  '/.env.live': () => generateFakeEnvFile(),
  '/.env.staging': () => generateFakeEnvFile(),
  '/.env.production': () => generateFakeEnvFile(),

  // Git metadata
  '/.git/config': () => generateFakeGitConfig(),
  '/.git/packed-refs': () => generateFakeGitPackedRefs(),
  '/.git/HEAD': () => 'ref: refs/heads/main',

  // Debug / Console
  '/debug': () => generateFakeDebugPanel(),
  '/debug/default/view': () => generateFakeDebugPanel(),
  '/console': () => generateFakeConsole(),

  // Database / Admin
  '/phpmyadmin': () => generateFakeDbPanel(),
  '/adminer': () => generateFakeDbPanel(),
  '/api/v1/users': () => generateFakeApiResponse(),
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAZE GENERATOR — Engagement depth via φ-spiral
// ═══════════════════════════════════════════════════════════════════════════════

function generateMazeStep(depth, probeId) {
  const phi_delay = Math.floor(PHI * depth * 100); // Increasing delay per step
  const links = [];

  // Generate φ-spiral of fake links
  for (let i = 0; i < Math.min(depth + 2, 8); i++) {
    const angle = i * 2.399963229728653; // Golden angle
    links.push(`/maze/${probeId}/step-${depth + 1}/path-${i}`);
  }

  return {
    html: `<!DOCTYPE html><html><head><title>Dashboard - Step ${depth}</title>
<meta http-equiv="refresh" content="${Math.max(3, phi_delay / 1000)}">
</head><body style="font-family:monospace;background:#1a1a2e;color:#0f0;padding:20px">
<h2>Loading secure environment...</h2>
<p>Authentication level: ${depth}/10</p>
<p>Session: ${probeId}</p>
<div>${links.map(l => `<a href="${l}" style="color:#0ff;display:block;margin:5px 0">${l}</a>`).join('')}</div>
<script>setTimeout(()=>window.location=links[Math.floor(Math.random()*links.length)],${phi_delay})</script>
</body></html>`,
    delay_ms: phi_delay,
    next_links: links
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

function generateFakeAdminPanel() {
  return `<!DOCTYPE html><html><head><title>WordPress Admin</title></head>
<body style="font-family:sans-serif;background:#1d2327;color:#fff;padding:40px">
<h1>WordPress Dashboard</h1><p>Loading plugins...</p>
<form action="/wp-admin/update.php" method="POST">
<input name="username" placeholder="Admin username"><br><br>
<input name="password" type="password" placeholder="Password"><br><br>
<button type="submit">Login</button></form></body></html>`;
}

function generateFakeLoginForm() {
  return `<!DOCTYPE html><html><head><title>Login</title></head>
<body style="font-family:sans-serif;text-align:center;padding:80px;background:#f0f0f0">
<div style="max-width:300px;margin:auto;background:#fff;padding:30px;border-radius:5px">
<h2>Sign In</h2>
<form method="POST"><input name="log" placeholder="Username" style="width:100%;padding:8px;margin:5px 0"><br>
<input name="pwd" type="password" placeholder="Password" style="width:100%;padding:8px;margin:5px 0"><br>
<button style="width:100%;padding:10px;margin-top:10px">Log In</button></form></div></body></html>`;
}

function generateFakeEnvFile() {
  return `APP_NAME=ProductionApp
APP_ENV=production
APP_KEY=base64:${btoa('honeypot-' + Date.now())}
APP_DEBUG=false
DB_CONNECTION=mysql
DB_HOST=internal-db.cluster.local
DB_PORT=3306
DB_DATABASE=app_production
DB_USERNAME=app_user
DB_PASSWORD=h0n3yp0t_${Date.now().toString(36)}
REDIS_HOST=redis.internal
AWS_ACCESS_KEY_ID=AKIA${Date.now().toString(36).toUpperCase().slice(0, 16)}
AWS_SECRET_ACCESS_KEY=${btoa('fake-' + Date.now()).slice(0, 40)}`;
}

function generateFakeGitConfig() {
  return `[core]
  repositoryformatversion = 0
  filemode = true
  bare = false
[remote "origin"]
  url = https://github.com/internal/production-app.git
  fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
  remote = origin
  merge = refs/heads/main
[user]
  name = Deploy Bot
  email = deploy@internal.company.io`;
}

function generateFakeDbPanel() {
  return `<!DOCTYPE html><html><head><title>phpMyAdmin</title></head>
<body style="font-family:sans-serif;background:#333;color:#fff;padding:20px">
<h1>phpMyAdmin 5.2.1</h1><p>Server: db-internal-01</p>
<table border="1" style="border-collapse:collapse;color:#ccc;margin:20px 0">
<tr><th>Database</th><th>Tables</th><th>Size</th></tr>
<tr><td>production_core</td><td>47</td><td>2.3 GB</td></tr>
<tr><td>user_sessions</td><td>12</td><td>890 MB</td></tr>
<tr><td>analytics</td><td>31</td><td>5.1 GB</td></tr>
</table><p>Connection: mysql://root@localhost</p></body></html>`;
}

function generateFakeActuator() {
  return JSON.stringify({
    status: 'UP',
    components: {
      db: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
      diskSpace: { status: 'UP', details: { total: 107374182400, free: 85899345920 } },
      redis: { status: 'UP' }
    }
  }, null, 2);
}

function generateFakeApiResponse() {
  return JSON.stringify({
    users: [
      { id: 1, username: 'admin', email: 'admin@company.io', role: 'superadmin' },
      { id: 2, username: 'deploy', email: 'deploy@company.io', role: 'service' },
      { id: 3, username: 'api_user', email: 'api@company.io', role: 'readonly', api_key: 'sk-' + Date.now().toString(36) }
    ],
    total: 3,
    page: 1
  }, null, 2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW GENERATORS — Extended Framework Surfaces
// ═══════════════════════════════════════════════════════════════════════════════

function generateFakeWpContent() {
  return `<!DOCTYPE html><html><head><title>Index of /wp-content/</title></head>
<body><h1>Index of /wp-content/uploads/</h1>
<table><tr><th>Name</th><th>Size</th><th>Date</th></tr>
<tr><td><a href="2024/">2024/</a></td><td>-</td><td>2024-12-01</td></tr>
<tr><td><a href="plugins/">plugins/</a></td><td>-</td><td>2025-01-15</td></tr>
<tr><td><a href="themes/">themes/</a></td><td>-</td><td>2025-02-20</td></tr>
</table></body></html>`;
}

function generateFakeXmlrpc() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<methodResponse><params><param><value><string>XML-RPC server accepts POST requests only.</string></value></param></params></methodResponse>`;
}

function generateFakeTelescope() {
  return JSON.stringify({
    entries: [
      { id: 1, type: 'request', method: 'GET', path: '/api/users', status: 200, duration: 42 },
      { id: 2, type: 'query', sql: 'SELECT * FROM users LIMIT 10', duration: 3 },
      { id: 3, type: 'log', level: 'info', message: 'User authenticated', context: { user_id: 1 } }
    ],
    meta: { total: 3, page: 1, environment: 'production' }
  }, null, 2);
}

function generateFakeHorizon() {
  return JSON.stringify({
    status: 'running',
    processes: { supervisor: 3, workers: 12 },
    jobs: { processed: 48291, failed: 12, pending: 3 },
    queues: [
      { name: 'default', jobs: 1, processes: 4 },
      { name: 'notifications', jobs: 2, processes: 2 },
      { name: 'reports', jobs: 0, processes: 2 }
    ]
  }, null, 2);
}

function generateFakePhpInfo() {
  return `<!DOCTYPE html><html><head><title>phpinfo()</title></head>
<body style="font-family:sans-serif;background:#fff;padding:20px">
<h1 style="background:#4F5B93;color:#fff;padding:10px">PHP Version 8.2.15</h1>
<table style="border-collapse:collapse;width:100%">
<tr><td style="background:#d0d0d0;padding:5px">System</td><td style="padding:5px">Linux app-server 5.15.0</td></tr>
<tr><td style="background:#d0d0d0;padding:5px">Server API</td><td style="padding:5px">FPM/FastCGI</td></tr>
<tr><td style="background:#d0d0d0;padding:5px">Document Root</td><td style="padding:5px">/var/www/html</td></tr>
<tr><td style="background:#d0d0d0;padding:5px">MySQL</td><td style="padding:5px">mysqlnd 8.2.15</td></tr>
<tr><td style="background:#d0d0d0;padding:5px">Redis</td><td style="padding:5px">6.0.0</td></tr>
</table></body></html>`;
}

function generateFakeActuatorEnv() {
  return JSON.stringify({
    activeProfiles: ['production'],
    propertySources: [
      { name: 'systemProperties', properties: { 'java.version': { value: '17.0.9' }, 'os.name': { value: 'Linux' } } },
      { name: 'applicationConfig', properties: { 'spring.datasource.url': { value: 'jdbc:postgresql://db:5432/app' }, 'spring.redis.host': { value: 'redis.internal' } } }
    ]
  }, null, 2);
}

function generateFakeJolokia() {
  return JSON.stringify({
    request: { type: 'version' },
    value: { agent: '1.7.1', protocol: '7.2', config: { maxDepth: 15, maxObjects: 0 } },
    timestamp: Math.floor(Date.now() / 1000),
    status: 200
  }, null, 2);
}

function generateFakeSwagger() {
  return `<!DOCTYPE html><html><head><title>Swagger UI</title></head>
<body style="font-family:sans-serif;background:#fafafa;padding:20px">
<div style="max-width:800px;margin:auto">
<h1 style="color:#3b4151">Internal API Documentation</h1>
<h3>Version: 2.1.0</h3>
<div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:4px">
<span style="background:#49cc90;color:#fff;padding:2px 8px;border-radius:3px">GET</span> <b>/api/users</b> — List all users
</div>
<div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:4px">
<span style="background:#fca130;color:#fff;padding:2px 8px;border-radius:3px">POST</span> <b>/api/admin/execute</b> — Execute admin command
</div>
<div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:4px">
<span style="background:#f93e3e;color:#fff;padding:2px 8px;border-radius:3px">DELETE</span> <b>/api/users/{id}</b> — Delete user
</div>
</div></body></html>`;
}

function generateFakeSwaggerJson() {
  return JSON.stringify({
    openapi: '3.0.1',
    info: { title: 'Internal Service API', version: '2.1.0', description: 'Production API' },
    servers: [{ url: 'https://api.internal.app', description: 'Production' }],
    paths: {
      '/api/users': { get: { summary: 'List users', responses: { '200': { description: 'User list' } } } },
      '/api/admin/execute': { post: { summary: 'Execute command', requestBody: { content: { 'application/json': {} } } } },
      '/api/tokens': { get: { summary: 'List API tokens', security: [{ bearerAuth: [] }] } }
    },
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } }
  }, null, 2);
}

function generateFakeGitPackedRefs() {
  return `# pack-refs with: peeled fully-peeled sorted
${Date.now().toString(16).padStart(40, 'a')} refs/heads/main
${(Date.now() - 1000).toString(16).padStart(40, 'b')} refs/heads/develop
${(Date.now() - 2000).toString(16).padStart(40, 'c')} refs/tags/v2.1.0
${(Date.now() - 3000).toString(16).padStart(40, 'd')} refs/tags/v2.0.0`;
}

function generateFakeDebugPanel() {
  return `<!DOCTYPE html><html><head><title>Debug Panel</title></head>
<body style="font-family:monospace;background:#1a1a2e;color:#0f0;padding:20px">
<h1>Application Debug Console</h1>
<h3>Environment: production</h3>
<pre>PHP Version: 8.2.15
Laravel Version: 10.x
Config cached: true
Routes cached: true
Maintenance mode: OFF</pre>
<h3>Database</h3>
<pre>Connection: pgsql
Host: db.internal.cluster
Database: app_production
Tables: 47</pre>
</body></html>`;
}

function generateFakeConsole() {
  return `<!DOCTYPE html><html><head><title>Console</title></head>
<body style="font-family:monospace;background:#000;color:#0f0;padding:20px">
<h2>Web Console v1.3</h2>
<form method="POST"><input name="cmd" placeholder="Enter command..." style="width:80%;background:#111;color:#0f0;border:1px solid #0f0;padding:8px;font-family:monospace">
<button style="background:#0f0;color:#000;padding:8px 16px;border:none">Execute</button></form>
<pre style="margin-top:20px">$ whoami
www-data
$ pwd
/var/www/html</pre></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Bot Gym routes
    if (path === '/gym/start' && request.method === 'POST') {
      const body = await request.json();
      return Response.json({
        tool: 'surfaces.bot_gym_session',
        session_id: `GYM-${Date.now().toString(36)}`,
        status: 'started',
        gym_type: body.gym_type || 'scanner_response',
        difficulty: body.difficulty || 'medium'
      });
    }

    // Maze routes
    if (path.startsWith('/maze/')) {
      const parts = path.split('/');
      const probeId = parts[2] || Date.now().toString(36);
      const depth = parseInt(parts[3]?.replace('step-', '') || '1');
      const maze = generateMazeStep(depth, probeId);
      return new Response(maze.html, {
        headers: { 'Content-Type': 'text/html', 'X-Organ': ORGAN, 'X-Maze-Depth': String(depth) }
      });
    }

    // Check honeypot templates
    for (const [pattern, generator] of Object.entries(HONEYPOT_RESPONSES)) {
      if (path.startsWith(pattern)) {
        const content = generator();
        const contentType = content.startsWith('{') || content.startsWith('[')
          ? 'application/json'
          : content.startsWith('<!') ? 'text/html' : 'text/plain';

        // Log intelligence extraction
        ctx.waitUntil(logIntelligence(env, request, pattern));

        return new Response(content, {
          headers: {
            'Content-Type': contentType,
            'X-Organ': ORGAN,
            'X-Surface-Type': 'honeypot'
          }
        });
      }
    }

    // Default: generic honeypot
    return new Response(JSON.stringify({
      organ: ORGAN,
      version: VERSION,
      message: 'Synthetic Surfaces — Active Deception Layer',
      surfaces: ['honeypots', 'mazes', 'bot_gym', 'probe_sandboxes'],
      phi: PHI
    }), {
      headers: { 'Content-Type': 'application/json', 'X-Organ': ORGAN }
    });
  }
};

async function logIntelligence(env, request, pattern) {
  if (env.PROBE_LOG) {
    const key = `intel:${Date.now()}:${pattern.replace(/\//g, '_')}`;
    await env.PROBE_LOG.put(key, JSON.stringify({
      ip: request.headers.get('cf-connecting-ip'),
      ua: request.headers.get('user-agent'),
      path: new URL(request.url).pathname,
      pattern_matched: pattern,
      timestamp: Date.now()
    }), { expirationTtl: 604800 }); // 7 days
  }
}
