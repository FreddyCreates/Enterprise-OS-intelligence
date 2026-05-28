# DALLAS MARKET DOCTRINE

**Document:** `parralax-aihftfund/DALLAS_MARKET_DOCTRINE.md`  
**Parent:** [`CHARTER.md`](./CHARTER.md) § 22 — Multi-Market Operating Model · § 33 — Strategic Position  
**Status:** Public charter. Prior art. No implementation in this commit.  
**Operator:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas

---

## 0. Premise

Markets have geography. The geography is changing. Dallas is becoming the third American financial pole.

The Texas Stock Exchange (TXSE) is being stood up in Dallas as a serious-equity venue with named institutional backers. Several major crypto firms have relocated their headquarters to Texas in the recent cycle. Texas has codified a friendly regulatory posture toward digital assets at the state level. None of this is speculation — it is observable fact at the time this charter is drafted.

PARRALAX is built in Dallas, by a Dallas operator, with a deliberate orientation toward the venues that are coming home. **The home venue is the natural starting venue.** This document is the doctrine that says so.

---

## 1. Why Dallas

### 1.1 Texas Stock Exchange (TXSE)

A new equity exchange registered with the SEC, headquartered in Dallas, backed by named institutional capital, with stated intent to compete with NYSE and Nasdaq on listings and on execution. The exchange's existence does three things for PARRALAX:

1. **Adds a third domestic listing venue** for the same underlying securities, which means more multi-venue parallax — the very phenomenon for which this system is named.
2. **Puts a major matching engine in our timezone**, on infrastructure we can be physically close to.
3. **Adds a layer of execution-venue competition** that historically benefits the side of the trade with better routing intelligence.

PARRALAX does not require TXSE to exist to operate. But when TXSE is operational, PARRALAX should be among the first systems with a clean, source-linked adapter to it.

### 1.2 The crypto migration

Several major crypto firms have moved or are moving headquarters to Texas, citing the state's regulatory posture and energy availability. PARRALAX is naturally positioned to engage these firms as venue counterparties and as ecosystem participants. The same time zone, the same regulatory frame, the same physical city.

### 1.3 Texas regulatory frame

At the state level, Texas has codified a relatively favourable posture toward digital assets, including state-level recognition of digital asset rights and discussion of strategic reserves. **State-level posture does not override federal regulation.** PARRALAX honours federal law first — securities, commodities, money transmission, AML/KYC — and treats state-level posture as a *secondary* layer that may simplify some operations and complicate none.

The compliance boundary document ([`COMPLIANCE_BOUNDARY.md`](./COMPLIANCE_BOUNDARY.md), to be drafted when the operator provides the parameters) is where this hierarchy gets formally enumerated.

### 1.4 Mexico proximity

Dallas is closer to Mexico City than to either NYC or San Francisco. This matters for two reasons:

- **MXN/USD as a tier-1 FX pair** for PARRALAX (per `ASSET_SCOPE_CHARTER.md`), not an afterthought.
- **Cross-border remittance, payment, and stablecoin flows** that route through Dallas already have a natural integration story.

This charter does not commit to specific Mexican counterparties — that is operator-decided — but it does commit to MXN as a first-class fiat in the asset scope.

---

## 2. The home-venue doctrine

> When two venues offer equivalent execution for an order, prefer the home venue.

This is a doctrinal preference, not a hard rule. The execution path still routes to whatever venue offers best fill given fees, slippage, and reliability. But when the inputs are equivalent — same fill price, same fees, same recent uptime — the home venue is preferred.

The reasons are structural:

1. **Latency.** A Dallas-hosted PARRALAX speaks to a Dallas-hosted matching engine through fewer hops than to a New Jersey or Chicago matching engine. Latency is opportunity cost.
2. **Regulatory clarity.** The home venue operates under the same state regulatory frame as the operator. Cross-state and cross-border venues add operational surface area.
3. **Local ecosystem.** Counterparty discovery, dispute resolution, and human escalation paths are simpler within the same jurisdiction.
4. **Time-zone alignment.** Operator awake-hours overlap maximally with home-venue open-hours. Anomaly response is faster.

