# AI TOKEN REGISTRY

**Document:** `parralax-aihftfund/AI_TOKEN_REGISTRY.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 17 — Asset Creation Charter · [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) § 11  
**Status:** Public registry. Prior art. **Zero tokens issued at the time of this charter.**

---

## 0. Premise

The PARRALAX corpus names many token concepts across multiple charter documents. This registry **catalogues every internal-token concept that has been named**, organises them into a coherent taxonomy, and states the inclusion path that any specific token must follow before issuance.

The registry is descriptive, not prescriptive. Naming a concept here does **not** authorise its issuance. The CHARTER (§ 17.4) and ASSET_SCOPE_CHARTER (§ 11) are explicit: every internal token requires its own dedicated charter, a council ratification, a securities-law assessment, a FABRICOR minting receipt, and a sunset path before a single unit is minted.

The doctrine: **the registry is the inventory of what has been named. It is not the inventory of what has been issued. As of this document, those two inventories differ — the second is empty.**

---

## 1. What is in scope here

Internal tokens — tokens that PARRALAX itself would issue. External AI tokens (the ones PARRALAX may eventually *trade* per `ASSET_SCOPE_CHARTER.md` § 7) are listed elsewhere; this registry is about what PARRALAX would *mint*.

The line between the two:

| | Internal token | External AI token |
|---|---|---|
| Who issues it | PARRALAX | A different project |
| Where it appears in scope | `AssetFamily.InternalPxToken` / `InternalUnit` | `AssetFamily.AiTokenExternal` |
| Charter required before activity | Yes (this registry + a per-token charter) | Yes (watchlist + inclusion memo) |
| Operator action required | Council ratification + securities review | Council ratification |

This registry is the first column.

---

## 2. The five token classes

Every token concept named anywhere in the corpus fits into one of five classes. The classes are the taxonomy.

### Class A — **Governance tokens**

Confer the right to vote on PARRALAX-internal proposals (strategy approvals, mandate ratifications, council seat changes, charter amendments).

Concepts named:
- `Governance tokens` — CHARTER § 17.2, § 8.4
- `Governance rights` — CHARTER § 8.4
- `Token Governance` — CHARTER § 13.4
- `Voting rights` — implied throughout governance charter

A governance token is structurally different from a price-bearing token. Its job is voice, not value. Per `AGENT_AUTHORITY_CHARTER.md` § 6, governance asymmetry favours stopping — so any governance token's voting rules must honour that asymmetry: easier to halt than to advance.

### Class B — **Utility tokens** (access + participation)

Grant the holder the ability to *use* a PARRALAX service (API access, agent access, strategy participation, fund participation). They are not investments; they are keys.

Concepts named:
- `Utility tokens` — CHARTER § 17.2
- `Strategy tokens` — CHARTER § 17.2, § 8.4
- `Fund participation tokens` — CHARTER § 17.2
- `Agent access tokens` — CHARTER § 17.2, § 8.3
- `Access credentials` — CHARTER § 8.4
- `Access NFTs` — CHARTER § 17.3, § 8.5
- `Protocol participation tokens` — CHARTER § 8.4
- `Strategy NFTs` — CHARTER § 17.3
- `License NFTs` — CHARTER § 17.3, § 8.5

Utility tokens are usually the safest class from a securities-law standpoint, but only if they grant *actual* use rights and are not marketed as investments. The marketing language matters as much as the contract.

### Class C — **Compute-backed assets** (proof of work performed)

Represent computation that has actually been performed. Mint when work is done; supply expands with verifiable activity.

Concepts named:
- `Compute-backed assets` — CHARTER § 8.3
- `Compute receipt tokens` — CHARTER § 17.2, § 8.4
- `Compute receipt assets` — CHARTER § 8.4
- `Compute proof NFTs` — CHARTER § 17.3
- `Compute receipts` — ubiquitous; see `parralax-impl/src/types/chrono.ts`

This is the class most aligned with PARRALAX's broader doctrine ("every action has a receipt"). A compute-backed token is the financialised form of a CHRONO entry. **The LOCUS family (see `LOCUS_TOKEN_CHARTER.md`) is the first concrete proposal in this class.**

### Class D — **Reputation + contribution units** (internal-only)

Represent a track record. Not transferable to external counterparties. Used internally for routing, allocation, weighting, and council representation.

Concepts named:
- `Reputation tokens` — CHARTER § 17.2
- `Contribution tokens` — CHARTER § 17.2
- `Contribution receipts` — CHARTER § 8.4
- `Agent reputation units` — CHARTER § 8.4
- `Agent reputation assets` — CHARTER § 11.7
- `Agent contribution records` — CHARTER § 25

Reputation units are **internal accounting units** in the `ASSET_SCOPE_CHARTER` § 10 sense — not transferable to external addresses, not redeemable for external assets, not used as collateral. They are how the system remembers who did what.

### Class E — **Risk + credit units** (internal-only accounting)

Represent risk budget or treasury accounting. Internal only; the bookkeeping primitives the operator and the council use to allocate capacity.

Concepts named:
- `Risk-credit tokens` — CHARTER § 17.2
- `Treasury accounting units` — CHARTER § 17.2
- `Internal accounting units` — CHARTER § 8.4
- `Strategy-specific asset units` — CHARTER § 8.4
- `Internal capital accounts` — CHARTER § 11.6
- `Internal fund tokens` — CHARTER § 8.4
- `Internal treasury units` — CHARTER § 22.3

Like reputation units, these are non-transferable, non-redeemable, internal-only. They are the system's chequebook.

### Plus — **provenance NFTs** (a transverse pattern)

A handful of NFT concepts are mentioned across the corpus that record *provenance* rather than confer rights or value:

- `Dataset provenance NFTs` — CHARTER § 17.3
- `Execution receipt NFTs` — CHARTER § 17.3
- `Agent identity NFTs` — CHARTER § 17.3
- `Execution history NFTs` — CHARTER § 8.5
- `Asset certification NFTs` — CHARTER § 8.5
- `Fund document NFTs` — CHARTER § 17.3
- `Asset-backed NFTs` — CHARTER § 11.7

These are receipts in NFT form. They span Classes B (license / access semantics) and C (compute receipt semantics) depending on what they represent. They get the same `NFT_PROTOCOL.md` treatment (deferred) when minted.

---

## 3. The full named inventory — flat list

For completeness. Every term anywhere in the corpus that refers to an internal token or NFT concept. Class assignments shown.

| Named term | Class | Source |
|---|:---:|---|
| Governance tokens | A | CHARTER § 17.2, § 8.4 |
| Governance rights | A | CHARTER § 8.4 |
| Token Governance protocol object | A | CHARTER § 13.4 |
| Utility tokens | B | CHARTER § 17.2 |
| Strategy tokens | B | CHARTER § 17.2, § 8.4 |
| Fund participation tokens | B | CHARTER § 17.2 |
| Agent access tokens | B | CHARTER § 17.2, § 8.3 |
| Access credentials | B | CHARTER § 8.4 |
| Access NFTs | B | CHARTER § 17.3, § 8.5 |
| Strategy NFTs | B | CHARTER § 17.3 |
| License NFTs | B | CHARTER § 17.3, § 8.5 |
| Protocol participation tokens | B | CHARTER § 8.4 |
| Model-governance tokens | A · B | CHARTER § 8.3, § 25 |
| Compute-backed assets | C | CHARTER § 8.3, § 25 |
| Compute receipt tokens | C | CHARTER § 17.2, § 8.4 |
| Compute receipt assets | C | CHARTER § 8.4 |
| Compute proof NFTs | C | CHARTER § 17.3 |
| Synthetic intelligence-linked assets | C | CHARTER § 8.3 |
| Internal network assets | C | CHARTER § 8.3 |
| Agent-issued tokens | A · C | CHARTER § 8.3, § 25 |
| Reputation tokens | D | CHARTER § 17.2 |
| Contribution tokens | D | CHARTER § 17.2 |
| Contribution receipts | D | CHARTER § 8.4 |
| Agent reputation units | D | CHARTER § 8.4, § 11.7 |
| Agent contribution records | D | CHARTER § 25 |
| Risk-credit tokens | E | CHARTER § 17.2 |
| Treasury accounting units | E | CHARTER § 17.2 |
| Internal accounting units | E | CHARTER § 8.4 |
| Strategy-specific asset units | E | CHARTER § 8.4 |
| Internal capital accounts | E | CHARTER § 11.6 |
| Internal fund tokens | E | CHARTER § 8.4 |
| Internal treasury units | E | CHARTER § 22.3 |
| Dataset provenance NFTs | NFT-trv | CHARTER § 17.3 |
| Execution receipt NFTs | NFT-trv | CHARTER § 17.3 |
| Agent identity NFTs | NFT-trv | CHARTER § 17.3 |
| Execution history NFTs | NFT-trv | CHARTER § 8.5 |
| Asset certification NFTs | NFT-trv | CHARTER § 8.5 |
| Fund document NFTs | NFT-trv | CHARTER § 17.3 |
| Asset-backed NFTs | NFT-trv | CHARTER § 11.7 |
| NFT-based ownership records | NFT-trv | CHARTER § 8.4 |
| Tokenized rights | B | CHARTER § 11.7 |
| Tokenized participation in strategy systems | B | CHARTER § 25 |

Forty-one named token / NFT concepts. **Zero issued.** This is intentional and per doctrine.

---

## 4. Specific concrete-token charters (proposed and forthcoming)

This is the inventory of token charters proposed for actual issuance. Each will have its own document, each requires the full inclusion path of § 6 below.

| # | Working name | Class | Charter document | Status |
|:--:|---|:---:|---|:---:|
| 1 | **LOCUS** token family | C | [`LOCUS_TOKEN_CHARTER.md`](./LOCUS_TOKEN_CHARTER.md) | **first sketch landed** in this PR |
| 2 | PARRALAX-GOV | A | `TOKEN_PARRALAX_GOVERNANCE_CHARTER.md` (forthcoming) | not started |
| 3 | PARRALAX-ACCESS | B | `TOKEN_PARRALAX_ACCESS_CHARTER.md` (forthcoming) | not started |
| 4 | PARRALAX-REP (reputation) | D | `TOKEN_PARRALAX_REPUTATION_CHARTER.md` (forthcoming) | not started |
| 5 | PARRALAX-TRES (treasury unit) | E | `TOKEN_PARRALAX_TREASURY_CHARTER.md` (forthcoming) | not started |

The first concrete proposal is the **LOCUS family** because the operator raised the architectural concept directly. Other token charters wait for explicit operator initiation.

---

## 5. The doctrinal constraints on every token

These apply universally. They are not optional and they cannot be relaxed by any single token's charter.

1. **No issuance without a dedicated charter.** "Mint a token because we feel like it" is not in the doctrine.
2. **Each token has a defined purpose, supply logic, rights model, transfer rules, governance status, and proof record.** Per CHARTER § 17.4.
3. **No agent at any level can mint tokens against an empty mandate.** Per `AGENT_AUTHORITY_CHARTER.md` the `child:spawn` capability is the closest analog — restricted to Level 6 with parent-bounded inheritance. Token minting follows the same pattern: explicit mandate, council ratification.
4. **No token marketing implies investment return without a securities-law assessment.** Per CHARTER § 26 and the inclusion path § 6 below.
5. **Every token must have a sunset path.** A burn protocol or a revocation mechanism governed by the council. No token is forever-immutable.
6. **Reputation, contribution, risk-credit, and treasury units never transfer externally.** They are internal accounting; their boundary is the system.
7. **Provenance NFTs are not investments.** They are receipts. They are not priced for trade.

---

## 6. The inclusion path for any new token

The path is rigid by design. Compressing it is forbidden. The cost is the deterrent against impulsive issuance.

```
Step 1.  Concept memo
         A one-page rationale: what the token is, which Class, what purpose,
         what supply logic, what rights, what transfer rules.

