# PARRALAX-AIHFTFUND

> Sovereign AI-native financial execution infrastructure.

This directory holds the **public charter family** for `PARRALAX-AIHFTFUND` — the financial-markets instance of the same organism described elsewhere in this repository (the journal, the papers, ORO, MERIDIAN, the CIVITAS INTELLIGENTIAE agent roster).

This is prior-art only. **No implementation code lives here.** The implementation belongs in a separate repository, behind separate security posture (see `PLAN.md` § 1 and § 5.4).

## Documents

### Root

| Document | Purpose |
|---|---|
| [`CHARTER.md`](./CHARTER.md) | The canonical PARRALAX-AIHFTFUND charter, v1.0, verbatim. Prior art. |
| [`READING.md`](./READING.md) | The architectural mapping. How every section of the charter resolves to an organ that already exists in the corpus (NEXORIS, COGNOVEX, CHRONO, ANTE·MEDIUS·POST, the truth ladder, AURUM, VOXIS), and where genuinely new doctrine is required (compliance boundary, kill-switch doctrine, simulation-to-live promotion). |
| [`PLAN.md`](./PLAN.md) | Next steps. The 10-agent council, the seven public sub-charters proposed, the seven-phase implementation roadmap, and the decisions only the operator can make. |

### Sub-charters (the three walls between intent and execution)

| Document | Purpose |
|---|---|
| [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) | **Who is allowed to act.** Levels 0–6 formalised as VOXIS doctrine-block fields, mapped to capability enumerations and wallet allow-lists. Promotion (deliberate, one level at a time, with receipts); demotion (automatic, eight triggers). No agent withdrawal at any level. No instantiation above Level 0. |
| [`RISK_CHARTER.md`](./RISK_CHARTER.md) | **What an action must clear before it executes.** Thirteen CUSTOS gates, each with parameter schema, check rule, failure semantics, receipt class. Capital · Exposure · Leverage · Volatility · Drawdown · Liquidity · Slippage · Venue · Chain · Smart-contract · Counterparty · Model-confidence · Strategy-consistency · Human-override. Three operator-selectable risk tiers (STRICT / STANDARD / WIDE), default STRICT. |
| [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md) | **The last wall.** Multi-trigger union, asymmetric stop/start (any one signed trigger trips; council vote required to reset; system reset requires hardware-signer ceremony). Canonical state in a Durable Object, never cached. **No auto-close of positions** — the switch stops new exposure; unwinding is deliberate operator action. |

These three documents together specify the entire trade-authorisation pipeline: an action proposed by an agent must pass its authority check (Authority Charter), then every relevant risk gate (Risk Charter), then a check that no kill switch covering its resources is tripped (Kill Switch Doctrine). Failure at any wall halts the action and writes a CHRONO entry.

## What this work is, and what it is not

| Is | Is not |
|---|---|
| The financial-markets instance of an existing organism | A new organism |
| A charter family establishing IP and doctrine | An implementation |
| Sibling to the journal and to MERIDIAN | Part of the journal |
| Public-by-design (prior-art) | A trading bot anyone can run |
| Operator-and-builder-facing | A consumer product |
| Risk-aware, compliance-aware, kill-switchable by construction | A speculative experiment |

## Identity

```
Name:        PARRALAX-AIHFTFUND
Author:      Alfredo Medina Hernandez
Affiliation: Medina Tech · Chaos Lab · Dallas, Texas
Version:     1.0 (charter)
Prior art:   May 2026
```

## The one non-negotiable

> Every executed trade has a receipt. Every receipt has a hash.  
> Every hash is chained to the prior. No trade is `settled` until the chain closes.  
> No agent escalates its authority without governance.  
> No kill switch is reset without a council.  
> No live key sits in a file.  
> No simulation result is reported as a real result.  
> No real result is reported until reconciled.

— `PARRALAX-AIHFTFUND/PLAN.md` § 9
