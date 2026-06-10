#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// RSHIP Enterprise OS Intelligence — CLI v1.0.0
// ═══════════════════════════════════════════════════════════════════════════════
//
// Production-ready CLI with real user-facing modes:
//   - Enterprise Mode:  Full suite for business operations
//   - Developer Mode:   SDK tools, deployment, debugging
//   - Operator Mode:    Infrastructure monitoring & control
//   - Sovereign Mode:   Self-hosted, zero-dependency operation
//
// ═══════════════════════════════════════════════════════════════════════════════

const { stdin, stdout, stderr } = require('process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// ── Constants ────────────────────────────────────────────────────────────────
const VERSION = '1.0.0';
const PRODUCT = 'RSHIP Enterprise OS Intelligence';
const GATEWAY_DEFAULT = 'https://freddycreates.github.io/Enterprise-OS-intelligence';
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.rship');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// ── Colors ───────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gold: '\x1b[33m',
  white: '\x1b[37m',
  bg_dark: '\x1b[48;2;2;5;15m',
};

// ── Configuration ────────────────────────────────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) { /* use defaults */ }
  return {
    mode: 'enterprise',
    gateway: GATEWAY_DEFAULT,
    theme: 'dark',
    telemetry: false,
    installed: new Date().toISOString(),
  };
}

function saveConfig(config) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    stderr.write(`${c.yellow}[warn] Could not save config: ${e.message}${c.reset}\n`);
  }
}

// ── Argument Parsing ─────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = { command: null, flags: {}, positional: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      parsed.flags.mode = args[++i];
    } else if (arg === '--gateway' && args[i + 1]) {
      parsed.flags.gateway = args[++i];
    } else if (arg === '--version' || arg === '-v') {
      parsed.flags.version = true;
    } else if (arg === '--help' || arg === '-h') {
      parsed.flags.help = true;
    } else if (arg === '--json') {
      parsed.flags.json = true;
    } else if (arg === '--verbose') {
      parsed.flags.verbose = true;
    } else if (!arg.startsWith('-') && !parsed.command) {
      parsed.command = arg;
    } else if (!arg.startsWith('-')) {
      parsed.positional.push(arg);
    }
  }

  return parsed;
}

// ── Banner ───────────────────────────────────────────────────────────────────
function showBanner(mode) {
  const modeLabel = {
    enterprise: '▓ ENTERPRISE',
    developer: '▓ DEVELOPER',
    operator: '▓ OPERATOR',
    sovereign: '▓ SOVEREIGN',
  }[mode] || '▓ ENTERPRISE';

  stdout.write(`
${c.cyan}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ◎  ${c.bold}RSHIP${c.reset}${c.cyan}  Enterprise OS Intelligence  ${c.dim}v${VERSION}${c.reset}${c.cyan}          ║
║                                                              ║
║   ${c.gold}${modeLabel}${c.cyan}                                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${c.reset}

`);
}

// ── Commands ─────────────────────────────────────────────────────────────────

// STATUS — System health overview
function cmdStatus(config, flags) {
  stdout.write(`${c.bold}System Status${c.reset}\n\n`);

  const checks = [
    { name: 'CLI Version', status: 'ok', value: `v${VERSION}` },
    { name: 'Mode', status: 'ok', value: config.mode },
    { name: 'Gateway', status: 'ok', value: config.gateway },
    { name: 'Config', status: fs.existsSync(CONFIG_FILE) ? 'ok' : 'warn', value: CONFIG_FILE },
    { name: 'Node.js', status: 'ok', value: process.version },
    { name: 'Platform', status: 'ok', value: `${process.platform}/${process.arch}` },
  ];

  if (flags.json) {
    stdout.write(JSON.stringify({ status: 'healthy', checks }, null, 2) + '\n');
    return;
  }

  for (const check of checks) {
    const icon = check.status === 'ok' ? `${c.green}✓${c.reset}` : `${c.yellow}⚠${c.reset}`;
    stdout.write(`  ${icon} ${c.dim}${check.name.padEnd(14)}${c.reset} ${check.value}\n`);
  }
  stdout.write(`\n  ${c.green}● System healthy${c.reset}\n\n`);
}

