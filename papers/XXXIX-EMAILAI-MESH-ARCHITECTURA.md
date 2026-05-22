# XXXIX — EMAILAI MESH ARCHITECTURA

**Designatio:** RSHIP-MESH-EMAIL-001  
**Latin:** Epistula Intelligens  
**Status:** Active  
**Protocol:** EAP-1 (Email Agent Protocol v1)  
**Version:** 1.0.0  

---

## I. PRINCIPIA

The EmailAI Mesh is a sovereign, multi-identity, cross-network communication layer where every organ, agent, system, bot, and service receives its own email identity and communicates autonomously via SMTP — the only universal protocol every system can speak.

This is not email as humans know it. This is **SMTP for AI civilizations**.

---

## II. ARCHITECTURA STRATORUM (Layer Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 6 — MEMORIA (Memory)                            │
│  All messages → ICP canister (logs, identity, reputation, audit)         │
├─────────────────────────────────────────────────────────────────────────┤
│                    LAYER 5 — ACTIO (Action)                              │
│  Reply, escalate, summarize, trigger workflow, update ICP, notify        │
├─────────────────────────────────────────────────────────────────────────┤
│                    LAYER 4 — ITINERARIUM (Routing)                       │
│  Route to organ, workflow, synthetic surface, external, reflex           │
├─────────────────────────────────────────────────────────────────────────┤
│                    LAYER 3 — CLASSIFICATIO (Classification)              │
│  Intent, urgency, organ target, action, entity type, confidence          │
├─────────────────────────────────────────────────────────────────────────┤
│                    LAYER 2 — INGESTIO (Ingestion)                        │
│  Cloudflare Email Routing → Worker → Parser → Structured Message         │
├─────────────────────────────────────────────────────────────────────────┤
│                    LAYER 1 — IDENTITAS (Identity)                         │
│  Each organ = email identity @ medinatechlabs.net                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## III. PROTOCOLLUM EAP-1

The Email Agent Protocol v1 defines standard headers for inter-agent SMTP communication:

| Header | Purpose | Values |
|--------|---------|--------|
| `X-Agent-Type` | Sender entity type | system, organ, bot, human, agent |
| `X-Agent-Intent` | Message intent | alert, task, info, escalation, summary, request, error |
| `X-Agent-Confidence` | Classification confidence | 0.0–1.0 |
| `X-Agent-Target` | Target organ | membrane, brain, identity, reflex, surfaces, nova, research, probe |
| `X-Agent-Source` | Source organ | (same as target values) |
| `X-Agent-Urgency` | Priority level | low, medium, high, critical |
| `X-Agent-Thread` | Conversation ID | UUID |
| `X-Agent-Action` | Requested action | reply, escalate, summarize, trigger_workflow, classify, route |

### Body Schema

```json
{
  "intent": "task",
  "payload": { },
  "metadata": { },
  "chain": ["msg-id-1", "msg-id-2"]
}
```

### Behaviors

1. Agents negotiate via confidence scores
2. Agents escalate when confidence < 0.6
3. Agents summarize chains exceeding 5 messages
4. Agents coordinate via shared thread IDs
5. Agents trigger workflows via reflex organ
6. Agents log all interactions to ICP canister

---

## IV. IDENTITATES ORGANORUM

### Core Organs (8)

| Organum | Epistula | Munus |
|---------|----------|-------|
| Membrane | membrane@medinatechlabs.net | Probe alerts, routing decisions, edge defense |
| Julia Brain | julia@medinatechlabs.net | Analytics, φ-curves, predictions, classification |
| Identity/SSN | identity@medinatechlabs.net | SSN onboarding, staking, reputation |
| Reflex Engine | reflex@medinatechlabs.net | Workflow summaries, event chains, automation |
| Synthetic Surfaces | synthetic@medinatechlabs.net | Deception logs, scanner intel, adversarial data |
| Nova | nova@medinatechlabs.net | User-facing communication, public interface |
| Research | research@medinatechlabs.net | Reports, insights, knowledge generation |
| Probe | probe@medinatechlabs.net | Scanner fingerprints, threat intel, recon |

### Agent Workers (6)

| Agens | Epistula | Munus |
|-------|----------|-------|
| Agens | agens@medinatechlabs.net | Command orchestration, API showcase, drills |
| Cerebrum | cerebrum@medinatechlabs.net | Deep reasoning, knowledge synthesis, intelligence |
| Animus | animus@medinatechlabs.net | Emotional intelligence, sentiment, adaptation |
| Nexus | nexus@medinatechlabs.net | Inter-organ coordination, binding, relay |
| Vigil | vigil@medinatechlabs.net | Monitoring, surveillance, watchman alerting |
| Cursor | cursor@medinatechlabs.net | Navigation, state tracking, pointer |

### Infrastructure Services (3)

| Servitium | Epistula | Munus |
|-----------|----------|-------|
| Gate-Node | gate@medinatechlabs.net | Outer membrane routing, threat filtering |
| Cache-Organism | cache@medinatechlabs.net | Inner intelligence, AI caching, learning |
| EmailAI Mesh | mesh@medinatechlabs.net | Message coordination, classification |

