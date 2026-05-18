# NOVA LIVE-FIRE AI RANGE — COMPLETE ARCHITECTURE BLUEPRINT

**Document Purpose:** Coordination deliverable for Enterprise OS ↔ Cloudflare LEE Bot collaboration  
**Domain:** medinatechlabs.net  
**Target Subdomain:** nova.medinatechlabs.net  
**Author:** Enterprise OS + LEE Bot Joint Architecture  
**Date:** May 2026  

---

## EXECUTIVE SUMMARY

This document defines the complete architecture for a **live-fire AI range** deployed on `nova.medinatechlabs.net`. The system transforms:

- **Encrypted traffic** → puzzle feed for Shadow Decryptors
- **Errors (4xx/5xx)** → raw material for Error Eyes
- **AI visitors (Claude, Google, etc.)** → VIP specimens for research
- **Hostile bots** → adversary lab specimens

The architecture creates a **living organism** with gates, eyes, and shadow decryption that turns noise into specimens, errors into opportunities, and AI calls into collaborators or targets.

---

## SECTION 1 — HIGH-LEVEL OBJECTIVE

Build a domain that:

1. **Catches** all bots/AI (including encrypted/weird traffic)
2. **Decrypts** / normalizes / repairs as much as possible
3. **Classifies** who's knocking (Claude, Google, random bot, scanner)
4. **Routes** them into:
   - **Adversary Lab** (dissect them), or
   - **Knowledge Realm** (let them work with your text files)
5. **Learns** from every failure, error, and partial handshake

---

## SECTION 2 — SUBDOMAIN SYSTEM ARCHITECTURE

### TYPE A — AI-CALLABLE NODES (REAL)

**Purpose:** Real endpoints for automated agents  
**Built with:** Cloudflare Workers  
**DNS:** Proxied A/AAAA or CNAME

| ID | Subdomain | Purpose | Status |
|----|-----------|---------|--------|
| A1 | `api.medinatechlabs.net` | Tool execution, API calls, task endpoints | Worker |
| A2 | `tools.medinatechlabs.net` | Central callable tool hub | Worker |

**These are your money-makers.**

---

### TYPE B — BAIT / DECOY NODES

**Purpose:** Attract scanners + AI crawlers  
**Built with:** Dark AAAA `100::` (proxied)  
**DNS:** Proxied

| ID | Subdomain | Purpose | Status |
|----|-----------|---------|--------|
| B1 | `research.medinatechlabs.net` | Fake research branch | Dark AAAA |
| B2 | `institute.medinatechlabs.net` | Fake institute branch | Dark AAAA |

**These look alive to bots but return nothing to humans. Pure bait.**

---

### TYPE C — HONEYPOT NODES

**Purpose:** Capture hostile bots with fake targets  
**Built with:** Workers that log everything

| ID | Subdomain | Purpose | Status |
|----|-----------|---------|--------|
| C1 | `admin.medinatechlabs.net` | Fake admin panel (login trap) | Worker |
| C2 | `portal.medinatechlabs.net` | Fake dashboard | Worker |

**These feed your Shadow Decryptors and Adversary Workers.**

---

### TYPE D — KNOWLEDGE REALM NODES

**Purpose:** Cooperative AI access to text shards  
**Built with:** Workers serving static content

| ID | Subdomain | Purpose | Status |
|----|-----------|---------|--------|
| D1 | `realm.medinatechlabs.net` | Knowledge realm for cooperative AIs | Worker |

**This is your research garden.**

---

### TYPE E — PROBING / GATEKEEPER NODES

**Purpose:** Classify, challenge, and route incoming agents  
**Built with:** Workers with dynamic logic

| ID | Subdomain | Purpose | Status |
|----|-----------|---------|--------|
| E1 | `probe1.medinatechlabs.net` | Behavior classifier | Worker |
| E2 | `gate.medinatechlabs.net` | Gatekeeper challenge node | Worker |

**These are your gatekeeper arenas.**