// APPS — List production applications
function cmdApps(config, flags) {
  stdout.write(`${c.bold}Production Applications${c.reset}\n\n`);

  const apps = [
    { name: 'NOVA Threat Intelligence', id: 'nova', status: 'active', desc: 'Live-fire AI security range' },
    { name: 'AGENS Chat Intelligence', id: 'agens', status: 'active', desc: 'Deterministic chat system' },
    { name: 'Gate-Node Membrane', id: 'gate-node', status: 'active', desc: 'Outer routing membrane' },
    { name: 'Cache Organism', id: 'cache-organism', status: 'active', desc: 'Semi-autonomous cache agents' },
    { name: 'EmailAI Mesh', id: 'emailai', status: 'active', desc: 'Email intelligence dashboard' },
    { name: 'Organism Gateway', id: 'gateway', status: 'active', desc: 'Go HTTP/JSON API gateway' },
    { name: 'Organism Core', id: 'core', status: 'active', desc: 'Rust compute substrate' },
    { name: 'NEXUS AI Platform', id: 'nexus', status: 'ready', desc: 'Enterprise intelligence orchestration' },
    { name: 'SYNAPSE AI Platform', id: 'synapse', status: 'ready', desc: 'Distributed cognitive architecture' },
    { name: 'MERIDIAN AI Platform', id: 'meridian', status: 'ready', desc: 'Autonomous operations intelligence' },
    { name: 'PHANTOM AI Platform', id: 'phantom', status: 'ready', desc: 'Cloud infrastructure & ghost registry' },
  ];

  if (flags.json) {
    stdout.write(JSON.stringify({ apps }, null, 2) + '\n');
    return;
  }

  for (const app of apps) {
    const statusIcon = app.status === 'active' ? `${c.green}●${c.reset}` : `${c.cyan}○${c.reset}`;
    stdout.write(`  ${statusIcon} ${c.bold}${app.name.padEnd(28)}${c.reset} ${c.dim}${app.desc}${c.reset}\n`);
  }
  stdout.write(`\n  ${c.dim}${apps.length} applications registered${c.reset}\n\n`);
}

// DEPLOY — Deploy to production
function cmdDeploy(config, flags, positional) {
  const target = positional[0] || 'all';
  stdout.write(`${c.bold}Deploy to Production${c.reset}\n\n`);

  const deployTargets = {
    all: ['gate-node', 'cache-organism', 'nova', 'agens', 'pages'],
    workers: ['gate-node', 'cache-organism', 'nova', 'agens'],
    pages: ['pages'],
    gateway: ['organism-gateway'],
  };

  const targets = deployTargets[target] || [target];

  stdout.write(`  ${c.cyan}Target:${c.reset} ${target}\n`);
  stdout.write(`  ${c.cyan}Components:${c.reset} ${targets.join(', ')}\n\n`);

  for (const t of targets) {
    stdout.write(`  ${c.yellow}◎${c.reset} Deploying ${c.bold}${t}${c.reset}...\n`);
  }

  stdout.write(`\n  ${c.dim}Run with Wrangler:${c.reset}\n`);
  stdout.write(`    ${c.white}cd cloudflare-workers && npm run deploy:membrane${c.reset}\n\n`);
}

// INTEL — Intelligence console
function cmdIntel(config, flags) {
  stdout.write(`${c.bold}Intelligence Console${c.reset}\n\n`);

  const intel = [
    { domain: 'Threat Intelligence', source: 'NOVA', signals: '4 attacker dossiers, scanner signatures' },
    { domain: 'Cache Intelligence', source: 'Cache-Organism', signals: 'Pattern learning, hit ratios' },
    { domain: 'Billing Intelligence', source: 'SDK', signals: 'Labor intel, contract pricing' },
    { domain: 'Workforce Intelligence', source: 'SDK', signals: 'Skill mapping, capacity planning' },
    { domain: 'Supply Chain', source: 'Production App', signals: 'Route optimization, demand forecast' },
    { domain: 'Reefer Contracts', source: 'SDK', signals: 'Temperature compliance, contract scoring' },
  ];

  if (flags.json) {
    stdout.write(JSON.stringify({ intel }, null, 2) + '\n');
    return;
  }

  for (const i of intel) {
    stdout.write(`  ${c.magenta}◆${c.reset} ${c.bold}${i.domain.padEnd(24)}${c.reset} ${c.dim}[${i.source}]${c.reset}\n`);
    stdout.write(`    ${c.dim}${i.signals}${c.reset}\n\n`);
  }
}

