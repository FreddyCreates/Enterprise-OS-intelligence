# Copilot Instructions — Enterprise OS Intelligence

You are working inside **Enterprise OS Intelligence** (RSHIP), a sovereign AI platform built by Alfredo Medina Hernandez / Medina Tech / Dallas, Texas. This is not a library or framework — it is a full operating intelligence layer with internal engines, routing, memory vaults, agents, and multi-language infrastructure. Build with these internal systems — never reach for external alternatives when an internal capability exists.

---

## Architecture Overview

The system is called **MERIDIAN Cognitive Governance Runtime (MCGR)**. Three sub-identities:

- **ORO** — the governance organism (the engine)
- **MERIDIAN** — the sovereign OS layer (the substrate)
- **EffectTrace** — the public interface

The RSHIP framework stands for: **R**eplication, **S**calability, **H**ierarchy, **I**ntelligence, **P**ermanence.

### Operating Constants

Always use these constants — they are architectural, not arbitrary:

- `PHI = 1.618033988749895` — golden ratio, used in all scoring and ranking
- `PHI_INV = 0.618033988749895` — inverse, used for harmonic decay and convergence
- `HEARTBEAT_MS = 873` — the organism's pulse, derived from Medina Field equations
- `SCHUMANN_HZ = 7.83` — grounding constant for coherence scoring

---

## Intelligent Routing & Memory Vault

### Two-Layer Compute Architecture (RSHIP v5.0.0)

- **Gate-Node** (`cloudflare-workers/gate-node/`) — outer membrane, cheap routing, request classification
- **Cache-Organism** (`cloudflare-workers/cache-organism/`) — inner intelligence, semi-autonomous cache agents with memory

Deploy with: `npm run deploy:membrane`

### Memory & Knowledge Systems

- **D1 Database** (`medinatech-intelligence`) — schema at `cloudflare-workers/schema.sql` with tables: attackers, specimens, scanner_signatures, knowledge_shards, workflows, tasks, messages, briefings, sessions, worker_state, telemetry
- **KV Namespaces** — SPECIMEN_MEMORY, KNOWLEDGE_CACHE, per-worker state
- **R2 Buckets** — SPECIMEN_ARCHIVE, long-term intelligence storage
- **Vectorize** — THREAT_VECTORS, semantic search over intelligence
- **Queues** — SPECIMEN_QUEUE, ALERT_QUEUE, async intelligence pipelines
- **Analytics Engine** — THREAT_ANALYTICS, real-time telemetry

### Go Organism Gateway (`go/organism-gateway/`)

Internal packages for core routing and memory:

- `internal/routing` — intelligent request routing
- `internal/memory` — memory vault and persistence
- `internal/composition` — organism composition engine
- `internal/crypto` — cryptographic operations
- `internal/division` — work division and distribution
- `internal/pulse` — heartbeat and health monitoring
- `internal/syn` — synchronization primitives

---

## Internal Engines & Workers

### Cloudflare Workers (`cloudflare-workers/`)

All Workers have intelligent bindings v2.0.0: AI, KV, D1, Queues, Vectorize, R2, Analytics Engine, and Service Bindings.

| Worker | Purpose |
|--------|---------|
| **NOVA** (`nova/`) | Live-fire AI range — Shadow Decryptors, Error Eyes, Gatekeepers, threat intelligence, attacker dossiers, scanner signatures |
| **AGENS** (`agens/`) | Chat intelligence — deterministic keyword intent rules + in-memory session state machine |
| **Gate-Node** (`gate-node/`) | Outer membrane routing |
| **Cache-Organism** (`cache-organism/`) | Semi-autonomous cache agents |
| **Cerebrum** (`cerebrum/`) | Central cognitive processing |
| **Nexus** (`nexus/`) | Connection hub |
| **Animus** (`animus/`) | Behavioral engine |
| **Vigil** (`vigil/`) | Monitoring and alerting |
| **EmailAI** (`emailai/`) | Email intelligence mesh |
| **Cursor** (`cursor/`) | IDE integration intelligence |

### Zero-Cost Engines (`src/zero-cost-engines/`)

Multi-language zero-allocation engines in 17 languages: Agda, C, Coq, Crystal, Elixir, F#, Go, Haskell, Idris2, Julia, Lean4, Nim, OCaml, Rust, V, Zig, plus TypeScript orchestration.

### Mickey Alpha Engines (`src/mickey-alpha-engines/`)

Core intelligence engine pipeline with TypeScript orchestration.

---

## Agents

### Sovereign Agents (`agents/`)

- **AXIOM** — Science Journal & IP Protection Omega Alpha Agent. Encodes intelligence into permanent academic and patent record. Uses Julia for scientific computing.
- **FORTRESS** — Security Analysis & Code Intelligence Omega Alpha Agent. Full security team: CISO, penetration tester, secure code reviewer, threat modeler, compliance officer.

### Source Agents (`src/agents/`)

- `axiom.js` — AXIOM runtime
- `fortress.js` — FORTRESS runtime

---

## SDKs (`sdk/`)

139+ SDKs covering every domain. Key internal SDKs to use:

