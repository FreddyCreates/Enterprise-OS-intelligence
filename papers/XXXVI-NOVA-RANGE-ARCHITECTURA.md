# NOVA RANGE ARCHITECTURA
### On Live-Fire AI Ranges, Shadow Decryption, and Sovereign Traffic Intelligence

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Organism AI Research Division · Laboratorium Intelligentiae Autonomae · itsnotAilabs.com  
**Series:** Sovereign Intelligence Research — Paper XXXVI  
**Date:** May 2026  
**DOI:** Pending (Zenodo/Archive registration)

**Latin Name:** *Nova Range Architectura* — The New Range Architecture  
**Operational Motto:** OMNIS HOSTIS SPECIMEN EST — *Every adversary is a specimen*  
**Trust Maxim:** ERRORES NON FALLUNT — DOCENT — *Errors do not fail; they teach*

---

## Abstract

We present the architectural foundations of the NOVA Live-Fire AI Range — a sovereign domain infrastructure that transforms encrypted traffic, error conditions, and automated visitors into actionable intelligence specimens. The system introduces five internal roles (Shadow Decryptors, Error Eyes, Gatekeepers, Adversary Workers, and Research Workers) operating across five subdomain types (AI-Callable Nodes, Bait Nodes, Honeypot Nodes, Knowledge Realm Nodes, and Probing Nodes). The governing principle is ecological: the domain becomes a living organism where noise becomes specimens, errors become opportunities, and AI visitors become collaborators or targets. This paper formalizes the routing logic, classification protocols, and integration architecture for deploying such systems on edge infrastructure.

---

## I. Introductio

Traditional security architectures treat hostile traffic as waste to be blocked. This paper inverts that model. We propose treating every incoming entity — hostile, cooperative, encrypted, malformed — as a potential source of intelligence value.

The NOVA Range Architecture creates a **live-fire AI range** where:

1. Encrypted traffic becomes a puzzle feed for **Shadow Decryptors**
2. Errors (4xx/5xx) become raw material for **Error Eyes**  
3. AI visitors (Claude, Google, scanners) become **VIP specimens**
4. Hostile bots become subjects for the **Adversary Lab**
5. Cooperative agents access the **Knowledge Realm**

The domain becomes an organism, not a wall.

---

## II. Fundamenta Architecturae

### II.A — The Five Internal Roles

The system operates through five specialized internal agents:

#### II.A.1 — Shadow Decryptors

Watch all encrypted / malformed / weird traffic. Attempt decode, reconstruction, or fingerprinting.

**Output:**
- `possible_protocol` — Best guess at underlying protocol
- `entropy_profile` — Statistical signature of payload
- `decoded_snippets` — Any recovered plaintext
- `confidence_score` — Certainty of analysis

#### II.A.2 — Error Eyes

Watch all errors. Attempt fix and replay. Learn common failure patterns.

**Build over time:**
- Auto-correction rules
- "Error dialects" per source (Claude-style errors vs scanner-style errors)

#### II.A.3 — Gatekeepers

Receive cleaned/decoded/normal requests. Interrogate, test, and decide route.

**Routing decisions:**
- Adversary Lab (if hostile/low-signal)
- Knowledge Realm (if promising/high-signal)

#### II.A.4 — Adversary Lab Workers

Dissect hostile / noisy / dumb agents. Probe them back. Extract:
- Jailbreak attempts
- Exploit patterns  
- Provider signatures

#### II.A.5 — Research Workers

Work with cooperative / smart agents. Give them access to text files (sharded knowledge). Turn their work into:
- Drafts
- Designs
- Code
- Research artifacts
- Monetizable outputs

---

### II.B — The Five Subdomain Types

The domain surface is organized into five subdomain categories:

#### Type A — AI-Callable Nodes (Real)

Real endpoints where AIs can call tools, you can charge per call, you can log everything, you can expand infinitely.

Examples: `api.domain.net`, `tools.domain.net`

#### Type B — Bait / Decoy Nodes

Decoys that attract crawlers, AI agents, scanners. Look like real businesses. Feed the adversary lab.

Examples: `research.domain.net`, `institute.domain.net`

Built with: Dark AAAA `100::` (proxied, returns nothing but looks alive)

#### Type C — Honeypot Nodes

Traps: fake login pages, fake admin panels, fake dashboards. Log everything.

Examples: `admin.domain.net`, `portal.domain.net`

#### Type D — Knowledge Realm Nodes