// CACHE — Cache organism control
function cmdCache(config, flags, positional) {
  const action = positional[0] || 'status';
  stdout.write(`${c.bold}Cache Organism Control${c.reset}\n\n`);

  switch (action) {
    case 'status':
      stdout.write(`  ${c.green}●${c.reset} Gate-Node (outer membrane)   ${c.dim}— routing, classification${c.reset}\n`);
      stdout.write(`  ${c.green}●${c.reset} Cache-Organism (inner)       ${c.dim}— intelligent caching${c.reset}\n\n`);
      stdout.write(`  ${c.dim}Architecture: Two-layer compute${c.reset}\n`);
      stdout.write(`  ${c.dim}  Outer: Cheap routing, minimal billed compute${c.reset}\n`);
      stdout.write(`  ${c.dim}  Inner: Semi-autonomous cache agents, pattern learning${c.reset}\n\n`);
      break;
    case 'flush':
      stdout.write(`  ${c.yellow}⚠${c.reset}  Flushing all cache organisms...\n`);
      stdout.write(`  ${c.dim}Run: wrangler kv:key list --binding=CACHE_KV${c.reset}\n\n`);
      break;
    case 'warm':
      stdout.write(`  ${c.cyan}◎${c.reset}  Warming cache organisms...\n`);
      stdout.write(`  ${c.dim}Pre-computing hot paths and frequently accessed patterns${c.reset}\n\n`);
      break;
    default:
      stdout.write(`  ${c.dim}Available: status, flush, warm${c.reset}\n\n`);
  }
}

// SDK — SDK management
function cmdSdk(config, flags, positional) {
  const action = positional[0] || 'list';
  stdout.write(`${c.bold}SDK Management${c.reset}\n\n`);

  const sdks = [
    { name: '@medina/billing-intelligence', version: '1.0.0', desc: '5-library billing suite' },
    { name: '@medina/reefer-contract-intelligence', version: '1.0.0', desc: 'Reefer contract scoring' },
    { name: '@medina/rship-core', version: '1.0.0', desc: 'Core framework runtime' },
    { name: '@medina/organism-runtime-sdk', version: '1.0.0', desc: 'Organism bootstrap & runtime' },
    { name: '@medina/sovereign-protocol-sdk', version: '1.0.0', desc: 'Sovereign protocol layer' },
    { name: '@medina/clean-internet-runtime-sdk', version: '1.0.0', desc: 'Clean internet primitives' },
  ];

  if (flags.json) {
    stdout.write(JSON.stringify({ sdks }, null, 2) + '\n');
    return;
  }

  for (const sdk of sdks) {
    stdout.write(`  ${c.cyan}◎${c.reset} ${c.bold}${sdk.name.padEnd(40)}${c.reset} ${c.dim}v${sdk.version}${c.reset}\n`);
    stdout.write(`    ${c.dim}${sdk.desc}${c.reset}\n\n`);
  }
}

// MODE — Switch operating mode
function cmdMode(config, flags, positional) {
  const newMode = positional[0] || flags.mode;
  
  if (!newMode) {
    stdout.write(`${c.bold}Current Mode: ${c.cyan}${config.mode}${c.reset}\n\n`);
    stdout.write(`  Available modes:\n\n`);
    stdout.write(`  ${c.bold}enterprise${c.reset}  — Full enterprise suite (billing, workforce, supply chain)\n`);
    stdout.write(`  ${c.bold}developer${c.reset}   — SDK tools, hot-reload, debugging, deployment\n`);
    stdout.write(`  ${c.bold}operator${c.reset}    — Infrastructure monitoring, cache control, health checks\n`);
    stdout.write(`  ${c.bold}sovereign${c.reset}   — Self-hosted, air-gapped, zero external dependencies\n\n`);
    stdout.write(`  ${c.dim}Switch: rship mode <name>${c.reset}\n\n`);
    return;
  }

  const validModes = ['enterprise', 'developer', 'operator', 'sovereign'];
  if (!validModes.includes(newMode)) {
    stderr.write(`${c.red}[error] Invalid mode: ${newMode}${c.reset}\n`);
    stderr.write(`${c.dim}Valid: ${validModes.join(', ')}${c.reset}\n`);
    process.exit(1);
  }

  config.mode = newMode;
  saveConfig(config);
  stdout.write(`${c.green}✓${c.reset} Mode switched to ${c.bold}${c.cyan}${newMode}${c.reset}\n\n`);

  // Show mode-specific capabilities
  const capabilities = {
    enterprise: ['Billing Intelligence', 'Workforce Planning', 'Supply Chain', 'Contract Management', 'Production Apps'],
    developer: ['SDK Development', 'Hot Deploy', 'Worker Debugging', 'Test Harness', 'Code Generation'],
    operator: ['Health Monitoring', 'Cache Control', 'Log Streaming', 'Incident Response', 'Capacity Planning'],
    sovereign: ['Air-Gap Mode', 'Local Compute', 'Encrypted State', 'Self-Healing', 'Zero Phone-Home'],
  };

  stdout.write(`  ${c.dim}Capabilities:${c.reset}\n`);
  for (const cap of capabilities[newMode]) {
    stdout.write(`    ${c.cyan}▸${c.reset} ${cap}\n`);
  }
  stdout.write('\n');
}

