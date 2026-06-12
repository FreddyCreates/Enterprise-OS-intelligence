#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RSHIP Enterprise OS Intelligence — Pages Bindings Setup
# Creates all resources AND auto-wires IDs into wrangler.jsonc
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRANGLER_JSONC="$SCRIPT_DIR/wrangler.jsonc"

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║  RSHIP Enterprise OS Intelligence — Pages Bindings Setup                  ║"
echo "║  Creating intelligent cache infrastructure + auto-wiring IDs              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER: Extract KV namespace ID from wrangler output
# ═══════════════════════════════════════════════════════════════════════════════
extract_kv_id() {
  local name="$1"
  wrangler kv namespace list 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
for ns in data:
    if ns.get('title','').endswith('$name') or ns.get('title') == '$name':
        print(ns['id'])
        break
" 2>/dev/null || echo ""
}

extract_d1_id() {
  local name="$1"
  wrangler d1 list --json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
for db in data:
    if db.get('name') == '$name':
        print(db['uuid'])
        break
" 2>/dev/null || echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# KV NAMESPACES — Organism Memory
# ═══════════════════════════════════════════════════════════════════════════════

echo "◎ Creating KV Namespaces..."
echo ""

echo "  Creating ORGANISM_MEMORY..."
wrangler kv namespace create ORGANISM_MEMORY 2>/dev/null || echo "    (already exists)"

echo "  Creating PATTERN_STORE..."
wrangler kv namespace create PATTERN_STORE 2>/dev/null || echo "    (already exists)"

echo "  Creating API_CACHE..."
wrangler kv namespace create API_CACHE 2>/dev/null || echo "    (already exists)"

echo "  Creating SESSION_STORE..."
wrangler kv namespace create SESSION_STORE 2>/dev/null || echo "    (already exists)"

echo "  Creating KNOWLEDGE_CACHE..."
wrangler kv namespace create KNOWLEDGE_CACHE 2>/dev/null || echo "    (already exists)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# D1 DATABASE — Structured Intelligence
# ═══════════════════════════════════════════════════════════════════════════════

echo "◈ Creating D1 Database..."
echo ""

echo "  Creating medinatech-intelligence..."
wrangler d1 create medinatech-intelligence 2>/dev/null || echo "    (already exists)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# R2 BUCKETS — Object Storage
# ═══════════════════════════════════════════════════════════════════════════════

echo "⬡ Creating R2 Buckets..."
echo ""

echo "  Creating medinatech-assets..."
wrangler r2 bucket create medinatech-assets 2>/dev/null || echo "    (already exists)"

echo "  Creating knowledge-archive..."
wrangler r2 bucket create knowledge-archive 2>/dev/null || echo "    (already exists)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# VECTORIZE INDEX — Semantic Search
# ═══════════════════════════════════════════════════════════════════════════════

echo "↗ Creating Vectorize Index..."
echo ""

echo "  Creating medinatech-knowledge-index..."
wrangler vectorize create medinatech-knowledge-index --dimensions=768 --metric=cosine 2>/dev/null || echo "    (already exists)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# CURSOR WORKER — Additional Resources
# ═══════════════════════════════════════════════════════════════════════════════

echo "◈ Creating Cursor worker resources..."
echo ""

echo "  Creating cursor-message-archive R2 bucket..."
wrangler r2 bucket create cursor-message-archive 2>/dev/null || echo "    (already exists)"

echo "  Creating cursor-routing-patterns Vectorize index..."
wrangler vectorize create cursor-routing-patterns --dimensions=768 --metric=cosine 2>/dev/null || echo "    (already exists)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# ORCHESTRATOR — Root worker resources
# ═══════════════════════════════════════════════════════════════════════════════

echo "◈ Creating Orchestrator worker resources..."
echo ""

echo "  Creating orchestrator-state KV namespace..."
wrangler kv namespace create orchestrator-state 2>/dev/null || echo "    (already exists)"

echo "  Creating orchestrator-health-cache KV namespace..."
wrangler kv namespace create orchestrator-health-cache 2>/dev/null || echo "    (already exists)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# AUTO-WIRE IDs INTO wrangler.jsonc
# ═══════════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║  Auto-wiring resource IDs into wrangler.jsonc                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Extract IDs
ORGANISM_MEMORY_ID=$(extract_kv_id "ORGANISM_MEMORY")
PATTERN_STORE_ID=$(extract_kv_id "PATTERN_STORE")
API_CACHE_ID=$(extract_kv_id "API_CACHE")
SESSION_STORE_ID=$(extract_kv_id "SESSION_STORE")
KNOWLEDGE_CACHE_ID=$(extract_kv_id "KNOWLEDGE_CACHE")
D1_ID=$(extract_d1_id "medinatech-intelligence")

if [ -f "$WRANGLER_JSONC" ]; then
  echo "  Patching wrangler.jsonc with live resource IDs..."
  
  if [ -n "$ORGANISM_MEMORY_ID" ]; then
    sed -i "s/PLACEHOLDER_ORGANISM_MEMORY_ID/$ORGANISM_MEMORY_ID/g" "$WRANGLER_JSONC"
    echo "    ✓ ORGANISM_MEMORY → $ORGANISM_MEMORY_ID"
  fi
  
  if [ -n "$PATTERN_STORE_ID" ]; then
    sed -i "s/PLACEHOLDER_PATTERN_STORE_ID/$PATTERN_STORE_ID/g" "$WRANGLER_JSONC"
    echo "    ✓ PATTERN_STORE → $PATTERN_STORE_ID"
  fi
  
  if [ -n "$API_CACHE_ID" ]; then
    sed -i "s/PLACEHOLDER_API_CACHE_ID/$API_CACHE_ID/g" "$WRANGLER_JSONC"
    echo "    ✓ API_CACHE → $API_CACHE_ID"
  fi
  
  if [ -n "$SESSION_STORE_ID" ]; then
    sed -i "s/PLACEHOLDER_SESSION_STORE_ID/$SESSION_STORE_ID/g" "$WRANGLER_JSONC"
    echo "    ✓ SESSION_STORE → $SESSION_STORE_ID"
  fi
  
  if [ -n "$KNOWLEDGE_CACHE_ID" ]; then
    sed -i "s/PLACEHOLDER_KNOWLEDGE_CACHE_ID/$KNOWLEDGE_CACHE_ID/g" "$WRANGLER_JSONC"
    echo "    ✓ KNOWLEDGE_CACHE → $KNOWLEDGE_CACHE_ID"
  fi
  
  if [ -n "$D1_ID" ]; then
    sed -i "s/PLACEHOLDER_D1_DATABASE_ID/$D1_ID/g" "$WRANGLER_JSONC"
    echo "    ✓ INTELLIGENCE_DB → $D1_ID"
  fi
  
  # Check for remaining placeholders
  REMAINING=$(grep -c "PLACEHOLDER_" "$WRANGLER_JSONC" 2>/dev/null || echo "0")
  if [ "$REMAINING" -gt "0" ]; then
    echo ""
    echo "  ⚠  $REMAINING placeholder(s) remain — run 'wrangler kv namespace list' to find IDs"
  else
    echo ""
    echo "  ✓ All placeholders replaced!"
  fi
else
  echo "  ⚠  wrangler.jsonc not found at: $WRANGLER_JSONC"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✓ Full protocol complete!"
echo ""
echo "Binding status:"
echo "  Pages (wrangler.jsonc):     KV×5, D1×1, R2×2, AI×1, Vectorize×1, Services×10"
echo "  Root Worker (wrangler.toml): AI×1, KV×2, D1×1, R2×1, Queue×1, Services×10"
echo "  Cursor Worker:               AI×1, KV×2, D1×1, R2×1, Queue×1, Vectorize×1, Services×9"
echo ""
echo "Next steps:"
echo "  1. Verify IDs in wrangler.jsonc (grep PLACEHOLDER_ wrangler.jsonc)"
echo "  2. Deploy: npm run deploy:all (from cloudflare-workers/)"
echo "  3. Validate: node tools/binding-validator.js"
echo ""
