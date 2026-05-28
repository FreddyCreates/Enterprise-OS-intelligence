# SECURITY

This document is the operational security posture of `parralax-aihftfund`.
It expands `CHARTER.md` § 28 (Security Charter) into concrete practices.

---

## 0. The single line

**No live key sits in a file in any repository, ever.**

That is the entire posture distilled to one sentence. Every rule below is a consequence.

---

## 1. Key custody

### 1.1 Where keys live

| Key class | Storage | Loaded into runtime by |
|---|---|---|
| **Operator hardware-signer master key** | Hardware device (YubiHSM, Ledger, Trezor, equivalent). Never extractable. | Direct USB / NFC at ceremony time. |
| **Council member signing keys** | Each member's own hardware signer. | Direct device interaction at ceremony time. |
| **Venue API keys (paper / demo)** | Operator-machine `.env` (gitignored), or operator's 1Password / Bitwarden. | Loaded by the runtime at process start. |
| **Venue API keys (live)** | Operator's password manager AND Cloudflare Worker secrets in production. **Never on a developer machine for any purpose.** | Loaded by the worker runtime from CF Secrets. |
| **Wallet private keys (any chain)** | Hardware signer ONLY. PARRALAX never holds a private key for any chain. | The signer signs transactions; the agent submits them. |
| **Database credentials** | Environment variables in the runtime's secrets vault. | Loaded by the runtime. |

### 1.2 What never happens

- A private key is never written to disk in plaintext.
- A live API key is never present on a developer laptop.
- A withdrawal signature is never produced by code without a human ceremony.
- A key is never granted to an agent at any authority level (per `AGENT_AUTHORITY_CHARTER.md`).

---

## 2. The sanitiser as gate

`tools/sanitiser.mjs` is the second wall against accidental key commits. It refuses to validate any file that contains a pattern resembling:

- A common API-key shape (32+ chars of base58 / base64 / hex following a `key`, `token`, `secret` indicator).
- An EVM wallet address (`0x[a-fA-F0-9]{40}`).
- A Bitcoin address (`1`, `3`, `bc1` prefixed).
- A Solana address (base58, 32 bytes).
- A Cosmos / Tendermint address (`bech32` `cosmos1`, etc.).
- An exchange-account identifier matching known formats.

The sanitiser runs in CI before any merge. It fails closed. There is no `--allow-secret` flag.

`.env.example` is the **only** file in the repo where secret *names* appear; values are forbidden even there.

---

## 3. Repository discipline

### 3.1 Branch protection on `main`

```yaml
main:
  require_pull_request: true
  required_status_checks: [typecheck, tests, sanitiser]
  require_signed_commits: true
  require_review_count: 1                # 2 once council is formed
  dismiss_stale_reviews: true
  enforce_admins: true                   # operator cannot bypass own rules
  restrictions:
    push: [operator, council]
```

### 3.2 Commit signing

Every commit to `main` requires a GPG or SSH signature verified against a registered key. Unsigned commits are rejected by branch protection.

### 3.3 Dependency review

`npm install` runs `npm audit` in CI. High or critical advisories fail the build. The lockfile is committed; floating versions in `package.json` are reviewed at each dependency upgrade.

### 3.4 No `node_modules` in commits, no built artefacts in commits

`.gitignore` excludes both. CI builds from source every time.

---

## 4. Runtime security

### 4.1 Process isolation

In production, every agent class runs as a separate Cloudflare Worker (or separate process locally). The kill-switch Durable Object is the single shared mutable state; everything else is read-only relative to other agents.

### 4.2 Network egress

Each adapter declares its egress allowlist (the exact hostnames it may contact). The runtime enforces the allowlist at the HTTP-fetch boundary. An adapter that attempts to contact an out-of-allowlist host writes a `gate.venue` failure and is auto-demoted.

### 4.3 Logging

Logs are operator-only. They never go to a third-party log aggregator. CHRONO is the audit substrate; standard `console.log` is for development only and is stripped from production builds.

### 4.4 Time

All timestamps are UTC in the audit chain. Operational rhythm uses `America/Chicago` (per `DALLAS_MARKET_DOCTRINE.md`). Time-sync uses NTP from at least two stratum-1 sources; clock drift > 100 ms triggers a `gate.venue` warning.

---

## 5. Incident response

### 5.1 If a key is suspected leaked

1. Operator **immediately** trips the affected venue's kill switch (`kill:trip` with scope `venue` is a Level-4+ capability; operator has it always).
2. Operator rotates the key at the venue (manual, hardware-signer required for sensitive venues).
3. The leaked key is added to the sanitiser's blocklist with a permanent entry.
4. Operator writes an `incident.key_leak` CHRONO entry with the timeline and rotation evidence.
5. Council reviews within 24 hours; the review writes a `incident.review` CHRONO entry.

No reset of the venue kill switch until step 4 is complete.

### 5.2 If an agent is compromised

1. Operator demotes the agent to Level 0 (single signer; immediate).
2. Operator trips the agent's kill switch.
3. SCRIBA exports the agent's full action history for the trailing 30 days.
4. Council reviews; council vote required to reset.
5. Compromised agent's `walletScope` is permanently null until council ratifies a new mandate.

### 5.3 If CUSTOS itself misfires

CUSTOS is a Level-6 VOXIS that can only be replaced by the operator with a hardware-signer ceremony. If CUSTOS misfires:

1. Operator trips the system kill switch.
2. Operator replaces CUSTOS with the hardware-signer ceremony.
3. System kill switch is reset per `KILL_SWITCH_DOCTRINE.md` § 6.1 (3-of-5 council + operator ceremony).
4. All agent authority is rebuilt from scratch (system reset does not re-promote — by design).

This is the most expensive operational event possible. The cost is the deterrent against a sloppy CUSTOS deployment.

---

## 6. Disclosure

The operator is the single point of disclosure. For security issues:

```
Medinasitech@outlook.com
Subject: [SECURITY] PARRALAX-AIHFTFUND — <one-line description>
```

Encrypted email (PGP) is preferred for sensitive disclosures. Operator's PGP key is published at the operator's signed identity page.

---

## 7. What this security posture commits to

1. **No bug-bounty programme on day 1.** A bug bounty without a triage capacity is theatre. Will be revisited when the council is formed.
2. **No public security advisory channel on day 1.** Disclosure is operator-direct.
3. **No vendor-managed key custody on day 1.** Hardware signer + operator-controlled vault only.
4. **No automated dependency upgrades.** Each upgrade is a reviewed PR.

---

## 8. Cross-references

- **Charter:** [§ 28 — Security Charter](../parralax-aihftfund/CHARTER.md)
- **Sibling docs:** [`AGENT_AUTHORITY_CHARTER.md`](../parralax-aihftfund/AGENT_AUTHORITY_CHARTER.md) (no agent withdrawal, ever), [`KILL_SWITCH_DOCTRINE.md`](../parralax-aihftfund/KILL_SWITCH_DOCTRINE.md) (the operational lever for incidents)

---

*No live key sits in a file in any repository, ever.*
