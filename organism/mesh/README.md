# EmailAI Mesh — Sovereign Email Intelligence Layer

A sovereign, multi-identity, cross-network communication mesh where every organ, agent, system, bot, and service gets its own email identity and communicates autonomously.

## Architecture Layers

| Layer | Name | Function |
|-------|------|----------|
| 1 | **Identity** | Each organ/agent/system = email identity |
| 2 | **Ingestion** | Cloudflare Email Routing → Worker → Parser |
| 3 | **Classification** | Intent, urgency, entity, organ target, action |
| 4 | **Routing** | Route to organ, workflow, surface, or external |
| 5 | **Action** | Reply, escalate, summarize, trigger, notify |
| 6 | **Memory** | All messages → D1 + ICP canister |

## Protocol: EAP-1 (Email Agent Protocol v1)

```
X-Agent-Type: system|organ|bot|human|agent
X-Agent-Intent: alert|task|info|escalation|summary|request|error
X-Agent-Confidence: 0.0–1.0
X-Agent-Target: organ-name
X-Agent-Source: organ-name
X-Agent-Urgency: low|medium|high|critical
X-Agent-Thread: thread-uuid
X-Agent-Action: reply|escalate|summarize|trigger_workflow|...
```

## Organ Email Identities

### Core Organs (8)

| Organ | Email | Purpose |
|-------|-------|---------|
| Membrane | membrane@medinatechlabs.net | Probe alerts, routing |
| Julia Brain | julia@medinatechlabs.net | Analytics, φ-curves |
| Identity/SSN | identity@medinatechlabs.net | Onboarding, staking |
| Reflex | reflex@medinatechlabs.net | Workflows, events |
| Surfaces | synthetic@medinatechlabs.net | Deception, scanner intel |
| Nova | nova@medinatechlabs.net | User-facing comms |
| Research | research@medinatechlabs.net | Reports, insights |
| Probe | probe@medinatechlabs.net | Threat intel |

### Agent Workers (6)

| Agent | Email | Purpose |
|-------|-------|---------|
| Agens | agens@medinatechlabs.net | Orchestration, commands |
| Cerebrum | cerebrum@medinatechlabs.net | Deep reasoning, synthesis |
| Animus | animus@medinatechlabs.net | Sentiment, adaptation |
| Nexus | nexus@medinatechlabs.net | Coordination, relay |
| Vigil | vigil@medinatechlabs.net | Monitoring, surveillance |
| Cursor | cursor@medinatechlabs.net | Navigation, tracking |

### Infrastructure (3)

| Service | Email | Purpose |
|---------|-------|---------|
| Gate-Node | gate@medinatechlabs.net | Outer membrane routing |
| Cache-Organism | cache@medinatechlabs.net | Inner intelligence |
| EmailAI Mesh | mesh@medinatechlabs.net | Message coordination |

### Bots (7)

| Bot | Email | Purpose |
|-----|-------|---------|
| Herald | herald@medinatechlabs.net | Broadcasts, notifications |
| Conduit | conduit@medinatechlabs.net | Cross-platform relay |
| Pulse | pulse@medinatechlabs.net | Heartbeat, health |
| Sentinel | sentinel@medinatechlabs.net | Security detection |
| Arbiter | arbiter@medinatechlabs.net | Decisions, arbitration |
| Imperium | imperium@medinatechlabs.net | Governance, authority |
| Nuntius | nuntius@medinatechlabs.net | Message delivery |

**Total: 24 sovereign email identities**

## Unified Inbox

All organ emails → one unified feed with views by:
- Organ
- Intent
- Entity type
- Urgency
- Workflow
- System

## Deploy

```bash
cd cloudflare-workers/emailai
wrangler d1 execute emailai-mesh --file=./schema.sql
wrangler deploy
```

## Classification Output

```json
{
  "entity": "system",
  "intent": "alert",
  "organ_target": "membrane",
  "confidence": 0.94,
  "action": "trigger_reflex",
  "urgency": "high",
  "metadata": { "source": "content-classification" }
}
```