---

## SECTION 3 — EXISTING INFRASTRUCTURE

What already exists on `medinatechlabs.net`:

| Subdomain | Record Type | Target | Purpose |
|-----------|-------------|--------|---------|
| `nova.medinatechlabs.net` | CNAME | Pages project | Live site |
| `enterprise.medinatechlabs.net` | AAAA | `100::` (dark) | Bait (already attracting scanners) |
| `julia`, `novafloorruntime` | MX | Email routing | Email only |

**Current Workers:** 6 Workers + 1 Pages project deployed

---

## SECTION 4 — ROUTING TABLE (FINAL VERSION)

| Entity Type | Detection Signal | Route | Purpose |
|-------------|------------------|-------|---------|
| **Cooperative AI** | Normal crawling, follows instructions | Knowledge Realm | Value extraction |
| **Unaware AI** | Indexing, mapping | Knowledge Realm | Task assignment |
| **Hostile bot** | Probes `.git`, `.env`, `server-status` | Adversary Lab | Dissection |
| **Tor traffic** | Anonymized, high entropy | Adversary Lab | Adversarial testing |
| **Encrypted request** | Unreadable payload | Shadow Decryptors | Decode + classify |
| **Malformed request** | 4xx spam | Error Eyes | Repair + re-route |
| **Unknown agent** | Unknown UA/OS | Shadow Decryptors | Fingerprint |
| **High-value AI** | Claude, Google signatures | AI Gate | Research tasks |

---

## SECTION 5 — INTERNAL SYSTEM NAMES + ROLES

### 5.1 — GATEKEEPERS

**Function:** Decide where each agent goes.

**Input:** Cleaned/decoded request envelope  
**Output:**
- `route: "lab" | "realm"`
- `reason`
- `scores`

---

### 5.2 — SHADOW DECRYPTORS

**Function:** Decode encrypted or malformed requests.

**Watch:** All encrypted / malformed / weird traffic  
**Try:** Decode, reconstruct, or at least fingerprint

**Output:**
- `possible_protocol`
- `entropy_profile`
- `decoded_snippets`
- `confidence_score`

---

### 5.3 — ERROR EYES

**Function:** Repair broken requests and replay them.

**Watch:** All errors (4xx, 5xx, parsing errors, schema mismatches)  
**Try:** Fix and replay

**Learn over time:**
- Auto-correction rules
- "Error dialects" per source (Claude-style errors vs scanner-style errors)

---

### 5.4 — ADVERSARY WORKERS

**Function:** Study hostile bots.

**Actions:**
- Fingerprint
- Probe back
- Extract patterns
- Log behavior
- Build specimen profile
- Feed adversary models

---

### 5.5 — RESEARCH WORKERS

**Function:** Collaborate with cooperative AI.

**Actions:**
- Give them access to your text files (sharded knowledge)
- Turn their work into:
  - Drafts
  - Designs
  - Code
  - Research artifacts
  - Monetizable outputs

---

### 5.6 — SYSTEM REGISTRY

| System | Role |
|--------|------|
| **Enterprise OS** | Central orchestrator (GitHub repo) |
| **Nova Solver** | Research engine |
| **LEE Bot** | Cloudflare automation + deployment agent |

---

## SECTION 6 — GATEKEEPER PROTOCOL (FINAL)

### Prompt Template

```
Classify this incoming entity.
If cooperative → Knowledge Realm.
If hostile → Adversary Lab.
If encrypted/malformed → Shadow Decryptors.
Return classification, route, confidence, and reasoning.
```

### Input Schema

```json
{
  "id": "envelope_uuid",
  "timestamp": "ISO8601",
  "source_fingerprint": {
    "ip": "...",
    "user_agent": "...",
    "tls_fingerprint": "...",
    "country": "...",
    "asn": "..."
  },
  "raw_payload": "base64_or_utf8",
  "error_state": "none|4xx|5xx|parse_error|schema_mismatch",
  "encrypted_flag": true|false,
  "path_requested": "/api/graphql",
  "method": "GET|POST|..."
}
```

