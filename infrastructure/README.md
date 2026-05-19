# Medinatech Intelligent Workers Infrastructure

This directory contains everything needed to give your Cloudflare Workers "brains and hearts" — AI reasoning, persistent memory, and coordinated communication.

## Quick Start

```bash
# 1. Make the setup script executable
chmod +x setup-bindings.sh

# 2. Run the setup (creates all resources)
./setup-bindings.sh

# 3. Copy the resource IDs into your wrangler.toml files
# 4. Deploy your Workers
cd ../cloudflare-workers
wrangler deploy --config agens/wrangler.toml
wrangler deploy --config cerebrum/wrangler.toml
# ... etc
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MEDINATECH INTELLIGENT WORKERS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ CEREBRUM│  │  AGENS  │  │  NEXUS  │  │ ANIMUS  │  │  VIGIL  │          │
│  │ (Brain) │  │ (Agent) │  │ (Bond)  │  │ (Soul)  │  │ (Guard) │          │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘          │
│       │            │            │            │            │                │
│       └────────────┴────────────┼────────────┴────────────┘                │
│                                 │                                          │
│  ┌──────────────────────────────┼──────────────────────────────────────┐   │
│  │                        SHARED BINDINGS                               │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ AI (LLM) │  │ KV (mem) │  │ D1 (SQL) │  │ R2 (obj) │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │   │
│  │  │ Queues   │  │ Vectorize│  │ Analytics│                          │   │
│  │  └──────────┘  └──────────┘  └──────────┘                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Bindings Reference

### Workers AI
Gives Workers access to LLMs, image generation, embeddings, and more.

```toml
[ai]
binding = "AI"
```

**Usage:**
```javascript
const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  prompt: "Analyze this threat...",
  max_tokens: 256
});
```

### KV (Key-Value Store)
Ultra-fast, globally distributed key-value storage.

```toml
[[kv_namespaces]]
binding = "SESSION_STORE"
id = "your-namespace-id"
```

**Usage:**
```javascript
await env.SESSION_STORE.put('key', 'value', { expirationTtl: 3600 });
const value = await env.SESSION_STORE.get('key');
```

### D1 (SQLite Database)
Serverless SQL database with full SQLite support.

```toml
[[d1_databases]]
binding = "CORE_DB"
database_name = "medinatech-core"
database_id = "your-database-id"
```

**Usage:**
```javascript
const { results } = await env.CORE_DB.prepare(
  'SELECT * FROM events WHERE severity = ?'
).bind('critical').all();
```

### R2 (Object Storage)
S3-compatible object storage for large files.

```toml
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "medinatech-assets"
```

**Usage:**
```javascript
await env.ASSETS.put('captures/2024/file.json', JSON.stringify(data));
const object = await env.ASSETS.get('captures/2024/file.json');
```

### Queues
Async message passing between Workers.

```toml
[[queues.producers]]
binding = "ALERT_QUEUE"
queue = "alert-dispatch"

[[queues.consumers]]
queue = "alert-dispatch"
max_batch_size = 10
```

**Producer:**
```javascript
await env.ALERT_QUEUE.send({ type: 'critical', message: '...' });
```

**Consumer:**
```javascript
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log(message.body);
      message.ack();
    }
  }
};
```

### Vectorize
Vector database for semantic search and RAG.

```toml
[[vectorize]]
binding = "KNOWLEDGE_VECTORS"
index_name = "medinatech-knowledge"
```

**Usage:**
```javascript
// Generate embedding
const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: 'query' });

// Search
const results = await env.KNOWLEDGE_VECTORS.query(embedding.data[0], { topK: 5 });
```

### Analytics Engine
Write custom analytics data.

```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "my_events"
```

**Usage:**
```javascript
env.ANALYTICS.writeDataPoint({
  blobs: ['path', 'ip'],
  doubles: [latency_ms],
  indexes: ['event_type']
});
```

## Databases

### medinatech-core
Central data store for all Workers.
- `workers` — Worker registry
- `events` — Central event log
- `api_keys` — API key management
- `sessions` — User sessions
- `rate_limits` — Rate limiting

### medinatech-honeypot
Honeypot and threat data.
- `captures` — Raw honeypot captures
- `attackers` — Known attacker profiles
- `honeypots` — Honeypot configuration
- `attack_patterns` — Detected patterns
- `scanner_signatures` — Known scanners

### medinatech-knowledge
Knowledge base and AI training data.
- `knowledge_shards` — Individual knowledge units
- `research_papers` — Paper metadata
- `ai_conversations` — AI interaction logs
- `embeddings` — Vectorize references

### nova-threat-intelligence
NOVA-specific threat data.
- `attackers` — Threat actors
- `specimens` — Captured requests
- `path_statistics` — Path analysis
- `scanner_signatures` — Scanner detection
- `tor_sessions` — Tor tracking
- `ai_visitors` — AI crawler logs
- `knowledge_shards` — NOVA knowledge

## Queues

| Queue | Purpose |
|-------|---------|
| `honeypot-events` | Honeypot captures → Analysis pipeline |
| `ai-analysis` | AI processing tasks |
| `specimen-processing` | NOVA specimen analysis |
| `alert-dispatch` | Security alerts |
| `knowledge-sync` | Knowledge base updates |
| `nova-specimens` | NOVA specimen queue |
| `nova-alerts` | NOVA alert dispatch |

## Vectorize Indexes

| Index | Dimensions | Purpose |
|-------|------------|---------|
| `medinatech-knowledge` | 768 | Knowledge base search |
| `nova-threat-patterns` | 768 | Threat pattern matching |
| `honeypot-signatures` | 768 | Attack signature matching |

## Workers with Bindings

| Worker | AI | KV | D1 | R2 | Queue | Vectorize |
|--------|:--:|:--:|:--:|:--:|:-----:|:---------:|
| nova | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cerebrum | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| agens | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| nexus | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| animus | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| vigil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cursor | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

## Getting Resource IDs

After running `setup-bindings.sh`, get your resource IDs:

```bash
# D1 databases
wrangler d1 list

# KV namespaces
wrangler kv namespace list

# R2 buckets (check dashboard)
# Queues (check dashboard)
# Vectorize indexes
wrangler vectorize list
```

Then update each Worker's `wrangler.toml` with the correct IDs.

## Deployment

Deploy all Workers at once:

```bash
cd ../cloudflare-workers

# Deploy each worker
for worker in nova agens cerebrum nexus animus vigil cursor; do
  echo "Deploying $worker..."
  wrangler deploy --config $worker/wrangler.toml
done
```

Or deploy individually:

```bash
wrangler deploy --config nova/wrangler.toml
```

## Troubleshooting

### "Binding not found"
Make sure the resource exists and the ID in wrangler.toml is correct.

### "D1 table not found"
Run the schema migrations:
```bash
wrangler d1 execute medinatech-core --file=schemas/medinatech-core.sql
```

### "Queue not found"
Create the queue first:
```bash
wrangler queues create my-queue
```

### "Vectorize index not found"
Create the index:
```bash
wrangler vectorize create my-index --dimensions=768 --metric=cosine
```
