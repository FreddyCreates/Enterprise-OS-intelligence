# 🧠 MEDINATECH Intelligence Bindings

**Version 2.0.0** — Workers with Brains and Hearts

This document describes all the intelligent bindings added to the RSHIP Worker ecosystem. Every Worker now has access to AI reasoning, persistent memory, structured knowledge, and async communication.

---

## 🎯 Binding Overview

| Binding Type | Purpose | Workers |
|--------------|---------|---------|
| **AI** | LLM reasoning, embeddings, image gen | ALL |
| **KV** | Fast key-value storage, sessions, cache | ALL |
| **D1** | SQL database for structured data | ALL |
| **R2** | Object storage for files and archives | CEREBRUM, VIGIL, PULSE |
| **Queues** | Async message passing | ALL |
| **Vectorize** | Semantic search / RAG | AGENS, VIGIL, ANIMUS, NUNTIUS, PULSE |
| **Analytics Engine** | Metrics and telemetry | ALL |
| **Service Bindings** | Direct Worker-to-Worker calls | ALL |

---

## 🔧 Setup Instructions

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 2. Create All Resources
```bash
cd cloudflare-workers
chmod +x setup-resources.sh
./setup-resources.sh
```

### 3. Get Resource IDs
```bash
# List KV namespaces and copy IDs
wrangler kv namespace list

# List D1 databases and copy IDs
wrangler d1 list

# List R2 buckets
wrangler r2 bucket list

# List Queues
wrangler queues list

# List Vectorize indexes
wrangler vectorize list
```

### 4. Update wrangler.toml Files
Replace all `PLACEHOLDER_*_ID` values with actual IDs from step 3.

### 5. Deploy Workers
```bash
# Deploy each Worker
cd agens && wrangler deploy
cd ../cerebrum && wrangler deploy
cd ../vigil && wrangler deploy
# ... etc
```

---

## 📊 Worker Binding Matrix

### Core AI Workers

| Worker | AI | KV Namespaces | D1 | R2 | Queues | Vectorize |
|--------|:--:|---------------|:--:|:--:|--------|-----------|
| **AGENS** | ✅ | SESSION_STORE, KNOWLEDGE_CACHE, IP_BLOCKLIST | INTELLIGENCE_DB | ASSET_STORE | EVENT_QUEUE, ANALYSIS_QUEUE | KNOWLEDGE_VECTORS |
| **CEREBRUM** | ✅ | SESSION_STORE, KNOWLEDGE_CACHE, IP_BLOCKLIST, MEMORY_STORE | INTELLIGENCE_DB | ASSET_STORE, KNOWLEDGE_ARCHIVE | EVENT_QUEUE, ANALYSIS_QUEUE, ORCHESTRATION_QUEUE | KNOWLEDGE_VECTORS |
| **VIGIL** | ✅ | THREAT_CACHE, IP_BLOCKLIST, ATTACKER_DOSSIERS | THREAT_DB | SPECIMEN_ARCHIVE | ALERT_QUEUE, SPECIMEN_QUEUE | THREAT_VECTORS |
| **NEXUS** | ✅ | ROUTING_TABLE, SESSION_STORE, SERVICE_REGISTRY | NETWORK_DB | - | ROUTING_QUEUE, EVENT_QUEUE | - |
| **ANIMUS** | ✅ | CONSCIOUSNESS_STATE, MEMORY_STORE, PERSONALITY_TRAITS | MEMORY_DB | - | THOUGHT_QUEUE | MEMORY_VECTORS |
| **CURSOR** | ✅ | MESSAGE_QUEUE, DELIVERY_STATUS, SESSION_STORE | MESSAGE_DB | - | OUTBOUND_QUEUE | - |

### Bot Workers

| Bot | AI | KV Namespaces | D1 | Queues | Special |
|-----|:--:|---------------|:--:|--------|---------|
| **ARBITER** | ✅ | TASK_QUEUE, WORKFLOW_STATE, SESSION_STORE | WORKFLOW_DB | TASK_DISTRIBUTION_QUEUE | Workflow orchestration |
| **SENTINEL** | ✅ | ALERT_STATE, THREAT_CACHE, IP_BLOCKLIST | ALERT_DB | ALERT_QUEUE | Cron triggers |
| **HERALD** | ✅ | MESSAGE_HISTORY, NOTIFICATION_STATE, SESSION_STORE | NOTIFICATION_DB | NOTIFICATION_QUEUE | Slack integration |
| **CONDUIT** | ✅ | ROUTING_STATE, TRANSFORM_CACHE, SESSION_STORE | ROUTING_DB | DATA_PIPELINE_QUEUE | Data transformation |
| **IMPERIUM** | ✅ | COMMAND_STATE, AUTHORITY_MATRIX, SESSION_STORE | COMMAND_DB | COMMAND_QUEUE | Authority control |
| **NUNTIUS** | ✅ | BRIEFING_CACHE, INTEL_DIGEST, SESSION_STORE | BRIEFING_DB | BRIEFING_QUEUE | Cron + Vectorize |
| **PULSE** | ✅ | PULSE_STATE, INTEL_CACHE, MARKET_DATA | PULSE_DB | PULSE_QUEUE | Cron + R2 + Vectorize |

---

## 🗄️ D1 Database Schema

All Workers share a single D1 database (`medinatech-intelligence`) with these tables:

### Threat Intelligence
- `attackers` — Known attacker profiles
- `specimens` — Captured attack specimens
- `scanner_signatures` — Threat scanner patterns

### Intelligence & Knowledge
- `knowledge_shards` — Knowledge fragments with Vectorize embeddings
- `intelligence_events` — System-wide event log