Step 2.  Charter draft
         A dedicated charter document landed in /parralax-aihftfund/.
         Same shape as AGENT_AUTHORITY_CHARTER / RISK_CHARTER:
         premise, doctrine, schema, lifecycle, non-negotiables,
         operator-only decisions, cross-references.

Step 3.  Securities-law assessment
         A written analysis specific to this token's design.
         The agent does not draft this; it requires counsel.
         CHARTER § 26 governs.

Step 4.  Compliance boundary check
         Cross-reference against COMPLIANCE_BOUNDARY.md (when drafted).
         If the token does not fit the operator's compliance posture,
         it cannot proceed.

Step 5.  Council ratification
         3-of-5 council vote per AGENT_AUTHORITY_CHARTER § 6.
         The vote is a CHRONO entry.

Step 6.  FABRICOR mint
         The first issuance is a FABRICOR action with full receipt:
         supply, distribution, custody, governance pointer, sunset
         pointer. CHRONO-anchored.

Step 7.  Asset registry entry
         Token added to the asset registry per ASSET_SCOPE_CHARTER § 14
         with status 'in_scope' at risk tier STRICT.

Step 8.  Public registry update
         This document (AI_TOKEN_REGISTRY.md) is updated to reflect
         the token has been issued. The line moves from "not started"
         to "issued" with a link to the per-token charter.