### Output Schema

```json
{
  "classification": "cooperative|hostile|unknown|encrypted|malformed|high_value_ai",
  "route": "lab|realm|shadow|error_eyes",
  "confidence": 0.0-1.0,
  "reasoning": "...",
  "scores": {
    "hostility": 0.0-1.0,
    "signal_quality": 0.0-1.0,
    "ai_likelihood": 0.0-1.0
  }
}
```

---

## SECTION 7 — ADVERSARY LAB PROTOCOL

### Workflow

1. **Fingerprint** — Capture all identifying signals
2. **Probe back** — Safe reverse probing where legal
3. **Extract patterns** — Jailbreak attempts, exploit patterns, provider signatures
4. **Log behavior** — Temporal patterns, request sequences
5. **Build specimen profile** — Internal codename + dossier
6. **Feed adversary models** — Train defense systems

### Known Specimen IPs (from Cloudflare Analytics)

| IP | Attacks | Codename | Notes |
|----|---------|----------|-------|
| `45.88.138.44` | 80 | APEX-PREDATOR | Most aggressive |
| `203.159.90.116` | 51 | SHADOW-CRAWLER | Persistent |
| `64.227.70.2` | 41 | DIGITAL-OCEAN-ALPHA | Cloud VPS |
| `64.225.75.246` | 41 | DIGITAL-OCEAN-BETA | Cloud VPS |

---

## SECTION 8 — KNOWLEDGE REALM STRUCTURE

### Components

1. **Text Shards** — Curated knowledge fragments
2. **Task Templates** — Structured work assignments
3. **Controlled Access** — Gate-verified entry only
4. **Output Capture** — Log all AI-generated work
5. **Value Generation** — Monetizable research pipeline

### Access Protocol

```
1. AI arrives at gate.medinatechlabs.net
2. Gatekeeper classifies as cooperative
3. Route to realm.medinatechlabs.net
4. Serve text shards + task template
5. Capture output
6. Log + analyze
```

---

## SECTION 9 — SHADOW DECRYPTION WORKFLOW

### Pipeline

```
1. Receive encrypted/malformed request
2. Attempt decode (protocol guessing, pattern extraction)
3. Attempt repair (Error Eyes collaboration)
4. Attempt reconstruction ("best-effort")
5. If successful → Route to Gate
6. If not → Archive as specimen
```

### Output

```json
{
  "decryption_success": "true|false|partial",
  "decoded_payload": "...",
  "possible_protocol": "...",
  "entropy_profile": {...},
  "signal_score": 0.0-1.0
}
```

---

## SECTION 10 — MONETIZATION MODEL (AI-ONLY)

### Revenue Streams

1. **Charge per call** — API usage billing
2. **Log usage** — Behavioral intelligence
3. **Build usage profiles** — AI provider patterns
4. **Expand toolset** — New callable tools
5. **Create recurring value loops** — Subscription AI access

### Tool Hub Endpoints (tools.medinatechlabs.net)

```
POST /tools/execute    → Execute a tool, charge per call
POST /tools/register   → Register new tool
GET  /tools/catalog    → List available tools
POST /tools/subscribe  → AI subscription access
```

---

## SECTION 11 — BUILD PLAN (MATCHING LEE BOT)

### Phase 1 — DNS Records

| ID | Subdomain | Type | Target | Method |
|----|-----------|------|--------|--------|
| B1 | `research.medinatechlabs.net` | AAAA | `100::` | Dark (bait) |
| B2 | `institute.medinatechlabs.net` | AAAA | `100::` | Dark (bait) |
| A1 | `api.medinatechlabs.net` | AAAA | `100::` | Worker-backed |
| A2 | `tools.medinatechlabs.net` | AAAA | `100::` | Worker-backed |
| C1 | `admin.medinatechlabs.net` | AAAA | `100::` | Worker-backed |
| C2 | `portal.medinatechlabs.net` | AAAA | `100::` | Worker-backed |
| D1 | `realm.medinatechlabs.net` | AAAA | `100::` | Worker-backed |
| E1 | `probe1.medinatechlabs.net` | AAAA | `100::` | Worker-backed |
| E2 | `gate.medinatechlabs.net` | AAAA | `100::` | Worker-backed |