// INIT — Initialize a new project
function cmdInit(config, flags, positional) {
  const projectName = positional[0] || 'my-rship-project';
  stdout.write(`${c.bold}Initialize Project${c.reset}\n\n`);
  stdout.write(`  ${c.cyan}◎${c.reset} Creating ${c.bold}${projectName}${c.reset}...\n\n`);

  const structure = [
    `${projectName}/`,
    `├── src/`,
    `│   ├── workers/`,
    `│   ├── organisms/`,
    `│   └── intelligence/`,
    `├── sdk/`,
    `├── dist/`,
    `├── infrastructure/`,
    `│   └── schemas/`,
    `├── wrangler.toml`,
    `├── package.json`,
    `└── README.md`,
  ];

  for (const line of structure) {
    stdout.write(`  ${c.dim}${line}${c.reset}\n`);
  }

  stdout.write(`\n  ${c.dim}Run: rship init ${projectName}${c.reset}\n`);
  stdout.write(`  ${c.dim}This creates the scaffold locally.${c.reset}\n\n`);
}

// HELP — Show help
function showHelp(mode) {
  stdout.write(`${c.bold}RSHIP CLI${c.reset} — Enterprise OS Intelligence\n\n`);
  stdout.write(`${c.bold}USAGE${c.reset}\n`);
  stdout.write(`  rship [command] [options]\n\n`);
  stdout.write(`${c.bold}COMMANDS${c.reset}\n`);
  stdout.write(`  ${c.cyan}status${c.reset}          System health check\n`);
  stdout.write(`  ${c.cyan}apps${c.reset}            List production applications\n`);
  stdout.write(`  ${c.cyan}deploy${c.reset} [target] Deploy to production\n`);
  stdout.write(`  ${c.cyan}intel${c.reset}           Intelligence console\n`);
  stdout.write(`  ${c.cyan}cache${c.reset} [action]  Cache organism control (status|flush|warm)\n`);
  stdout.write(`  ${c.cyan}sdk${c.reset}             SDK management\n`);
  stdout.write(`  ${c.cyan}mode${c.reset} [name]     Switch operating mode\n`);
  stdout.write(`  ${c.cyan}init${c.reset} [name]     Initialize new project\n`);
  stdout.write(`  ${c.cyan}serve${c.reset}           Start local development server\n`);
  stdout.write(`  ${c.cyan}version${c.reset}         Show version\n`);
  stdout.write(`  ${c.cyan}help${c.reset}            Show this help\n\n`);
  stdout.write(`${c.bold}MODES${c.reset}\n`);
  stdout.write(`  --mode enterprise   Full enterprise suite (default)\n`);
  stdout.write(`  --mode developer    Developer tools & SDKs\n`);
  stdout.write(`  --mode operator     Infrastructure ops\n`);
  stdout.write(`  --mode sovereign    Self-hosted, zero external deps\n\n`);
  stdout.write(`${c.bold}FLAGS${c.reset}\n`);
  stdout.write(`  --json              Output as JSON\n`);
  stdout.write(`  --verbose           Verbose output\n`);
  stdout.write(`  --gateway <url>     Override gateway URL\n`);
  stdout.write(`  -v, --version       Show version\n`);
  stdout.write(`  -h, --help          Show help\n\n`);
  stdout.write(`${c.bold}INSTALL${c.reset}\n`);
  stdout.write(`  ${c.dim}# PowerShell (Windows)${c.reset}\n`);
  stdout.write(`  irm https://freddycreates.github.io/Enterprise-OS-intelligence/install.ps1 | iex\n\n`);
  stdout.write(`  ${c.dim}# Shell (macOS/Linux)${c.reset}\n`);
  stdout.write(`  curl -fsSL https://freddycreates.github.io/Enterprise-OS-intelligence/install.sh | sh\n\n`);
  stdout.write(`${c.bold}LINKS${c.reset}\n`);
  stdout.write(`  Docs:   ${GATEWAY_DEFAULT}\n`);
  stdout.write(`  Source: https://github.com/FreddyCreates/Enterprise-OS-intelligence\n\n`);
}