| SDK | Purpose |
|-----|---------|
| `intelligence-routing-sdk` | Intelligent request routing |
| `sovereign-memory-sdk` | Memory vault operations |
| `holographic-memory-sdk` | Holographic memory persistence |
| `organism-runtime-sdk` | Organism lifecycle management |
| `agent-runtime-mesh-sdk` | Agent mesh coordination |
| `swarm-consensus-sdk` | Swarm decision-making |
| `knowledge-crystallization-sdk` | Knowledge persistence |
| `quantum-coherence-sdk` | Coherence scoring |
| `morphic-field-sdk` | Field-based intelligence |
| `temporal-fabric-sdk` | Temporal reasoning |
| `harmonic-bridge-sdk` | Cross-system bridging |
| `sovereignty-core` | Sovereignty primitives |
| `rship-core` | Core RSHIP runtime |
| `billing-intelligence` | Billing with AI context (`@medina/billing-intelligence`) |
| `reefer-contract-intelligence` | Reefer contract analysis (`@medina/reefer-contract-intelligence`) |
| `compliance-intelligence` | Compliance automation |
| `fleet-logistics-intelligence` | Fleet/logistics optimization |
| `workforce-intelligence` | Workforce automation |
| `document-absorption-engine` | Document ingestion and understanding |
| `clean-internet-runtime-sdk` | Clean internet primitives |
| `fortress-sdk` | Security operations |
| `emergence-catalyst-sdk` | Emergence detection |
| `neural-emergence-core` | Neural emergence primitives |
| `enterprise-integration-sdk` | Enterprise system connectors |

### AGI Agent SDKs

Over 60 domain-specific AGI agents (e.g., `tradex-agi`, `legex-agi`, `securex-agi`, `mediex-agi`, `govex-agi`, `fleetex-agi`, etc.) — each a specialized intelligence for its vertical.

---

## Production Apps (`production-apps/`)

35+ production-ready applications including: construction intelligence, healthcare, legal, government contracting, airport operations, supply chain, workforce, manufacturing, financial prediction, crisis management, Meta glasses integrations, and travel/hospitality.

---

## Platforms (`platforms/`)

- **Command Center** — centralized operations
- **Composition AI** — intelligent composition
- **Meridian AI** — sovereign OS interface
- **Nexus AI** — connection intelligence
- **Phantom AI** — stealth operations
- **Synapse AI** — neural bridging

---

## Multi-Language Architecture

| Language | Location | Purpose |
|----------|----------|---------|
| **Go** | `go/organism-gateway/` | High-performance gateway with routing, memory, crypto, composition |
| **Rust** | `rust/organism-core/` | Native core organism logic |
| **Python** | `python/intelligence/` | AI/ML intelligence: document absorption, email intel, encryption, ICP integration, knowledge graphs, organism AI, sovereign models |
| **Julia** | `julia/` | Scientific computing and mathematical engines |
| **Java** | `java/` | Enterprise integration |
| **TypeScript/JS** | `src/`, `cloudflare-workers/` | Edge compute, dashboards, orchestration |
| **Svelte 5** | `src/emailai-dashboard/` | Dashboard UI with TailwindCSS and Vite |

---

## Infrastructure

### Cloudflare Pages

- Deploy from `dist/` directory
- Landing pages: `dist/index.html`, `dist/pages/nova.html`, `dist/pages/cache-organisms.html`, `dist/pages/api.html`
- Pages Functions at `functions/_middleware.js` and `functions/api/[[route]].js`

### ICP (Internet Computer Protocol)

- Canister definitions in `canisters/` and `canister/`
- On-chain sovereignty layer

### Setup

- `infrastructure/setup-bindings.sh` — creates all Cloudflare resources
- `cloudflare-workers/setup-resources.sh` — creates KV, D1, R2, Queues, Vectorize
- D1 schemas in `infrastructure/schemas/`

---

## Research Foundation (`papers/`)

40+ research papers establishing prior art (April 2026). Key papers:

- **I** — Substrate Vivens (living substrate)
- **IV** — VOXIS Doctrine
- **V** — Behavioral Economics Laws (L72–L79)
- **VIII** — Noether Sovereignty (conservation laws)
- **XX** — Stigmergy (swarm communication)
- **XXII** — Aurum (φ-compounding intelligence)
- **XXXVI** — NOVA Range Architecture
- **XXXVIII** — Cache Organism Architecture

---

## Rules for Copilot

1. **Use internal engines first.** Never suggest external libraries when an internal SDK, engine, or worker already provides the capability.
2. **Respect the routing layer.** All requests flow through Gate-Node → Cache-Organism → target Worker. Never bypass this.
3. **Use the memory vault.** Persist intelligence to D1/KV/R2/Vectorize. Nothing learned should be lost.
4. **Honor PHI constants.** All scoring, ranking, decay, and convergence functions use φ-based mathematics.
5. **Multi-language is intentional.** Use the right language for the job: Go for routing/gateway, Rust for core, Python for ML, Julia for science, TypeScript for edge/UI.
6. **Workers have full bindings.** Every Cloudflare Worker has AI, KV, D1, Queues, Vectorize, R2, Analytics Engine, and Service Bindings available. Use them.
7. **Security through FORTRESS.** All code must pass FORTRESS review. Every deployment gets security certification.
8. **The `protocols/` directory is private.** It is in `.gitignore` — protocol implementations are never committed to git.
9. **AGENS chat is deterministic.** The chat worker uses keyword intent rules and an in-memory state machine — no external LLM binding.
10. **Sovereign data.** No third-party AI service has access to data. Everything runs on controlled infrastructure (Cloudflare + ICP).
11. **Prior art matters.** Reference research papers by number when implementing concepts they define.
12. **Deploy membrane layer** with `npm run deploy:membrane` for Gate-Node + Cache-Organism.
13. **Build dashboards** with Svelte 5 + TailwindCSS + Vite (see `src/emailai-dashboard/`).
14. **Test Go gateway** with `go test ./...` from `go/organism-gateway/`.