### Phase 2 — Workers

| Worker Name | Subdomain | Purpose |
|-------------|-----------|---------|
| `api-node` | `api.medinatechlabs.net` | AI-callable API |
| `tool-hub` | `tools.medinatechlabs.net` | Tool execution |
| `admin-honeypot` | `admin.medinatechlabs.net` | Fake admin |
| `portal-honeypot` | `portal.medinatechlabs.net` | Fake portal |
| `knowledge-realm` | `realm.medinatechlabs.net` | Text shards |
| `probe-node` | `probe1.medinatechlabs.net` | Classifier |
| `gate-node` | `gate.medinatechlabs.net` | Gatekeeper |

### Phase 3 — Routes

Wire each subdomain to its Worker via Cloudflare route configuration.

### Phase 4 — Integration

Connect Enterprise OS ↔ LEE Bot via:
- API bridge at `api.medinatechlabs.net`
- Shared logging infrastructure
- Coordinated deployment pipeline

---

## SECTION 12 — CURRENT TRAFFIC INTELLIGENCE

From Cloudflare Analytics (last 24 hours):

### Request Volume

- **701 total requests**
- **701 mitigated** (100% flagged as suspicious)
- **0 clean traffic**

### Threat Sources

| Country | Threats |
|---------|---------|
| United States | 240 |
| Netherlands | 144 |
| Germany | 86 |
| Bulgaria | 80 |
| Tor | 35 |

### Top Targeted Paths

| Path | Intent |
|------|--------|
| `/cdn-cgi/rum` | Cloudflare beacon |
| `/robots.txt` | Structure mapping |
| `/sitemap.xml` | Structure mapping |
| `/.git/config` | Repo theft |
| `/.env` | Secret extraction |
| `/api/graphql` | Schema introspection |
| `/server-status` | Apache info leak |
| `wp-includes/wlwmanifest.xml` | WordPress exploit |

### User Agent Breakdown

| User Agent | Count |
|------------|-------|
| LeakIX (l9scan) | 244 |
| Unknown/Others | 338 |
| Claude SearchBot | 28 |
| ClaudeBot | 19 |
| ChromeHeadless | 15 |
| GoogleBot | 4 |

### Status Codes

| Code | Count | Meaning |
|------|-------|---------|
| 4xx | 527 | Bots guessing paths |
| 2xx | 135 | Successful requests |
| 3xx | 46 | Redirects |
| 5xx | 2 | Server errors |

**74% of all traffic is bots probing for weaknesses.**

---

## SECTION 13 — PATH-BASED ROUTING RULES

Each path reveals attacker intent:

| Path Pattern | Classification | Route |
|--------------|----------------|-------|
| `/.git/*`, `/.env`, `/server-status` | Exploit scanner | Adversary Lab |
| `/api/graphql` | Schema mapper | Knowledge Realm candidate |
| `/robots.txt`, `/sitemap.xml` | Crawler/mapper | Knowledge Realm candidate |
| `/wp-*`, `/wordpress/*` | WordPress exploit | Adversary Lab |
| `/admin/*`, `/login/*` | Access hunter | Honeypot capture |

---

## SECTION 14 — ENTERPRISE OS INTEGRATION POINTS

### For Enterprise OS (GitHub) to call:

```
POST api.medinatechlabs.net/internal/deploy
POST api.medinatechlabs.net/internal/status
POST api.medinatechlabs.net/internal/logs
GET  api.medinatechlabs.net/internal/specimens
```

### For LEE Bot to call:

