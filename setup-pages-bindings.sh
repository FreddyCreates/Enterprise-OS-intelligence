#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RSHIP Enterprise OS Intelligence — Pages Bindings Setup
# Creates all KV namespaces, D1 databases, and R2 buckets for Pages Functions
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║  RSHIP Enterprise OS Intelligence — Pages Bindings Setup                  ║"
echo "║  Creating intelligent cache infrastructure for Cloudflare Pages           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# KV NAMESPACES — Organism Memory
# ═══════════════════════════════════════════════════════════════════════════════

echo "◎ Creating KV Namespaces..."
echo ""

# Organism Memory — Core intelligent cache storage
echo "  Creating ORGANISM_MEMORY..."
wrangler kv namespace create ORGANISM_MEMORY 2>/dev/null || echo "    (already exists)"

# Pattern Store — Learned traffic patterns
echo "  Creating PATTERN_STORE..."
wrangler kv namespace create PATTERN_STORE 2>/dev/null || echo "    (already exists)"

# API Cache — Cached API responses
echo "  Creating API_CACHE..."
wrangler kv namespace create API_CACHE 2>/dev/null || echo "    (already exists)"

# Session Store — User sessions
echo "  Creating SESSION_STORE..."
wrangler kv namespace create SESSION_STORE 2>/dev/null || echo "    (already exists)"

# Knowledge Cache — Cached knowledge responses
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
# GET RESOURCE IDS
# ═══════════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║  Resource IDs — Copy these to wrangler.jsonc                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "KV Namespaces:"
wrangler kv namespace list 2>/dev/null | grep -E "(ORGANISM_MEMORY|PATTERN_STORE|API_CACHE|SESSION_STORE|KNOWLEDGE_CACHE)" || echo "  (run 'wrangler kv namespace list' to see IDs)"

echo ""
echo "D1 Databases:"
wrangler d1 list 2>/dev/null | grep -E "medinatech-intelligence" || echo "  (run 'wrangler d1 list' to see IDs)"

echo ""
echo "R2 Buckets:"
wrangler r2 bucket list 2>/dev/null | grep -E "(medinatech-assets|knowledge-archive)" || echo "  (run 'wrangler r2 bucket list' to see IDs)"

echo ""
echo "Vectorize Indexes:"
wrangler vectorize list 2>/dev/null | grep -E "medinatech-knowledge-index" || echo "  (run 'wrangler vectorize list' to see IDs)"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy the resource IDs above into wrangler.jsonc"
echo "  2. Run 'wrangler pages deploy dist/' to deploy Pages"
echo "  3. Connect your Workers via service bindings"
echo ""
echo "Architecture:"
echo "  OUTER MEMBRANE: Pages Functions (classification + routing)"
echo "  INNER ORGANISM: KV cache layer (intelligent responses)"
echo "  DECOUPLED COMPUTE: Organism cycles ≠ Cloudflare billing"
echo ""
