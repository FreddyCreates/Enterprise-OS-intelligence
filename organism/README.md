# Organism Architecture

The organism is a living intelligence system composed of five integrated organs.

```
organism/
│
├── membrane/       # Cloudflare gateway organ — routing, policies, edge compute
├── identity/       # ICP SSN organ — sovereign identity, canister auth, tokens
├── brain/          # Julia organ — phi mathematics, probe classification, WASM compilation
├── reflex/         # Cloudflare workflows organ — event-driven automation, queues
└── surfaces/       # Synthetic surfaces organ — honeypots, mazes, bot gymnasium
```

## Organs

| Organ | Runtime | Purpose |
|-------|---------|---------|
| **membrane** | Cloudflare Workers | Gateway routing, rate limiting, threat policies |
| **identity** | Internet Computer (ICP) | SSN canister, X-token auth, Candid interfaces |
| **brain** | Julia + WASM | Phi-math reasoning, probe classification, function cards |
| **reflex** | Cloudflare Workflows | Event-driven workflows, queue processing, handlers |
| **surfaces** | Multi-runtime | Honeypots, adversarial mazes, bot training gym |
# 🧬 ORGANISM — 5-Organ Computational Architecture

**Door 4 — The Architect Key**

This is the genome of a civilization-scale computational organism.
Each folder is a chromosome. Each subfolder is a gene cluster. Each deployed artifact is an organ.

## Architecture

```
        ┌──────────────────────────────┐
        │      Cloudflare Membrane     │
        │  (Workers + DO + KV + WAF)   │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │     Reflex Engine (CF)       │
        │  (Workflows + Queues + WS)   │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │     Julia Brain Organ        │
        │ (WASM + Bridge + φ-math)     │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │     ICP Identity / State     │
        │ (SSN + SSN-X + Canisters)    │
        └──────────────────────────────┘
```

Everything talks to everything through MCP tools.

## Cross-Substrate Computation

| Path | Description |
|------|-------------|
| Cloudflare → Julia | Membrane invokes brain computations |
| Julia → ICP | Brain writes state to identity substrate |
| ICP → Cloudflare | Identity triggers membrane reflexes |
| Cloudflare → ICP | Membrane resolves identity directly |
| ICP → Julia | Identity triggers policy optimization |

## 3 Sovereign Workers (Collapsed from 12)

| Worker | Role | Responsibilities |
|--------|------|-----------------|
| **Worker 1 — Membrane Gateway** | All public traffic | Routing, probe classification, identity resolution |
| **Worker 2 — Internal Services** | Internal APIs | SSN-X accounting, admin, Julia bridge calls |
| **Worker 3 — Synthetic Surfaces** | Deception layer | Honeypots, mazes, bot gyms, probe sandboxes |

Everything else becomes: Workflows, Durable Objects, ICP canisters, Julia functions.

## Organ Registry

| Organ | Substrate | MCP Namespace |
|-------|-----------|---------------|
| Identity | ICP + Worker | `icp.ssn.*` |
| Membrane | Cloudflare Workers | `membrane.*` |
| Reflex | Cloudflare Workflows | `workflow.*` |
| Brain | Julia WASM + Bridge | `julia.*` |
| State | ICP + Durable Objects | `state.*` |
| Surfaces | Cloudflare Workers | `surfaces.*` |

## Genome Layout

```
organism/
├── membrane/               # Cloudflare gateway organ
│   ├── workers/            # 3 sovereign workers
│   ├── routes/             # Route definitions
│   ├── policies/           # Edge policies
│   └── mcp/               # MCP tool manifests
│
├── identity/               # ICP SSN organ
│   ├── ssn_canister/       # SSN registration canister
│   ├── ssn_x_tokens/       # SSN-X token canister
│   ├── candid/             # Candid interfaces
│   └── mcp/               # MCP tool manifests
│
├── brain/                  # Julia organ
│   ├── phi_math/           # φ-mathematics
│   ├── probe_classifier/   # Probe classification
│   ├── wasm/               # WASM compilation targets
│   ├── function_cards/     # Julia-Motoko bridge cards
│   └── mcp/               # MCP tool manifests
│
├── reflex/                 # Cloudflare workflows organ
│   ├── workflows/          # Workflow definitions
│   ├── queues/             # Queue processors
│   ├── handlers/           # Event handlers
│   └── mcp/               # MCP tool manifests
│
├── state/                  # State/Memory organ
│   ├── stores/             # Durable Object stores
│   ├── logs/               # Append-only logs
│   ├── metrics/            # Metrics pipelines
│   └── mcp/               # MCP tool manifests
│
└── surfaces/               # Synthetic surfaces organ
    ├── honeypots/          # Deception endpoints
    ├── mazes/              # Engagement mazes
    ├── bot_gym/            # Bot training environments
    └── mcp/               # MCP tool manifests
```

## Version

- Architecture: Door 4 — 5-Organ v1.0.0
- Runtime: Cross-Substrate (Cloudflare + ICP + Julia)
- Protocol: MCP Tool System

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
