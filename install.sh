#!/bin/bash
# ============================================================================
# Enterprise OS Intelligence — One-Command Install
# Medina Tech · Dallas, Texas
# ============================================================================

set -e

echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║        ENTERPRISE OS INTELLIGENCE — INSTALLER           ║"
echo "  ║              Medina Tech · Dallas, Texas                 ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prereqs() {
  echo -e "${BLUE}[1/4]${NC} Checking prerequisites..."

  if ! command -v node &> /dev/null; then
    echo "  ✗ Node.js is required (v18+). Install from https://nodejs.org"
    exit 1
  fi

  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo "  ✗ Node.js v18+ required. You have $(node -v)"
    exit 1
  fi
  echo "  ✓ Node.js $(node -v)"

  if ! command -v npm &> /dev/null; then
    echo "  ✗ npm is required"
    exit 1
  fi
  echo "  ✓ npm $(npm -v)"

  if command -v go &> /dev/null; then
    echo "  ✓ Go $(go version | awk '{print $3}')"
    HAS_GO=true
  else
    echo "  - Go not found (optional — needed for organism-gateway)"
    HAS_GO=false
  fi

  if command -v wrangler &> /dev/null; then
    echo "  ✓ Wrangler CLI found"
    HAS_WRANGLER=true
  else
    echo "  - Wrangler not found (optional — needed for Cloudflare Workers deploy)"
    HAS_WRANGLER=false
  fi

  echo ""
}

# Install Node.js dependencies
install_node() {
  echo -e "${BLUE}[2/4]${NC} Installing Node.js dependencies..."

  if [ -f "src/package.json" ]; then
    echo "  → src/"
    (cd src && npm install 2>/dev/null) || echo "  ⚠ src/ install had warnings (non-fatal)"
  fi

  if [ -f "cloudflare-workers/package.json" ]; then
    echo "  → cloudflare-workers/"
    (cd cloudflare-workers && npm install 2>/dev/null) || echo "  ⚠ cloudflare-workers/ install had warnings (non-fatal)"
  fi

  if [ -f "src/emailai-dashboard/package.json" ]; then
    echo "  → src/emailai-dashboard/"
    (cd src/emailai-dashboard && npm install 2>/dev/null) || echo "  ⚠ emailai-dashboard/ install had warnings (non-fatal)"
  fi

  echo ""
}

# Install Go dependencies (optional)
install_go() {
  echo -e "${BLUE}[3/4]${NC} Installing Go dependencies..."

  if [ "$HAS_GO" = true ] && [ -f "go/organism-gateway/go.mod" ]; then
    echo "  → go/organism-gateway/"
    (cd go/organism-gateway && go mod download 2>/dev/null) || echo "  ⚠ Go mod download had warnings (non-fatal)"
  else
    echo "  - Skipped (Go not installed or no go.mod found)"
  fi

  echo ""
}

# Done
print_success() {
  echo -e "${BLUE}[4/4]${NC} Setup complete!"
  echo ""
  echo -e "${GREEN}  ✓ Enterprise OS Intelligence is ready.${NC}"
  echo ""
  echo "  ┌─────────────────────────────────────────────────────────┐"
  echo "  │  Quick Commands:                                        │"
  echo "  │                                                         │"
  echo "  │  npm run dev              — Start dev server             │"
  echo "  │  npm run dev:dashboard    — Start EmailAI dashboard      │"
  echo "  │  npm run build            — Build for production         │"
  echo "  │  npm run test             — Run tests                    │"
  echo "  │  npm run test:protocols   — Test intelligence protocols  │"
  echo "  │  npm run deploy:workers   — Deploy all Cloudflare Workers│"
  echo "  │                                                         │"
  echo "  │  For Cloudflare Workers (requires wrangler login):      │"
  echo "  │  npm run deploy:membrane  — Deploy Gate-Node + Cache    │"
  echo "  │  npm run deploy:agents    — Deploy all AI agent workers  │"
  echo "  │                                                         │"
  echo "  └─────────────────────────────────────────────────────────┘"
  echo ""

  if [ "$HAS_WRANGLER" = false ]; then
    echo -e "  ${YELLOW}Tip:${NC} To deploy Workers, install Wrangler:"
    echo "       npm install -g wrangler && wrangler login"
    echo ""
  fi
}

# Run
check_prereqs
install_node
install_go
print_success
