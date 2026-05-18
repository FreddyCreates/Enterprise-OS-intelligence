#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# MEDINATECH INTELLIGENT WORKERS — BINDING SETUP SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# This script creates all the Cloudflare resources needed to give Workers
# "brains and hearts" — AI, KV, D1, R2, Vectorize, Queues
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║  MEDINATECH INTELLIGENT WORKERS — BINDING SETUP                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
echo "📋 Checking Wrangler authentication..."
wrangler whoami || wrangler login

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "STEP 1: Creating D1 Databases"
echo "═══════════════════════════════════════════════════════════════════════════"

# Create D1 databases
DATABASES=(
    "medinatech-core"
    "medinatech-honeypot"
    "medinatech-knowledge"
    "nova-threat-intelligence"
)

for db in "${DATABASES[@]}"; do
    echo "Creating D1 database: $db"
    wrangler d1 create "$db" 2>/dev/null || echo "  → Database $db may already exist"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "STEP 2: Creating KV Namespaces"
echo "═══════════════════════════════════════════════════════════════════════════"

# Create KV namespaces
KV_NAMESPACES=(
    "SESSION_STORE"
    "IP_BLOCKLIST"
    "CONFIG_CACHE"
    "HONEYPOT_LOGS"
    "KNOWLEDGE_CACHE"
    "SPECIMEN_MEMORY"
    "RATE_LIMITS"
    "API_KEYS"
)

for kv in "${KV_NAMESPACES[@]}"; do
    echo "Creating KV namespace: $kv"
    wrangler kv namespace create "$kv" 2>/dev/null || echo "  → Namespace $kv may already exist"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "STEP 3: Creating R2 Buckets"
echo "═══════════════════════════════════════════════════════════════════════════"

# Create R2 buckets
R2_BUCKETS=(
    "medinatech-assets"
    "medinatech-backups"
    "honeypot-captures"
    "specimen-archive"
    "knowledge-corpus"
)

for bucket in "${R2_BUCKETS[@]}"; do
    echo "Creating R2 bucket: $bucket"
    wrangler r2 bucket create "$bucket" 2>/dev/null || echo "  → Bucket $bucket may already exist"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "STEP 4: Creating Queues"
echo "═══════════════════════════════════════════════════════════════════════════"

# Create queues
QUEUES=(
    "honeypot-events"
    "ai-analysis"
    "specimen-processing"
    "alert-dispatch"
    "knowledge-sync"
    "nova-specimens"
    "nova-alerts"
)

for queue in "${QUEUES[@]}"; do
    echo "Creating Queue: $queue"
    wrangler queues create "$queue" 2>/dev/null || echo "  → Queue $queue may already exist"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "STEP 5: Creating Vectorize Indexes"
echo "═══════════════════════════════════════════════════════════════════════════"

# Create Vectorize indexes (768 dimensions for text-embedding-ada-002 or similar)
VECTORIZE_INDEXES=(
    "medinatech-knowledge"
    "nova-threat-patterns"
    "honeypot-signatures"
)

for idx in "${VECTORIZE_INDEXES[@]}"; do
    echo "Creating Vectorize index: $idx"
    wrangler vectorize create "$idx" --dimensions=768 --metric=cosine 2>/dev/null || echo "  → Index $idx may already exist"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "STEP 6: Applying D1 Schemas"
echo "═══════════════════════════════════════════════════════════════════════════"

# Apply D1 schemas
SCHEMA_DIR="$(dirname "$0")/schemas"

if [ -d "$SCHEMA_DIR" ]; then
    for schema in "$SCHEMA_DIR"/*.sql; do
        if [ -f "$schema" ]; then
            db_name=$(basename "$schema" .sql)
            echo "Applying schema to $db_name..."
            wrangler d1 execute "$db_name" --file="$schema" 2>/dev/null || echo "  → Schema may already be applied"
        fi
    done
else
    echo "No schemas directory found. Skipping schema application."
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ SETUP COMPLETE                                                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Run 'wrangler d1 list' to get your database IDs"
echo "2. Run 'wrangler kv namespace list' to get your KV namespace IDs"
echo "3. Update each Worker's wrangler.toml with the correct IDs"
echo "4. Deploy Workers with 'wrangler deploy'"
echo ""
echo "Resource IDs will be shown below. Copy these into your wrangler.toml files:"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "D1 DATABASES:"
wrangler d1 list 2>/dev/null || echo "Run 'wrangler d1 list' to see databases"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "KV NAMESPACES:"
wrangler kv namespace list 2>/dev/null || echo "Run 'wrangler kv namespace list' to see namespaces"
echo ""