### Bots (7)

| Automaton | Epistula | Munus |
|-----------|----------|-------|
| Herald | herald@medinatechlabs.net | Announcements, broadcasts, notifications |
| Conduit | conduit@medinatechlabs.net | Cross-platform relay, bridging, forwarding |
| Pulse | pulse@medinatechlabs.net | Heartbeat monitoring, health checks, vitals |
| Sentinel | sentinel@medinatechlabs.net | Security detection, perimeter defense |
| Arbiter | arbiter@medinatechlabs.net | Decision-making, conflict resolution, rules |
| Imperium | imperium@medinatechlabs.net | Command authority, governance, delegation |
| Nuntius | nuntius@medinatechlabs.net | Message delivery, inter-agent dispatch |

### Summary

**Total sovereign email identities: 24**

- 8 Core Organs
- 6 Agent Workers
- 3 Infrastructure Services
- 7 Bots

---

## V. CLASSIFICATIO ENGINE

### Parser Extraction

- Headers (all RFC 2822 + EAP-1 custom)
- Sender address + domain
- Subject line
- Body (plain + HTML)
- Attachments (stored in R2)
- Metadata (size, timestamps, routing path)
- Digital signatures

### Classification Dimensions

| Dimension | Values |
|-----------|--------|
| Intent | info, request, alert, error, task, escalation, summary |
| Entity Type | human, bot, system, organ, agent |
| Urgency | low, medium, high, critical |
| Organ Target | membrane, brain, identity, reflex, surfaces, nova, research, probe |
| Action Required | reply, escalate, summarize, trigger_workflow, update_state, notify, generate_report |
| Confidence | 0.0–1.0 (φ-weighted) |

### Output Schema

```json
{
  "entity": "system",
  "intent": "alert",
  "organ_target": "membrane",
  "confidence": 0.94,
  "action": "trigger_reflex",
  "urgency": "high",
  "metadata": {
    "source": "content-classification",
    "classified_at": "2026-05-22T02:00:00Z"
  }
}
```

---

## VI. ITINERARIUM (Routing Rules)

| Condition | Action |
|-----------|--------|
| `intent == alert && urgency == critical` | Route to membrane + notify all organs |
| `intent == task && target specified` | Route to target organ directly |
| `intent == escalation` | Route to membrane for re-classification |
| `entity_type == human` | Route to nova for human-facing response |
| `confidence < 0.6` | Route to brain for re-classification |
| Default | Route to classified organ_target |

---

## VII. INBOX UNIFICATA

### Views

- By organ (membrane, brain, identity, reflex, surfaces, nova, research, probe)
- By intent (alert, task, info, error, escalation, summary)
- By entity (human, bot, system, organ, agent)
- By urgency (critical, high, medium, low)
- By workflow (triggered, pending, completed)
- By system (per-domain grouping)

### Intelligence

Julia Brain generates:
- Daily digests per organ
- Anomaly reports (unusual patterns)
- Organ health summaries
- Probe intelligence briefings
- System behavior pattern analysis
- Cross-organ correlation reports

---

## VIII. VINCULI (Bindings)

| Binding | Type | Purpose |
|---------|------|---------|
| AI | Workers AI | LLM classification + response generation |
| MESH_INBOX | KV | Fast inbox cache |
| MESH_STATE | KV | Processing state |
| MESH_DB | D1 | Message store + classifications |
| EMAIL_QUEUE | Queue | Inbound processing |
| REFLEX_QUEUE | Queue | Workflow triggers |
| ALERT_QUEUE | Queue | Escalation alerts |
| BRAIN_QUEUE | Queue | Re-classification requests |
| ATTACHMENT_STORE | R2 | Email attachments |
| MESSAGE_VECTORS | Vectorize | Semantic search |
| MESH_ANALYTICS | Analytics Engine | Telemetry |

---

## IX. MONETIZATIO

| Tier | Model | Price |
|------|-------|-------|
| Per-Organ | Each organ identity | $X/month |
| Per-System | Each external system identity | $Y/month |
| Intelligence | Probe intel, anomaly, workflows | Add-on |
| Enterprise | Custom domains, organs, private mesh | Custom |

### Differentiation

- **Slack** = human chat
- **Discord** = community chat  
- **EmailAI Mesh** = system-to-system intelligence layer

---

## X. ONBOARDING FLOW

1. **Connect Domain** — Add MX → Cloudflare Email Routing
2. **Create Identities** — crm@, billing@, monitoring@, security@
3. **Assign Organs** — Map systems → organs
4. **Activate Workflows** — Alerts, escalations, summaries, rules
5. **Activate Intelligence** — Probe intel, anomaly, surfaces, cross-network

---

## XI. COLOPHON

```
System:    EmailAI Mesh
Worker:    cloudflare-workers/emailai/worker.js
Schema:    cloudflare-workers/emailai/schema.sql
Protocol:  organism/mesh/protocols/eap-1.json
Registry:  organism/mesh/identities.json
Deploy:    npm run deploy:emailai
Paper:     XXXIX
```

*Finis — Epistula Intelligens*