```

No expedited path. No "soft launch" to a private allowlist that bypasses the charter. No pre-mint to insiders.

---

## 7. The status header

> **At the time of this document, zero PARRALAX-issued internal tokens exist.**
>
> Forty-one token / NFT concepts are named across the corpus. Five concrete token charters are proposed (one drafted). None has reached Step 5 of the inclusion path. The asset registry currently lists no entries with status `in_scope` in `AssetFamily.InternalPxToken`.

This header is the truth. It updates only via the inclusion path of § 6.

---

## 8. What this registry forbids

| Forbidden | Reason |
|---|---|
| Issuing a token whose Class is not in § 2 | The taxonomy is exhaustive; if a token doesn't fit, the taxonomy is wrong and must be amended first |
| A single token spanning multiple Classes without explanation | A governance + investment combo (Class A + speculative) is a securities-law fact pattern. Address it in the charter, don't dodge it. |
| Marketing copy that implies a token's value will rise | Period. Even when true. Marketing copy is constrained per DALLAS_MARKET_DOCTRINE § 7. |
| Pre-announcing a token before its charter is landed | The charter precedes the announcement. The doctrine § 11 of `ASSET_SCOPE_CHARTER` is explicit on this. |
| Issuing a token that bypasses any step of the path | The path is not negotiable. |
| Using "AI token" in marketing without a clear utility statement | "AI" is not a value proposition. The token's specific function is. |

---

## 9. Open decisions (operator-only)

The registry does not assume any of these:

1. **Order of issuance.** Recommendation: LOCUS first (because the operator initiated the concept), then PARRALAX-GOV (because governance machinery should exist before serious external participation). But operator's call.
2. **Whether to issue any token at all in the first 12 months.** "Zero issued" may stay the truth for a year or more. The doctrine permits both.
3. **External fundraising via any of these tokens.** Recommendation: no, until a registered legal entity exists, the compliance boundary is set, and counsel has reviewed the token-specific design.
4. **Whether ANY tokens should be on a public chain vs. internal-only.** Recommendation: internal-only for Classes D and E always (already structural); Classes A, B, C are operator-decided per-token.

---

## 10. Cross-references

- **CHARTER:** [§ 8 — Asset Scope](./CHARTER.md), [§ 17 — Asset Creation Charter](./CHARTER.md), [§ 25 — AI Token and AI Governance Layer](./CHARTER.md), [§ 26 — Legal and Compliance Awareness](./CHARTER.md)
- **Sibling docs:** [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md) § 7 (external AI tokens), § 8 (NFTs), § 11 (internal PARRALAX tokens — none day 1), [`LOCUS_TOKEN_CHARTER.md`](./LOCUS_TOKEN_CHARTER.md) (the first concrete proposal), [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md) (council ratification path), `COMPLIANCE_BOUNDARY.md` (forthcoming; required for Step 4)
- **Existing doctrine:**
  - Charter § 17.4 — the five attributes every internal asset must have
  - `parralax-impl/src/types/chrono.ts` — receipt classes for the FABRICOR mint event

---

*Forty-one named concepts. Zero issued. The path between is deliberate.*
