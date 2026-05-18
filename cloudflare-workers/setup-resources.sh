#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# MEDINATECH INTELLIGENCE — Resource Setup Script
# Creates all Cloudflare resources needed for intelligent Workers
# Run: ./setup-resources.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║  MEDINATECH INTELLIGENCE — Resource Setup                                      ║"
echo "║  Creating KV, D1, R2, Queues, and Vectorize resources                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ─────────────────────────────────────────────────────────────────────────────────
# D1 DATABASES
# ─────────────────────────────────────────────────────────────────────────────────
log_step "Creating D1 Database..."
wrangler d1 create medinatech-intelligence 2>/dev/null && log_success "D1: medinatech-intelligence" || log_warning "D1: medinatech-intelligence (may already exist)"

# ─────────────────────────────────────────────────────────────────────────────────
# KV NAMESPACES
# ─────────────────────────────────────────────────────────────────────────────────
log_step "Creating KV Namespaces..."

# Shared namespaces
wrangler kv namespace create SESSION_STORE 2>/dev/null && log_success "KV: SESSION_STORE" || log_warning "KV: SESSION_STORE (may already exist)"
wrangler kv namespace create KNOWLEDGE_CACHE 2>/dev/null && log_success "KV: KNOWLEDGE_CACHE" || log_warning "KV: KNOWLEDGE_CACHE (may already exist)"
wrangler kv namespace create IP_BLOCKLIST 2>/dev/null && log_success "KV: IP_BLOCKLIST" || log_warning "KV: IP_BLOCKLIST (may already exist)"
wrangler kv namespace create MEMORY_STORE 2>/dev/null && log_success "KV: MEMORY_STORE" || log_warning "KV: MEMORY_STORE (may already exist)"

# VIGIL namespaces
wrangler kv namespace create THREAT_CACHE 2>/dev/null && log_success "KV: THREAT_CACHE" || log_warning "KV: THREAT_CACHE (may already exist)"
wrangler kv namespace create ATTACKER_DOSSIERS 2>/dev/null && log_success "KV: ATTACKER_DOSSIERS" || log_warning "KV: ATTACKER_DOSSIERS (may already exist)"

# NEXUS namespaces
wrangler kv namespace create ROUTING_TABLE 2>/dev/null && log_success "KV: ROUTING_TABLE" || log_warning "KV: ROUTING_TABLE (may already exist)"
wrangler kv namespace create SERVICE_REGISTRY 2>/dev/null && log_success "KV: SERVICE_REGISTRY" || log_warning "KV: SERVICE_REGISTRY (may already exist)"

# ANIMUS namespaces
wrangler kv namespace create CONSCIOUSNESS_STATE 2>/dev/null && log_success "KV: CONSCIOUSNESS_STATE" || log_warning "KV: CONSCIOUSNESS_STATE (may already exist)"
wrangler kv namespace create PERSONALITY_TRAITS 2>/dev/null && log_success "KV: PERSONALITY_TRAITS" || log_warning "KV: PERSONALITY_TRAITS (may already exist)"

# CURSOR namespaces
wrangler kv namespace create MESSAGE_QUEUE 2>/dev/null && log_success "KV: MESSAGE_QUEUE" || log_warning "KV: MESSAGE_QUEUE (may already exist)"
wrangler kv namespace create DELIVERY_STATUS 2>/dev/null && log_success "KV: DELIVERY_STATUS" || log_warning "KV: DELIVERY_STATUS (may already exist)"

# Bot namespaces
wrangler kv namespace create TASK_QUEUE 2>/dev/null && log_success "KV: TASK_QUEUE" || log_warning "KV: TASK_QUEUE (may already exist)"
wrangler kv namespace create WORKFLOW_STATE 2>/dev/null && log_success "KV: WORKFLOW_STATE" || log_warning "KV: WORKFLOW_STATE (may already exist)"
wrangler kv namespace create ALERT_STATE 2>/dev/null && log_success "KV: ALERT_STATE" || log_warning "KV: ALERT_STATE (may already exist)"
wrangler kv namespace create MESSAGE_HISTORY 2>/dev/null && log_success "KV: MESSAGE_HISTORY" || log_warning "KV: MESSAGE_HISTORY (may already exist)"
wrangler kv namespace create NOTIFICATION_STATE 2>/dev/null && log_success "KV: NOTIFICATION_STATE" || log_warning "KV: NOTIFICATION_STATE (may already exist)"
wrangler kv namespace create ROUTING_STATE 2>/dev/null && log_success "KV: ROUTING_STATE" || log_warning "KV: ROUTING_STATE (may already exist)"
wrangler kv namespace create TRANSFORM_CACHE 2>/dev/null && log_success "KV: TRANSFORM_CACHE" || log_warning "KV: TRANSFORM_CACHE (may already exist)"
wrangler kv namespace create COMMAND_STATE 2>/dev/null && log_success "KV: COMMAND_STATE" || log_warning "KV: COMMAND_STATE (may already exist)"
wrangler kv namespace create AUTHORITY_MATRIX 2>/dev/null && log_success "KV: AUTHORITY_MATRIX" || log_warning "KV: AUTHORITY_MATRIX (may already exist)"
wrangler kv namespace create BRIEFING_CACHE 2>/dev/null && log_success "KV: BRIEFING_CACHE" || log_warning "KV: BRIEFING_CACHE (may already exist)"
wrangler kv namespace create INTEL_DIGEST 2>/dev/null && log_success "KV: INTEL_DIGEST" || log_warning "KV: INTEL_DIGEST (may already exist)"
wrangler kv namespace create PULSE_STATE 2>/dev/null && log_success "KV: PULSE_STATE" || log_warning "KV: PULSE_STATE (may already exist)"
wrangler kv namespace create INTEL_CACHE 2>/dev/null && log_success "KV: INTEL_CACHE" || log_warning "KV: INTEL_CACHE (may already exist)"
wrangler kv namespace create MARKET_DATA 2>/dev/null && log_success "KV: MARKET_DATA" || log_warning "KV: MARKET_DATA (may already exist)"

