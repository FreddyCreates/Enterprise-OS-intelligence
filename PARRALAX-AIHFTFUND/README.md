# PARRALAX-AIHFTFUND

Sovereign AI-native multi-asset trading, execution, and financial infrastructure.

## What this is

PARRALAX-AIHFTFUND is the financial execution organism described in the charter:

- multi-asset trading infrastructure
- agent-governed execution
- risk-gated order flow
- internal token and NFT asset rails
- compute, signal, trade, and governance receipts
- memory-backed market operations
- simulation-to-live upgrade path

This implementation pass establishes:

- core governing documents
- recommended repo structure
- starter registries for agents, protocols, risk gates, assets, and strategies
- runtime modules for receipts, risk, agents, execution, assets, and orchestration
- a paper-execution loop that proves the infrastructure hangs together

## Layout

```text
PARRALAX-AIHFTFUND/
  README.md
  CHARTER.md
  ROADMAP.md
  SECURITY.md
  RISK.md
  GOVERNANCE.md
  COMPLIANCE_BOUNDARY.md
  lib/
  config/
  docs/
  protocols/
  agents/
  assets/
  execution/
  receipts/
  risk/
  treasury/
  scripts/
  tests/
```

## Quick start

```bash
cd PARRALAX-AIHFTFUND
node scripts/paper-execution-demo.mjs
node scripts/validate.mjs
```

## Core implemented modules

- `lib/registry.js` — seeded registries
- `lib/receipts.js` — compute/trade/signal/governance/asset receipts
- `lib/risk.js` — risk gate engine, kill switch, capital allocation
- `lib/assets.js` — token and NFT issuance
- `lib/agents.js` — observer/signal/risk/governance/audit agents
- `lib/execution.js` — paper execution and market memory
- `lib/index.js` — `ParralaxStack`

## Current scope

This is infrastructure-first and simulation-safe:

- paper execution
- registries
- protocol docs
- risk gates
- governance records
- receipt creation

It is not yet wired to live brokers, exchanges, DEX routers, or legal entity operations.

Those belong to later phases in `ROADMAP.md`.
