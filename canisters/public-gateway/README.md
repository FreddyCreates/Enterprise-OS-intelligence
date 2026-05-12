# Public Gateway Canister

**Status:** Stub. Substrate phase B target for [`/journal/`](../../journal/).

When the journal is stable on Cloudflare Pages (phase C), the migration onto this canister is a SPINOR — same doctrine, same content, new substrate. The doctrine block embedded in `main.mo` mirrors `PUBLIC-VIEW-PLAN.md § 3` and is constant-folded into the WASM, so an upgrade cannot silently modify it.

## What the activated canister will do

- Serve the journal's static HTML/CSS/JS via certified `http_request`.
- Read sanitized content from stable memory.
- Return certified responses (ICP HTTP gateway certification).
- Refuse any path that has not been verified by Mundator Cognitus.

## What this stub does now

Returns the doctrine block as plain text on every HTTP request. Exposes `doctrine()` and `heartbeatMs()` as query methods. Nothing else.

## Local build

```bash
dfx start --background
dfx deploy public_gateway
```

```bash
dfx canister call public_gateway doctrine
```

## Why this is wired into the repo today

So the C → B migration path exists from day one, as PUBLIC-VIEW-PLAN.md § 10 requires. No code added to the SDK organism; no change to ORO; no change to MERIDIAN. The journal's substrate option B is here, ready, and unimplemented until the journal calls for it.