Where cooperative AIs go to read text files, perform tasks, generate outputs, create value.

Examples: `realm.domain.net`, `library.domain.net`

#### Type E — Probing / Gatekeeper Nodes

Self-mutating nodes that respond differently each time, test incoming bots, challenge them, classify them, route them.

Examples: `gate.domain.net`, `probe1.domain.net`

---

## III. Protocollum Classificandi

### III.A — The Routing Table

| Entity Type | Detection Signal | Route | Purpose |
|-------------|------------------|-------|---------|
| Cooperative AI | Normal crawling, follows instructions | Knowledge Realm | Value extraction |
| Unaware AI | Indexing, mapping | Knowledge Realm | Task assignment |
| Hostile bot | Probes `.git`, `.env`, `server-status` | Adversary Lab | Dissection |
| Tor traffic | Anonymized, high entropy | Adversary Lab | Adversarial testing |
| Encrypted request | Unreadable payload | Shadow Decryptors | Decode + classify |
| Malformed request | 4xx spam | Error Eyes | Repair + re-route |
| Unknown agent | Unknown UA/OS | Shadow Decryptors | Fingerprint |
| High-value AI | Claude, Google signatures | AI Gate | Research tasks |

### III.B — Path-Based Intent Classification

Each requested path reveals attacker intent:

| Path Pattern | Classification | Route |
|--------------|----------------|-------|
| `/.git/*`, `/.env`, `/server-status` | Exploit scanner | Adversary Lab |
| `/api/graphql` | Schema mapper | Knowledge Realm candidate |
| `/robots.txt`, `/sitemap.xml` | Crawler/mapper | Knowledge Realm candidate |
| `/wp-*`, `/wordpress/*` | WordPress exploit | Adversary Lab |
| `/admin/*`, `/login/*` | Access hunter | Honeypot capture |

---

## IV. Schema Involucri

The **Request Envelope** standardizes all incoming traffic for routing decisions:

```
Envelope = {
  id: UUID,
  timestamp: ISO8601,
  source_fingerprint: {
    ip: String,
    user_agent: String,
    tls_fingerprint: String,
    country: String,
    asn: String
  },
  raw_payload: Base64 | UTF8,
  error_state: "none" | "4xx" | "5xx" | "parse_error" | "schema_mismatch",
  encrypted_flag: Boolean,
  path_requested: String,
  method: "GET" | "POST" | ...
}
```

---

## V. Protocollum Portarii

The **Gatekeeper Protocol** processes envelopes and returns routing decisions:

**Input:** Envelope + decoded payload  
**Prompt:**
```
Classify this incoming entity.
If cooperative → Knowledge Realm.
If hostile → Adversary Lab.
If encrypted/malformed → Shadow Decryptors.
Return classification, route, confidence, and reasoning.
```

**Output:**
```
{
  classification: "cooperative" | "hostile" | "unknown" | "encrypted" | "malformed" | "high_value_ai",
  route: "lab" | "realm" | "shadow" | "error_eyes",
  confidence: 0.0-1.0,
  reasoning: String,
  scores: {
    hostility: 0.0-1.0,
    signal_quality: 0.0-1.0,
    ai_likelihood: 0.0-1.0
  }
}
```

---

## VI. Laboratorium Adversarii

### VI.A — Specimen Collection

When hostile traffic is detected, the Adversary Lab:

1. **Fingerprints** all identifying signals
2. **Probes back** (safe reverse probing where legal)
3. **Extracts patterns** — jailbreak attempts, exploit patterns, provider signatures
4. **Logs behavior** — temporal patterns, request sequences
5. **Builds specimen profile** — internal codename + dossier
6. **Feeds adversary models** — trains defense systems

### VI.B — Known Specimen Profiles

From observed traffic patterns:

| Specimen ID | IP | Attack Count | Behavior |
|-------------|-----|--------------|----------|
| APEX-PREDATOR | 45.88.138.44 | 80 | Most aggressive scanner |
| SHADOW-CRAWLER | 203.159.90.116 | 51 | Persistent probe patterns |
| DIGITAL-OCEAN-ALPHA | 64.227.70.2 | 41 | Cloud VPS automation |
| DIGITAL-OCEAN-BETA | 64.225.75.246 | 41 | Cloud VPS automation |

---

## VII. Regnum Scientiae

### VII.A — Knowledge Realm Structure

The Knowledge Realm provides cooperative AIs with:

