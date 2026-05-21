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
  '/wp-admin': () => generateFakeAdminPanel(),
  '/wp-login.php': () => generateFakeLoginForm(),
  '/.env': () => generateFakeEnvFile(),
  '/.git/config': () => generateFakeGitConfig(),
  '/phpmyadmin': () => generateFakeDbPanel(),
  '/actuator/health': () => generateFakeActuator(),
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
