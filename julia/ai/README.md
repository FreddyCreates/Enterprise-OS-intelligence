# Julia-Motoko Bridge — AI Function Cards

Door 4 Architecture: Every Julia function becomes a typed, cross-substrate MCP tool.

## How It Works

```
Julia Function → Function Card (JSON) → WASM Compilation → Motoko Wrapper → Candid Interface → ICP Canister
                                       ↓
                                TypeScript Wrapper → Cloudflare Worker
```

## Function Cards

Each function card defines the complete cross-substrate type mapping:

```json
{
  "name": "linalg.eigen",
  "julia": "eigen(A::Matrix{Float64})",
  "motoko": "linalg_eigen(A: [[Float]]) : async ([Float], [[Float]])",
  "candid": "linalg_eigen : (vec vec float64) -> (record { ... })",
  "deterministic": true,
  "canister_safe": true,
  "round_trip_tested": true
}
```

## MCP Tool Usage

### Generate Wrappers
```json
{
  "tool": "julia_motoko_bridge.generate_wrapper",
  "input": {
    "julia_function": "phi_eigen",
    "input_type": "Matrix{Float64}",
    "target": ["Motoko", "Candid", "TypeScript"]
  }
}
```

### Invoke Through Bridge
```json
{
  "tool": "julia_motoko_bridge.invoke",
  "input": {
    "function_card": "phi_eigen",
    "args": { "matrix": [[1.0, 0.5], [0.5, 1.0]] },
    "route": "julia_wasm_icp"
  }
}
```

### Validate Card
```json
{
  "tool": "julia_motoko_bridge.validate_card",
  "input": {
    "card_path": "julia/ai/function_cards/phi_eigen.json",
    "strict": true
  }
}
```

## Registered Cards

| Card | Julia Signature | Deterministic | Canister Safe |
|------|----------------|---------------|---------------|
| `phi_eigen` | `eigen(A::Matrix{Float64})` | Yes | Yes |
| `phi_reward_curve` | `reward_curve(...)` | Yes | Yes |
| `probe_classify` | `classify_probe(features)` | Yes | Yes |
| `policy_optimize` | `optimize_policy(...)` | No | Yes |

## Cross-Substrate Routes

```
Cloudflare → Julia:    membrane invokes brain via WASM bridge
Julia → ICP:           brain writes results to canister state
ICP → Cloudflare:      identity triggers membrane reflexes
Cloudflare → ICP:      membrane resolves identity directly
ICP → Julia:           identity triggers policy optimization
```

## Architecture

This bridge is the nervous system of the organism.
Every Julia function exposed as a function card becomes:
- An MCP tool callable by any agent
- A Motoko-compatible canister method
- A Candid-typed interface
- A TypeScript-callable worker function
- A WASM-compiled portable computation

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