### Workflows & Tasks
- `workflows` — Multi-step workflow definitions
- `tasks` — Individual task tracking

### Messaging
- `messages` — Inter-Worker communications
- `briefings` — Generated intelligence briefings

### State Management
- `sessions` — User/request sessions
- `worker_state` — Worker health and status
- `telemetry` — Metrics and analytics

---

## 📨 Queue Architecture

```
┌─────────────┐     intelligence-events     ┌─────────────┐
│   AGENS     │ ─────────────────────────▶  │  CEREBRUM   │
│   VIGIL     │                             │  (consumer) │
│   NEXUS     │                             └─────────────┘
└─────────────┘

┌─────────────┐     ai-analysis             ┌─────────────┐
│   VIGIL     │ ─────────────────────────▶  │  CEREBRUM   │
│   SENTINEL  │                             │  (consumer) │
└─────────────┘                             └─────────────┘

┌─────────────┐     security-alerts         ┌─────────────┐
│   VIGIL     │ ─────────────────────────▶  │  SENTINEL   │
│   SENTINEL  │ ◀─────────────────────────  │  (consumer) │
└─────────────┘                             └─────────────┘

┌─────────────┐     orchestration-tasks     ┌─────────────┐
│   ARBITER   │ ─────────────────────────▶  │  CEREBRUM   │
│   IMPERIUM  │                             │  (consumer) │
└─────────────┘                             └─────────────┘
```

---

## 🔗 Service Bindings (Direct Worker Calls)

### CEREBRUM (Master Brain) → Controls All
```javascript
// From CEREBRUM:
await env.AGENS.fetch('/internal/status')
await env.VIGIL.fetch('/threat/analyze', { method: 'POST', body: specimen })
await env.NEXUS.fetch('/route/message', { method: 'POST', body: message })
```

### NEXUS (Network Hub) → Routes to All
```javascript
// NEXUS routes messages to any Worker
await env.CEREBRUM.fetch('/intelligence/ingest', { body })
await env.VIGIL.fetch('/alert/new', { body })
await env.CURSOR.fetch('/deliver', { body })
```

---

## 🧪 Using Bindings in Code

### AI Binding
```javascript
export default {
  async fetch(request, env) {
    // LLM Chat
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: 'Analyze this threat...' }]
    });

    // Embeddings for Vectorize
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: 'Knowledge to embed'
    });

    return Response.json(response);
  }
};
```

### KV Binding
```javascript
// Store session
await env.SESSION_STORE.put(`session:${id}`, JSON.stringify(data), {
  expirationTtl: 3600
});

// Retrieve
const session = await env.SESSION_STORE.get(`session:${id}`, 'json');
```

### D1 Binding
```javascript
// Query attackers
const { results } = await env.INTELLIGENCE_DB.prepare(
  'SELECT * FROM attackers WHERE threat_level = ?'
).bind('APEX').all();

// Insert specimen
await env.INTELLIGENCE_DB.prepare(
  'INSERT INTO specimens (attacker_id, request_path) VALUES (?, ?)'
).bind(attackerId, path).run();
```

### Queue Binding
```javascript
// Send to queue
await env.EVENT_QUEUE.send({
  type: 'THREAT_DETECTED',
  worker: 'VIGIL',
  data: { ip: '45.88.138.44', path: '/wp-admin' }
});

// Consume (in queue handler)
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log(message.body);
      message.ack();
    }
  }
};
```

### Vectorize Binding
```javascript
// Store embedding
await env.KNOWLEDGE_VECTORS.insert([{
  id: 'doc-123',
  values: embedding.data[0],
  metadata: { source: 'VIGIL', type: 'threat' }
}]);

// Query similar
const results = await env.KNOWLEDGE_VECTORS.query(queryVector, {
  topK: 5,
  returnMetadata: true
});
```

### R2 Binding
```javascript
// Store object
await env.ASSET_STORE.put('specimens/2024-01-15/attack-001.json', 
  JSON.stringify(specimen),
  { customMetadata: { attacker: 'APEX-PREDATOR' } }
);

// Retrieve
const object = await env.ASSET_STORE.get('specimens/2024-01-15/attack-001.json');
const data = await object.json();
```

---

## 📈 Analytics Engine

Every Worker has an Analytics Engine binding for metrics:

```javascript
// Log telemetry
env.AGENS_ANALYTICS.writeDataPoint({
  blobs: ['request_handled'],
  doubles: [responseTime],
  indexes: [request.cf.colo]
});
```

Query analytics via GraphQL in the Cloudflare dashboard.

---

## 🔐 Security Notes

1. **Secrets** — Store sensitive values (API keys, tokens) as Worker Secrets:
   ```bash
   wrangler secret put SLACK_BOT_TOKEN
   ```

2. **KV Blocklists** — `IP_BLOCKLIST` namespace is shared across Workers for coordinated blocking

3. **D1 Access Control** — All Workers use the same database; implement row-level security in your code

4. **Queue Dead Letters** — Configure DLQ for failed messages

---

## 🚀 Deployment

### Single Worker
```bash
cd cloudflare-workers/agens
wrangler deploy
```

### All Workers (CI/CD)
```bash
# In GitHub Actions or local script:
for worker in agens cerebrum vigil nexus animus cursor; do
  cd cloudflare-workers/$worker
  wrangler deploy
  cd ..
done

for bot in arbiter sentinel herald conduit imperium nuntius pulse; do
  cd cloudflare-workers/bots/$bot
  wrangler deploy
  cd ..
done
```

---

## 📚 References

- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [Queues Documentation](https://developers.cloudflare.com/queues/)
- [Vectorize Documentation](https://developers.cloudflare.com/vectorize/)
