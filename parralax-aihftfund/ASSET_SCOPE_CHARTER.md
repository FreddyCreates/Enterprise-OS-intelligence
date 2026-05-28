# ASSET SCOPE CHARTER

**Document:** `parralax-aihftfund/ASSET_SCOPE_CHARTER.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 8 — Asset Scope · § 17 — Asset Creation Charter  
**Status:** Public charter. Prior art. No implementation in this commit.

---

## 0. Premise

The Charter (§ 8) enumerates *categories* of asset PARRALAX may operate across. This document tightens that into a **declared, tiered, gate-readable** universe — the actual set of asset classes the system will engage on day one, the tier each receives by default, and the criteria for adding or removing an asset.

Without a formal scope, "PARRALAX trades many things" is brand language, not engineering. With this scope, CUSTOS knows exactly which `assetId` strings are valid inputs and which are out-of-mandate.

The doctrine: **the asset universe is enumerated, tiered, and source-linked. Anything not in the scope cannot be traded by any agent at any level.**

---

## 1. The seven asset families

| # | Family | Examples | Risk tier default | On day 1? |
|:--:|:---|:---|:---:|:---:|
| 1 | **Crypto majors (spot)** | BTC, ETH, SOL | STANDARD | yes |
| 2 | **Stablecoins** | USDC, USDT, DAI (vetted issuers only) | STRICT | yes |
| 3 | **Fiat (FX)** | USD, EUR, GBP, JPY, MXN, CAD | STANDARD | yes |
| 4 | **Equities (listed)** | US-listed common stock, ETFs, ADRs | STANDARD | yes (paper) / phased (live) |
| 5 | **AI tokens** | external project tokens with explicit AI mandate | STRICT | yes (read-only first 90d) |
| 6 | **NFTs / programmable ownership** | strategy NFTs, license NFTs, internal-issued | STRICT | internal only on day 1 |
| 7 | **Prediction markets** | event-outcome contracts on regulated venues | STRICT | yes (limited, see PREDICTION_MARKETS_CHARTER) |

Plus two PARRALAX-internal asset families with their own issuance rules:

| # | Family | Examples | Tier | On day 1? |
|:--:|:---|:---|:---:|:---:|
| 8 | **Internal accounting units** | strategy P&L units, agent reputation units | STRICT | yes |
| 9 | **Internal PARRALAX AI tokens** | governance / participation / compute-receipt | STRICT | **no — issuance is a future, gated decision** |

---

## 2. The asset-tier matrix

Every asset PARRALAX touches has a **risk tier** in the sense of `RISK_CHARTER.md` § 6. The tier governs which gate parameter set CUSTOS applies. Defaults below; operator may override per asset with documented justification and a council record.

### 2.1 STRICT tier (the default for new entries)

Used for any asset with one or more of:
- Limited price history (< 2 years of clean data).
- Concentrated venue exposure (single dominant venue).
- Recently disclosed exploit or solvency event.
- Regulatory ambiguity at the federal level.
- Liquidity profile that cannot absorb the agent's standard order size at < 25 bps slippage.

Parameter defaults (illustrative; operator-set numbers):
- Max position size: smallest of the per-tier defaults.
- Drawdown halt: tightest daily/weekly bounds.
- Volatility ceiling: lowest.
- Confidence floor: highest (model must be very sure to act).

Every asset in scope **enters at STRICT** by default. Loosening to STANDARD requires:
- 90 days of clean operation at STRICT with no CUSTOS violations.
- Council ratification.

### 2.2 STANDARD tier

For assets with established price discovery, deep multi-venue liquidity, and stable regulatory frame. Crypto majors after a probation period and most US-listed equities sit here.

### 2.3 WIDE tier (rare; explicit justification required)

Reserved for assets where a specific strategy *legitimately* needs wider parameters — usually market-making or HFT in deep, mature markets. Requires documented strategy mandate and council ratification.

### 2.4 Excluded by doctrine (cannot be added at any tier)

| Excluded | Reason |
|---|---|
| Unregistered securities offered to the operator under exempt-offering rules | Compliance posture is conservative; we don't trade what we don't have public-market access to. |
| Tokens on chains without an audited bridge or validator set | `gate.chain` would fail every action anyway; making them in-scope is wasted surface. |
| Assets sanctioned by OFAC or equivalent | `gate.counterparty` permanent block. |
| "Memecoins" without a public, verifiable contract-and-team disclosure | Failure rate is the doctrine. No exposure to founders we cannot name. |
| Pure-rugpull-history project tokens, even if currently active | Historical rugpull is a permanent disqualifier. |
| Privacy coins on regulated venues that don't accept them | Cannot route through a venue that won't accept the asset. |

The exclusion list is **additive**. An entry on it cannot be quietly removed; removal requires a council vote and a written rationale that survives in the audit trail.

---

## 3. Family 1 — Crypto majors (spot)

### 3.1 Day-1 set

```
BTC/USD, BTC/USDC, BTC/USDT
ETH/USD, ETH/USDC, ETH/USDT
SOL/USD, SOL/USDC
```

### 3.2 Venue qualification

A crypto major must be tradeable on **at least three independently-operated venues** (centralised, decentralised, or mixed) for inclusion. This is the parallax requirement: if there's only one shadow, there's no parallax.

### 3.3 Promotion to STANDARD

After 90 days at STRICT with no CUSTOS violations and demonstrated multi-venue liquidity, an asset is eligible for council promotion to STANDARD.

### 3.4 Watchlist (in-scope for observation, not for execution)

Other top-50-by-marketcap assets are on a **watchlist** — VIGIL observes them, AUGUR may emit signals scoring them, but **no Level-4+ agent has them in its `walletScope`**. Promotion from watchlist to in-scope follows § 9 below.

---

## 4. Family 2 — Stablecoins

### 4.1 Vetted issuers only

Stablecoin inclusion requires:
- Publicly disclosed reserves audited by a recognised auditor on a quarterly or better cadence.
- A clear redemption path that has been demonstrated, not just claimed.
- A regulatory disclosure in at least one major jurisdiction (US, EU, UK, Singapore).

### 4.2 Day-1 set

```
USDC, USDT, DAI
```

### 4.3 Per-stablecoin depeg posture

CUSTOS maintains a **depeg watchdog** per stablecoin:
- If price deviates more than 50 bps from peg for more than 5 consecutive minutes, the stablecoin is auto-tripped on `gate.counterparty` and exits in-scope until manual reset.
- Reset is council-only (3-of-5) plus a written rationale.

### 4.4 Stablecoin-of-last-resort

PARRALAX designates **one** stablecoin as the system-wide unit of account for internal accounting purposes. Default: USDC. The designation is an operator decision recorded in the deployment manifest; changing it is a hardware-signer ceremony.

---

## 5. Family 3 — Fiat (FX)

### 5.1 Tier-1 pairs (in-scope on day 1)

```
EUR/USD, GBP/USD, USD/JPY, USD/MXN, USD/CAD
```

USD/MXN is included because of the Dallas Market Doctrine — proximity, remittance flow, and trade volume between TX and MX justify tier-1 status. This is a doctrinal commitment, not a market-rank assertion.

### 5.2 Tier-2 pairs (watchlist; observation only)

```
AUD/USD, NZD/USD, USD/CHF, USD/SGD, USD/HKD, USD/CNY (via offshore CNH only)
```

### 5.3 Crosses

Crosses (e.g. EUR/JPY) are not in-scope on day 1. PARRALAX will trade a cross as two USD legs through `VECTOR` rather than route to a cross-pair venue, unless the cross has a documented liquidity advantage.

### 5.4 Counterparty constraint

Fiat trades require a registered FX broker counterparty per `RISK_CHARTER.md gate.counterparty`. No fiat trades against unregistered or peer-to-peer counterparties. Stablecoin-mediated fiat is *not* FX; it is crypto-routed payment and follows § 4.

---

## 6. Family 4 — Equities (listed)

### 6.1 Scope

US-listed common stock, ETFs, and ADRs on:
- TXSE (when live; preferred per Dallas Market Doctrine)
- NYSE
- Nasdaq
- ARCA

### 6.2 Liquidity floor

Eligible only if **3-month average daily volume ≥ $5M USD** at the symbol. Smaller-cap symbols are watchlist only.

### 6.3 Short-selling

Short positions are out of scope on day 1. Long-only equity is the entry posture. Short-enabling requires:
- An operator-issued mandate that names the strategy.
- Council ratification.
- A documented borrow source.
- `gate.leverage.systemMax` re-evaluation by CUSTOS.

### 6.4 Options

Listed options are **out of scope on day 1**. The complexity warrants its own protocol document. Operator may add later via a dedicated charter (`OPTIONS_CHARTER.md`, deferred).

---

## 7. Family 5 — AI tokens

### 7.1 What this family is

Tokens issued by external projects whose stated mandate involves AI services, compute, agent coordination, or model governance. PARRALAX engages this family for two reasons:

1. **Thematic exposure.** The AI-token sector has a coherent macro thesis that AUGUR can model.
2. **Parallax against PARRALAX's own AI tokens.** When PARRALAX eventually issues its own tokens (§ 11 below), external AI tokens are the reference set.

### 7.2 Inclusion criteria

A token is eligible for the watchlist only if:
- The project has a public team disclosure (named individuals, verifiable identities).
- The contract is audited by a reputable firm with a public audit report.
- A clear, public articulation of what the token represents — utility, governance, compute-rights, or revenue-share — in plain language.
- Listed on at least two independently-operated venues with combined ADV ≥ $5M USD over the trailing 30 days.

### 7.3 Inclusion process

- Phase 1 (0–90 days): **Read-only** on the watchlist. VIGIL observes, AUGUR may model, no agent may transact.
- Phase 2 (90+ days, conditional): With council ratification, promoted to **in-scope STRICT** — Level 4 agents with explicit asset-allowlist may engage.
- Phase 3 (180+ days, conditional): Promotion to **STANDARD** by council ratification and clean record.

### 7.4 Day-1 watchlist

This list is intentionally empty in this charter — operator populates it on deployment with a hardware-signer ceremony. The agent does not assume which AI tokens belong on the list.

### 7.5 Forbidden in this family

- Any AI token whose primary marketing is its price, not its function.
- Any AI token with unannounced or anonymous team behind it.
- Any AI token on a chain not in `gate.chain.contractAllowlist`.

---

## 8. Family 6 — NFTs and programmable ownership

### 8.1 Scope

PARRALAX's NFT engagement is **internal-first**. The fund creates and manages NFTs that represent:

- Strategy licenses.
- Agent identity certificates.
- Compute receipts.
- Fund participation rights.
- Dataset provenance records.
- Execution-history snapshots.

External NFT trading (i.e., flipping art or PFP collections) is **out of scope on day 1.** It may be added later via a dedicated charter, but the engagement is structurally different and warrants its own doctrine.

### 8.2 Internal NFT issuance rules

Per `CHARTER.md` § 17.4: every internal NFT must have:
- A defined purpose.
- A supply logic (mint cap, mint window, mint authority).
- A rights model (what does holding it grant?).
- Transfer rules (transferable, soulbound, or revocable?).
- A governance status (who can amend the rights?).
- A proof record (a CHRONO entry signed by FABRICOR at mint).

The implementation of the issuance protocol is deferred to a future doctrine document (`NFT_PROTOCOL.md`); this charter only declares the rules apply.

### 8.3 Forbidden

- NFT trading on platforms with unmaintained smart contracts.
- NFTs without on-chain provenance.
- NFTs minted on a chain not in `gate.chain.contractAllowlist`.
- NFT pricing strategies based purely on social-sentiment signals without underlying right or utility.

---

## 9. Family 7 — Prediction markets

Specified in detail in [`PREDICTION_MARKETS_CHARTER.md`](./PREDICTION_MARKETS_CHARTER.md).

In this scope charter, the high-level statement: prediction markets are **in-scope on day 1 in a limited posture**, on venues that are either CFTC-regulated (Kalshi-class) or fully decentralised with verifiable oracle protocols. Concentrated event exposure is bounded by a dedicated gate (`gate.event_concentration`, defined in the prediction-markets charter).

---

## 10. Family 8 — Internal accounting units

### 10.1 What these are

Non-tradeable, non-transferable, ledger entries the system uses to track:

- Per-strategy P&L (in the system's unit of account).
- Per-agent reputation (a φ-EMA of clean executions).
- Capital commitments to specific strategies (not pledges; allocations).
- Risk-credit balances (an internal "you have N USD of risk budget left this hour").

### 10.2 Doctrine

These are **internal-only**. They never appear on any external venue. They are not assets in the regulated sense; they are accounting primitives. Their schema is owned by TRESOR and audited by SCRIBA.

### 10.3 Constraints

- Not transferable to external addresses.
- Not redeemable for any external asset.
- Not used as collateral against any external counterparty.
- Visible only to operator and council; not surfaced externally.

---

## 11. Family 9 — Internal PARRALAX AI tokens (FUTURE)

### 11.1 Why this family exists in the charter

The CHARTER (§ 8.4, § 17) explicitly contemplates that PARRALAX may issue its own tokens — governance, utility, strategy, fund-participation, compute-receipt, agent-access, reputation. This family is the placeholder for those issuances.

### 11.2 What this charter commits to

PARRALAX **may** in the future issue tokens of any class enumerated in `CHARTER.md` § 17.2. **Day-1 issuance is none.** Every issuance, when it eventually happens, requires:

1. A dedicated issuance charter for the specific token (e.g., `TOKEN_PARRALAX_GOVERNANCE_CHARTER.md`).
2. Council ratification.
3. A written compliance assessment (securities-law analysis specific to the token's design).
4. A FABRICOR-emitted minting receipt and a public registration in the asset registry.
5. A clear sunset path — every PARRALAX token has a governance-revocable burn protocol.

### 11.3 What this charter forbids without further doctrine

- Issuing any token without a charter dedicated to that token.
- Issuing a token with no rights, no utility, and no compute-backing.
- "Pre-mining" — issuing supply to the operator or council ahead of any public mint without disclosure.
- Soft-launching to a private allowlist without public disclosure that the allowlist exists.
- Any token whose marketing implies investment return without a securities-law assessment.

### 11.4 Day-1 status

**No PARRALAX-issued tokens exist.** The implementation scaffold will include the issuance protocol skeleton (FABRICOR's asset-issuance interface), but no token is minted by it on day 1.

---

## 12. Adding an asset to scope — the protocol

The only path by which an asset moves from "outside the scope" to "in-scope at STRICT":

1. **Discovery.** An operator, an agent on the watchlist, or a council member identifies the asset.
2. **Inclusion proposal.** The proposer writes a one-page inclusion memo: what the asset is, why it should be in scope, which venues qualify, which gate parameters apply.
3. **Watchlist (90 days).** The asset enters the watchlist. VIGIL observes; no agent transacts.
4. **CUSTOS review.** CUSTOS evaluates whether the gate parameter defaults are appropriate for the asset's volatility, liquidity, and venue profile.
5. **Council ratification.** 3-of-5 council vote to move from watchlist to in-scope STRICT.
6. **Registration.** Asset is added to the asset registry, with the inclusion memo, the CUSTOS review, and the council vote attached as a single CHRONO transaction.
7. **First trade.** Only after registration; only by a Level-4+ agent whose mandate's `walletScope` includes the asset.

The protocol cannot be shortened. There is no "expedited inclusion" path. The cost of the 90-day watchlist is the deterrent against impulsive asset additions.

---

## 13. Removing an asset from scope — the protocol

Removal is faster than inclusion (per the doctrinal asymmetry that stopping is easy):

1. **Trigger.** Any of: CUSTOS gate.counterparty permanent block; CUSTOS gate.smartcontract permanent block; OFAC sanctions; venue-coverage drops below the qualification threshold; operator decision; council vote.
2. **Immediate halt.** All Level-4+ agents lose the asset from `walletScope` on the next heartbeat.
3. **Wind-down.** Open positions are not auto-closed (per `KILL_SWITCH_DOCTRINE.md` § 7). Operator decides whether and how to unwind.
4. **De-registration.** Asset is moved to a `retired` registry section, with the retirement rationale and the operator's wind-down notes attached.

Re-inclusion of a retired asset follows § 12, but with **double the watchlist period** (180 days instead of 90).

---

## 14. The asset registry

A single canonical file (in the implementation repo, not this charter repo) maps `assetId → AssetRecord`. The shape:

```
AssetRecord {
  id:           string           // canonical id, e.g. 'crypto:btc'
  symbol:       string           // human-readable, e.g. 'BTC'
  family:       AssetFamily      // one of the 9 in this charter
  venues:       VenueRef[]       // qualifying venues
  unitOfAccount: string          // 'USDC' for crypto-spot, 'USD' for FX/equity, etc.
  tier:         'STRICT'|'STANDARD'|'WIDE'
  status:       'watchlist'|'in_scope'|'retired'|'excluded'
  inclusionMemoHash: sha256
  councilVoteIds:   string[]
  registeredAt:     iso8601
  retiredAt:        iso8601 | null
  notes:            string
}
```

The registry is read by every agent on every heartbeat. **An asset not in the registry with status `in_scope` cannot be traded by any agent at any level.** This is enforced by CUSTOS as a precondition to all gate evaluations.

---

## 15. What this charter explicitly forbids

| Forbidden | Reason |
|---|---|
| Trading any asset not in the registry with status `in_scope` | The registry is the only allow-list. |
| Adding an asset to the registry without the § 12 protocol | Inclusion is deliberate, never expedited. |
| "Soft" inclusion (e.g., agent transacts a token by exploiting a fungibility quirk in a wrapper) | Wrappers are themselves assets and follow § 12. |
| Mixing tiers — using STANDARD parameters for a STRICT-tier asset | Each asset's tier governs its CUSTOS parameter set. |
| Re-including a retired asset under shortened watchlist | Retirement doubles the re-entry watchlist. |
| Externally announcing tokens PARRALAX *will* issue before the issuance charter exists | No teaser issuance. The charter precedes the announcement. |
| Trading internal accounting units against external counterparties | Accounting units are internal-only. |
| Treating MXN/USD as a "minor" pair in any agent default | MXN is tier-1 by Dallas Market Doctrine. |

---

## 16. Reading lock-in

1. **The asset universe is enumerated.** "Trade anything in scope" is a defined, source-linked statement. There is no implicit scope.
2. **Every asset enters at STRICT.** Loosening is conscious, gated, council-ratified.
3. **Removal is faster than inclusion; re-inclusion is slower than first inclusion.** The asymmetry favours discipline.

---

## 17. Open decisions (operator-only)

1. **Day-1 AI-token watchlist.** Which specific external AI tokens enter the watchlist on launch. The charter does not assume any.
2. **First internal PARRALAX token — if any, when, why.** Not committed; entirely operator-decided.
3. **Equity short-selling enablement timeline.** Recommendation: not within the first 12 months of live operation.
4. **Options doctrine timing.** When (if) to draft `OPTIONS_CHARTER.md`.
5. **Unit-of-account default.** Confirm USDC (or another) as the system-wide internal-unit anchor.

---

## 18. Cross-references

- **Charter:** [§ 8 — Asset Scope](./CHARTER.md), [§ 17 — Asset Creation Charter](./CHARTER.md)
- **Sibling docs:** [`DALLAS_MARKET_DOCTRINE.md`](./DALLAS_MARKET_DOCTRINE.md) (MXN tier-1, TXSE preference), [`PREDICTION_MARKETS_CHARTER.md`](./PREDICTION_MARKETS_CHARTER.md) (family 7 detail), [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (asset registry membership is a `walletScope` precondition), [`RISK_CHARTER.md`](./RISK_CHARTER.md) (tier maps to gate parameter set)
- **Future docs:** `NFT_PROTOCOL.md`, `TOKEN_ISSUANCE_PROTOCOL.md` (per-token charters), `OPTIONS_CHARTER.md`
- **Existing doctrine inherited from the corpus:**
  - Charter § 17.4 — every internal asset must have purpose, supply logic, rights model, transfer rules, governance status, proof record.
  - The journal's CUSTOS pattern — registry as fail-closed allow-list.

---

*The asset universe is enumerated. Anything not in the registry cannot be traded.*