# ─────────────────────────────────────────────────────────────────────────────────
# R2 BUCKETS
# ─────────────────────────────────────────────────────────────────────────────────
log_step "Creating R2 Buckets..."
wrangler r2 bucket create medinatech-assets 2>/dev/null && log_success "R2: medinatech-assets" || log_warning "R2: medinatech-assets (may already exist)"
wrangler r2 bucket create knowledge-archive 2>/dev/null && log_success "R2: knowledge-archive" || log_warning "R2: knowledge-archive (may already exist)"
wrangler r2 bucket create threat-specimens 2>/dev/null && log_success "R2: threat-specimens" || log_warning "R2: threat-specimens (may already exist)"
wrangler r2 bucket create pulse-archive 2>/dev/null && log_success "R2: pulse-archive" || log_warning "R2: pulse-archive (may already exist)"

# ─────────────────────────────────────────────────────────────────────────────────
# QUEUES
# ─────────────────────────────────────────────────────────────────────────────────
log_step "Creating Queues..."
wrangler queues create intelligence-events 2>/dev/null && log_success "Queue: intelligence-events" || log_warning "Queue: intelligence-events (may already exist)"
wrangler queues create ai-analysis 2>/dev/null && log_success "Queue: ai-analysis" || log_warning "Queue: ai-analysis (may already exist)"
wrangler queues create orchestration-tasks 2>/dev/null && log_success "Queue: orchestration-tasks" || log_warning "Queue: orchestration-tasks (may already exist)"
wrangler queues create security-alerts 2>/dev/null && log_success "Queue: security-alerts" || log_warning "Queue: security-alerts (may already exist)"
wrangler queues create threat-specimens 2>/dev/null && log_success "Queue: threat-specimens" || log_warning "Queue: threat-specimens (may already exist)"
wrangler queues create routing-events 2>/dev/null && log_success "Queue: routing-events" || log_warning "Queue: routing-events (may already exist)"
wrangler queues create thought-processing 2>/dev/null && log_success "Queue: thought-processing" || log_warning "Queue: thought-processing (may already exist)"
wrangler queues create outbound-messages 2>/dev/null && log_success "Queue: outbound-messages" || log_warning "Queue: outbound-messages (may already exist)"
wrangler queues create task-distribution 2>/dev/null && log_success "Queue: task-distribution" || log_warning "Queue: task-distribution (may already exist)"
wrangler queues create notifications 2>/dev/null && log_success "Queue: notifications" || log_warning "Queue: notifications (may already exist)"
wrangler queues create data-pipeline 2>/dev/null && log_success "Queue: data-pipeline" || log_warning "Queue: data-pipeline (may already exist)"
wrangler queues create command-distribution 2>/dev/null && log_success "Queue: command-distribution" || log_warning "Queue: command-distribution (may already exist)"
wrangler queues create briefings 2>/dev/null && log_success "Queue: briefings" || log_warning "Queue: briefings (may already exist)"
wrangler queues create pulse-signals 2>/dev/null && log_success "Queue: pulse-signals" || log_warning "Queue: pulse-signals (may already exist)"

# ─────────────────────────────────────────────────────────────────────────────────
# VECTORIZE INDEXES
# ─────────────────────────────────────────────────────────────────────────────────
log_step "Creating Vectorize Indexes..."
wrangler vectorize create medinatech-knowledge-index --dimensions=768 --metric=cosine 2>/dev/null && log_success "Vectorize: medinatech-knowledge-index" || log_warning "Vectorize: medinatech-knowledge-index (may already exist)"
wrangler vectorize create threat-patterns-index --dimensions=768 --metric=cosine 2>/dev/null && log_success "Vectorize: threat-patterns-index" || log_warning "Vectorize: threat-patterns-index (may already exist)"
wrangler vectorize create animus-memories-index --dimensions=768 --metric=cosine 2>/dev/null && log_success "Vectorize: animus-memories-index" || log_warning "Vectorize: animus-memories-index (may already exist)"
wrangler vectorize create intel-synthesis-index --dimensions=768 --metric=cosine 2>/dev/null && log_success "Vectorize: intel-synthesis-index" || log_warning "Vectorize: intel-synthesis-index (may already exist)"

# ─────────────────────────────────────────────────────────────────────────────────
# DATABASE SCHEMA
# ─────────────────────────────────────────────────────────────────────────────────
log_step "Applying D1 Schema..."
wrangler d1 execute medinatech-intelligence --file=./schema.sql && log_success "D1 schema applied" || log_warning "D1 schema (may have errors)"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                                               ║"
echo "╠═══════════════════════════════════════════════════════════════════════════════╣"
echo "║  Next steps:                                                                   ║"
echo "║  1. Run: wrangler kv namespace list                                            ║"
echo "║  2. Copy the namespace IDs into each Worker's wrangler.toml                    ║"
echo "║  3. Run: wrangler d1 list                                                      ║"
echo "║  4. Copy the database ID into each Worker's wrangler.toml                      ║"
echo "║  5. Deploy Workers: cd <worker> && wrangler deploy                             ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
