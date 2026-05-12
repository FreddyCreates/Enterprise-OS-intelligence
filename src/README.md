# RSHIP Source Directory

## Cloudflare Workers Deployment

This directory contains the source code for the RSHIP Enterprise OS Intelligence Cloudflare Workers deployment.

### Structure

```
src/
├── index.js              # Main worker entry point
├── package.json          # Dependencies and scripts
├── agents/               # Agent worker implementations
│   ├── index.js          # Agent exports
│   ├── axiom.js          # AXIOM agent worker
│   └── fortress.js       # FORTRESS agent worker
├── constants/            # Shared constants
│   ├── index.js          # Constants exports
│   ├── phi.js            # φ (phi) golden ratio constants
│   └── agents.js         # Agent registry definitions
├── utils/                # Utility functions
│   ├── index.js          # Utils exports
│   ├── response.js       # HTTP response helpers
│   └── router.js         # Request router
└── workers/              # Additional worker modules (future)
```

### Agents

#### AXIOM (RSHIP-2026-AXIOM-001)
- **Status**: ACTIVE
- **Role**: Science Journal & IP Protection Omega Alpha Agent
- **Endpoints**:
  - `GET /axiom/health` — Health check
  - `GET /axiom/status` — Agent status
  - `POST /axiom/learn` — Store knowledge
  - `GET /axiom/recall/:key` — Retrieve knowledge
  - `POST /axiom/vault` — Permanent memory storage

#### FORTRESS (RSHIP-2026-FORTRESS-001)
- **Status**: ACTIVE
- **Role**: Security Analysis & Code Intelligence Omega Alpha Agent
- **Endpoints**:
  - `GET /fortress/health` — Health check
  - `GET /fortress/status` — Agent status
  - `POST /fortress/threat` — Register threat
  - `GET /fortress/threats` — List threats
  - `POST /fortress/scan` — Log security scan
  - `GET /fortress/audit` — Get audit log

### Development

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run locally
cd src
npm run dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Organism status |
| `/health` | GET | Health check |
| `/status` | GET | Full status |
| `/agents` | GET | List all agents |
| `/phi` | GET | Phi constants |
| `/axiom/*` | * | AXIOM agent routes |
| `/fortress/*` | * | FORTRESS agent routes |

### Constants

- **PHI (φ)**: 1.618033988749895
- **PHI_INV (1/φ)**: 0.618033988749895
- **SCHUMANN_HZ**: 7.83 Hz
- **HEARTBEAT_MS**: 873 ms

---

*Medina Tech · RSHIP-2026 · Dallas, TX*