The home-venue preference is encoded in CUSTOS as a tie-breaker in `gate.venue` selection: among venues passing all health checks with equivalent expected fill, the venue tagged `region: 'TX'` wins. Operator-overridable per agent.

---

## 3. The four-pole positioning

PARRALAX sees the U.S. equity landscape as a four-pole structure:

| Pole | City | Venues | PARRALAX posture |
|---|---|---|---|
| **NY/NJ** | New York / Mahwah | NYSE, Nasdaq matching | Engage. Standard. |
| **Chicago** | Chicago / Aurora | CME, CBOE | Engage for derivatives. |
| **Texas** | Dallas | TXSE (forthcoming), regional brokers | **Prefer where viable. Home.** |
| **Crypto-native** | Globally distributed; major nodes in TX, FL, Singapore, EU | CEXs and DEXs | Engage. Multi-venue parallax-native. |

PARRALAX does not concentrate exposure in any one pole. The four-pole model is for **route preference and observation**, not for asset concentration. Asset concentration is a `gate.exposure` matter, not a geography matter.

---

## 4. What the doctrine commits to

1. **A TXSE adapter** is written and tested in paper mode before TXSE goes live. The day TXSE accepts orders, PARRALAX is ready to route to it.
2. **MXN/USD** is a first-class FX pair in the asset scope, with the same gate parameter set as EUR/USD.
3. **Time-zone awareness** in cron-driven agents — daily marks, end-of-day reporting, regime classifier resets all align to America/Chicago (Dallas), not UTC, by default. UTC is the canonical timestamp; the operational rhythm is local.
4. **A Dallas-resident operator console** (the optional NUNTIUS-extended dashboard, per `TESTING_INTEGRATION_OPTIONS.md`) is the primary surface for human oversight. Remote access is operator-only and hardware-key-gated.
5. **Energy-aware on-chain operations.** Texas runs on the ERCOT grid, which has distinct demand and pricing characteristics. PARRALAX's chain-side decisions (gas timing, validator-on-Texas-grid preference) may, where it does not compromise security, prefer ERCOT-resident infrastructure. This is a posture, not a requirement.

---

## 5. What the doctrine does NOT commit to

- **No exclusivity to Texas venues.** Multi-venue parallax is the system's name and operating principle. The home preference is a tie-breaker, not a constraint. If NYSE offers a better fill, NYSE gets the trade.
- **No state-regulator capture.** PARRALAX does not orient its compliance posture to favour the state level. Federal law governs first; state simplifies where it can.
- **No political alignment.** Dallas is the operator's home. The doctrine is operational, not political. PARRALAX does not endorse, oppose, or campaign on any policy regarding venue location, market structure, or regulatory direction.
- **No claim that Dallas is the only future of finance.** The four-pole model explicitly counts Dallas as one pole of four, not as the centre. Concentrating identity in one geography is the failure mode of every prior regional financial empire. PARRALAX is built to absorb the change in geography, not to bet on a single endpoint.

---

## 6. Operational defaults that follow from this doctrine

These are encoded once and propagated to the implementation. The operator may override per agent.

```
DEFAULT_TIMEZONE              = 'America/Chicago'
DEFAULT_FX_TIER_1_PAIRS       = ['USD/EUR', 'USD/GBP', 'USD/JPY', 'USD/MXN', 'USD/CAD']
DEFAULT_EQUITY_VENUE_ORDER    = ['TXSE', 'NYSE', 'NASDAQ']    // TXSE preferred when live
DEFAULT_FUTURES_VENUE         = 'CME'
DEFAULT_CRYPTO_VENUE_ORDER    = operator-set per asset
DEFAULT_DAILY_MARK_TIME       = '16:00 America/Chicago'        // post-equity-close in TX
DEFAULT_EOD_REPORT_TIME       = '17:30 America/Chicago'
DEFAULT_REGIME_RESET_TIME     = '00:00 America/Chicago'        // local midnight
```

`DEFAULT_EQUITY_VENUE_ORDER` is the canonical statement of the home-venue tie-breaker. The implementation reads from this list; CUSTOS sees TXSE first when all gates pass equivalently.

---

## 7. Public posture

