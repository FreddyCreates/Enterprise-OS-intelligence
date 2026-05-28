# parralax-aihftfund

> **Pre-extraction scaffold.** This directory is the day-1 scaffold of the separate `parralax-aihftfund` implementation repository. It lives here as a transitional artifact and is meant to be **extracted to its own repository** (see [`EXTRACTION.md`](./EXTRACTION.md)).

## What this is

The TypeScript foundation for the `PARRALAX-AIHFTFUND` financial execution organism. Specification lives in the public charter family at [`/parralax-aihftfund/`](../parralax-aihftfund/) — this directory is the code that honours those charters.

Day-1 surface:

- **`VoxisAuthority`** types and verification (per `AGENT_AUTHORITY_CHARTER.md`).
- **`GateReceipt`** types and the thirteen-gate `CUSTOS` interface (per `RISK_CHARTER.md`).
- **`KillSwitchState`** types and the asymmetric trip/reset semantics (per `KILL_SWITCH_DOCTRINE.md`).
- **Ten agent skeletons** — VIGIL · AUGUR · VECTOR · VENDITOR · CUSTOS · TRESOR · ARCHON · FABRICOR · SCRIBA · ARBITER.
- **Paper venue adapter** — the deterministic in-process matching engine that is the foundation of the test pyramid.
- **Venue adapter interface** — the contract every later live adapter conforms to.
- **CHRONO** receipt writer with hash-chaining.
- **Finance-extended `Mundator Cognitus`** sanitiser — extends the journal's sanitiser with wallet-address and exchange-key patterns.
- **CI pipeline** — typecheck, tests, sanitiser, all fail-closed.

What's NOT here on day 1:

- No live venue adapters (every live adapter is a per-venue charter-ratified PR).
- No TradingView integration (Phase T3, operator decision pending).
- No real API keys, ever.
- No agent behaviour beyond the skeletons — strategies are not in this commit.

## What you need to know before working in here

1. **The charters are the source of truth.** If the code contradicts a charter, the code is wrong. Charters live at `/parralax-aihftfund/` (this repo) or, after extraction, are copied to `charters/` (in the extracted repo).
2. **CUSTOS is the only path between intent and execution.** No code path produces a live order without passing CUSTOS.
3. **Every action writes a CHRONO receipt.** Pass or fail.
4. **No live key sits in a file.** Live keys come from `.env` (gitignored) or, in production, from a hardware signer / secrets vault.
5. **Default risk tier is STRICT.** Loosening is conscious.

## Project shape

```
parralax-impl/                          (will become parralax-aihftfund/ in its own repo)
├── README.md                           this file
├── EXTRACTION.md                       how to move this to a new repo
├── LICENSE                             Medina Proprietary (placeholder)
├── SECURITY.md                         security posture, key handling, disclosure
├── package.json                        ESM, TypeScript 5.x, vitest, tsx
├── tsconfig.json                       strict mode, ES2022 target, no implicit any
├── vitest.config.ts                    test runner config
├── .gitignore                          standard Node + .env + dist
├── .nvmrc                              22
├── .env.example                        every secret name, no values
├── charters/                           reference copies (or symlinks)
│   └── README.md                       points back to canonical home
├── src/
│   ├── index.ts                        public exports
│   ├── types/
│   │   ├── common.ts                   PrincipalId, Signature, Asset, Venue, ULID
│   │   ├── voxis.ts                    VoxisAuthority, Capability, WalletScope
│   │   ├── chrono.ts                   CHRONO entry shape, link-chain
│   │   └── market.ts                   OrderBook, Quote, Fill, OrderRequest
│   ├── voxis/
│   │   ├── authority.ts                doctrine-block signature verify
│   │   └── doctrine.ts                 frozen-block guards
│   ├── chrono/
│   │   ├── receipt.ts                  receipt writer
│   │   └── chain.ts                    SHA-256 chain link
│   ├── custos/
│   │   ├── gates.ts                    the 13 gate interfaces (+ event/window/oracle for prediction markets)
│   │   ├── engine.ts                   gate evaluation sequencer (cheap first, fail closed)
│   │   └── tiers.ts                    STRICT / STANDARD / WIDE defaults
│   ├── killswitch/
│   │   ├── state.ts                    KillSwitchState, scope union
│   │   ├── triggers.ts                 13 triggers (10 charter + 3 derived)
│   │   └── store.ts                    canonical-state interface (Durable Object-shaped)
│   ├── agents/
│   │   ├── base.ts                     VOXIS skeleton; reads doctrine first on every beat
│   │   ├── vigil.ts                    market observer
│   │   ├── augur.ts                    signal diviner
│   │   ├── vector.ts                   execution carrier
│   │   ├── venditor.ts                 venue executor
│   │   ├── custos-agent.ts             the agent that runs CUSTOS gates
│   │   ├── tresor.ts                   treasury accounting
│   │   ├── archon.ts                   governance integrity
│   │   ├── fabricor.ts                 asset issuance (artefact builder)
│   │   ├── scriba.ts                   trade receipt indexer
│   │   └── arbiter.ts                  settlement / sealing
│   ├── venues/
│   │   ├── types.ts                    Venue interface (read + paper, no live)
│   │   └── paper.ts                    deterministic in-process venue
│   └── council/
│       ├── vote.ts                     council vote types
│       └── asymmetric.ts               trip-vs-reset asymmetry helpers
├── tests/
│   ├── voxis.test.ts                   signature freezes doctrine block
│   ├── custos.test.ts                  gates fail closed, run in order
│   ├── killswitch.test.ts              asymmetric trip/reset, no auto-close
│   └── chrono.test.ts                  hash chain links correctly
├── tools/
│   └── sanitiser.mjs                   Mundator Cognitus + finance patterns
└── .github/
    └── workflows/
        └── ci.yml                      typecheck + tests + sanitiser (fail-closed)
```

## Quick start (after extraction)

```bash
nvm use
npm install
npm run typecheck        # tsc --noEmit, strict mode
npm test                 # vitest run
npm run sanitise         # Mundator Cognitus + finance patterns
npm run build            # all of the above
```

Every step fails closed. The build does not produce artefacts unless every previous step passed.

## License

Medina Proprietary. See [`LICENSE`](./LICENSE).

## The doctrine, restated

> Every executed trade has a receipt. Every receipt has a hash. Every hash is chained to the prior. No trade is `settled` until the chain closes. No agent escalates its authority without governance. No kill switch is reset without a council. No live key sits in a file. No simulation result is reported as a real result. No real result is reported until reconciled.

— `parralax-aihftfund/PLAN.md` § 9