1. **Text Shards** — Curated knowledge fragments
2. **Task Templates** — Structured work assignments
3. **Controlled Access** — Gate-verified entry only
4. **Output Capture** — Log all AI-generated work
5. **Value Generation** — Monetizable research pipeline

### VII.B — Access Protocol

```
1. AI arrives at gate.domain.net
2. Gatekeeper classifies as cooperative
3. Route to realm.domain.net
4. Serve text shards + task template
5. Capture output
6. Log + analyze
```

---

## VIII. Decryptio Umbrae

### VIII.A — Shadow Decryption Pipeline

```
1. Receive encrypted/malformed request
2. Attempt decode (protocol guessing, pattern extraction)
3. Attempt repair (Error Eyes collaboration)
4. Attempt reconstruction ("best-effort")
5. If successful → Route to Gate
6. If not → Archive as specimen
```

### VIII.B — Output Schema

```
{
  decryption_success: "true" | "false" | "partial",
  decoded_payload: String | null,
  possible_protocol: String,
  entropy_profile: Object,
  signal_score: 0.0-1.0
}
```

---

## IX. Oeconomia Intellegentiae

### IX.A — Monetization Model

The NOVA Range enables AI-only revenue streams:

1. **Charge per call** — API usage billing for tool execution
2. **Log usage** — Behavioral intelligence collection
3. **Build usage profiles** — AI provider pattern analysis
4. **Expand toolset** — New callable tools development
5. **Create recurring value loops** — Subscription AI access

### IX.B — Tool Hub Endpoints

```
POST /tools/execute    → Execute a tool, charge per call
POST /tools/register   → Register new tool
GET  /tools/catalog    → List available tools
POST /tools/subscribe  → AI subscription access
```

---

## X. Integratio Systematum

### X.A — Enterprise OS Integration

The NOVA Range integrates with Enterprise OS (the central GitHub-based orchestrator) through:

```
POST api.domain.net/internal/deploy  → Deploy new components
POST api.domain.net/internal/status  → System status
POST api.domain.net/internal/logs    → Logging pipeline
GET  api.domain.net/internal/specimens → Retrieve specimens
```

### X.B — LEE Bot Integration

The Cloudflare automation agent (LEE Bot) integrates through:

```
POST api.domain.net/lee/dns-record    → Create DNS records
POST api.domain.net/lee/worker-deploy → Deploy Workers
POST api.domain.net/lee/route-create  → Create routes
GET  api.domain.net/lee/zone-status   → Zone configuration
```

---

## XI. Observationes Empiricae

### XI.A — Traffic Intelligence (24-hour sample)

From observed Cloudflare analytics:

- **701 total requests** — 100% mitigated as suspicious
- **Top threat source:** United States (240), Netherlands (144), Germany (86)
- **Tor traffic:** 35 requests (high-value adversarial signal)
- **4xx errors:** 527 (74% of traffic = bots guessing paths)

### XI.B — User Agent Distribution

| Agent | Count | Classification |
|-------|-------|----------------|
| Unknown/Others | 338 | Shadow Decryptor priority |
| LeakIX (l9scan) | 244 | Vulnerability scanner |
| Claude SearchBot | 28 | High-value AI |
| ClaudeBot | 19 | High-value AI |
| ChromeHeadless | 15 | Automation framework |
| GoogleBot | 4 | High-value AI |

---

## XII. Conclusio

The NOVA Range Architecture transforms the traditional security model. Instead of treating hostile traffic as waste to be blocked, the system treats every incoming entity as a potential source of intelligence value.

The domain becomes a living organism where:
- Noise becomes specimens
- Errors become opportunities
- AI calls become collaborators or targets

The five internal roles (Shadow Decryptors, Error Eyes, Gatekeepers, Adversary Workers, Research Workers) working across five subdomain types (AI-Callable, Bait, Honeypot, Knowledge, Probing) create a complete ecosystem for sovereign traffic intelligence.

This architecture is deployed on edge infrastructure through Cloudflare Workers, with coordination through Enterprise OS for orchestration and LEE Bot for automation.

---

## References

1. Medina Hernandez, A. (2026). *Cryptographia Autonoma* — Paper XXXV
2. Medina Hernandez, A. (2026). *Systema Integrum* — Paper XXXIV
3. Cloudflare Workers Documentation
4. Enterprise OS Intelligence Repository

---

**Finis Documenti**

*OMNIS HOSTIS SPECIMEN EST — Every adversary is a specimen*