When PARRALAX speaks externally about its venue posture (in published performance reports, in counterparty introductions, in interviews), the language is consistent:

> PARRALAX is a Dallas-resident financial execution system. It operates across U.S. equities (including TXSE when live), CME-listed futures, global FX with MXN/USD as a tier-1 pair, and crypto markets across major venues. The home-venue preference is operational — it improves latency and regulatory clarity — and it does not concentrate exposure.

This phrasing is doctrine-locked. Any external statement that materially differs from it must be reviewed against this charter before publication.

---

## 8. The relationship to the rest of the charter family

- **CHARTER.md § 22** (Multi-Market Operating Model) — this doctrine specifies the **home-venue tie-breaker** within the centralised-market sub-model.
- **CHARTER.md § 26** (Legal and Compliance Awareness) — Texas state posture is a *secondary* layer; federal compliance governs first. The compliance boundary document, when drafted, owns this hierarchy.
- **CHARTER.md § 33** (Strategic Position) — Dallas is the home pole within the four-pole model.
- **`AGENT_AUTHORITY_CHARTER.md`** — agent mandates include `walletScope.fiatAccounts` with currency tags; the default for any new mandate includes MXN as available alongside USD.
- **`RISK_CHARTER.md`** — the venue gate (`gate.venue`) consults `DEFAULT_EQUITY_VENUE_ORDER` for its tie-breaker.
- **`ASSET_SCOPE_CHARTER.md`** — declares MXN as a tier-1 fiat and TXSE as a tier-1 equity venue (when live).

---

## 9. What this doctrine forbids

| Forbidden | Reason |
|---|---|
| Routing decisions based on venue ideology rather than execution quality | Multi-venue parallax requires honest comparison; ideology distorts it. |
| Concentrating asset exposure in Texas-resident assets ("home bias as portfolio") | Exposure concentration is forbidden by `RISK_CHARTER` regardless of geography. |
| External statements implying TXSE exclusivity, endorsement, or partnership beyond what is documented | Public posture is doctrine-locked. |
| Hard-coding state-level tax or regulatory assumptions into execution logic | State posture changes; federal compliance is the floor. Logic is built to the floor. |
| Operator-private routing preferences that override CUSTOS without a receipt | Every routing decision passes through CUSTOS; tie-breakers are written, not whispered. |

---

## 10. Open decisions (operator-only)

1. **TXSE engagement timeline.** When TXSE goes live, the operator decides whether to engage in paper-only for a probation period or to enable live routing on day one. Recommendation: paper-only for the first 60 days of TXSE operation.
2. **MXN-denominated strategies.** Whether PARRALAX runs strategies *denominated* in MXN, or only trades MXN/USD as a leg. Defaults to the latter unless operator specifies.
3. **ERCOT-resident chain operations.** Whether on-chain validator/relay preference is enabled at all. Defaults to off. Operator may enable for specific chains with documented justification.
4. **Public-statement boilerplate ownership.** Who reviews external statements for doctrine-compliance with § 7. Recommendation: operator alone for the first year; council (3-of-5) thereafter.

---

## 11. Cross-references

- **Charter:** [§ 22 — Multi-Market Operating Model](./CHARTER.md), [§ 26 — Legal and Compliance Awareness](./CHARTER.md), [§ 33 — Strategic Position](./CHARTER.md)
- **Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](./AGENT_AUTHORITY_CHARTER.md), [`RISK_CHARTER.md`](./RISK_CHARTER.md), [`KILL_SWITCH_DOCTRINE.md`](./KILL_SWITCH_DOCTRINE.md), [`ASSET_SCOPE_CHARTER.md`](./ASSET_SCOPE_CHARTER.md)
- **Existing doctrine inherited from the corpus:**
  - Paper XIX (`INFRASTRUCTURA CIVICA INTELLIGENS`) — civic infrastructure as sovereign intelligence; the home-venue posture is the financial analogue.
  - The journal's "no school named" doctrine — public posture is restrained, operator relationships stay private. The same principle applies here: PARRALAX names the home, not the counterparties.

---

*The home venue is the natural starting venue. The home venue is not the only venue.*
