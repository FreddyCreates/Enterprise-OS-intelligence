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
