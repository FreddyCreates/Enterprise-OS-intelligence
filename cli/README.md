# RSHIP CLI — Enterprise OS Intelligence

Production-ready CLI with real user-facing modes for the RSHIP Enterprise OS Intelligence platform.

## One-Command Install

### Windows (PowerShell)
```powershell
irm https://freddycreates.github.io/Enterprise-OS-intelligence/install.ps1 | iex
```

### macOS / Linux
```bash
curl -fsSL https://freddycreates.github.io/Enterprise-OS-intelligence/install.sh | sh
```

## User-Facing Modes

| Mode | Command | For |
|------|---------|-----|
| **Enterprise** | `rship --mode enterprise` | Full suite: billing, workforce, supply chain |
| **Developer** | `rship --mode developer` | SDK tools, hot-reload, deployment |
| **Operator** | `rship --mode operator` | Infrastructure monitoring, cache control |
| **Sovereign** | `rship --mode sovereign` | Self-hosted, air-gapped, zero external deps |

## Commands

```
rship                     — Interactive dashboard (mode-aware)
rship status              — System health check
rship deploy [target]     — Deploy to production
rship intel               — Intelligence console
rship apps                — List production applications
rship cache [action]      — Cache organism control
rship sdk                 — SDK management
rship mode [name]         — Switch operating mode
rship init [name]         — Scaffold new project
rship serve               — Start local dev server
```

## Flags

```
--mode <name>     Switch operating mode
--json            Output as JSON (for scripting)
--verbose         Verbose output
--gateway <url>   Override gateway URL
-v, --version     Show version
-h, --help        Show help
```

## How It Works

The install scripts:
1. Download `rship-cli.js` from GitHub Pages (or raw GitHub as fallback)
2. Create a shell/batch launcher
3. Add the install directory to your PATH

The CLI requires **Node.js 18+** (zero other dependencies).

## Architecture

```
User runs: rship <command>
    │
    ▼
rship-cli.js (Node.js, zero deps)
    │
    ├── Mode-aware command routing
    ├── Local config (~/.rship/config.json)
    ├── JSON output for automation (--json)
    └── Gateway connection for live operations
```

## File Structure

```
cli/
├── install.ps1       — PowerShell installer (full, in repo)
├── install.sh        — Shell installer (full, in repo)
├── rship-cli.js      — CLI entry point
└── README.md         — This file

dist/
├── install.ps1       — Served from Pages (download target)
├── install.sh        — Served from Pages (download target)
├── cli/
│   └── rship-cli.js  — Served from Pages (download target)
└── pages/
    └── install.html  — Landing page with install instructions
```

## Enticing Users (The Grok Pattern)

The one-liner install pattern (`irm url | iex`) is proven to reduce friction:

1. **Single command** — No manual download, extraction, or PATH configuration
2. **Memorable URL** — Your own domain, your own brand
3. **Instant gratification** — User runs `rship` immediately after install
4. **Mode selection** — Users self-select into the right experience
5. **Zero third-party AI** — Differentiator vs. every other CLI tool

### Marketing the Install

```
# Drop this in any README, tweet, or docs:
irm https://freddycreates.github.io/Enterprise-OS-intelligence/install.ps1 | iex

# Or for the shell crowd:
curl -fsSL https://freddycreates.github.io/Enterprise-OS-intelligence/install.sh | sh
```

The landing page at `/pages/install.html` is designed for conversion:
- Shows both install commands prominently
- Displays all 4 modes
- Lists platform capabilities
- Links to docs and source

## What the Grok Pattern Teaches Us

The `irm https://x.ai/cli/install.ps1 | iex` pattern works because:
- **One line** to go from zero to running
- **Branded URL** (x.ai) builds trust and recognition
- **PowerShell native** — no prerequisites on Windows
- **Immediate value** — tool works right after install

We replicate this with our own sovereign infrastructure:
- Our URL: `freddycreates.github.io/Enterprise-OS-intelligence/install.ps1`
- Our brand: RSHIP Enterprise OS Intelligence
- Our differentiator: Zero third-party AI, sovereign by design
- Our value: 35+ production apps, 100+ SDKs, intelligent cache organisms