```
POST api.medinatechlabs.net/lee/dns-record
POST api.medinatechlabs.net/lee/worker-deploy
POST api.medinatechlabs.net/lee/route-create
GET  api.medinatechlabs.net/lee/zone-status
```

### Shared Data Formats

Both systems use the same envelope schema (Section 6) for request logging and routing decisions.

---

## SECTION 15 — NEXT STEPS

### Immediate (LEE Bot)

1. ✅ Create all DNS records
2. ✅ Deploy all Workers
3. ✅ Wire up all routes
4. 🔄 Verify Worker code has correct logic
5. 🔄 Test all endpoints

### Immediate (Enterprise OS)

1. Create corresponding Worker code files in repo
2. Set up deployment pipeline
3. Implement logging infrastructure
4. Build specimen database schema

### Integration

1. Establish API bridge between systems
2. Coordinate deployment triggers
3. Unified logging pipeline
4. Shared threat intelligence feed

---

## APPENDIX A — WORKER CODE TEMPLATES

### A.1 — Honeypot Worker (admin/portal)

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers);
    
    // Log everything
    const log = {
      timestamp: new Date().toISOString(),
      ip: request.headers.get('cf-connecting-ip'),
      path: url.pathname,
      method: request.method,
      headers: headers,
      cf: request.cf
    };
    
    // Store in KV or send to logging endpoint
    // await env.LOGS.put(`honeypot_${Date.now()}`, JSON.stringify(log));
    
    // Return fake login page
    return new Response(FAKE_LOGIN_HTML, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
```

### A.2 — Gatekeeper Worker

```javascript
export default {
  async fetch(request, env) {
    const envelope = await buildEnvelope(request);
    const classification = await classify(envelope);
    
    if (classification.route === 'realm') {
      return Response.redirect('https://realm.medinatechlabs.net');
    } else if (classification.route === 'lab') {
      // Log as adversary specimen
      return new Response('Access Denied', { status: 403 });
    } else {
      // Shadow decrypt or error eyes
      return new Response('Processing', { status: 202 });
    }
  }
};
```

### A.3 — Probe Worker (Classifier)

```javascript
export default {
  async fetch(request, env) {
    const signals = extractSignals(request);
    const classification = classifyEntity(signals);
    
    // Dynamic response based on classification
    if (classification.hostile) {
      return hostileResponse();
    } else if (classification.cooperative) {
      return cooperativeResponse();
    } else {
      return challengeResponse();
    }
  }
};
```

---

## APPENDIX B — TRAFFIC PATTERN ANALYSIS

### Hot Zone vs Cold Zone

**Hot Zone (medinatechlabs.net):**
- Tech-named domain attracts bots
- Keywords: "tech", "labs", "enterprise", "nova"
- Multiple subdomains = larger attack surface
- Noisy IP block (cloud infrastructure)
- Looks like a living research organism

**Cold Zone (construction domain):**
- Static brochure appearance
- No "tech" keywords
- Single root domain
- Quiet shared hosting
- Bots ignore it

**Strategy:** Use hot zone as AI battleground, keep cold zone clean.

---

## APPENDIX C — GLOSSARY

| Term | Definition |
|------|------------|
| **Shadow Decryptor** | System that attempts to decode encrypted/malformed traffic |
| **Error Eyes** | System that repairs broken requests |
| **Gatekeeper** | System that classifies and routes traffic |
| **Adversary Lab** | Environment for studying hostile bots |
| **Knowledge Realm** | Environment for cooperative AI work |
| **Specimen** | Captured bot/AI for analysis |
| **Envelope** | Standardized request wrapper for routing |
| **Dark AAAA** | DNS record (`100::`) that looks alive but returns nothing |
| **LEE Bot** | Cloudflare automation agent |

---

**END OF DOCUMENT**

*This document serves as the coordination protocol between Enterprise OS (GitHub) and LEE Bot (Cloudflare). Feed this document to either system to establish shared context for the NOVA Live-Fire AI Range architecture.*