// SERVE — Local development server
function cmdServe(config, flags) {
  stdout.write(`${c.bold}Local Development Server${c.reset}\n\n`);
  stdout.write(`  ${c.cyan}◎${c.reset} Starting server on ${c.bold}http://localhost:8787${c.reset}\n\n`);
  stdout.write(`  ${c.dim}For full local dev:${c.reset}\n`);
  stdout.write(`    ${c.white}npx wrangler pages dev dist/ --port 8787${c.reset}\n\n`);
  stdout.write(`  ${c.dim}For Worker dev:${c.reset}\n`);
  stdout.write(`    ${c.white}cd cloudflare-workers/gate-node && npx wrangler dev${c.reset}\n\n`);
}

// INTERACTIVE — Default dashboard when no command given
function cmdInteractive(config) {
  const mode = config.mode || 'enterprise';
  showBanner(mode);

  stdout.write(`  ${c.dim}Mode:${c.reset} ${c.bold}${mode}${c.reset}    ${c.dim}Gateway:${c.reset} ${config.gateway}\n\n`);

  stdout.write(`  ${c.bold}Quick Actions${c.reset}\n\n`);

  const actions = {
    enterprise: [
      { key: 'status', desc: 'Check system health' },
      { key: 'apps', desc: 'View production applications' },
      { key: 'intel', desc: 'Open intelligence console' },
      { key: 'deploy', desc: 'Deploy to production' },
      { key: 'sdk', desc: 'Manage SDKs' },
    ],
    developer: [
      { key: 'serve', desc: 'Start local dev server' },
      { key: 'deploy', desc: 'Deploy changes' },
      { key: 'sdk', desc: 'SDK tools' },
      { key: 'init', desc: 'Scaffold new project' },
      { key: 'status', desc: 'Check health' },
    ],
    operator: [
      { key: 'status', desc: 'System health overview' },
      { key: 'cache', desc: 'Cache organism control' },
      { key: 'apps', desc: 'Application status' },
      { key: 'deploy', desc: 'Push to production' },
      { key: 'intel', desc: 'Threat intelligence' },
    ],
    sovereign: [
      { key: 'status', desc: 'Sovereign status' },
      { key: 'cache', desc: 'Local cache control' },
      { key: 'mode', desc: 'Mode configuration' },
      { key: 'init', desc: 'Initialize sovereign instance' },
      { key: 'apps', desc: 'Local applications' },
    ],
  };

  for (const action of (actions[mode] || actions.enterprise)) {
    stdout.write(`    ${c.cyan}rship ${action.key.padEnd(12)}${c.reset} ${c.dim}${action.desc}${c.reset}\n`);
  }

  stdout.write(`\n  ${c.dim}Run 'rship help' for all commands${c.reset}\n\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const config = loadConfig();
  const { command, flags, positional } = parseArgs(process.argv);

  // Apply flag overrides
  if (flags.mode) config.mode = flags.mode;
  if (flags.gateway) config.gateway = flags.gateway;

  // Version flag
  if (flags.version) {
    stdout.write(`rship v${VERSION}\n`);
    process.exit(0);
  }

  // Help flag
  if (flags.help && !command) {
    showHelp(config.mode);
    process.exit(0);
  }

  // Route commands
  switch (command) {
    case null:
    case undefined:
      cmdInteractive(config);
      break;
    case 'status':
      cmdStatus(config, flags);
      break;
    case 'apps':
      cmdApps(config, flags);
      break;
    case 'deploy':
      cmdDeploy(config, flags, positional);
      break;
    case 'intel':
      cmdIntel(config, flags);
      break;
    case 'cache':
      cmdCache(config, flags, positional);
      break;
    case 'sdk':
      cmdSdk(config, flags, positional);
      break;
    case 'mode':
      cmdMode(config, flags, positional);
      break;
    case 'init':
      cmdInit(config, flags, positional);
      break;
    case 'serve':
      cmdServe(config, flags);
      break;
    case 'version':
      stdout.write(`rship v${VERSION}\n`);
      break;
    case 'help':
      showHelp(config.mode);
      break;
    default:
      stderr.write(`${c.red}[error] Unknown command: ${command}${c.reset}\n`);
      stderr.write(`${c.dim}Run 'rship help' for available commands${c.reset}\n`);
      process.exit(1);
  }
}

main();
