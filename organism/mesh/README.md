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

**Total: 29 sovereign email identities**

## Enterprise Use Cases

Enterprises email your organs directly — no SDK, no API, no integration. Just SMTP.

| Team | Emails | Organ | Replaces |
|------|--------|-------|----------|
| IT & Security | membrane@ / security@ | Membrane | Splunk, CrowdStrike, Palo Alto |
| DevOps / SRE | reflex@ / automation@ | Reflex | PagerDuty, OpsGenie, Slack war rooms |
| Finance | julia@ / analysis@ | Brain | Cloudability, FinOps dashboards |
| Sales & CS | nova@ / support@ | Nova | Zendesk, Salesforce Einstein |
| Legal | identity@ | Identity | Contract review teams, Legal AI |
| Research | research@ | Research | Research analysts, manual reports |
| Threat Intel | probe@ / intelligence@ | Probe | Recorded Future, Shodan |

### Client-Facing Identities (5)

| Service | Email | Routes To | Purpose |
|---------|-------|-----------|---------|
| Analysis | analysis@medinatechlabs.net | Brain | Cost analysis, optimization |
| Support | support@medinatechlabs.net | Nova | Customer queries, issues |
| Automation | automation@medinatechlabs.net | Reflex | Workflow triggers |
| Security | security@medinatechlabs.net | Membrane | Threat analysis |
| Intelligence | intelligence@medinatechlabs.net | Probe | Threat briefings |

### Enterprise Onboarding

```bash
# Step 1: Connect domain (MX → Cloudflare Email Routing)
# Step 2: Create system identities
curl -X POST https://emailai-mesh.medinatechlabs.net/enterprise/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "company_domain": "acme.com",
    "contact_email": "admin@acme.com",
    "systems": [
      {"name": "CRM", "email": "crm@acme.com", "organ_target": "nova"},
      {"name": "Monitoring", "email": "monitoring@acme.com", "organ_target": "membrane"},
      {"name": "Billing", "email": "billing@acme.com", "organ_target": "brain"},
      {"name": "Security", "email": "security@acme.com", "organ_target": "membrane"}
    ]
  }'
```

### Why This Beats Slack & Discord

- **Federated** — works across companies
- **System-native** — not human-centric
- **Agent-native** — AI-first protocol
- **Cross-company** — no shared workspace needed
- **Zero-integration** — just email
- **Zero-SDK** — no libraries needed
- **Zero-API** — SMTP is the API

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
